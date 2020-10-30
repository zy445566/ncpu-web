type NcpuParams = {
    key:number,
    functionData:string,
    params:Array<any>
}
type NcpuResult = {
    key:number,
    error:any,
    res:any
}
// var runFunction = function(_params){}
self.onmessage =  async function(event) {
    const ncpuParams:NcpuParams = event.data;
    const result:NcpuResult = {key:ncpuParams.key, error:undefined, res:undefined}
    try {
        // more error tracing
        // const blob = new Blob(
        //     [`function runFunction (params){const func = ${ncpuParams.functionData};return func(...params)}`], 
        //     {type : 'application/javascript'}
        // );
        // const workerUrl = URL.createObjectURL(blob);
        // importScripts(workerUrl)
        // more stable
        const runFunction = new Function(
            'params',
            `const func = ${ncpuParams.functionData};return func(...params);`
        );
        result.res = await runFunction(ncpuParams.params);
    } catch(err) {
        result.error = err;
    } finally {
        this.postMessage(result);
    }
    
}
