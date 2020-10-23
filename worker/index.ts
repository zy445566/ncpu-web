
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
    public run(func:Function,params:Array<any>) {
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
            this.worker.addEventListener('message',(event) => {
                const res = event.data;
                if(res.key===key) {
                    this.completeIndex++;
                    if(this.index===this.completeIndex) {this.end();}
                    return resolve(res.res);
                }
            });
            this.worker.addEventListener('error',(err) => {
                this.end();
                return reject(err);
            });
            this.worker.postMessage({
                key, functionData, params
            });
        });
    }
}
