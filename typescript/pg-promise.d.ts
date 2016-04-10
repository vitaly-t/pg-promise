////////////////////////////////////////
// Requires pg-promise v3.7.0 or later.
////////////////////////////////////////

declare module "pg-promise" {

    import {PG, Client, Result} from "pg";
    import * as pgMinify from "pg-minify";

    // temporary? Is there a better way to declare promises?
    interface Promise<R> {
    }

    // Query Result Mask;
    // API: http://vitaly-t.github.io/pg-promise/global.html#queryResult
    enum queryResult {
        one = 1,
        many = 2,
        none = 4,
        any = 6
    }

    // Transaction Isolation Level;
    // API: http://vitaly-t.github.io/pg-promise/global.html#isolationLevel
    enum isolationLevel{
        none = 0,
        serializable = 1,
        repeatableRead = 2,
        readCommitted = 3
    }

    // Query Result Error Code;
    // API: http://vitaly-t.github.io/pg-promise/global.html#queryResultErrorCode
    enum queryResultErrorCode {
        noData = 0,
        notEmpty = 1,
        multiple = 2
    }

    // Query Result Error;
    // API: http://vitaly-t.github.io/pg-promise/QueryResultError.html
    interface QueryResultError extends Error {
        result:Result,
        received:number,
        code:queryResultErrorCode,
        query:string,
        values?:any
    }

    // Base database protocol
    // API: http://vitaly-t.github.io/pg-promise/Database.html
    interface BaseProtocol {

        // generic query method;
        query(query:any, values?:any, qrm?:queryResult):Promise<any>;

        // result-specific methods;
        none(query:any, values?:any):Promise<void>;
        one(query:any, values?:any):Promise<any>;
        oneOrNone(query:any, values?:any):Promise<any>;
        many(query:any, values?:any):Promise<any[]>;
        manyOrNone(query:any, values?:any):Promise<any[]>;
        any(query:any, values?:any):Promise<any[]>;
        result(query:any, values?:any):Promise<Result>;

        stream(qs:Object, init:Function):Promise<{processed:number, duration:number}>;

        func(funcName:string, values?:any[] | any, qrm?:queryResult):Promise<any>;
        proc(procName:string, values?:any[] | any):Promise<any>;

        task(cb:TaskCallback):Promise<any>;
        task(tag:any, cb:TaskCallback):Promise<any>;

        tx(cb:TaskCallback):Promise<any>;
        tx(tag:any, cb:TaskCallback):Promise<any>;
    }

    // Database full protocol;
    // API: http://vitaly-t.github.io/pg-promise/Database.html
    interface Database extends BaseProtocol {
        connect():Promise<Connection>;
    }

    // Database connected manually;
    interface Connection extends BaseProtocol {
        done():void;
    }

    interface TaskCallback {
        (t:Task):Promise<any>
    }

    // Task/Transaction interface;
    // API: http://vitaly-t.github.io/pg-promise/Task.html
    interface Task extends BaseProtocol {

        // SPEX API: https://github.com/vitaly-t/spex/blob/master/docs/code/batch.md
        batch(values:any[], cb?:Function):Promise<any[]>;
        batch(values:any[], options:{cb?:Function}):Promise<any[]>;

        // SPEX API: https://github.com/vitaly-t/spex/blob/master/docs/code/page.md
        page(source:Function, dest?:Function, limit?:number):Promise<{pages:number, total:number, duration:number}>;
        page(source:Function, options:{dest?:Function, limit?:number}):Promise<{pages:number, total:number, duration:number}>;

        // SPEX API: https://github.com/vitaly-t/spex/blob/master/docs/code/sequence.md
        sequence(source:Function, dest?:Function, limit?:number, track?:boolean):Promise<any>;
        sequence(source:Function, options:{dest?:Function, limit?:number, track?:boolean}):Promise<any>;

        ctx:TaskContext;
    }

