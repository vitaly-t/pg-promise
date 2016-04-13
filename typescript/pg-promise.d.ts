////////////////////////////////////////
// Requires pg-promise v3.7.0 or later.
////////////////////////////////////////

/// <reference path="./pg.d.ts" />
/// <reference path="./pg-minify.d.ts" />
/// <reference path="./promise.d.ts" />

declare module "pg-promise" {

    import * as pg from "pg";
    import * as pgMinify from "pg-minify";
    import XPromise=require("promise");

    // Base database protocol
    // API: http://vitaly-t.github.io/pg-promise/Database.html
    interface BaseProtocol {

        // generic query method;
        query(query:any, values?:any, qrm?:pgPromise.queryResult):XPromise<Object|Array<Object>|void>;

        // result-specific methods;
        none(query:any, values?:any):XPromise<void>;
        one(query:any, values?:any):XPromise<Object>;
        oneOrNone(query:any, values?:any):XPromise<Object|void>;
        many(query:any, values?:any):XPromise<Array<Object>>;
        manyOrNone(query:any, values?:any):XPromise<Array<Object>>;
        any(query:any, values?:any):XPromise<Array<Object>>;

        result(query:any, values?:any):XPromise<pg.Result>;

        stream(qs:Object, init:(stream:Object)=>void):XPromise<{processed:number, duration:number}>;

        // functions and procedures

        func(funcName:string, values?:Array<any> | any, qrm?:pgPromise.queryResult):XPromise<Object|Array<Object>|void>;
        proc(procName:string, values?:Array<any> | any):XPromise<Object|void>;

        // tasks & transactions

        task(cb:(t:Task)=>any):XPromise<any>;
        task(tag:any, cb:(t:Task)=>any):XPromise<any>;

        tx(cb:(t:Task)=>any):XPromise<any>;
        tx(tag:any, cb:(t:Task)=>any):XPromise<any>;
    }

    // Database full protocol;
    // API: http://vitaly-t.github.io/pg-promise/Database.html
    interface Database extends BaseProtocol {
        connect():XPromise<Connected>;
    }

    // Database protocol in connected state;
    interface Connected extends BaseProtocol {
        done():void;
    }

    // Task/Transaction interface;
    // API: http://vitaly-t.github.io/pg-promise/Task.html
    interface Task extends BaseProtocol {

        // SPEX API: https://github.com/vitaly-t/spex/blob/master/docs/code/batch.md
        batch(values:Array<any>, cb?:(index:number, success:boolean, result:any, delay:number)=>any):XPromise<Array<any>>;
        batch(values:Array<any>, options:{cb?:(index:number, success:boolean, result:any, delay:number)=>any}):XPromise<Array<any>>;

        // SPEX API: https://github.com/vitaly-t/spex/blob/master/docs/code/page.md
        page(source:(index:number, data:any, delay:number)=>any, dest?:(index:number, data:any, delay:number)=>any, limit?:number):XPromise<{pages:number, total:number, duration:number}>;
        page(source:(index:number, data:any, delay:number)=>any, options:{dest?:(index:number, data:any, delay:number)=>any, limit?:number}):XPromise<{pages:number, total:number, duration:number}>;

        // SPEX API: https://github.com/vitaly-t/spex/blob/master/docs/code/sequence.md
        sequence(source:(index:number, data:any, delay:number)=>any, dest?:(index:number, data:any, delay:number)=>any, limit?:number, track?:boolean):XPromise<any>;
        sequence(source:(index:number, data:any, delay:number)=>any, options:{dest?:(index:number, data:any, delay:number)=>any, limit?:number, track?:boolean}):XPromise<any>;

        ctx:TaskContext;
    }

    // Query formatting namespace;
    // API: http://vitaly-t.github.io/pg-promise/formatting.html
    interface Formatting {

        array(arr:Array<any>|(()=>Array<any>)):string;

        bool(value:any|(()=>any)):string;

        buffer(obj:Object|(()=>Object), raw?:boolean):string;

        csv(values:any|(()=>any)):string;

        date(d:Date|(()=>Date), raw?:boolean):string;

        format(query:string, values?:any, options?:{partial?:boolean}):string;

        func(func:()=>any, raw?:boolean, obj?:Object):string;

        json(obj:any|(()=>any), raw?:boolean):string;

