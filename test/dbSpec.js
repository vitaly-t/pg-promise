var promise = require('bluebird');

var options = {}; // options, if needed;

var dbHeader = require('./dbHeader')(options);

var pgp = dbHeader.pgp;
var db = dbHeader.db;

describe("Database", function () {
    it("must be able to connect", function () {
        var status = 'connecting';
        var error = '';
        db.connect()
            .then(function (obj) {
                status = 'success';
                obj.done(); // release connection;
            }, function (reason) {
                error = reason.message;
                status = 'failed';//reason.error;
            })
            .catch(function (err) {
                error = err;
                status = 'failed';
            });
        waitsFor(function () {
            return status !== 'connecting';
        }, "Connection timed out", 5000);
        runs(function () {
            expect(status).toBe('success');
            expect(error).toBe('');
        });
    });
});

describe("Selecting one static value", function () {

    it("must return the value via property", function () {
        var result, error;
        db.one('select 123 as value')
            .then(function (data) {
                result = data;
            }, function (reason) {
                error = reason;
                result = null;
            });
        waitsFor(function () {
            return result !== undefined;
        }, "Query timed out", 5000);
        runs(function () {
            expect(error).toBe(undefined);
            expect(typeof(result)).toBe('object');
            expect(result.value).toBe(123);
        });
    });
});

describe("Executing an invalid query", function () {

    it("must reject with an error", function () {
        var finished, result, error = "Invalid query specified.";
        promise.any([
            db.query(),
            db.query(''),
            db.query(null)])
            .then(function () {
                finished = true;
            }, function (reason) {
                result = reason;
                finished = true;
            });
        waitsFor(function () {
            return finished;
        }, "Query timed out", 5000);
        runs(function () {
            expect(result.length).toBe(3);
            expect(result[0]).toBe(error);  // reject to an undefined query;
            expect(result[1]).toBe(error);  // reject to an empty query;
            expect(result[2]).toBe(error);  // reject to a null query;
        });
    });
});


// NOTE: The same test for 100,000 inserts works just the same.
// Inserting just 10,000 records to avoid exceeding memory quota on the test server.
// Also, the client shouldn't execute more than 10,000 queries within single transaction,
// huge transactions must be throttled into smaller chunks.
describe("A complex transaction with 10,000 inserts", function () {
    it("must not fail", function () {
        var result, error;
        db.tx(function (ctx) {
            var queries = [
                ctx.none('drop table if exists test'),
                ctx.none('create table test(id serial, name text)')
            ];
            for (var i = 1; i <= 10000; i++) {
                queries.push(ctx.none('insert into test(name) values($1)', 'name-' + i));
            }
            queries.push(ctx.one('select count(*) from test'));
            return promise.all(queries);
        })
            .then(function (data) {
                result = data;
            }, function (reason) {
                result = null;
                error = reason;
            });
        waitsFor(function () {
            return result !== undefined;
        }, "Query timed out", 15000);
        runs(function () {
            expect(error).toBe(undefined);
            expect(result instanceof Array).toBe(true);
            expect(result.length).toBe(10003); // drop + create + insert x 10000 + select;
            var last = result[result.length - 1]; // result from the select;
            expect(typeof(last)).toBe('object');
            expect(last.count).toBe('10000'); // last one must be the counter (as text);
        });
    });
});

describe("When a nested transaction fails", function () {
    it("must return error from the nested transaction", function () {
        var result, error;
        db.tx(function (ctx) {
            return promise.all([
                ctx.none('update users set login=$1 where id=$2', ['TestName', 1]),
                ctx.tx(function () {
                    throw new Error('Nested TX failure');
                })
            ]);
        })
            .then(function (data) {
                result = data;
            }, function (reason) {
                result = null;
                error = reason;
            });
        waitsFor(function () {
            return result !== undefined;
        }, "Query timed out", 5000);
        runs(function () {
            expect(result).toBe(null);
            expect(error).toBe('Nested TX failure');
        });
    });
});

describe("When a nested transaction fails", function () {
    it("both transactions must rollback", function () {
        var result, error, nestError;
        db.tx(function (ctx) {
            return promise.all([
                ctx.none('update users set login=$1', 'External'),
                ctx.tx(function () {
                    return promise.all([
                        ctx.none('update users set login=$1', 'Internal'),
                        ctx.one('select * from unknownTable') // emulating a bad query;
                    ]);
                })
            ]);
        })
            .then(function () {
                result = null; // must not get here;
            }, function (reason) {
                nestError = reason;
                return promise.all([
                    db.one('select count(*) from users where login=$1', 'External'), // 0 is expected;
                    db.one('select count(*) from users where login=$1', 'Internal'), // 0 is expected;
                ]);
            })
            .then(function (data) {
                result = data;
            }, function (reason) {
                result = null;
                error = reason;
            });
        waitsFor(function () {
            return result !== undefined;
        }, "Query timed out", 5000);
        runs(function () {
            expect(error).toBe(undefined);
            expect(nestError).toBe('relation "unknowntable" does not exist');
            expect(result instanceof Array).toBe(true);
            expect(result.length).toBe(2);
            expect(result[0].count).toBe('0'); // no changes within parent transaction;
            expect(result[1].count).toBe('0'); // no changes within nested transaction;
        });
    });
});

