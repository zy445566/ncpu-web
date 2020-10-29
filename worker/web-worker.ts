type NcpuParams = {
    key:number,
    functionData:string,
    params:Array<any>
}
type NcpuResult = {
    key:number,
    res:any
}
var runFunction = function(_params){}
self.onmessage =  async function(event) {
    const ncpuParams:NcpuParams = event.data;
    const blob = new Blob(
        [`function runFunction (params){const func = ${ncpuParams.functionData};return func(...params)}`], 
        {type : 'application/javascript'}
    );
    const workerUrl = URL.createObjectURL(blob);
    importScripts(workerUrl)
    // const runFunction = new Function(
    //     'params',
    //     `const func = ${ncpuParams.functionData};return func(...params);`
    // );
    const result:NcpuResult = {key:ncpuParams.key,res:undefined}
    result.res = runFunction(ncpuParams.params);
    if(result.res instanceof Promise) {result.res = await result.res;}
    this.postMessage(result);
}
