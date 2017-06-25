////////////////////////////////////////
// Requires pg-promise v5.9.6 or later.
////////////////////////////////////////

import * as XPromise from './ext-promise'; // External Promise Provider

import * as pg from './pg-subset';
import * as pgMinify from 'pg-minify';
import * as spexLib from 'spex';

// Empty Extensions
interface IEmptyExt {

}

// Main protocol of the library;
// API: http://vitaly-t.github.io/pg-promise/module-pg-promise.html
declare namespace pgPromise {

    type TQueryFileOptions = {
        debug?: boolean
        minify?: boolean | 'after'
        compress?: boolean
        params?: any
        noWarnings?: boolean
    };

    type TFormattingOptions = {
        partial?: boolean
        default?: any
    };

    type TConnectionOptions = {
        direct?: boolean
    };

    type TAssignOptions = {
        source?: Object
        prefix?: string
    };

    type TPreparedBasic = {
        name: string
        text: string
        values: Array<any>
        binary: boolean
        rowMode: string
        rows: number
    };

    type TParameterizedBasic = {
        text: string
        values: Array<any>
        binary: boolean
        rowMode: string
    };

    type TPrepared = {
        name: string
        text: string | QueryFile
        values?: Array<any>
        binary?: boolean
        rowMode?: string
        rows?: number
    };

    type TParameterized = {
        text: string | QueryFile
        values?: Array<any>
        binary?: boolean
        rowMode?: string
    };

    type TQuery = string | QueryFile | TPrepared | TParameterized | PreparedStatement | ParameterizedQuery

    type TColumnDescriptor = {
        source: any
        name: string
        value: any
        exists: boolean
    };

    type TColumnConfig = {
        name: string
        prop?: string
        mod?: string
        cast?: string
        cnd?: boolean
        def?: any
        init?: (col: TColumnDescriptor) => any
        skip?: (col: TColumnDescriptor) => boolean
    };

    type TColumnSetOptions = {
        table?: string | TTable | TableName
        inherit?: boolean
    };

    type TUpdateOptions = {
        tableAlias?: string
        valueAlias?: string
        emptyUpdate?: any
    };

    type TTable = {
        table: string
        schema?: string
    };

    type TQueryColumns = Column | ColumnSet | Array<string | TColumnConfig | Column>

    type TSqlBuildConfig = {
        dir: string
        recursive?: boolean
        ignoreErrors?: boolean
        output?: string
        module?: {
            path?: string
            name?: string
        }
    };

    type TQueryFormat = {
        query: string | QueryFile
        values?: any
        options?: TFormattingOptions
    };

    type TPromiseConfig = {
        create: (resolve: (value?: any) => void, reject?: (reason?: any) => void) => XPromise<any>

        resolve: (value?: any) => void

        reject: (reason?: any) => void

        all: (iterable: any) => XPromise<any>
    };

    interface IArrayExt<T> extends Array<T> {
        duration: number
    }

    // helpers.TableName class;
    // API: http://vitaly-t.github.io/pg-promise/helpers.TableName.html
    class TableName {
        constructor(table: string, schema?: string)
        constructor(table: TTable)

        // these are all read-only:
        readonly name: string;
        readonly table: string;
        readonly schema: string;

        // API: http://vitaly-t.github.io/pg-promise/helpers.TableName.html#toString
        toString(): string
    }

    // helpers.Column class;
    // API: http://vitaly-t.github.io/pg-promise/helpers.Column.html
    class Column {
        constructor(col: string | TColumnConfig);

        // these are all read-only:
        readonly name: string;
        readonly prop: string;
        readonly mod: string;
        readonly cast: string;
        readonly cnd: boolean;
        readonly def: any;

        readonly init: (value: any) => any;
        readonly skip: (name: string) => boolean;

        // API: http://vitaly-t.github.io/pg-promise/helpers.Column.html#toString
        toString(): string
    }

    // helpers.Column class;
    // API: http://vitaly-t.github.io/pg-promise/helpers.ColumnSet.html
    class ColumnSet {
        constructor(columns: Column, options?: TColumnSetOptions)
        constructor(columns: Array<string | TColumnConfig | Column>, options?: TColumnSetOptions)
        constructor(columns: Object, options?: TColumnSetOptions)

        // these are all read-only:

        // API: http://vitaly-t.github.io/pg-promise/helpers.ColumnSet.html#columns
        readonly columns: Array<Column>;

        // API: http://vitaly-t.github.io/pg-promise/helpers.ColumnSet.html#names
        readonly names: string;

