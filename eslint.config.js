const js = require("@eslint/js");
const globals = require("globals");

module.exports = [
    js.configs.recommended,
    {
        files: ["**/*.js"],
        languageOptions: {
            ecmaVersion: 2021,
            sourceType: "commonjs",
            globals: {
                ...globals.node
            }
        },
        rules: {
            "no-unused-vars": "warn",
            "no-undef": "error"
        }
    },
    {
        ignores: ["node_modules/", ".git/"]
    }
];
