/// <reference path="../pg-promise.d.ts" />

import * as lib from "pg-promise";

var pgp = lib({
    capSQL: true
});

var db = pgp('connection');
