/*

 // TODO: Support for promises hasn't been updated for TypeScript 2.0 yet!

 External Promise Provider.

 The purpose of this module is to make it possible to enable declarations of a custom promise library
 by patching this file manually. It presumes that you are already initializing pg-promise with a custom
 promise library, using option `promiseLib`. If not, then you cannot use the provisions documented here.

 Example of enabling declarations for Bluebird:

 1. Install Bluebird ambient TypeScript as you normally would:
 $ typings install bluebird --ambient --save

 2. Add the reference path here, similar to this:
 /// <reference path='../../../typings/main' />

 3. Replace line `export=Promise` with the following:
 import * as promise from 'bluebird';
 export=promise;

 // TODO: The following considerations need to be updated for TypeScript 2.0:

 Unfortunately, as of today it is impossible to use custom promises as TypeScript generics,
 and this is why we have this file here, so it can be manually patched.
 You can find research details on this matter from the following link:  
 http://stackoverflow.com/questions/36593087/using-a-custom-promise-as-a-generic-type

 In the meantime, if you do not want to get these settings overridden during an update or deployment,
 it may be a good idea to copy all of the *.ts files into your own project, and use them from there.

 */

export=Promise; // Using ES6 Promise by default
