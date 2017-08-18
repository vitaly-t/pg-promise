//////////////////////////////////////////////////////////////////////////////
// Declaring only a subset of the 'pg' module that's useful within pg-promise.
//
// Calling it 'pg-subset' to avoid a conflict in case the application also
// includes the official 'pg' typings.
//
// Supported version of pg: 6.3.0 and later.
//
// pg: https://github.com/brianc/node-postgres
//////////////////////////////////////////////////////////////////////////////

import {EventEmitter} from 'events';

declare namespace pg {

    interface IColumn {
        name: string
        dataTypeID: number

        // NOTE: properties below are not available within Native Bindings:

        tableID: number
        columnID: number
        dataTypeSize: number
        dataTypeModifier: number
        format: string
    }

    interface IResult {
        command: string
        rowCount: number
        rows: any[]
        fields: IColumn[]

        duration: number // pg-promise extension

        // properties below are not available within Native Bindings:

        rowAsArray: boolean
    }

    // SSL configuration;
    // For property types and documentation see:
    // http://nodejs.org/api/tls.html#tls_tls_connect_options_callback
    type TSSLConfig = {
        ca?: string | string[] | Buffer | Buffer[]
        pfx?: string | Buffer
        cert?: string | string[] | Buffer | Buffer[]
        key?: string | string[] | Buffer | Object[]
        passphrase?: string
        rejectUnauthorized?: boolean
        NPNProtocols?: string[] | Buffer
    }

    // See:
    // 1) https://github.com/brianc/node-postgres/blob/master/lib/defaults.js
    // 2) https://github.com/brianc/node-pg-pool
    type TConnectionParameters = {
        database?: string
        user?: string
        password?: string
        port?: number
        host?: string
        ssl?: boolean | TSSLConfig
        binary?: boolean
        client_encoding?: string
        application_name?: string
        fallback_application_name?: string
        isDomainSocket?: boolean
        poolSize?: number // is the same as `max` below
        max?: number // replaces `poolSize`
        min?: number
        poolIdleTimeout?: number
        reapIntervalMillis?: number
        returnToHead?: boolean
        poolLog?: boolean | (() => void)
        parseInputDatesAsUTC?: boolean
        rows?: number
    }

    // Interface of 'pg-types' module;
    // See: https://github.com/brianc/node-pg-types
    interface ITypes {
        setTypeParser: (oid: number, format: string | ((value: string) => any)) => void
        getTypeParser: (oid: number, format?: string) => any
        arrayParser: (source: string, transform: (entry: any) => any) => any[]
    }

    interface IDefaults {
        // database host. defaults to localhost
        host: string

        //database user's name
        user: string

        //name of database to connect
        database: string

        //database user's password
        password?: string

        //database port
        port: number

        //number of rows to return at a time from a prepared statement's
        //portal. 0 will return all rows at once
        rows: number

        // binary result mode
        binary: boolean

        //Connection pool options - see https://github.com/coopernurse/node-pool
        //number of connections to use in connection pool
        //0 will disable connection pooling
        poolSize: number

        //max milliseconds a client can go unused before it is removed
        //from the pool and destroyed
        poolIdleTimeout: number

        //frequency to check for idle clients within the client pool
        reapIntervalMillis: number

        //pool log function / boolean
        poolLog: boolean | (() => void)

        client_encoding: string

        ssl: boolean | TSSLConfig

        application_name: string

        fallback_application_name: string

        parseInputDatesAsUTC: boolean
    }

    class Connection {
        // not needed within pg-promise;
    }

    class Query {
        // not needed within pg-promise;
    }

    class Client extends EventEmitter {

        constructor(cn: string | TConnectionParameters)

        query: (config: any, values: any, callback: (err: Error, result: IResult) => void) => Query;

        on(event: 'drain', listener: () => void): this
        on(event: 'error', listener: (err: Error) => void): this
        on(event: 'notification', listener: (message: any) => void): this
        on(event: 'notice', listener: (message: any) => void): this
        on(event: string, listener: Function): this

        connectionParameters: TConnectionParameters;
        database: string;
        user: string;
        password: string;
        port: number;
        host: string;

        // properties below are not available within Native Bindings:

        queryQueue: Query[];
        binary: boolean;
        ssl: boolean | TSSLConfig;
        secretKey: number;
        processID: number;
        encoding: string;
        readyForQuery: boolean;
        activeQuery: Query;
    }

    const defaults: IDefaults;
    const types: ITypes;
}

export = pg;