        // http://vitaly-t.github.io/pg-promise/helpers.ColumnSet.html#table
        readonly table: TableName;

        // API: http://vitaly-t.github.io/pg-promise/helpers.ColumnSet.html#variables
        readonly variables: string;

        // API: http://vitaly-t.github.io/pg-promise/helpers.ColumnSet.html#prepare
        assign(source?: TAssignOptions): string

        // API: http://vitaly-t.github.io/pg-promise/helpers.ColumnSet.html#extend
        extend(columns: Column | ColumnSet | Array<string | TColumnConfig | Column>): ColumnSet

        // API: http://vitaly-t.github.io/pg-promise/helpers.ColumnSet.html#merge
        merge(columns: Column | ColumnSet | Array<string | TColumnConfig | Column>): ColumnSet

        // API: http://vitaly-t.github.io/pg-promise/helpers.ColumnSet.html#prepare
        prepare(obj: Object): Object

        // API: http://vitaly-t.github.io/pg-promise/helpers.ColumnSet.html#toString
        toString(): string
    }

    var minify: typeof pgMinify;

    // Query Result Mask;
    // API: http://vitaly-t.github.io/pg-promise/global.html#queryResult
    enum queryResult {
        one = 1,
        many = 2,
        none = 4,
        any = 6
    }

    // PreparedStatement class;
    // API: http://vitaly-t.github.io/pg-promise/PreparedStatement.html
    class PreparedStatement {

        // API: http://vitaly-t.github.io/pg-promise/PreparedStatement.html
        constructor(name: string, text: string | QueryFile, values?: Array<any>)
        constructor(obj: PreparedStatement)
        constructor(obj: TPrepared)

        // standard properties:
        name: string;
        text: string | QueryFile;
        values: Array<any>;

        // advanced properties:
        binary: boolean;
        rowMode: string;
        rows: any;

        // API: http://vitaly-t.github.io/pg-promise/PreparedStatement.html#parse
        parse(): TPreparedBasic | errors.PreparedStatementError

        // API: http://vitaly-t.github.io/pg-promise/PreparedStatement.html#toString
        toString(): string
    }

    // ParameterizedQuery class;
    // API: http://vitaly-t.github.io/pg-promise/ParameterizedQuery.html
    class ParameterizedQuery {

        // API: http://vitaly-t.github.io/pg-promise/ParameterizedQuery.html
        constructor(text: string | QueryFile, values?: Array<any>)
        constructor(obj: ParameterizedQuery)
        constructor(obj: TParameterized)

        // standard properties:
        text: string | QueryFile;
        values: Array<any>;

        // advanced properties:
        binary: boolean;
        rowMode: string;

        // API: http://vitaly-t.github.io/pg-promise/ParameterizedQuery.html#parse
        parse(): TParameterizedBasic | errors.ParameterizedQueryError

        // API: http://vitaly-t.github.io/pg-promise/ParameterizedQuery.html#toString
        toString(): string
    }

    // QueryFile class;
    // API: http://vitaly-t.github.io/pg-promise/QueryFile.html
    class QueryFile {

        // API: http://vitaly-t.github.io/pg-promise/QueryFile.html
        constructor(file: string, options?: TQueryFileOptions)

        // API: http://vitaly-t.github.io/pg-promise/QueryFile.html#error
        readonly error: Error;

        // API: http://vitaly-t.github.io/pg-promise/QueryFile.html#file
        readonly file: string;

        // API: http://vitaly-t.github.io/pg-promise/QueryFile.html#options
        readonly options: any;

        // API: http://vitaly-t.github.io/pg-promise/QueryFile.html#prepare
        prepare(): void

        // API: http://vitaly-t.github.io/pg-promise/QueryFile.html#toString
        toString(): string
    }

    // PromiseAdapter class;
    // API: http://vitaly-t.github.io/pg-promise/PromiseAdapter.html
    class PromiseAdapter {
        constructor(api: TPromiseConfig)
    }

    const txMode: ITXMode;
    const utils: IUtils;
    const as: IFormatting;

    // Database full protocol;
    // API: http://vitaly-t.github.io/pg-promise/Database.html
    //
    // We export this interface only to be able to help IntelliSense cast extension types correctly,
    // which doesn't always work, depending on the version of IntelliSense being used. 
    interface IDatabase<Ext> extends IBaseProtocol<Ext> {
        connect(options?: TConnectionOptions): XPromise<IConnected<Ext>>

