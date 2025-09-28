import {
    NcpuWorker
} from './index';

export interface NcpuWorkerPoolOptions {
    /**
     * 最大工作线程数，默认为 CPU 核心数
     */
    maxWorkers?: number;
    /**
     * 单个任务超时时间（毫秒），默认无超时
     */
    timeout?: number;
    /**
     * Worker 线程的额外选项
     */
    workerOptions?: WorkerOptions;
}

interface WorkerTask {
    func: Function;
    params: Array<any>;
    resolve: (value: any) => void;
    reject: (reason: any) => void;
    timeoutId?: NodeJS.Timeout;
    assignedWorker?: NcpuWorker; // 跟踪分配给任务的工作线程
}

export class NcpuWorkerPool {
    private workers: NcpuWorker[] = [];
    private idleWorkers: NcpuWorker[] = [];
    private taskQueue: WorkerTask[] = [];
    private maxWorkers: number;
    private timeout: number | null;
    private workerOptions: WorkerOptions | undefined;

    /**
     * 创建一个 NcpuWorkerPool 实例
     * @param options 线程池配置选项
     */
    constructor(options?: NcpuWorkerPoolOptions) {
        this.maxWorkers = options?.maxWorkers || 2;
        this.timeout = options?.timeout || null;
        this.workerOptions = options?.workerOptions;
    }

    /**
     * 执行任务
     * @param func 要执行的函数
     * @param params 函数参数
     * @returns Promise 包含函数执行结果
     */
    public run(func: Function, params: Array<any>): Promise<any> {
        return new Promise((resolve, reject) => {
            const task: WorkerTask = { func, params, resolve, reject };
            
            // 如果设置了超时时间，创建超时处理
            if (this.timeout) {
                task.timeoutId = setTimeout(() => {
                    // 从队列中移除任务
                    const index = this.taskQueue.indexOf(task);
                    if (index !== -1) {
                        this.taskQueue.splice(index, 1);
                    } else if (task.assignedWorker) {
                        // 任务已经在执行中，需要中止对应的工作线程
                        this.terminateWorker(task.assignedWorker);
                    }
                    reject(new Error(`Task execution timed out after ${this.timeout}ms`));
                }, this.timeout);
            }

            // 将任务添加到队列
            this.taskQueue.push(task);
            
            // 尝试处理队列中的任务
            this.processQueue();
        });
    }

    /**
     * 处理任务队列
     */
    private processQueue(): void {
        // 如果没有待处理的任务，直接返回
        if (this.taskQueue.length === 0) {
            this.terminate()
            return;
        }

        // 如果有空闲的工作线程，使用它
        if (this.idleWorkers.length > 0) {
            const worker = this.idleWorkers.pop()!;
            const task = this.taskQueue.shift()!;
            this.executeTask(worker, task);
        }
        // 如果可以创建新的工作线程，创建它
        else if (this.workers.length < this.maxWorkers) {
            const worker = new NcpuWorker({workerOptions: this.workerOptions});
            this.workers.push(worker);
            const task = this.taskQueue.shift()!;
            this.executeTask(worker, task);
        }
        // 否则任务将保留在队列中等待工作线程变为可用
    }

    /**
     * 在工作线程上执行任务
     * @param worker 工作线程
     * @param task 任务
     */
    private executeTask(worker: NcpuWorker, task: WorkerTask): void {
        // 记录任务分配的工作线程
        task.assignedWorker = worker;
        
        // 不要清除超时定时器，让它继续计时以便能够中止长时间运行的任务

        worker.run(task.func, task.params)
            .then((result) => {
                // 清除超时定时器（如果有）
                if (task.timeoutId) {
                    clearTimeout(task.timeoutId);
                }
                task.resolve(result);
                // 将工作线程标记为空闲
                this.idleWorkers.push(worker);
                // 处理下一个任务
                this.processQueue();
            })
            .catch((error) => {
                // 清除超时定时器（如果有）
                if (task.timeoutId) {
                    clearTimeout(task.timeoutId);
                }
                task.reject(error);
                // 将工作线程标记为空闲
                this.idleWorkers.push(worker);
                // 异常后替换worker
                this.terminateWorker(worker)
                // 处理下一个任务
                this.processQueue();
            });
    }

    /**
     * 关闭所有工作线程
     */
    public async terminate(force: boolean = false): Promise<void> {
        if(!force) {
            if(this.taskQueue.length > 0) {
                return;
            }
        }
        // 清空任务队列并拒绝所有待处理的任务
        while (this.taskQueue.length > 0) {
            const task = this.taskQueue.shift()!;
            if (task.timeoutId) {
                clearTimeout(task.timeoutId);
            }
            task.reject(new Error('Worker pool is terminating'));
        }

        // 终止所有工作线程
        for (const worker of this.workers) {
            if (worker.worker) {
                worker.worker.terminate();
            }
        }

        // 清空工作线程数组
        this.workers = [];
        this.idleWorkers = [];
    }

    /**
     * 获取当前活跃的工作线程数量
     */
    public get activeWorkersCount(): number {
        return this.workers.length - this.idleWorkers.length;
    }

    /**
     * 获取当前等待中的任务数量
     */
    public get pendingTasksCount(): number {
        return this.taskQueue.length;
    }

    /**
     * 获取线程池的最大工作线程数
     */
    public get maxWorkersCount(): number {
        return this.maxWorkers;
    }
    
    /**
     * 终止工作线程并创建一个新的替代它
     * @param worker 要终止的工作线程
     */
    private terminateWorker(worker: NcpuWorker): void {
        // 从工作线程数组和空闲工作线程数组中移除
        const workerIndex = this.workers.indexOf(worker);
        if (workerIndex !== -1) {
            this.workers.splice(workerIndex, 1);
        }
        
        const idleIndex = this.idleWorkers.indexOf(worker);
        if (idleIndex !== -1) {
            this.idleWorkers.splice(idleIndex, 1);
        }
        
        // 终止工作线程
        if (worker.worker) {            
            worker.worker.terminate();
        }
        
        // 创建一个新的工作线程来替代它
        const newWorker = new NcpuWorker({workerOptions: this.workerOptions});
        this.workers.push(newWorker);
        
        // 如果有待处理的任务，立即处理
        if (this.taskQueue.length > 0) {
            const task = this.taskQueue.shift()!;
            this.executeTask(newWorker, task);
        } else {
            // 否则将新工作线程标记为空闲
            this.idleWorkers.push(newWorker);
        }
    }
}