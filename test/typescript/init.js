/// <reference path="../pg-promise.d.ts" />
"use strict";
const lib = require("pg-promise");
var pgp = lib({
    capSQL: true,
    pgFormatting: true,
    pgNative: true
});
var db = pgp('connection');
