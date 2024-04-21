const js = require("@eslint/js");
const globals = require("globals");

module.exports = [
    js.configs.recommended,
    {
        languageOptions: {
            globals: {
                ...globals.es6,
                ...globals.node,
                ...globals.jasmine,
                ...globals.BigInt,
            },
            parserOptions: {
                ecmaFeatures: { globalReturn: true },
            },
            sourceType: "commonjs",
            ecmaVersion: 2022,
        },
        rules: {
            "no-var": "error",
            "prefer-const": "error",
            "prefer-arrow-callback": "error",
            "no-else-return": "error",
            "no-multi-spaces": "error",
            "no-whitespace-before-property": "error",
            camelcase: "error",
            "new-cap": "error",
            "no-console": "error",
            "comma-dangle": "error",
            "no-shadow": "error",
            "object-shorthand": ["error", "properties"],
            indent: [
                "error",
                4,
                {
                    SwitchCase: 1,
                },
            ],
            quotes: ["error", "single"],
            semi: ["error", "always"],
        },
    },
];
