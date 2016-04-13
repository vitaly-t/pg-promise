//////////////////////////////////////////////////////////////////////////////
// Declaring only the part of the 'pg' module that's useful within pg-promise
//
// Supported version of pg: 4.5.3 and later.
//
// pg: https://github.com/brianc/node-postgres
//////////////////////////////////////////////////////////////////////////////

declare module "pg" {

    interface Column {
        name:string,
        dataTypeID:number,

        // the ones below are not available with the Native Bindings;

        tableID:number,
        columnID:number,
        dataTypeSize:number,
        dataTypeModifier:number,
        format:string
    }

    export interface Result {
        command:string,
        rowCount:number,
        rows:Array<Object>,
        fields:Array<Column>,

        duration:number, // pg-promise extension

        // the ones below are not available with the Native Bindings;

        rowAsArray:boolean
    }

    interface Query {

    }
    
    interface ConnectionParameters {
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

    export interface Client {
        query:(config:any, values:any, callback:(err:Error, result:Result)=>void)=>Query;
        connectionParameters:ConnectionParameters;
        database:string;
        user:string;
        password:string;
        port:number;
        host:string;
        ssl:boolean;
    }

    // Default library interface
    export interface PG {
        Client:(config:Object)=>Client,
        defaults:pgDefaults,
        types:pgTypes
    }

    // Interface of 'pg-types' module;
    // See: https://github.com/brianc/node-pg-types
    interface pgTypes {
        setTypeParser:(oid:number, format:string|((value:any)=>string))=>void;
        getTypeParser:(oid:number, format?:string)=>any;
        arrayParser:(source:string, transform:(entry:any)=>any)=>Array<any>;
    }

    interface pgDefaults {
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

    export default PG;
}
