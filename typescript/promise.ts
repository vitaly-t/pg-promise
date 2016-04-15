/*

 This file is here to make it possible to enable declarations of a custom promise library.
 It presumes that you are already initializing pg-promise with a custom promise library,
 using option `promiseLib`. If not, then you cannot use the provisions documented here.

 Example of enabling declarations for Bluebird:

 1. Install Bluebird TypeScript as you normally would:
 $ typings install bluebird --save

 2. Add the reference path here, similar to this:
 /// <reference path='../typings/main' />

 3. Replace line `export=Promise` with the following:
 import * as promise from 'bluebird';
 export=promise;

 Unfortunately, for now this is the only way to declare a custom promise interface properly.
 It is possible that this may be improved in the future. In the meantime, if you do not want to
 get these settings overridden during an update or deployment, it may be a good idea to copy
 all of the *.ts files into your own project, and use them from there.

 */

declare module 'promise' {
    export=Promise;
}