describe("Calling a transaction with an invalid callback", function () {

    it("must reject when the callback is undefined", function () {
        var result, error;
        db.tx()
            .then(function (data) {
                result = data;
            }, function (reason) {
                result = null;
                error = reason;
            });
        waitsFor(function () {
            return result !== undefined;
        }, "Query timed out", 5000);
        runs(function () {
            expect(result).toBe(null);
            expect(error).toBe("Cannot invoke tx() without a callback function.");
        });
    });

    it("must reject when the callback returns nothing", function () {
        var result, error;
        db.tx(function (ctx) {
            // return nothing;
        })
            .then(function (data) {
                result = data;
            }, function (reason) {
                result = null;
                error = reason;
            });
        waitsFor(function () {
            return result !== undefined;
        }, "Query timed out", 5000);
        runs(function () {
            expect(result).toBe(null);
            expect(error).toBe("Callback function passed into tx() didn't return a valid promise object.");
        });
    });
    it("must reject when the callback returns nonsense", function () {
        var result, error;
        db.tx(function () {
            return 123; // not quite a promise object;
        })
            .then(function (data) {
                result = data;
            }, function (reason) {
                result = null;
                error = reason;
            });
        waitsFor(function () {
            return result !== undefined;
        }, "Query timed out", 15000);
        runs(function () {
            expect(result).toBe(null);
            expect(error).toBe("Callback function passed into tx() didn't return a valid promise object.");
        });
    });

});

describe("A nested transaction (10 levels)", function () {
    it("must work the same no matter how many levels", function () {
        var result, error;
        db.tx(function (ctx) {
            return ctx.tx(function () {
                return ctx.tx(function () {
                    return ctx.tx(function () {
                        return ctx.tx(function () {
                            return ctx.tx(function () {
                                return promise.all([
                                    ctx.one("select 'Hello' as word"),
                                    ctx.tx(function () {
                                        return ctx.tx(function () {
                                            return ctx.tx(function () {
                                                return ctx.tx(function () {
                                                    return ctx.one("select 'World!' as word");
                                                });
                                            });
                                        });
                                    })
                                ]);
                            });
                        });
                    });
                });
            });
        })
            .then(function (data) {
                result = data;
            }, function (reason) {
                result = null;
                error = reason;
            });
        waitsFor(function () {
            return result !== undefined;
        }, "Query timed out", 5000);
        runs(function () {
            expect(error).toBe(undefined);
            expect(result instanceof Array).toBe(true);
            expect(result.length).toBe(2);
            expect(result[0].word).toBe('Hello');
            expect(result[1].word).toBe('World!');
        });
    });
});

describe("Return data from a query must match the request type", function () {

    it("method 'none' must throw an error when there was data returned", function () {
        var result, error;
        db.none("select * from person where name=$1", 'John')
            .then(function (data) {
                result = data;
            }, function (reason) {
                result = null;
                error = reason;
            });
        waitsFor(function () {
            return result !== undefined;
        }, "Query timed out", 5000);
        runs(function () {
            expect(result).toBe(null);
            expect(error).toBe("No return data was expected from query: select * from person where name='John'");
        });
    });

    it("method 'one' must throw an error when there was no data returned", function () {
        var result, error;
        db.one("select * from person where name=$1", 'Unknown')
            .then(function (data) {
                result = data;
            }, function (reason) {
                result = null;
                error = reason;
            });
        waitsFor(function () {
            return result !== undefined;
        }, "Query timed out", 5000);
        runs(function () {
            expect(result).toBe(null);
            expect(error).toBe("No rows returned from query: select * from person where name='Unknown'");
        });
    });

    it("method 'one' must throw an error when more than one row was returned", function () {
        var result, error;
        db.one("select * from person")
            .then(function (data) {
                result = data;
            }, function (reason) {
                result = null;
                error = reason;
            });
        waitsFor(function () {
            return result !== undefined;
        }, "Query timed out", 5000);
        runs(function () {
            expect(result).toBe(null);
            expect(error).toBe("Single row was expected from query: select * from person");
        });
    });

    it("method 'oneOrNone' must resolve into null when no data returned", function () {
        var result, error;
        db.oneOrNone("select * from person where name=$1", "Unknown")
            .then(function (data) {
                result = data;
            }, function (reason) {
                result = 'whatever';
                error = reason;
            });
        waitsFor(function () {
            return result !== undefined;
        }, "Query timed out", 5000);
        runs(function () {
            expect(error).toBe(undefined);
            expect(result).toBe(null);
        });
    });

    it("method 'any' must return an empty array when no records found", function () {
        var result, error;
        db.any("select * from person where name='Unknown'")
            .then(function (data) {
                result = data;
            }, function (reason) {
                result = null;
                error = reason;
            });
        waitsFor(function () {
            return result !== undefined;
        }, "Query timed out", 5000);
        runs(function () {
            expect(error).toBe(undefined);
            expect(result instanceof Array).toBe(true);
            expect(result.length).toBe(0);
        });
    });

});