        name(name:string|(()=>string)):string;

        number(value:number|(()=>number)):string;

        text(value:any|(()=>any), raw?:boolean):string;

        value(value:any|(()=>any)):string;
    }

    // Generic Event Context interface;
    // See: http://vitaly-t.github.io/pg-promise/global.html#event:query
    interface EventContext {
        client:pg.Client;
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

    // Transaction Isolation Level;
    // API: http://vitaly-t.github.io/pg-promise/global.html#isolationLevel
    enum isolationLevel{
        none = 0,
        serializable = 1,
        repeatableRead = 2,
        readCommitted = 3
    }

    // Transaction Mode class;
    // API: http://vitaly-t.github.io/pg-promise/TransactionMode.html
    class TransactionMode {
        constructor(tiLevel?:isolationLevel, readOnly?:boolean, deferrable?:boolean);
        constructor(options:{tiLevel?:isolationLevel, readOnly?:boolean, deferrable?:boolean});
    }

    // Query Result Error;
    // API: http://vitaly-t.github.io/pg-promise/QueryResultError.html
    class QueryResultError implements Error {

        // standard error properties:
        name:string;
        message:string;
        stack:string;

        // extended properties:
        result:pg.Result;
        received:number;
        code:queryResultErrorCode;
        query:string;
        values:any;

        toString():string;
    }

    // Query Result Error Code;
    // API: http://vitaly-t.github.io/pg-promise/global.html#queryResultErrorCode
    enum queryResultErrorCode {
        noData = 0,
        notEmpty = 1,
        multiple = 2
    }

    // Errors namespace
    // API: http://vitaly-t.github.io/pg-promise/errors.html
    interface Errors {
        QueryResultError:typeof QueryResultError;
        queryResultErrorCode:typeof queryResultErrorCode;
    }

    // Transaction Mode namespace;
    // API: http://vitaly-t.github.io/pg-promise/txMode.html
    interface TXMode {
        isolationLevel:typeof isolationLevel,
        TransactionMode:typeof TransactionMode
    }

    // Post-initialization interface;
    // API: http://vitaly-t.github.io/pg-promise/module-pg-promise.html
    interface pgMain {
        (cn:string|Config):Database,
        PromiseAdapter:typeof pgPromise.PromiseAdapter;
        QueryFile:typeof pgPromise.QueryFile;
        queryResult:typeof pgPromise.queryResult;
        minify:typeof pgMinify,
        errors:Errors;
        txMode:TXMode;
        as:Formatting;
        end():void,
        pg:pg.PG
    }

    // Main protocol of the library;
    // API: http://vitaly-t.github.io/pg-promise/module-pg-promise.html
    namespace pgPromise {
        export var minify:typeof pgMinify;

        // Query Result Mask;
        // API: http://vitaly-t.github.io/pg-promise/global.html#queryResult
        export enum queryResult {
            one = 1,
            many = 2,
            none = 4,
            any = 6
        }

        // Query File class;
        // API: http://vitaly-t.github.io/pg-promise/QueryFile.html
        export class QueryFile {
            constructor(file:string, options?:{
                debug?:boolean,
                minify?:boolean|'after',
                compress?:boolean,
                params?:any
            });
        }

        // Promise Adapter class;
        // API: http://vitaly-t.github.io/pg-promise/PromiseAdapter.html
        export class PromiseAdapter {
            constructor(create:(cb)=>Object, resolve:(data:any)=>void, reject:(reason:any)=>void);
        }

        export var txMode:TXMode;
        export var errors:Errors;
        export var as:Formatting;

    }

    // Default library interface (before initialization)
    // API: http://vitaly-t.github.io/pg-promise/module-pg-promise.html
    function pgPromise(options?:{
        pgFormatting?:boolean;
        pgNative?:boolean,
        promiseLib?:any;
        connect?:(client:pg.Client) => void;
        disconnect?:(client:pg.Client) => void;
        query?:(e:EventContext) => void;
        receive?:(data:Array<Object>, result:pg.Result|void, e:EventContext) => void;
        task?:(e:EventContext) => void;
        transact?:(e:EventContext) => void;
        error?:(err:any, e:EventContext) => void;
        extend?:(obj:Database) => void;
        noLocking?:boolean;
        capSQL?:boolean;
    }):pgMain;

    export=pgPromise;

}
