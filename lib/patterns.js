'use strict';

/*
  The most important regular expressions and data as used by the library,
  isolated here to help with possible edge cases during integration.
*/

module.exports = {
    // Searches for all Named Parameters, supporting any of the following syntax:
    // ${propName}, $(propName), $[propName], $/propName/, $<propName>
    namedParameters: /\$(?:({)|(\()|(<)|(\[)|(\/))\s*[a-zA-Z0-9$_]+(\^|~|#|:raw|:alias|:name|:json|:csv|:value)?\s*(?:(?=\2)(?=\3)(?=\4)(?=\5)}|(?=\1)(?=\3)(?=\4)(?=\5)\)|(?=\1)(?=\2)(?=\4)(?=\5)>|(?=\1)(?=\2)(?=\3)(?=\5)]|(?=\1)(?=\2)(?=\3)(?=\4)\/)/g,

    // Searches for all variables $1, $2, ...$100000, and while it will find greater than $100000
    // variables, the formatting engine is expected to throw an error for those.
    multipleValues: /\$([1-9][0-9]{0,16}(?![0-9])(\^|~|#|:raw|:alias|:name|:json|:csv|:value)?)/g,

    // Searches for all occurrences of variable $1
    singleValue: /\$1(?![0-9])(\^|~|#|:raw|:alias|:name|:json|:csv|:value)?/g,

    // Matches a valid column name, which can contain any combination of letters, digits and underscores,
    // can optionally start with ?, and optionally end with any of the supported formatting modifiers.
    validColumn: /\??[a-zA-Z0-9$_]+(\^|~|#|:raw|:alias|:name|:json|:csv|:value)?/,

    // Matches a valid open-name JavaScript variable, according to the following rules:
    // - can contain any combination of letters, digits, dollars and underscores ($, _);
    // - cannot start with a digit
    validVariable: /^[0-9]+|[a-zA-Z0-9$_]+/,

    // Matches a valid modifier in a column/property:
    hasValidModifier: /\^|~|#|:raw|:alias|:name|:json|:csv|:value/,

    // List of all supported formatting modifiers:
    validModifiers: ['^', '~', '#', ':raw', ':alias', ':name', ':json', ':csv', ':value'],

    // Splits device information for a file path, to determine whether the path is absolute or relative;
    // This is specifically for Windows, and based on: https://github.com/sindresorhus/path-is-absolute
    splitDevice: /^([a-zA-Z]:|[\\/]{2}[^\\/]+[\\/]+[^\\/]+)?([\\/])?([\s\S]*?)$/
};
