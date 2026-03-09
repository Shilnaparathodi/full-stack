import js from "@eslint/js";
import globals from "globals";
import stylistic from "@stylistic/eslint-plugin-js";

export default [
  {
    ignores: ["node_modules", "dist", "build"],
  },
  {
    files: ["**/*.js"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: globals.node,
    },
    plugins: {
      "@stylistic/js": stylistic,
    },
    rules: {
      ...js.configs.recommended.rules,
      "no-console": 0,
      "no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
      "@stylistic/js/indent": ["error", 2],
      "@stylistic/js/quotes": ["error", "double"],
      "@stylistic/js/semi": ["error", "never"],
    },
  },
];
