import * as pgPromise from '../../typescript/pg-promise';
import {IArrayExt} from '../../typescript/pg-promise';

var pgp: pgPromise.IMain = pgPromise();

var db: pgPromise.IDatabase<any> = pgp('connection');

var qrm = pgPromise.queryResult;

db.query('', [], qrm.one | qrm.none)
    .then(data => {
        var d1 = data.value;
        var d2 = data[0].value;
    });

db.none('')
    .then(data => {
    });

db.one('', [], value => {
}, 'this')
    .then(data => {
        var value = data.value;
    });

db.oneOrNone('')
    .then(data => {
        var value = data.value;
    });

db.many('')
    .then(data => {
        var value = data[0].ops;
        var d: number = data.duration;
    });

db.result('', [], () => {
}, 123)
    .then(data => {
        var value = data.rows[0].name;
        var d: number = data.duration;
    });

db.map('', null, row => {
    return row.value;
})
    .then((data: IArrayExt<any>) => {
        var d: number = data.duration;
    });

db.each('', null, row => {
    var v = row.value;
})
    .then((data: IArrayExt<any>) => {
        var d: number = data.duration;
    });

db.task(t => {
    return t.batch([
        t.one('')
    ])
        .then((data: IArrayExt<any>) => {
            var d: number = data.duration;
            return data;
        });
})
    .then(data => {
        var d1 = data.value;
        var d2 = data[0].value;
    });
