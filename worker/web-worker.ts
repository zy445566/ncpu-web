self.onmessage =  function(event) {
    const {functionData,params} = event.data.workerData;
    async function run() {
        const runFunction = new Function(
            'params',
            `const func = ${functionData};return func(...params);`
        );
        let res = runFunction(params);
        if(res instanceof Promise) {res = await res;}
        this.postMessage(res)
    }
    run();
}