    // Query formatting namespace;
    // API: http://vitaly-t.github.io/pg-promise/formatting.html
    interface Formatting {
        array(arr:Array<any>):string;
        bool(value:any):string;
        buffer(obj:Object, raw?:boolean):string;
        csv(values:any):string;
        date(d:Date|Function, raw?:boolean):string;
        format(query:string, values?:any, options?:{partial?:boolean}):string;
        func(func:Function, raw?:boolean, obj?:Object):string;
        json(obj:any, raw?:boolean):string;
        name(name:string|Function):string;
        number(value:number|Function):string;
        text(value:any, raw?:boolean):string;
        value(value:any):string;
    }

    // Generic Event Context interface;
    // See: http://vitaly-t.github.io/pg-promise/global.html#event:query
    interface EventContext {
        client:Client;
        cn?:any;
        query?:any;
        params?:any;
        ctx?:TaskContext;
    }

    // Event context extension for tasks/transactions;
    // See: http://vitaly-t.github.io/pg-promise/global.html#event:query
    interface TaskContext {
        isTX:boolean;
        start:Date;
        finish?:Date;
        tag?:any;
        success?:boolean;
        result?:any;
        context?:Object;
    }

    // Database connection configuration interface;
    // See: https://github.com/brianc/node-postgres/blob/master/lib/connection-parameters.js#L36
    interface Config {
        host?:string,
        port?:number,
        database:string,
        user?:string,
        password?:string,
        ssl?:boolean,
        binary?:boolean,
        client_encoding?:string,
        application_name?:string,
        fallback_application_name?:string
    }

    // Promise Adapter class;
    // API: http://vitaly-t.github.io/pg-promise/PromiseAdapter.html
    export class PromiseAdapter {
        constructor(create:(cb)=>(resolve:Function, reject:Function)=>void, resolve:(data:any)=>void, reject:(reason:any)=>void);
    }

    // Query File class;
    // API: http://vitaly-t.github.io/pg-promise/QueryFile.html
    export class QueryFile {
        constructor(file:string, options?:{
            debug?:boolean,
            minify?:boolean|'auto',
            compress?:boolean,
            params?:any
        });
    }

    // Transaction Mode class;
    // API: http://vitaly-t.github.io/pg-promise/TransactionMode.html
    export class TransactionMode {
        constructor(tiLevel?:isolationLevel, readOnly?:boolean, deferrable?:boolean);
        constructor(options:{tiLevel?:isolationLevel, readOnly?:boolean, deferrable?:boolean});
    }

    // Errors namespace
    // API: http://vitaly-t.github.io/pg-promise/errors.html
    interface errors {
        QueryResultError:QueryResultError,
        queryResultErrorCode:queryResultErrorCode,
    }

    // Transaction Mode namespace;
    // API: http://vitaly-t.github.io/pg-promise/txMode.html
    interface TXMode {
        isolationLevel:isolationLevel,
        TransactionMode:TransactionMode
    }

    // Main protocol of the library;
    // API: http://vitaly-t.github.io/pg-promise/module-pg-promise.html
    interface pgRoot {
        minify:pgMinify,
        PromiseAdapter:PromiseAdapter,
        QueryFile:QueryFile,
        queryResult:queryResult,
        errors:errors,
        txMode:TXMode,
        as:Formatting
    }

    // Post-initialization interface;
    // API: http://vitaly-t.github.io/pg-promise/module-pg-promise.html
    interface pgMain extends pgRoot {
        (cn:string|Config):Database,
        end:Function,
        pg:PG
    }
    
    // Default library interface (before initialization)
    // API: http://vitaly-t.github.io/pg-promise/module-pg-promise.html
    interface pgPromise extends pgRoot {
        (options?:{
            pgFormatting?:boolean;
            pgNative?:boolean,
            promiseLib?:any;
            connect?:(client:Client) => void;
            disconnect?:(client:Client) => void;
            query?:(e:EventContext) => void;
            receive?:(data:any[], result:any, e:EventContext) => void;
            task?:(e:EventContext) => void;
            transact?:(e:EventContext) => void;
            error?:(err:any, e:EventContext) => void;
            extend?:(obj:any) => void;
            noLocking?:boolean;
            capSQL?:boolean;
        }):pgMain
    }

    export default pgPromise;
}
