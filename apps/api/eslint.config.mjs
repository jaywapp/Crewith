import js from "@eslint/js";

export default [
  js.configs.recommended,
  {
    files: ["dist/**/*.js"],
    languageOptions: {
      ecmaVersion: 2022,
      globals: {
        Buffer: "readonly",
        console: "readonly",
        exports: "writable",
        module: "readonly",
        process: "readonly",
        require: "readonly",
        Reflect: "readonly",
        Record: "readonly",
        Set: "readonly",
        Map: "readonly",
      },
      parserOptions: {
        sourceType: "module",
      },
    },
    rules: {
      "no-cond-assign": "off",
      "no-unused-vars": "off",
    },
  },
];