        /////////////////////////////////////////////////////////////////////////////
        // Hidden, read-only properties, for integrating with third-party libraries:

        // API: http://vitaly-t.github.io/pg-promise/Database.html#$config
        readonly $config: ILibConfig<Ext>

        // API: http://vitaly-t.github.io/pg-promise/Database.html#$cn
        readonly $cn: string | IConfig

        // API: http://vitaly-t.github.io/pg-promise/Database.html#$dc
        readonly $dc: any
    }

    type IConfig = pg.IConnectionParameters

    // Post-initialization interface;
    // API: http://vitaly-t.github.io/pg-promise/module-pg-promise.html
    interface IMain {
        (cn: string | IConfig, dc?: any): IDatabase<IEmptyExt>

        <T>(cn: string | IConfig, dc?: any): IDatabase<T> & T

        PromiseAdapter: typeof PromiseAdapter
        PreparedStatement: typeof PreparedStatement
        ParameterizedQuery: typeof ParameterizedQuery
        QueryFile: typeof QueryFile
        queryResult: typeof queryResult
        minify: typeof pgMinify
        spex: spexLib.ISpex
        errors: typeof errors
        utils: IUtils
        txMode: ITXMode
        helpers: IHelpers
        as: IFormatting
        pg: typeof pg

        end(): void
    }

    // Additional methods available inside tasks + transactions;
    // API: http://vitaly-t.github.io/pg-promise/Task.html
    interface ITask<Ext> extends IBaseProtocol<Ext>, spexLib.ISpexBase {
        // API: http://vitaly-t.github.io/pg-promise/Task.html#ctx
        ctx: ITaskContext
    }

    // Base database protocol
    // API: http://vitaly-t.github.io/pg-promise/Database.html
    interface IBaseProtocol<Ext> {

        // API: http://vitaly-t.github.io/pg-promise/Database.html#query
        query(query: TQuery, values?: any, qrm?: queryResult): XPromise<any>

        // result-specific methods;

        // API: http://vitaly-t.github.io/pg-promise/Database.html#none
        none(query: TQuery, values?: any): XPromise<void>

        // API: http://vitaly-t.github.io/pg-promise/Database.html#one
        one(query: TQuery, values?: any, cb?: (value: any) => any, thisArg?: any): XPromise<any>

        // API: http://vitaly-t.github.io/pg-promise/Database.html#oneOrNone
        oneOrNone(query: TQuery, values?: any, cb?: (value: any) => any, thisArg?: any): XPromise<any>

        // API: http://vitaly-t.github.io/pg-promise/Database.html#many
        many(query: TQuery, values?: any): XPromise<IArrayExt<any>>

        // API: http://vitaly-t.github.io/pg-promise/Database.html#manyOrNone
        manyOrNone(query: TQuery, values?: any): XPromise<IArrayExt<any>>

        // API: http://vitaly-t.github.io/pg-promise/Database.html#any
        any(query: TQuery, values?: any): XPromise<IArrayExt<any>>

        // API: http://vitaly-t.github.io/pg-promise/Database.html#result
        result(query: TQuery, values?: any, cb?: (value: any) => any, thisArg?: any): XPromise<any>

        // API: http://vitaly-t.github.io/pg-promise/Database.html#stream
        stream(qs: Object, init: (stream: NodeJS.ReadableStream) => void): XPromise<{ processed: number, duration: number }>

        // API: http://vitaly-t.github.io/pg-promise/Database.html#func
        func(funcName: string, values?: any, qrm?: queryResult): XPromise<any>

        // API: http://vitaly-t.github.io/pg-promise/Database.html#proc
        proc(procName: string, values?: any, cb?: (value: any) => any, thisArg?: any): XPromise<any>

        // API: http://vitaly-t.github.io/pg-promise/Database.html#map
        map(query: TQuery, values: any, cb: (row: any, index: number, data: Array<any>) => any, thisArg?: any): XPromise<IArrayExt<any>>

        // API: http://vitaly-t.github.io/pg-promise/Database.html#each
        each(query: TQuery, values: any, cb: (row: any, index: number, data: Array<any>) => void, thisArg?: any): XPromise<IArrayExt<any>>

        // Tasks
        // API: http://vitaly-t.github.io/pg-promise/Database.html#task
        task(cb: (t: ITask<Ext> & Ext) => any): XPromise<any>

        task(tag: any, cb: (t: ITask<Ext> & Ext) => any): XPromise<any>

