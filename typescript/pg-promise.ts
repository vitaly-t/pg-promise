////////////////////////////////////////
// Requires pg-promise v3.8.0 or later.
////////////////////////////////////////

/// <reference path='./pg' />
/// <reference path='./pg-minify' />
/// <reference path='./promise' />

declare module 'pg-promise' {

    import * as pg from 'pg';
    import * as pgMinify from 'pg-minify';
    import XPromise=require('promise');

    // Base database protocol
    // API: http://vitaly-t.github.io/pg-promise/Database.html
    interface IBaseProtocol<Ext> {

        // generic query method;
        query(query:any, values?:any, qrm?:pgPromise.queryResult):XPromise<any>;

        // result-specific methods;
        none(query:any, values?:any):XPromise<void>;
        one(query:any, values?:any):XPromise<any>;
        oneOrNone(query:any, values?:any):XPromise<any>;
        many(query:any, values?:any):XPromise<Array<any>>;
        manyOrNone(query:any, values?:any):XPromise<Array<any>>;
        any(query:any, values?:any):XPromise<Array<any>>;

        result(query:any, values?:any):XPromise<pg.IResult>;

        stream(qs:Object, init:(stream:Object)=>void):XPromise<{processed:number, duration:number}>;

        // functions and procedures

        func(funcName:string, values?:any, qrm?:pgPromise.queryResult):XPromise<any>;
        proc(procName:string, values?:any):XPromise<any>;

        // tasks & transactions

        task(cb:(t:ITask<Ext>&Ext)=>any):XPromise<any>;
        task(tag:any, cb:(t:ITask<Ext>&Ext)=>any):XPromise<any>;

        tx(cb:(t:ITask<Ext>&Ext)=>any):XPromise<any>;
        tx(tag:any, cb:(t:ITask<Ext>&Ext)=>any):XPromise<any>;
    }

    // Database protocol in connected state;
    interface IConnected<Ext> extends IBaseProtocol<Ext> {
        done():void;
    }

    // Task/Transaction interface;
    // API: http://vitaly-t.github.io/pg-promise/Task.html
    interface ITask<Ext> extends IBaseProtocol<Ext> {

        // SPEX API: https://github.com/vitaly-t/spex/blob/master/docs/code/batch.md
        batch(values:Array<any>, cb?:(index:number, success:boolean, result:any, delay:number)=>any):XPromise<Array<any>>;
        batch(values:Array<any>, options:{cb?:(index:number, success:boolean, result:any, delay:number)=>any}):XPromise<Array<any>>;

        // SPEX API: https://github.com/vitaly-t/spex/blob/master/docs/code/page.md
        page(source:(index:number, data:any, delay:number)=>any, dest?:(index:number, data:any, delay:number)=>any, limit?:number):XPromise<{pages:number, total:number, duration:number}>;
        page(source:(index:number, data:any, delay:number)=>any, options:{dest?:(index:number, data:any, delay:number)=>any, limit?:number}):XPromise<{pages:number, total:number, duration:number}>;

        // SPEX API: https://github.com/vitaly-t/spex/blob/master/docs/code/sequence.md
        sequence(source:(index:number, data:any, delay:number)=>any, dest?:(index:number, data:any, delay:number)=>any, limit?:number, track?:boolean):XPromise<any>;
        sequence(source:(index:number, data:any, delay:number)=>any, options:{dest?:(index:number, data:any, delay:number)=>any, limit?:number, track?:boolean}):XPromise<any>;

        ctx:ITaskContext;
    }

    // Query formatting namespace;
    // API: http://vitaly-t.github.io/pg-promise/formatting.html
    interface IFormatting {

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

    // Event context extension for tasks/transactions;
    // See: http://vitaly-t.github.io/pg-promise/global.html#event:query
    interface ITaskContext {
        isTX:boolean;
        start:Date;
        finish:Date;
        tag:any;
        dc:any;
        success:boolean;
        result:any;
        context:Object;
    }

