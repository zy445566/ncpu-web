# ncpu-web
multi-threaded library that browser run function worker

# Installation 
```sh
npm install ncpu-web
```
[ncpu-web](https://github.com/zy445566/ncpu-web) for the **`browser`** environment,use [ncpu](https://github.com/zy445566/ncpu) for the **`node.js`** environment.


`require:Chrome60+，FireFox57+`

# Attention
Because it is multithreaded, context information cannot be received and parameter passing can only be achieved by cloning(
The cloning will occur as described in the [HTML structured clone algorithm](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Structured_clone_algorithm), and an error will be thrown if the object cannot be cloned (e.g. because it contains functions)).

# Quick Start
```js
import {NCPU} from 'ncpu-web' // or const {NCPU} = require('ncpu-web')
async function main () {
  // ### run
    await NCPU.run((a,b)=>a+b,[1,2]) // result: 3
    await NCPU.run((list)=>{
        return list.reduce((total,value)=>{return total+value;});
    },[[1,2,3]]) // result: 6
  // ### pick
    const workerFibo = await NCPU.pick((num)=>{
        const fibo = (value)=>{
            if(value<=2){return 1;}
            return fibo(value-2)+fibo(value-1);
        }
        return fibo(num);
    });
    // slef time to run
    await workerFibo(38)+await workerFibo(39) // result: 102334155 //fibo(40)
    // ### getWorkerPool // reuse a thread
    const ncpuWorkerPool = NCPU.getWorkerPool(); 
    const multiplexingWorkerFibo = await NCPU.pick((num)=>{
        const fibo = (value)=>{
            if(value<=2){return 1;}
            return fibo(value-2)+fibo(value-1);
        }
        return fibo(num);
    }, {ncpuWorkerPool}); // reuse a thread
    const res = await Promise.all([multiplexingWorkerFibo(38), NCPU.run((num)=>{
        const fibo = (value)=>{
            if(value<=2){return 1;}
            return fibo(value-2)+fibo(value-1);
        }
        return fibo(num);
    }, [39] ,{ncpuWorkerPool})]); // reuse a thread
    
    // use the default thread pool
    const defaultPool = NCPU.getDefaultWorkerPool();
    await NCPU.run((a, b) => a + b, [5, 10], {ncpuWorkerPool: defaultPool}); // result: 15
}
main()
```
The above example spawns a Worker thread for each callback function when runing. In actual practice, use a pool of Workers instead for these kinds of tasks. Otherwise, the overhead of creating Workers would likely exceed their benefit.

# License
[ncpu-web](https://github.com/zy445566/ncpu-web) is available under the MIT license. See the [LICENSE](https://github.com/zy445566/ncpu-web/blob/master/LICENSE) file for details.