describe("Queries must not allow invalid QRM (Query Request Mask) combinations", function () {
    it("method 'query' must throw an error when mask is one+many", function () {
        var result, error;
        db.query("select * from person", undefined, queryResult.one | queryResult.many)
            .then(function (data) {
                result = data;
            }, function (reason) {
                result = null;
                error = reason;
            });
        waitsFor(function () {
            return result !== undefined;
        }, "Query timed out", 5000);
        runs(function () {
            expect(result).toBe(null);
            expect(error).toBe("Invalid Query Result Mask specified.");
        });
    });
    it("method 'query' must throw an error when QRM is > 6", function () {
        var result, error;
        db.query("select * from person", undefined, 7)
            .then(function (data) {
                result = data;
            }, function (reason) {
                result = null;
                error = reason;
            });
        waitsFor(function () {
            return result !== undefined;
        }, "Query timed out", 5000);
        runs(function () {
            expect(result).toBe(null);
            expect(error).toBe("Invalid Query Result Mask specified.");
        });
    });
    it("method 'query' must throw an error when QRM is < 1", function () {
        var result, error;
        db.query("select * from person", undefined, 0)
            .then(function (data) {
                result = data;
            }, function (reason) {
                result = null;
                error = reason;
            });
        waitsFor(function () {
            return result !== undefined;
        }, "Query timed out", 5000);
        runs(function () {
            expect(result).toBe(null);
            expect(error).toBe("Invalid Query Result Mask specified.");
        });
    });

    it("method 'query' must throw an error when QRM is of the wrong type", function () {
        var result, error;
        db.query("select * from person", undefined, 'wrong qrm')
            .then(function (data) {
                result = data;
            }, function (reason) {
                result = null;
                error = reason;
            });
        waitsFor(function () {
            return result !== undefined;
        }, "Query timed out", 5000);
        runs(function () {
            expect(result).toBe(null);
            expect(error).toBe("Invalid Query Result Mask specified.");
        });
    });

});

describe("Connect/Disconnect notification events", function () {
    it("must execute each once during any query", function () {
        var result, connected = 0, disconnected = 0;
        options.connect = function () {
            connected++;
        };
        options.disconnect = function () {
            disconnected++;
        };
        db.query("select 'test'")
            .then(function () {
                result = null;
            });
        waitsFor(function () {
            return result !== undefined;
        }, "Query timed out", 5000);
        runs(function () {
            expect(result).toBe(null);
            expect(connected).toBe(1);
            expect(disconnected).toBe(1);
        });
    });
});

describe("Query event", function () {

    it("must pass query and parameters correctly", function () {
        var result, p, counter = 0;
        options.query = function (e) {
            counter++;
            p = e;
        };

        db.query("select * from users where id > $1", [0])
            .then(function () {
                result = null;
            }, function () {
                result = null;
            });
        waitsFor(function () {
            return result !== undefined;
        }, "Query timed out", 5000);
        runs(function () {
            expect(counter).toBe(1);
            expect(p.query).toBe('select * from users where id > 0');
        });
    });
});

describe("Start/Finish transaction events", function () {

    it("must execute each once for every transaction, with the right properties", function () {
        var result, tag, start = 0, finish = 0, finishContext;
        options.transact = function (e) {
            if (e.ctx.finish) {
                finish++;
                finishContext = e.ctx;
            } else {
                start++;
                tag = e.ctx.tag;
            }
        };
        db.tx("myTransaction", function () {
            return promise.resolve('SUCCESS');
        }).then(function (data) {
            result = data;
        });
        waitsFor(function () {
            return result !== undefined;
        }, "Query timed out", 5000);
        runs(function () {
            expect(result).toBe('SUCCESS');
            expect(start).toBe(1);
            expect(finish).toBe(1);
            expect(tag).toBe("myTransaction");
            expect(finishContext.success).toBe(true);
        });
    });
});

describe("Error event", function () {

    it("must report errors from transaction callbacks", function () {
        var result, errTxt, context, r, counter = 0;
        options.error = function (err, e) {
            counter++;
            errTxt = err;
            context = e.ctx;
        };
        db.tx("Error Transaction", function () {
            throw new Error("Test Error");
        }).then(function () {
        }, function (reason) {
            r = reason;
            result = null;
        });
        waitsFor(function () {
            return result !== undefined;
        }, "Query timed out", 5000);
        runs(function () {
            expect(r).toBe('Test Error');
            expect(errTxt).toBe('Test Error');
            expect(counter).toBe(1);
            expect(context.tag).toBe("Error Transaction");
        });
    });
});

var _finishCallback = jasmine.Runner.prototype.finishCallback;
jasmine.Runner.prototype.finishCallback = function () {
    // Run the old finishCallback:
    _finishCallback.bind(this)();

    pgp.end(); // closing pg database application pool;
};
