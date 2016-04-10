///////////////////////////////////
// Interface for pg-promise v3.7.0
///////////////////////////////////

declare module "pg-promise" {

    import {PG, Client, Result} from "pg";
    import * as pgMinify from "pg-minify";

    // temporary? how else to expose promises?
    interface Promise<R> {
    }

    // Query Result Mask
    enum queryResult {
        one = 1,
        many = 2,
        none = 4,
        any = 6
    }

    // Transaction Isolation Level
    enum isolationLevel{
        none = 0,
        serializable = 1,
        repeatableRead = 2,
        readCommitted = 3
    }

    // Query Result Error Code
    enum queryResultErrorCode {
        noData = 0,
        notEmpty = 1,
        multiple = 2
    }

    interface QueryResultError extends Error {
        result:Result,
        received:number,
        code:queryResultErrorCode,
        query:string,
        values?:any
    }

    // Base database protocol
    interface BaseProtocol {

        // generic method:
        query(query:any, values?:any, qrm?:queryResult):Promise<any>;

        // result-specific methods;
        none(query:any, values?:any):Promise<void>;
        one(query:any, values?:any):Promise<any>;
        oneOrNone(query:any, values?:any):Promise<any>;
        many(query:any, values?:any):Promise<any[]>;
        manyOrNone(query:any, values?:any):Promise<any[]>;
        any(query:any, values?:any):Promise<any[]>;
        result(query:any, values?:any):Promise<Object>;

        stream(qs:Object, init:Function):Promise<any>;

        func(funcName:string, values?:any[] | any, qrm?:queryResult):Promise<any>;
        proc(procName:string, values?:any[] | any):Promise<any>;

        task(cb:TaskCallback):Promise<any>;
        task(tag:any, cb:TaskCallback):Promise<any>;

        tx(cb:TaskCallback):Promise<any>;
        tx(tag:any, cb:TaskCallback):Promise<any>;
    }

    // Database full protocol;
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
    interface Task extends BaseProtocol {

        batch(values:any[], cb?:Function):Promise<any>;
        batch(values:any[], {cb:Function}):Promise<any>;

        page(source:Function, dest?:Function, limit?:Number):Promise<any>;
        page(source:Function, {dest:Function, limit:Number}):Promise<any>;

        sequence(source:Function, dest?:Function, limit?:Number, track?:Boolean):Promise<any>;
        sequence(source:Function, {dest:Function, limit:Number, track:Boolean}):Promise<any>;

        ctx:TaskContext;
    }

    // Query formatting namespace;
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
        number(value:Number|Function):string;
        text(value:any, raw?:boolean):string;
        value(value:any):string;
    }

    // Generic Event Context interface;
    interface EventContext {
        client:Client;
        cn?:any;
        query?:any;
        params?:any;
        ctx?:TaskContext;
    }

    // Event context extension for tasks/transactions;
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

    export class PromiseAdapter {
        constructor(create:(cb)=>(resolve, reject)=>void, resolve:(data)=>void, reject:(reason)=>void);
    }

    export class QueryFile {
        constructor(file:string, options?:{
            debug?:boolean,
            minify?:boolean|'auto',
            compress?:boolean,
            params?:any
        });
    }

    // Errors namespace
    interface errors {
        QueryResultError:QueryResultError,
        queryResultErrorCode:queryResultErrorCode,
    }

    // Transaction Mode namespace;
    interface TXMode {
        isolationLevel:isolationLevel,
        TransactionMode:Function
    }

    // Main protocol of the library;
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
    interface pgMain extends pgRoot {
        (cn:string|Config):Database,
        end:Function,
        pg:PG
    }

    // Default library interface (before initialization)
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
