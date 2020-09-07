
const blob = new Blob(['REPLACE_JS_DATA'], {type : 'application/javascript'});
const workerUrl = URL.createObjectURL(blob);
export function runWorker (options:Object):Promise<any> {
    if(!window) {
        throw new Error('must be run browser environment');
    }
    if(!window.Worker) {
        throw new Error('browser not support Web Worker');
    }
    return new Promise((resolve, reject) => {
        const worker = new Worker(workerUrl);
        worker.postMessage(options);
        worker.onmessage = function (event) {
            resolve(event.data);
            return worker.terminate();
        }
        worker.onerror = function (event) {
            reject(event);
            return worker.terminate();
        };
    });
}