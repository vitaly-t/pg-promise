////////////////////////////////////////
// Requires pg-promise v6.5.0 or later.
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

    interface ILostContext {
        cn: string
        dc: any
        start: Date
        client: pg.Client
    }

    type TConnectionOptions = {
        direct?: boolean
        onLost?: (err?: any, e?: ILostContext) => void
    };

    type TAssignOptions = {
        source?: Object
        prefix?: string
    };

    type TPreparedBasic = {
        name: string
        text: string
        values: any[]
        binary: boolean
        rowMode: string
        rows: number
    };

    type TParameterizedBasic = {
        text: string
        values: any[]
        binary: boolean
        rowMode: string
    };

    type TPrepared = {
        name: string
        text: string | QueryFile
        values?: any[]
        binary?: boolean
        rowMode?: string
        rows?: number
    };

    type TParameterized = {
        text: string | QueryFile
        values?: any[]
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

        // API: http://vitaly-t.github.io/pg-promise/helpers.TableName.html#toPostgres
        toPostgres(self: TableName): string
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
        toString(level?: number): string
    }

    // helpers.Column class;
    // API: http://vitaly-t.github.io/pg-promise/helpers.ColumnSet.html
    class ColumnSet {
        constructor(columns: Column, options?: TColumnSetOptions)
        constructor(columns: Array<string | TColumnConfig | Column>, options?: TColumnSetOptions)
        constructor(columns: Object, options?: TColumnSetOptions)

        // these are all read-only:

        // API: http://vitaly-t.github.io/pg-promise/helpers.ColumnSet.html#columns
        readonly columns: Column[];

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
        toString(level?: number): string
    }

    const minify: typeof pgMinify;

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
        constructor(name: string, text: string | QueryFile, values?: any[])
        constructor(obj: PreparedStatement)
        constructor(obj: TPrepared)

        // standard properties:
        name: string;
        text: string | QueryFile;
        values: any[];

        // advanced properties:
        binary: boolean;
        rowMode: string;
        rows: any;

        // API: http://vitaly-t.github.io/pg-promise/PreparedStatement.html#parse
        parse(): TPreparedBasic | errors.PreparedStatementError

        // API: http://vitaly-t.github.io/pg-promise/PreparedStatement.html#toString
        toString(level?: number): string
    }

    // ParameterizedQuery class;
    // API: http://vitaly-t.github.io/pg-promise/ParameterizedQuery.html
    class ParameterizedQuery {

        // API: http://vitaly-t.github.io/pg-promise/ParameterizedQuery.html
        constructor(text: string | QueryFile, values?: any[])
        constructor(obj: ParameterizedQuery)
        constructor(obj: TParameterized)

        // standard properties:
        text: string | QueryFile;
        values: any[];

        // advanced properties:
        binary: boolean;
        rowMode: string;

        // API: http://vitaly-t.github.io/pg-promise/ParameterizedQuery.html#parse
        parse(): TParameterizedBasic | errors.ParameterizedQueryError

        // API: http://vitaly-t.github.io/pg-promise/ParameterizedQuery.html#toString
        toString(level?: number): string
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
        toString(level?: number): string

        // API: http://vitaly-t.github.io/pg-promise/QueryFile.html#toPostgres
        toPostgres(self: QueryFile): string
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
        readonly $cn: string | TConfig

        // API: http://vitaly-t.github.io/pg-promise/Database.html#$dc
        readonly $dc: any

        // Pool object as provided by pg-pool;
        // API: https://github.com/brianc/node-pg-pool
        readonly $pool: any
    }

    type TConfig = pg.TConnectionParameters

    // Post-initialization interface;
    // API: http://vitaly-t.github.io/pg-promise/module-pg-promise.html
    interface IMain {
        (cn: string | TConfig, dc?: any): IDatabase<IEmptyExt>

        <T>(cn: string | TConfig, dc?: any): IDatabase<T> & T

        readonly PromiseAdapter: typeof PromiseAdapter
        readonly PreparedStatement: typeof PreparedStatement
        readonly ParameterizedQuery: typeof ParameterizedQuery
        readonly QueryFile: typeof QueryFile
        readonly queryResult: typeof queryResult
        readonly minify: typeof pgMinify
        readonly spex: spexLib.ISpex
        readonly errors: typeof errors
        readonly utils: IUtils
        readonly txMode: ITXMode
        readonly helpers: IHelpers
        readonly as: IFormatting
        readonly pg: typeof pg

        end(): void
    }

    // Additional methods available inside tasks + transactions;
    // API: http://vitaly-t.github.io/pg-promise/Task.html
    interface ITask<Ext> extends IBaseProtocol<Ext>, spexLib.ISpexBase {
        // API: http://vitaly-t.github.io/pg-promise/Task.html#ctx
        readonly ctx: ITaskContext
    }

    // Base database protocol
    // API: http://vitaly-t.github.io/pg-promise/Database.html
    interface IBaseProtocol<Ext> {

        // API: http://vitaly-t.github.io/pg-promise/Database.html#query
        query<T=any>(query: TQuery, values?: any, qrm?: queryResult): XPromise<T>

        // result-specific methods;

        // API: http://vitaly-t.github.io/pg-promise/Database.html#none
        none(query: TQuery, values?: any): XPromise<null>

        // API: http://vitaly-t.github.io/pg-promise/Database.html#one
        one<T=any>(query: TQuery, values?: any, cb?: (value: any) => T, thisArg?: any): XPromise<T>

        // API: http://vitaly-t.github.io/pg-promise/Database.html#oneOrNone
        oneOrNone<T=any>(query: TQuery, values?: any, cb?: (value: any) => T, thisArg?: any): XPromise<T>

        // API: http://vitaly-t.github.io/pg-promise/Database.html#many
        many<T=any>(query: TQuery, values?: any): XPromise<IArrayExt<T>>

        // API: http://vitaly-t.github.io/pg-promise/Database.html#manyOrNone
        manyOrNone<T=any>(query: TQuery, values?: any): XPromise<IArrayExt<T>>

        // API: http://vitaly-t.github.io/pg-promise/Database.html#any
        any<T=any>(query: TQuery, values?: any): XPromise<IArrayExt<T>>

        // API: http://vitaly-t.github.io/pg-promise/Database.html#result
        result<T=pg.IResult>(query: TQuery, values?: any, cb?: (value: any) => T, thisArg?: any): XPromise<T>

        // API: http://vitaly-t.github.io/pg-promise/Database.html#stream
        stream(qs: Object, init: (stream: NodeJS.ReadableStream) => void): XPromise<{ processed: number, duration: number }>

        // API: http://vitaly-t.github.io/pg-promise/Database.html#func
        func<T=any>(funcName: string, values?: any, qrm?: queryResult): XPromise<T>

        // API: http://vitaly-t.github.io/pg-promise/Database.html#proc
        proc<T=any>(procName: string, values?: any, cb?: (value: any) => T, thisArg?: any): XPromise<T>

        // API: http://vitaly-t.github.io/pg-promise/Database.html#map
        map<T=any>(query: TQuery, values: any, cb: (row: any, index: number, data: any[]) => T, thisArg?: any): XPromise<IArrayExt<T>>

        // API: http://vitaly-t.github.io/pg-promise/Database.html#each
        each<T=any>(query: TQuery, values: any, cb: (row: any, index: number, data: any[]) => void, thisArg?: any): XPromise<IArrayExt<T>>

        // Tasks
        // API: http://vitaly-t.github.io/pg-promise/Database.html#task
        task<T=any>(cb: (t: ITask<Ext> & Ext) => T): XPromise<T>

        task<T=any>(tag: any, cb: (t: ITask<Ext> & Ext) => T): XPromise<T>

        // Transactions
        // API: http://vitaly-t.github.io/pg-promise/Database.html#tx
        tx<T=any>(cb: (t: ITask<Ext> & Ext) => T): XPromise<T>

        tx<T=any>(tag: any, cb: (t: ITask<Ext> & Ext) => T): XPromise<T>
    }

    // Database object in connected state;
    interface IConnected<Ext> extends IBaseProtocol<Ext>, spexLib.ISpexBase {
        readonly client: pg.Client

        done(): void
    }

    // Event context extension for tasks + transactions;
    // See: http://vitaly-t.github.io/pg-promise/global.html#TaskContext
    interface ITaskContext {

        // these are set in the beginning of each task/transaction:
        readonly context: any
        readonly parent: ITaskContext | null
        readonly connected: boolean
        readonly level: number
        readonly isFresh: boolean
        readonly isTX: boolean
        readonly start: Date
        readonly tag: any
        readonly dc: any

        // these are set at the end of each task/transaction:
        readonly finish?: Date
        readonly duration?: number
        readonly success?: boolean
        readonly result?: any

        // this exists only inside transactions (isTX = true):
        readonly txLevel?: number
    }

    // Generic Event Context interface;
    // See: http://vitaly-t.github.io/pg-promise/global.html#EventContext
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
            toString(level?: number): string
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
            toString(level?: number): string
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
            toString(level?: number): string
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
        receive?: (data: any[], result: pg.IResult, e: IEventContext) => void
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
        toPostgres: (a: any) => any
    }

    // Query formatting namespace;
    // API: http://vitaly-t.github.io/pg-promise/formatting.html
    interface IFormatting {

        // API: http://vitaly-t.github.io/pg-promise/formatting.html#.alias
        alias(name: string | (() => string)): string

        // API: http://vitaly-t.github.io/pg-promise/formatting.html#.array
        array(arr: any[] | (() => any[])): string

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

        insert(data: Object | Object[], columns?: TQueryColumns, table?: string | TTable | TableName): string

        update(data: Object | Object[], columns?: TQueryColumns, table?: string | TTable | TableName, options?: TUpdateOptions): any

        values(data: Object | Object[], columns?: TQueryColumns): string

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
