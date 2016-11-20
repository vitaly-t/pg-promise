//////////////////////////////////////////////////////////
// Module pg-minify that's used and exposed by pg-promise
//
// Supported version of pg-minify: 0.2.4 and later.
//
// pg-minify: https://github.com/vitaly-t/pg-minify
//////////////////////////////////////////////////////////

interface IErrorPosition {
    line: number,
    column: number
}

declare namespace pgMinify {

    export enum parsingErrorCode {
        unclosedMLC = 1,    // Unclosed multi-line comment.
        unclosedText = 2,   // Unclosed text block.
        unclosedQI = 3,     // Unclosed quoted identifier.
        multiLineQI = 4     // Multi-line quoted identifiers are not supported.
    }

    export class SQLParsingError implements Error {
        name: string;
        message: string;
        stack: string;
        error: string;
        code: parsingErrorCode;
        position: IErrorPosition;
    }

}

declare function pgMinify(sql: string, options?: {compress?: boolean}): string;

export = pgMinify;