    // Generic Event Context interface;
    // See: http://vitaly-t.github.io/pg-promise/global.html#event:query
    interface IEventContext {
        client:pg.Client;
        cn:any;
        dc:any;
        query:any;
        params:any;
        ctx:ITaskContext;
    }

    // Database connection configuration interface;
    // See: https://github.com/brianc/node-postgres/blob/master/lib/connection-parameters.js#L36
    interface IConfig {
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
        result:pg.IResult;
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
    interface IErrors {
        QueryResultError:typeof QueryResultError;
        queryResultErrorCode:typeof queryResultErrorCode;
    }

    // Transaction Mode namespace;
    // API: http://vitaly-t.github.io/pg-promise/txMode.html
    interface ITXMode {
        isolationLevel:typeof isolationLevel,
        TransactionMode:typeof TransactionMode
    }

    // Post-initialization interface;
    // API: http://vitaly-t.github.io/pg-promise/module-pg-promise.html
    interface IMain {
        (cn:string|IConfig, dc?:any):pgPromise.IDatabase<IEmptyExt>,
        PromiseAdapter:typeof pgPromise.PromiseAdapter;
        QueryFile:typeof pgPromise.QueryFile;
        queryResult:typeof pgPromise.queryResult;
        minify:typeof pgMinify,
        errors:IErrors;
        txMode:ITXMode;
        as:IFormatting;
        end():void,
        pg:typeof pg
    }

    // Empty Extensions
    interface IEmptyExt {

    }

    // Main protocol of the library;
    // API: http://vitaly-t.github.io/pg-promise/module-pg-promise.html
    namespace pgPromise {
        var minify:typeof pgMinify;

        // Query Result Mask;
        // API: http://vitaly-t.github.io/pg-promise/global.html#queryResult
        enum queryResult {
            one = 1,
            many = 2,
            none = 4,
            any = 6
        }

        // Query File class;
        // API: http://vitaly-t.github.io/pg-promise/QueryFile.html
        class QueryFile {
            constructor(file:string, options?:{
                debug?:boolean,
                minify?:boolean|'after',
                compress?:boolean,
                params?:any
            });
        }

        // Promise Adapter class;
        // API: http://vitaly-t.github.io/pg-promise/PromiseAdapter.html
        class PromiseAdapter {
            constructor(create:(cb)=>Object, resolve:(data:any)=>void, reject:(reason:any)=>void);
        }

        var txMode:ITXMode;
        var errors:IErrors;
        var as:IFormatting;

        // Database full protocol;
        // API: http://vitaly-t.github.io/pg-promise/Database.html
        //
        // We export this interface only to be able to help IntelliSense cast extension types correctly,
        // which doesn't always work, depending on the version of IntelliSense being used. 
        interface IDatabase<Ext> extends IBaseProtocol<Ext> {
            connect():XPromise<IConnected<Ext>>;
        }

    }

    // Library's Initialization Options
    // API: http://vitaly-t.github.io/pg-promise/module-pg-promise.html
    interface IOptions<Ext> {
        pgFormatting?:boolean;
        pgNative?:boolean,
        promiseLib?:any;
        connect?:(client:pg.Client, dc:any) => void;
        disconnect?:(client:pg.Client, dc:any) => void;
        query?:(e:IEventContext) => void;
        receive?:(data:Array<any>, result:pg.IResult, e:IEventContext) => void;
        task?:(e:IEventContext) => void;
        transact?:(e:IEventContext) => void;
        error?:(err:any, e:IEventContext) => void;
        extend?:(obj:pgPromise.IDatabase<Ext>&Ext, dc:any) => void;
        noLocking?:boolean;
        capSQL?:boolean;
    }

    // Default library interface (before initialization)
    // API: http://vitaly-t.github.io/pg-promise/module-pg-promise.html
    function pgPromise(options?:IOptions<IEmptyExt>):IMain;
    function pgPromise<Ext>(options?:IOptions<Ext>):IMain;

    export=pgPromise;
}