        // Transactions
        // API: http://vitaly-t.github.io/pg-promise/Database.html#tx
        tx(cb: (t: ITask<Ext> & Ext) => any): XPromise<any>

        tx(tag: any, cb: (t: ITask<Ext> & Ext) => any): XPromise<any>
    }

    // Database object in connected state;
    interface IConnected<Ext> extends IBaseProtocol<Ext> {
        client: pg.Client

        done(): void
    }

    // Event context extension for tasks + transactions;
    // See: http://vitaly-t.github.io/pg-promise/Task.html#ctx
    interface ITaskContext {

        // these are set in the beginning of each task/transaction:
        context: any
        isFresh: boolean
        isTX: boolean
        start: Date
        tag: any
        dc: any

        // these are set at the end of each task/transaction:
        finish: Date
        success: boolean
        result: any
    }

    // Generic Event Context interface;
    // See: http://vitaly-t.github.io/pg-promise/global.html#event:query
    interface IEventContext {
        client: pg.Client
        cn: any
        dc: any
        query: any
        params: any
        ctx: ITaskContext
    }

    // Errors namespace
    // API: http://vitaly-t.github.io/pg-promise/errors.html
    namespace errors {
        // QueryResultError interface;
        // API: http://vitaly-t.github.io/pg-promise/errors.QueryResultError.html
        class QueryResultError extends Error {

            // standard error properties:
            name: string;
            message: string;
            stack: string;

            // extended properties:
            result: pg.IResult;
            received: number;
            code: queryResultErrorCode;
            query: string;
            values: any;

            // API: http://vitaly-t.github.io/pg-promise/errors.QueryResultError.html#toString
            toString(): string
        }

        // QueryFileError interface;
        // API: http://vitaly-t.github.io/pg-promise/errors.QueryFileError.html
        class QueryFileError extends Error {

            // standard error properties:
            name: string;
            message: string;
            stack: string;

            // extended properties:
            file: string;
            options: TQueryFileOptions;
            error: pgMinify.SQLParsingError;

            // API: http://vitaly-t.github.io/pg-promise/errors.QueryFileError.html#toString
            toString(): string
        }

        // PreparedStatementError interface;
        // API: http://vitaly-t.github.io/pg-promise/errors.PreparedStatementError.html
        class PreparedStatementError extends Error {

            // standard error properties:
            name: string;
            message: string;
            stack: string;

            // extended properties:
            error: QueryFileError;

            // API: http://vitaly-t.github.io/pg-promise/errors.PreparedStatementError.html#toString
            toString(): string
        }

        // ParameterizedQueryError interface;
        // API: http://vitaly-t.github.io/pg-promise/errors.ParameterizedQueryError.html
        class ParameterizedQueryError extends Error {

            // standard error properties:
            name: string;
            message: string;
            stack: string;

            // extended properties:
            error: QueryFileError;

            // API: http://vitaly-t.github.io/pg-promise/errors.ParameterizedQueryError.html#toString
            toString(): string
        }

        // Query Result Error Code;
        // API: http://vitaly-t.github.io/pg-promise/errors.html#.queryResultErrorCode
        enum queryResultErrorCode {
            noData = 0,
            notEmpty = 1,
            multiple = 2
        }
    }

    // Transaction Isolation Level;
    // API: http://vitaly-t.github.io/pg-promise/txMode.html#.isolationLevel
    enum isolationLevel {
        none = 0,
        serializable = 1,
        repeatableRead = 2,
        readCommitted = 3
    }

    // TransactionMode class;
    // API: http://vitaly-t.github.io/pg-promise/txMode.TransactionMode.html
    class TransactionMode {
        constructor(tiLevel?: isolationLevel, readOnly?: boolean, deferrable?: boolean)
        constructor(options: { tiLevel?: isolationLevel, readOnly?: boolean, deferrable?: boolean })
    }

    // Library's Initialization Options
    // API: http://vitaly-t.github.io/pg-promise/module-pg-promise.html
    interface IOptions<Ext> {
        noWarnings?: boolean
        pgFormatting?: boolean
        pgNative?: boolean
        promiseLib?: any
        connect?: (client: pg.Client, dc: any, fresh: boolean) => void
        disconnect?: (client: pg.Client, dc: any) => void
        query?: (e: IEventContext) => void
        receive?: (data: Array<any>, result: pg.IResult, e: IEventContext) => void
        task?: (e: IEventContext) => void
        transact?: (e: IEventContext) => void
        error?: (err: any, e: IEventContext) => void
        extend?: (obj: IDatabase<Ext> & Ext, dc: any) => void
        noLocking?: boolean
        capSQL?: boolean
    }

