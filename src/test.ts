import {NCPU} from './index'

// 创建测试结果容器
const testResults: {name: string, status: 'pass'|'fail'|'error', message: string, expected?: any, actual?: any}[] = [];

function addTestResult(name: string, actual: any, expected?: any, message?: string) {
    let status: 'pass'|'fail'|'error' = 'pass';
    let resultMessage = message || '';
    
    if (expected !== undefined) {
        status = JSON.stringify(actual) === JSON.stringify(expected) ? 'pass' : 'fail';
        if (status === 'fail') {
            resultMessage = `Expected: ${JSON.stringify(expected)}, Actual: ${JSON.stringify(actual)}`;
        }
    }

    testResults.push({
        name,
        status,
        message: resultMessage,
        expected,
        actual
    });
}

const testUnit = {
    [Symbol('test.run.add')] : async function() {
        const result = await NCPU.run((a,b)=>a+b,[1,2]);
        addTestResult('test.run.add', result, 3, 'Simple addition test');
    },
    [Symbol('test.run.sum')] : async function() {
        const result = await NCPU.run((list)=>{
            return list.reduce((total,value)=>{return total+value;});
        },[[1,2,3]]);
        addTestResult('test.run.sum', result, 6, 'Array sum test');
    },
    [Symbol('test.run.map')] : async function() {
        const result = await NCPU.run((list)=>{
            const map = {}
            for(const value of list) {
                map[value.id] = value;
            }
            return map;
        },[[{id:1},{id:2}]]);
        addTestResult('test.run.map', result, {
            1:{id:1},
            2:{id:2}
        }, 'Object mapping test');
    },
    [Symbol('test.pick.fibo')] : async function() {
        const workerFibo = await NCPU.pick((num)=>{
                const fibo = (value)=>{
                    if(value<=2){return 1;}
                    return fibo(value-2)+fibo(value-1);
                }
                return fibo(num);
        });
        const result = await workerFibo(38)+await workerFibo(39);
        addTestResult('test.pick.fibo', result, 102334155, 'Fibonacci calculation test');
    },
    [Symbol('test.run.async.add')] : async function() {
        const result = await NCPU.run(async(a,b)=>a+b,[1,2]);
        addTestResult('test.run.async.add', result, 3, 'Async addition test');
    },
    [Symbol('test.getWorkerPool.fibo')] : async function() {
        const ncpuWorkerPool = NCPU.getWorkerPool();
        const multiplexingWorkerFibo = await NCPU.pick((num)=>{
            const fibo = (value)=>{
                if(value<=2){return 1;}
                return fibo(value-2)+fibo(value-1);
            }
            return fibo(num);
        }, {ncpuWorkerPool});
        const res = await Promise.all([multiplexingWorkerFibo(38), NCPU.run((num)=>{
            const fibo = (value)=>{
                if(value<=2){return 1;}
                return fibo(value-2)+fibo(value-1);
            }
            return fibo(num);
        }, [39] ,{ncpuWorkerPool})]);
        const result = res[0]+res[1];
        addTestResult('test.getWorkerPool.fibo', result, 102334155, 'Worker pool Fibonacci test');
    },
    [Symbol('test.run.timeout')] : async function() {
        try{
            await NCPU.run(()=>{while(true){}},[],{ncpuWorkerPool:NCPU.getWorkerPool({timeout:3000})});
            addTestResult('test.run.timeout', 'No timeout', 'Task execution timed out after 3000ms', 'Timeout test - should have timed out');
        } catch(err){
            addTestResult('test.run.timeout', err.message, 'Task execution timed out after 3000ms', 'Timeout test');
        }
    },
    [Symbol('test.run.uncatchError')] : async function() {
        try{
            await NCPU.run(()=>{throw new Error('uncatchError')});
            addTestResult('test.run.uncatchError', 'No error', 'uncatchError', 'Error handling test - should have thrown error');
        } catch(err){
            addTestResult('test.run.uncatchError', err.message, 'uncatchError', 'Error handling test');
        }
    },
}


async function run(testUnitList) {
    for(let testUnitValue of testUnitList) {
        for(let testFunc of Object.getOwnPropertySymbols(testUnitValue)) {
            console.log(testFunc,'start')
            await testUnitValue[testFunc]();
            console.log(testFunc,'end')
        }
    }
}

// 导出测试结果以便在页面上显示
(window as any).testResults = testResults;

(async function() {
    await run([testUnit]).catch(err=>{
        console.log(err);
    });
    // 通知页面测试已完成
    if (typeof (window as any).testsCompleted === 'function') {
        (window as any).testsCompleted(testResults);
    }
})();

