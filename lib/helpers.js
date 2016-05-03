'use strict';

var $npm = {
    utils: require('./utils'),
    formatting: require('./formatting')
};

/* istanbul ignore next */
/**
 * @method helpers.insert
 * @description
 * Generates a complete `INSERT` query from an object, using its properties as insert values.
 *
 * @param {String} table
 * Destination table name.
 *
 * Passing in anything other than a non-empty string will throw {@link external:TypeError TypeError} =
 * `Parameter 'table' must be a non-empty text string.`
 *
 * @param {Object} obj
 * Object with properties for insert values.
 *
 * Passing in anything other than a non-null object will throw {@link external:TypeError TypeError} =
 * `Parameter 'obj' must be a non-null object.`
 *
 * @param {helpers.propertyOptions} [options]
 * An object with optional parameters.
 *
 * Passing in anything other than a non-null object will be ignored.
 *
 * @returns {string}
 * The resulting query string.
 *
 * @example
 *
 * // Default usage
 *
 * var obj = {
 *    one: 123,
 *    two: 'test'
 * };
 *
 * var query = pgp.helpers.insert('myTable', obj);
 * //=> INSERT INTO "myTable"("one","two") VALUES(123,'test')
 *
 * @example
 *
 * // Advanced usage, with `exclude` and `defaults`
 *
 * var obj = {
 *     zero: 0,
 *     one: 1,
 *     two: undefined,
 *     // `three` is missing
 *     four: true
 * };
 *
 * var query = pgp.helpers.insert('myTable', obj, {
 *     exclude: 'zero', // exclude property `zero`
 *     defaults: {
 *         one: 123, // use `one` = 123, if missing;
 *         three: 555, // use `three` = 555, if missing;
 *         two: function (value) {
 *             // set `two` = `second`, if it is `undefined`,
 *             // or else keep the current value:
 *             return value === undefined ? 'second' : value;
 *         },
 *         four: function (value) {
 *             // if `one` is equal 1, set `four` to `false`,
 *             // or else keep the current value:
 *             return this.one === 1 ? false : value;
 *         }
 *     }
 * });
 * //=> INSERT INTO "myTable"("one","two","four","three") VALUES(1,'second',false,555)
 *
 */
function insert(table, obj, options, capSQL) {
    if (!$npm.utils.isText(table)) {
        throw new TypeError("Parameter 'table' must be a non-empty text string.");
    }
    if (!obj || typeof obj !== 'object') {
        throw new TypeError("Parameter 'obj' must be a non-null object.");
    }

    var include, exclude, optInherit, optDefaults;
    if (options) {
        if (typeof options.defaults === 'object') {
            optDefaults = options.defaults;
        }
        optInherit = options.inherit;
        if (typeof options.include === 'string') {
            include = [options.include];
        } else {
            if (Array.isArray(options.include)) {
                include = options.include.filter(function (inc) {
                    return typeof inc === 'string';
                });
            } else {
                if (typeof options.include === 'function') {
                    include = [];
                    for (var prop in obj) {
                        if (options.include.call(obj, prop, obj[prop])) {
                            include.push(prop);
                        }
                    }
                }
            }
        }
        if (typeof options.exclude === 'string') {
            exclude = [options.exclude];
            checkIncluded(options.exclude);
        } else {
            if (Array.isArray(options.exclude)) {
                exclude = options.exclude.filter(function (exc) {
                    if (typeof exc === 'string') {
                        checkIncluded(exc);
                        return true;
                    }
                });
            } else {
                if (typeof options.exclude === 'function') {
                    exclude = [];
                    for (var prop in obj) {
                        if (options.exclude.call(obj, prop, obj[prop])) {
                            checkIncluded(prop);
                            exclude.push(prop);
                        }
                    }
                }
            }
        }
    }

    function checkIncluded(propName) {
        if (include && include.indexOf(propName) !== -1) {
            throw new TypeError("Property '" + propName + "' is included and excluded at the same time.");
        }
    }

    var names = [], values = [];
    for (var prop in obj) {
        if ((optInherit || obj.hasOwnProperty(prop)) && (!include || include.indexOf(prop) !== -1) && (!exclude || exclude.indexOf(prop) === -1)) {
            names.push(prop);
            values.push(obj[prop]);
        }
    }

    if (optDefaults) {
        for (var prop in optDefaults) {
            if (exclude && exclude.indexOf(prop) !== -1) {
                throw new TypeError("Cannot exclude property '" + prop + "', as it has a default value.");
            }
            var idx = names.indexOf(prop), val = optDefaults[prop];
            if (typeof val === 'function') {
                if (idx === -1) {
                    names.push(prop);
                    values.push(val.call(obj));
                } else {
                    values[idx] = val.call(obj, values[idx]);
                }
            } else {
                if (idx === -1) {
                    names.push(prop);
                    values.push(val);
                }
            }
        }
    }

    var query = "insert into $1~($2^) values($3^)";
    if (capSQL) {
        query = query.toUpperCase();
    }
    names = names.map(function (n) {
        return $npm.formatting.as.name(n);
    }).join(',');
    return $npm.formatting.as.format(query, [table, names, $npm.formatting.as.csv(values)]);
}

/* istanbul ignore next */
/**
 * @method helpers.inserts
 * @param table
 * @param arr
 * @param {helpers.propertyOptions} [options]
 *
 * @param capSQL
 */