    // API: http://vitaly-t.github.io/pg-promise/Database.html#$config
    interface ILibConfig<Ext> {
        version: string
        promiseLib: any
        promise: IGenericPromise
        options: IOptions<Ext>
        pgp: IMain
        $npm: any
    }

    // Custom-Type Formatting object
    // API: https://github.com/vitaly-t/pg-promise#custom-type-formatting
    interface CTFObject {
        formatDBType: (a: any) => any
    }

    // Query formatting namespace;
    // API: http://vitaly-t.github.io/pg-promise/formatting.html
    interface IFormatting {

        // API: http://vitaly-t.github.io/pg-promise/formatting.html#.alias
        alias(name: string | (() => string)): string

        // API: http://vitaly-t.github.io/pg-promise/formatting.html#.array
        array(arr: Array<any> | (() => Array<any>)): string

        // API: http://vitaly-t.github.io/pg-promise/formatting.html#.bool
        bool(value: any | (() => any)): string

        // API: http://vitaly-t.github.io/pg-promise/formatting.html#.buffer
        buffer(obj: Object | (() => Object), raw?: boolean): string

        // API: http://vitaly-t.github.io/pg-promise/formatting.html#.csv
        csv(values: any | (() => any)): string

        // API: http://vitaly-t.github.io/pg-promise/formatting.html#.date
        date(d: Date | (() => Date), raw?: boolean): string

        // API: http://vitaly-t.github.io/pg-promise/formatting.html#.format
        format(query: string | QueryFile | CTFObject, values?: any, options?: TFormattingOptions): string

        // API: http://vitaly-t.github.io/pg-promise/formatting.html#.func
        func(func: (cc: any) => any, raw?: boolean, cc?: any): string

        // API: http://vitaly-t.github.io/pg-promise/formatting.html#.json
        json(data: any | (() => any), raw?: boolean): string

        // API: http://vitaly-t.github.io/pg-promise/formatting.html#.name
        name(name: any | (() => any)): string

        // API: http://vitaly-t.github.io/pg-promise/formatting.html#.number
        number(value: number | (() => number)): string

        // API: http://vitaly-t.github.io/pg-promise/formatting.html#.text
        text(value: any | (() => any), raw?: boolean): string

        // API: http://vitaly-t.github.io/pg-promise/formatting.html#.value
        value(value: any | (() => any)): string
    }

    // Transaction Mode namespace;
    // API: http://vitaly-t.github.io/pg-promise/txMode.html
    interface ITXMode {
        isolationLevel: typeof isolationLevel
        TransactionMode: typeof TransactionMode
    }

    // General-purpose functions
    // API: http://vitaly-t.github.io/pg-promise/utils.html
    interface IUtils {
        camelize(text: string): string

        camelizeVar(text: string): string

        objectToCode(obj: any, cb?: (value: any, name: string, obj: any) => any): string

        enumSql(dir: string, options?: { recursive?: boolean, ignoreErrors?: boolean }, cb?: (file: string, name: string, path: string) => any): any

        buildSqlModule(config?: string | TSqlBuildConfig): string
    }

    // Query Formatting Helpers
    // API: http://vitaly-t.github.io/pg-promise/helpers.html
    interface IHelpers {

        concat(queries: Array<string | TQueryFormat | QueryFile>): string

        insert(data: Object | Array<Object>, columns?: TQueryColumns, table?: string | TTable | TableName): string

        update(data: Object | Array<Object>, columns?: TQueryColumns, table?: string | TTable | TableName, options?: TUpdateOptions): any

        values(data: Object | Array<Object>, columns?: TQueryColumns): string

        sets(data: Object, columns?: TQueryColumns): string

        Column: typeof Column
        ColumnSet: typeof ColumnSet
        TableName: typeof TableName
    }

    interface IGenericPromise {
        (cb: (resolve: (value?: any) => void, reject?: (reason?: any) => void) => void): XPromise<any>

        resolve(value?: any): void

        reject(reason?: any): void

        all(iterable: any): XPromise<any>
    }

}

// Default library interface (before initialization)
// API: http://vitaly-t.github.io/pg-promise/module-pg-promise.html
declare function pgPromise(options?: pgPromise.IOptions<IEmptyExt>): pgPromise.IMain
declare function pgPromise<Ext>(options?: pgPromise.IOptions<Ext>): pgPromise.IMain

export = pgPromise;