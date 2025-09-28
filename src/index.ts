import  {
    NcpuWorkerPool,
    NcpuWorkerPoolOptions
}  from './worker/pool';

export type NCPUOPTION  = {ncpuWorkerPool?:NcpuWorkerPool}

const DefaultNCPUOption = {ncpuWorkerPool:new NcpuWorkerPool()}

export class NCPU {
    static getWorkerPool(options?: NcpuWorkerPoolOptions):NcpuWorkerPool {
        return new NcpuWorkerPool(options);
    }
    static pick(func:Function, {ncpuWorkerPool=new NcpuWorkerPool()}:NCPUOPTION=DefaultNCPUOption):Function {
        return (...params:Array<any>)=>{
            return ncpuWorkerPool.run(func, params);
        }
    }
    static run (func:Function,params:Array<any>=[], {ncpuWorkerPool=new NcpuWorkerPool()}:NCPUOPTION=DefaultNCPUOption):Promise<any> {
        return ncpuWorkerPool.run(func, params);
    };
}
