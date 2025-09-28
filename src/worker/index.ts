
const blob = new Blob(['REPLACE_JS_DATA'], {type : 'application/javascript'});
const workerUrl = URL.createObjectURL(blob);

function getFunctionData (func:Function):string {
    if(!(func instanceof Function)) {throw `${func} is not Function!`}
    return func.toString();
}
export class NcpuWorker {
    worker:Worker;
    index:number;
    completeIndex:number;
    private workerOptions: WorkerOptions | undefined;

    constructor(options?: {workerOptions: WorkerOptions | undefined}) {
        this.workerOptions = options?.workerOptions;
    }
    
    private start() {
        this.worker = new Worker(workerUrl, this.workerOptions);
        this.resetIndex();
    }

    private end() {
        this.worker.terminate();
        this.resetIndex();
    }

    private resetIndex() {
        this.index = 0;
        this.completeIndex = 0;
    }

    public run(func:Function, params:Array<any>) {
        const functionData = getFunctionData (func);
        if(!this.worker) { 
            this.start();
        }
        return new Promise((resolve, reject) => {
            this.index++;
            const key = this.index;
            let isTaskComplete = false;
            
            // 创建命名的事件处理函数，以便后续可以移除
            const messageHandler = ({data}) => {
                if(data.key === key && (!isTaskComplete)) {
                    // 移除事件监听器
                    this.worker.removeEventListener('message', messageHandler);
                    this.worker.removeEventListener('error', errorHandler);
                    
                    isTaskComplete = true;
                    if(data.error) {return reject(data.error);}
                    return resolve(data.res);
                }
            };
            
            const errorHandler = (err) => {
                // 移除事件监听器
                this.worker.removeEventListener('message', messageHandler);
                this.worker.removeEventListener('error', errorHandler);
                
                this.end();
                return reject(err);
            };
            
            this.worker.addEventListener('message', messageHandler);
            this.worker.addEventListener('error', errorHandler);
            this.worker.postMessage({
                key, functionData, params
            });
        });
    }
}