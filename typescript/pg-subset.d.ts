/*
 * Copyright (c) 2015-present, Vitaly Tomilov
 *
 * See the LICENSE file at the top-level directory of this distribution
 * for licensing information.
 *
 * Removal or modification of this copyright notice is prohibited.
 */

//////////////////////////////////////////////////////////////////////////////
// Declaring only a subset of the 'pg' module that's useful within pg-promise.
//
// Calling it 'pg-subset' to avoid a conflict in case the application also
// includes the official 'pg' typings.
//
// Supported version of pg: 7.12.1 and later.
//
// pg: https://github.com/brianc/node-postgres
//////////////////////////////////////////////////////////////////////////////

import {EventEmitter} from 'events';
import {checkServerIdentity} from 'tls';

declare namespace pg {

    interface IColumn {
        name: string
        oid: number
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

        // properties below are not available within Native Bindings:
        rowAsArray: boolean

        _types: {
            _types: any,
            text: any,
            binary: any
        };
        _parsers: Array<Function>;
    }

    // SSL configuration;
    // For property types and documentation see:
    // http://nodejs.org/api/tls.html#tls_tls_connect_options_callback
    interface ISSLConfig {
        ca?: string | Buffer | Array<string | Buffer>
        pfx?: string | Buffer | Array<string | Buffer | object>
        cert?: string | Buffer | Array<string | Buffer>
        key?: string | Buffer | Array<Buffer | object>
        passphrase?: string
        rejectUnauthorized?: boolean
        checkServerIdentity?: typeof checkServerIdentity
        secureOptions?: number
        NPNProtocols?: string[] | Buffer | Buffer[] | Uint8Array | Uint8Array[]
    }

    type DynamicPassword = string | (() => string) | (() => Promise<string>);

    // See:
    // 1) https://github.com/brianc/node-postgres/blob/master/lib/defaults.js
    // 2) https://github.com/brianc/node-pg-pool
    interface IConnectionParameters {
        connectionString?: string
        host?: string
        database?: string
        user?: string
        password?: DynamicPassword
        port?: number
        ssl?: boolean | ISSLConfig
        binary?: boolean
        client_encoding?: string
        encoding?: string
        application_name?: string
        fallback_application_name?: string
        isDomainSocket?: boolean
        max?: number
        min?: number
        idleTimeoutMillis?: number
        parseInputDatesAsUTC?: boolean
        rows?: number
        statement_timeout?: boolean | number
        query_timeout?: boolean | number
        connect_timeout?: number
        keepAliveInitialDelayMillis?: number
        keepAlive?: boolean
        keepalives?: number
        keepalives_idle?: number
    }

    // Type id-s supported by PostgreSQL, copied from:
    // http://github.com/brianc/node-pg-types/blob/master/lib/builtins.js
    enum TypeId {
        BOOL = 16,
        BYTEA = 17,
        CHAR = 18,
        INT8 = 20,
        INT2 = 21,
        INT4 = 23,
        REGPROC = 24,
        TEXT = 25,
        OID = 26,
        TID = 27,
        XID = 28,
        CID = 29,
        JSON = 114,
        XML = 142,
        PG_NODE_TREE = 194,
        SMGR = 210,
        PATH = 602,
        POLYGON = 604,
        CIDR = 650,
        FLOAT4 = 700,
        FLOAT8 = 701,
        ABSTIME = 702,
        RELTIME = 703,
        TINTERVAL = 704,
        CIRCLE = 718,
        MACADDR8 = 774,
        MONEY = 790,
        MACADDR = 829,
        INET = 869,
        ACLITEM = 1033,
        BPCHAR = 1042,
        VARCHAR = 1043,
        DATE = 1082,
        TIME = 1083,
        TIMESTAMP = 1114,
        TIMESTAMPTZ = 1184,
        INTERVAL = 1186,
        TIMETZ = 1266,
        BIT = 1560,
        VARBIT = 1562,
        NUMERIC = 1700,
        REFCURSOR = 1790,
        REGPROCEDURE = 2202,
        REGOPER = 2203,
        REGOPERATOR = 2204,
        REGCLASS = 2205,
        REGTYPE = 2206,
        UUID = 2950,
        TXID_SNAPSHOT = 2970,
        PG_LSN = 3220,
        PG_NDISTINCT = 3361,
        PG_DEPENDENCIES = 3402,
        TSVECTOR = 3614,
        TSQUERY = 3615,
        GTSVECTOR = 3642,
        REGCONFIG = 3734,
        REGDICTIONARY = 3769,
        JSONB = 3802,
        REGNAMESPACE = 4089,
        REGROLE = 4096
    }

    // Interface of 'pg-types' module;
    // See: https://github.com/brianc/node-pg-types
    interface ITypes {
        setTypeParser: (id: TypeId, format: string | ((value: string) => any)) => void
        getTypeParser: (id: TypeId, format?: string) => any
        arrayParser: (source: string, transform: (entry: any) => any) => any[]

        builtins: typeof TypeId
    }

    interface IDefaults {

        // connection string for overriding defaults
        connectionString: string

        // database host. defaults to localhost
        host: string

        // database user's name
        user: string

        // name of database to connect
        database: string

        // database user's password
        password: DynamicPassword

        // database port
        port: number

        // number of rows to return at a time from a prepared statement's
        // portal. 0 will return all rows at once
        rows: number

        // binary result mode
        binary: boolean

        // Connection pool options - see https://github.com/brianc/node-pg-pool

        // number of connections to use in connection pool
        // 0 will disable connection pooling
        max: number,

        // max milliseconds a client can go unused before it is removed
        // from the pool and destroyed
        idleTimeoutMillis: number

        client_encoding: string

        ssl: boolean | ISSLConfig

        application_name: string

        fallback_application_name: string

        parseInputDatesAsUTC: boolean

        // max milliseconds any query using this connection will execute for before timing out in error.
        // false=unlimited
        statement_timeout: boolean | number

        // max milliseconds to wait for query to complete (client side)
        query_timeout: boolean | number

        connect_timeout: number

        keepalives: number

        keepalives_idle: number
    }

    class Query {
        // not used within pg-promise;
    }

    interface IClient extends EventEmitter {

        query(config: any, values: any[], callback: (err: Error, result: IResult) => void): undefined;

        query(config: any, callback: (err: Error, result: IResult) => void): undefined;

        query(config: any, values: any[]): Promise<IResult>;

        query(config: any): Promise<IResult>;

        on(event: 'drain', listener: () => void): this

        on(event: 'error', listener: (err: Error) => void): this

        on(event: 'notification', listener: (message: any) => void): this

        on(event: 'notice', listener: (message: any) => void): this

        on(event: string, listener: Function): this

        connectionParameters: IConnectionParameters;
        database: string;
        user: string;
        password: DynamicPassword;
        port: number;
        host: string;

        // properties below are not available within Native Bindings:

        queryQueue: Query[];
        binary: boolean;
        ssl: boolean | ISSLConfig;
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
