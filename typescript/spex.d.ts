///////////////////////////////////////////////////////////////////////
// SPEX post-initialization sub-set interface as exposed by pg-promise
//
// Supported version of SPEX: 0.4.5 and later.
//
// SPEX: https://github.com/vitaly-t/spex
///////////////////////////////////////////////////////////////////////

/// <reference path='./ext-promise' />

declare module 'spex' {

    import XPromise = require('ext-promise'); // External Promise Provider

    export interface ISpex {
        // SPEX API: https://github.com/vitaly-t/spex/blob/master/docs/code/batch.md
        batch(values:Array<any>, cb?:(index:number, success:boolean, result:any, delay:number)=>any):XPromise<Array<any>>;
        batch(values:Array<any>, options:{cb?:(index:number, success:boolean, result:any, delay:number)=>any}):XPromise<Array<any>>;

        // SPEX API: https://github.com/vitaly-t/spex/blob/master/docs/code/page.md
        page(source:(index:number, data:any, delay:number)=>any, dest?:(index:number, data:any, delay:number)=>any, limit?:number):XPromise<{pages:number, total:number, duration:number}>;
        page(source:(index:number, data:any, delay:number)=>any, options:{dest?:(index:number, data:any, delay:number)=>any, limit?:number}):XPromise<{pages:number, total:number, duration:number}>;

        // SPEX API: https://github.com/vitaly-t/spex/blob/master/docs/code/sequence.md
        sequence(source:(index:number, data:any, delay:number)=>any, dest?:(index:number, data:any, delay:number)=>any, limit?:number, track?:boolean):XPromise<any>;
        sequence(source:(index:number, data:any, delay:number)=>any, options:{dest?:(index:number, data:any, delay:number)=>any, limit?:number, track?:boolean}):XPromise<any>;
    }

    // We do not include the streaming support here, because pg-promise doesn't use it.
}
