//////////////////////////////////////////////////////////
// Module pg-minify that's used and exposed by pg-promise
//
// Supported version of pg-minify: 0.2.4 and later.
//
// pg-minify: https://github.com/vitaly-t/pg-minify
//////////////////////////////////////////////////////////

declare module "pg-minify" {

    enum parsingErrorCode {
        unclosedMLC = 1,    // Unclosed multi-line comment.
        unclosedText = 2,   // Unclosed text block.
        unclosedQI = 3,     // Unclosed quoted identifier.
        multiLineQI = 4     // Multi-line quoted identifiers are not supported.
    }

    interface ErrorPosition {
        line:number,
        column:number
    }

    interface SQLParsingError extends Error {
        code:parsingErrorCode,
        position:ErrorPosition
    }
    
    // Default library interface
    interface pgMinify {
        (sql:string, options?:{compress?:boolean}):string,
        SQLParsingError:SQLParsingError,
        parsingErrorCode:parsingErrorCode
    }

    export default pgMinify;
}