function inserts(table, arr, options, capSQL) {
}

/* istanbul ignore next */
/**
 * @method helpers.update
 * @description
 * Generates a complete `UPDATE` query from an object, using its properties as update values.
 *
 * @param {String} table
 * Name of the table to be updated.
 *
 * Passing in anything other than a non-empty string will throw {@link external:TypeError TypeError} =
 * `Parameter 'table' must be a non-empty text string.`
 *
 * @param {Object} obj
 * Object with properties for update values.
 *
 * Passing in anything other than a non-null object will throw {@link external:TypeError TypeError} =
 * `Parameter 'obj' must be a non-null object.`
 *
 * @param {helpers.propertyOptions} [options]
 * An object with optional parameters.
 *
 * Passing in anything other than a non-null object will be ignored.
 *
 * @returns {string}
 * The resulting query string.
 */
function update(table, obj, options, capSQL) {
    if (!$npm.utils.isText(table)) {
        throw new TypeError("Parameter 'table' must be a non-empty text string.");
    }
    if (!obj || typeof obj !== 'object') {
        throw new TypeError("Parameter 'obj' must be a non-null object.");
    }

    var include, exclude, optInherit;
    if (options) {
        optInherit = options.inherit;
        if (typeof options.include === 'string') {
            include = [options.include];
        } else {
            if (Array.isArray(options.include)) {
                include = options.include.filter(function (inc) {
                    return typeof inc === 'string';
                });
            }
        }
        if (typeof options.exclude === 'string') {
            exclude = [options.exclude];
            checkIncluded(options.exclude);
        } else {
            if (Array.isArray(options.exclude)) {
                exclude = options.exclude.filter(function (exc) {
                    if (typeof exc === 'string') {
                        checkIncluded(exc);
                        return true;
                    }
                });
            }
        }
    }

    function checkIncluded(propName) {
        if (include && include.indexOf(propName) !== -1) {
            throw new TypeError("Property '" + propName + "' is included and excluded at the same time.");
        }
    }

    var names = [], values = [];
    for (var prop in obj) {
        if ((optInherit || obj.hasOwnProperty(prop)) && (!include || include.indexOf(prop) !== -1) && (!exclude || exclude.indexOf(prop) === -1)) {
            names.push($npm.formatting.as.name(prop));
            values.push(obj[prop]);
        }
    }

    if (!names.length) {
        throw new TypeError("Cannot generate a valid UPDATE without any fields.");
    }

    var query = "update $1~ set ";
    if (capSQL) {
        query = query.toUpperCase();
    }
    query = $npm.formatting.as.format(query, table);
    var values = names.map(function (name, index) {
        return name + "=$" + (index + 1);
    });
    return $npm.formatting.as.format(query + values.join(','), values);
}

/* istanbul ignore next */
/**
 * @namespace helpers
 * @description
 * **NOTE: Due to be introduced with `pg-promise` v.4.1.0, it is currently under development.**
 *
 * Namespace for all query-formatting helper functions, available as `pgp.helpers` after initializing the library.
 */
module.exports = function (config) {
    return {
        insert: function (table, obj, options) {
            var capSQL = config.options && config.options.capSQL;
            return insert(table, obj, options, capSQL);
        },
        update: function (table, obj, options) {
            var capSQL = config.options && config.options.capSQL;
            return update(table, obj, options, capSQL);
        }
    };
};

/**
 * @callback helpers.propertyTest
 * @description
 * Used by options `include` and `exclude` to test properties for inclusion/exclusion,
 * based on the property's name and value, plus the state of the object being formatted.
 *
 * The function is always called with `this` context set to the object being formatted.
 *
 * @property {string} name
 * Name of the property being tested.
 *
 * @property {} value
 * Value of the property being tested.
 *
 * @returns {Boolean}
 * - `true` - the test has passed
 * - `false` - the test has failed
 */

/**
 * @typedef helpers.propertyOptions
 * @description
 * Set of rules used when formatting queries.
 *
 * @property {String|Array|Function} [include]
 * Custom way of determining which properties to include:
 * - a text string with just one property name to be included;
 * - an array of strings - names of the properties to be included;
 * - a function - {@link helpers.propertyTest propertyTest} callback to test if the property should be included.
 *
 * By default, all available properties are used. Setting `include` to a string, array of function will trigger
 * the use of only the properties as determined by the option.
 *
 * @property {String|Array} [exclude]
 * Either a single string or an array of strings - names of properties to be excluded.
 *
 * Excluding a property name that's present on the `include` list will throw {@link external:TypeError TypeError} =
 * `Property 'propName' is included and excluded at the same time.`
 *
 * Excluding a property name that's present within the `defaults` option will throw {@link external:TypeError TypeError} =
 * `Cannot exclude property 'propName', as it has a default value.`
 *
 * @property {Object} [defaults]
 * An object with required properties set to their default values. Such values will be used whenever the corresponding property
 * doesn't exist within `obj`.
 *
 * Setting a property to a function is treated as an override for the value, and the call into `defaults.propName(value)` is expected
 * to return the new value for the property. The function is called with parameter `value` - the original value within `obj`, and with
 * `this` context set to `obj`, i.e. `value` = `this.propName`.
 *
 * @property {Boolean} [inherit=false]
 * Triggers the use of inherited properties within `obj` (in addition to its own).
 *
 * By default, only the object's own properties are enumerated for insert values.
 *
 */
