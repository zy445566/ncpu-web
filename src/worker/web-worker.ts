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
        // more stable
        const runFunction = new Function(
            'params',
            `const func = ${ncpuParams.functionData};return func(...params);`
        );
        result.res = await runFunction(ncpuParams.params);
    } catch(err) {
        result.error = err;
    } finally {
        postMessage(result);
    }
    
}
