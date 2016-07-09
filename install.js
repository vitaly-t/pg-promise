'use strict';

////////////////////////////
// Post-Installation Script
////////////////////////////

var cp = require("child_process");

cp.exec('typings install').unref();
