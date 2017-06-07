//////////////////////////////////////////////////////////////////////////////
// This definition file should support the external libraries that don't have
// a Typescript definition file yet or to provide a custom / subset version,
// i.e. pg-subset.
//////////////////////////////////////////////////////////////////////////////


//////////////////////////////////////////////////////////////////////////////
// *** pg-subset ***
//////////////////////////////////////////////////////////////////////////////
// Declaring only a subset of the 'pg' module that's useful within pg-promise.
//
// Calling it 'pg-subset' to avoid a conflict in case the application also
// includes the official 'pg' typings.
//
// Supported version of pg: 4.3.0 and later.
//
// pg: https://github.com/brianc/node-postgres
//////////////////////////////////////////////////////////////////////////////
declare module 'pg-subset' {

    import { EventEmitter } from 'events';
    import { Buffer } from 'buffer';

    namespace pg {

        interface IColumn {
            name: string,
            dataTypeID: number,

            // properties below are not available within Native Bindings:

            tableID: number,
            columnID: number,
            dataTypeSize: number,
            dataTypeModifier: number,
            format: string
        }

        interface IResult {
            command: string,
            rowCount: number,
            rows: Array<any>,
            fields: Array<IColumn>,

            duration: number, // pg-promise extension

            // properties below are not available within Native Bindings:

            rowAsArray: boolean
        }

        // SSL configuration;
        // For property types and documentation see:
        // http://nodejs.org/api/tls.html#tls_tls_connect_options_callback
        interface ISSLConfig {
            ca?: string | string[] | Buffer | Buffer[];
            pfx?: string | Buffer;
            cert?: string | string[] | Buffer | Buffer[];
            key?: string | string[] | Buffer | Object[];
            passphrase?: string;
            rejectUnauthorized?: boolean;
            NPNProtocols?: string[] | Buffer;
        }

        interface IConnectionParameters {
            database?: string;
            user?: string;
            password?: string;
            port?: number;
            host?: string;
            ssl?: boolean | ISSLConfig;
            binary?: boolean;
            client_encoding?: string;
            application_name?: string;
            fallback_application_name?: string;
            isDomainSocket?: boolean;
        }

        // Interface of 'pg-types' module;
        // See: https://github.com/brianc/node-pg-types
        interface ITypes {
            setTypeParser: (oid: number, format: string | ((value: string) => any)) => void;
            getTypeParser: (oid: number, format?: string) => any;
            arrayParser: (source: string, transform: (entry: any) => any) => Array<any>;
        }

        interface IDefaults {
            // database host. defaults to localhost
            host: string,

            //database user's name
            user: string,

            //name of database to connect
            database: string,

            //database user's password
            password?: string,

            //database port
            port: number,

            //number of rows to return at a time from a prepared statement's
            //portal. 0 will return all rows at once
            rows: number,

            // binary result mode
            binary: boolean,

            //Connection pool options - see https://github.com/coopernurse/node-pool
            //number of connections to use in connection pool
            //0 will disable connection pooling
            poolSize: number,

            //max milliseconds a client can go unused before it is removed
            //from the pool and destroyed
            poolIdleTimeout: number,

            //frequency to check for idle clients within the client pool
            reapIntervalMillis: number,

            //pool log function / boolean
            poolLog: boolean,

            client_encoding: string,

            ssl: boolean | ISSLConfig,

            application_name?: string,

            fallback_application_name?: string,

            parseInputDatesAsUTC: boolean
        }

        class Connection {
            // not needed within pg-promise;
        }

        class Query {
            // not needed within pg-promise;
        }

        class Client extends EventEmitter {
            constructor(cn: string | IConnectionParameters);

            query: (config: any, values: any, callback: (err: Error, result: IResult) => void) => Query;

            on(event: 'drain', listener: () => void): this;
            on(event: 'error', listener: (err: Error) => void): this;
            on(event: 'notification', listener: (message: any) => void): this;
            on(event: 'notice', listener: (message: any) => void): this;
            on(event: string, listener: Function): this;

            connectionParameters: IConnectionParameters;
            database: string;
            user: string;
            password: string;
            port: number;
            host: string;

            // properties below are not available within Native Bindings:

            queryQueue: Array<Query>;
            binary: boolean;
            ssl: boolean | ISSLConfig;
            secretKey: number;
            processID: number;
            encoding: string;
            readyForQuery: boolean;
            activeQuery: Query;
        }

        var defaults: IDefaults;
        var types: ITypes;
    }

    export = pg;
}

//////////////////////////////////////////////////////////////////////////////
// *** ext-promise ***
//////////////////////////////////////////////////////////////////////////////
//  External Promise Provider.
//  The purpose of this module is to make it possible to enable declarations of a custom promise library
//  by patching this file manually. It presumes that you are already initializing pg-promise with a custom
//  promise library, using option `promiseLib`. If not, then you cannot use the provisions documented here.
//  Example of enabling declarations for Bluebird:
//  1. Install Bluebird ambient TypeScript as you normally would:
//  $ typings install bluebird --ambient --save
//  2. Add the reference path here, similar to this:
//  /// <reference path='../../../typings/main' />
//  3. Replace line `export=Promise` with the following:
//  import * as promise from 'bluebird';
//  export=promise;
//  Unfortunately, as of today it is impossible to use custom promises as TypeScript generics,
//  and this is why we have this file here, so it can be manually patched.
//  You can find research details on this matter from the following link:
//  http://stackoverflow.com/questions/36593087/using-a-custom-promise-as-a-generic-type
//  In the meantime, if you do not want to get these settings overridden during an update or deployment,
//  it may be a good idea to copy all of the *.ts files into your own project, and use them from there.
//////////////////////////////////////////////////////////////////////////////
declare module 'ext-promise' {
    export = Promise; // Using ES6 Promise by default
}