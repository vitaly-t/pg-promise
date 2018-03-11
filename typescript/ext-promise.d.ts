/*
 * Copyright (c) 2015-present, Vitaly Tomilov
 *
 * See the LICENSE file at the top-level directory of this distribution
 * for licensing information.
 *
 * Removal or modification of this copyright notice is prohibited.
 */

/*

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

 Unfortunately, as of today (TypeScript 2.7.2), it is still impossible to use custom promises
 as TypeScript generics, and this is why we still have this file here, so it can be manually patched,
 in order to provide access to the custom API of a third-party promise library.

 You can find research details on this matter from the following link:
 http://stackoverflow.com/questions/36593087/using-a-custom-promise-as-a-generic-type

 In the meantime, if you do not want to get changes here overridden during an update or deployment,
 it may be a good idea to copy all of the *.ts files into your own project, and use them locally.

 */

export = Promise; // Using ES6 Promise declarative syntax by default
