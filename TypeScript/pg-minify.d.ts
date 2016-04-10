declare module "pg-minify" {

    enum parsingErrorCode {
        /**
         * Unclosed multi-line comment.
         * @type {number}
         */
        unclosedMLC = 1,

        /**
         * Unclosed text block.
         * @type {number}
         */
        unclosedText = 2,

        /**
         * Unclosed quoted identifier.
         * @type {number}
         */
        unclosedQI = 3,

        /**
         * Multi-line quoted identifiers are not supported.
         * @type {number}
         */
        multiLineQI = 4
    }

    interface ErrorPosition {
        line:number,
        column:number
    }

    interface SQLParsingError extends Error {
        code:parsingErrorCode,
        position:ErrorPosition
    }
    
    // Default library interface (before initialization)
    interface pgMinify {
        (sql:string, options?:{compress?:boolean}):string,
        SQLParsingError:SQLParsingError,
        parsingErrorCode:parsingErrorCode
    }

    export default pgMinify;
}
