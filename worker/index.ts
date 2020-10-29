
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

    private start() {
        this.worker = new Worker(workerUrl);
        this.resetIndex();
    }

    private end() {
        this.worker.terminate();
        this.worker = undefined;
        this.resetIndex();
    }

    private resetIndex() {
        this.index = 0;
        this.completeIndex = 0;
    }

    private gc() {
        this.completeIndex++;
        if(this.index===this.completeIndex) {this.end();}
    }

    public run(func:Function,params:Array<any>, timeout:number) {
        if(!window) {
            throw new Error('must be run browser environment');
        }
        if(!window.Worker) {
            throw new Error('browser not support Web Worker');
        }
        const functionData = getFunctionData (func);
        if(!this.worker) { 
            this.start();
        }
        return new Promise((resolve, reject) => {
            this.index++;
            const key = this.index;
            let timer;
            let isTaskComplete = false;
            if(timeout>=0) {
                timer = setTimeout(()=>{
                    if(!isTaskComplete) {
                        this.gc();
                        isTaskComplete = true;
                        return reject(new Error('task timeout'));
                    }
                }, timeout)
            }
            this.worker.addEventListener('message',(event) => {
                const res = event.data;
                if(res.key===key && (!isTaskComplete)) {
                    this.gc();
                    isTaskComplete = true;
                    if(timer) {clearTimeout(timer)}
                    return resolve(res.res);
                }
            });
            this.worker.addEventListener('error',(err) => {
                this.end();
                if(timer) {clearTimeout(timer)}
                return reject(err);
            });
            this.worker.postMessage({
                key, functionData, params
            });
        });
    }
}
