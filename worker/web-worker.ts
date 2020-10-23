type NcpuParams = {
    key:number,
    functionData:string,
    params:Array<any>
}
type NcpuResult = {
    key:number,
    res:any
}
self.onmessage =  async function(event) {
    const ncpuParams:NcpuParams = event.data;
    const runFunction = new Function(
        'params',
        `const func = ${ncpuParams.functionData};return func(...params);`
    );
    const result:NcpuResult = {key:ncpuParams.key,res:undefined}
    result.res = runFunction(ncpuParams.params);
    if(result.res instanceof Promise) {result.res = await result.res;}
    this.postMessage(result);
}
