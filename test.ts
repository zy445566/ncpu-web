import {NCPU} from './index'

const testUnit = {
    [Symbol('test.run.add')] : async function() {
        console.log(
            await NCPU.run((a,b)=>a+b,[1,2]),
            3,
            'test.run.add error'
        )
    },
    [Symbol('test.run.sum')] : async function() {
        console.log(
            await NCPU.run((list)=>{
                return list.reduce((total,value)=>{return total+value;});
            },[[1,2,3]]),
            6,
            'test.run.sum error'
        )
    },
    [Symbol('test.run.map')] : async function() {
        console.log(
            await NCPU.run((list)=>{
                const map = {}
                for(const value of list) {
                    map[value.id] = value;
                }
                return map;
            },[[{id:1},{id:2}]]),
            {
                1:{id:1},
                2:{id:2}
            },
            'test.run.map error'
        )
    },
    [Symbol('test.pick.fibo')] : async function() {
        const workerFibo = await NCPU.pick((num)=>{
                const fibo = (value)=>{
                    if(value<=2){return 1;}
                    return fibo(value-2)+fibo(value-1);
                }
                return fibo(num);
        });
        console.log(
            await workerFibo(38)+await workerFibo(39),
            102334155,
            'test.pick.fibo error'
        )
    },
    [Symbol('test.run.async.add')] : async function() {
        console.log(
            await NCPU.run(async(a,b)=>a+b,[1,2]),
            3,
            'test.run.async.add error'
        )
    },
    [Symbol('test.getWorker.fibo')] : async function() {
        const ncpuWorker = NCPU.getWorker(); // 
        const multiplexingWorkerFibo = await NCPU.pick((num)=>{
            const fibo = (value)=>{
                if(value<=2){return 1;}
                return fibo(value-2)+fibo(value-1);
            }
            return fibo(num);
        }, ncpuWorker); // reuse a thread
        const res = await Promise.all([multiplexingWorkerFibo(38), NCPU.run((num)=>{
            const fibo = (value)=>{
                if(value<=2){return 1;}
                return fibo(value-2)+fibo(value-1);
            }
            return fibo(num);
        }, [39] ,ncpuWorker)]); // reuse a thread
        console.log(
            res[0]+res[1],
            102334155,
            'test.getWorker.fibo error'
        )
    },
    [Symbol('test.run.timeout')] : async function() {
        try{
            await NCPU.run(()=>{while(true){}},[],NCPU.getWorker(),3000)
        } catch(err){
            console.log(err.message, 'task timeout', 'test.run.timeout error')
        }
    },
    [Symbol('test.run.uncatchError')] : async function() {
        try{
            await NCPU.run(()=>{throw new Error('uncatchError')})
        } catch(err){
            console.log(err.message, 'uncatchError', 'test.run.uncatchError')
        }
    },
}


async function run(testUnitList) {
    for(let testUnitValue of testUnitList) {
        for(let testFunc of Object.getOwnPropertySymbols(testUnitValue)) {
            await testUnitValue[testFunc]();
        }
    }
}
(async function() {
    await run([testUnit]);
})();

