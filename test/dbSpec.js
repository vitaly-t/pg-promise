var pgpLib = require('../index');

var options = {};

var pgp = pgpLib(options); // initializing the library;

var cn = {
    host: 'localhost',
    port: 5432,
    database: 'pg_promise_test',
    user: 'postgres'
};

var db = pgp(cn);

describe("Database", function () {

    it("must be able to connect", function (done) {
        var sco, error;
        db.connect()
            .then(function (obj) {
                sco = obj;
            }, function (reason) {
                error = reason;
                console.log(reason);
                this.fail(reason);
            })
            .catch(function () {
                expect(typeof(sco)).toBe('object');
                if (sco) {
                    sco.done();
                    pgp.end();
                }
                done();
            });
    }, 15000);
});
