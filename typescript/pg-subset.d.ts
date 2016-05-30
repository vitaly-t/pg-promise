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

    namespace pg {

        interface IColumn {
            name:string,
            dataTypeID:number,

            // the ones below are not available with the Native Bindings;

            tableID:number,
            columnID:number,
            dataTypeSize:number,
            dataTypeModifier:number,
            format:string
        }

        interface IResult {
            command:string,
            rowCount:number,
            rows:Array<any>,
            fields:Array<IColumn>,

            duration:number, // pg-promise extension

            // the ones below are not available with the Native Bindings;

            rowAsArray:boolean
        }

        interface IConnectionParameters {
            database:string;
            user:string;
            password:string;
            port:number;
            host:string;
            ssl:boolean;
            binary:boolean;
            client_encoding:string;
            application_name:string;
            fallback_application_name:string;
            isDomainSocket:boolean;
        }

        // Interface of 'pg-types' module;
        // See: https://github.com/brianc/node-pg-types
        interface ITypes {
            setTypeParser:(oid:number, format:string|((value:any)=>string))=>void;
            getTypeParser:(oid:number, format?:string)=>any;
            arrayParser:(source:string, transform:(entry:any)=>any)=>Array<any>;
        }

        interface IDefaults {
            // database host. defaults to localhost
            host:string,

            //database user's name
            user:string,

            //name of database to connect
            database:string,

            //database user's password
            password?:string,

            //database port
            port:number,

            //number of rows to return at a time from a prepared statement's
            //portal. 0 will return all rows at once
            rows:number,

            // binary result mode
            binary:boolean,

            //Connection pool options - see https://github.com/coopernurse/node-pool
            //number of connections to use in connection pool
            //0 will disable connection pooling
            poolSize:number,

            //max milliseconds a client can go unused before it is removed
            //from the pool and destroyed
            poolIdleTimeout:number,

            //frequency to check for idle clients within the client pool
            reapIntervalMillis:number,

            //pool log function / boolean
            poolLog:boolean,

            client_encoding:string,

            ssl:boolean,

            application_name?:string,

            fallback_application_name?:string,

            parseInputDatesAsUTC:boolean
        }

        class Connection {
            // not needed within pg-promise;
        }

        class Query {
            // not needed within pg-promise;
        }

        class Client {

            constructor(config:any);

            query:(config:any, values:any, callback:(err:Error, result:IResult)=>void)=>Query;

            connectionParameters:IConnectionParameters;
            database:string;
            user:string;
            password:string;
            port:number;
            host:string;

            // these are not available with Native Bindings:

            queryQueue:Array<Query>;
            binary:boolean;
            ssl:boolean;
            secretKey:number;
            processID:number;
            encoding:string;
            readyForQuery:boolean;
            activeQuery:Query;
        }

        var defaults:IDefaults;
        var types:ITypes;
    }

    export=pg;
}
