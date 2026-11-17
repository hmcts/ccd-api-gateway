import { defineConfig } from "eslint/config";
import mocha from "eslint-plugin-mocha";
import globals from "globals";
import js from "@eslint/js";

export default defineConfig([
  {
    ignores: [
      "**/config/*",
      "**/node_modules/*",
      "yarn.lock",
      ".yarn/**",
      "yarn-audit-known-issues",
      "**/*.properties",
    ],
  },
  {
    files: ["**/*.js", "**/*.spec.js"],
    extends: [js.configs.recommended],

    plugins: {
      mocha,
      js,
    },

    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.jquery,
        ...globals.mocha,
        actor: true,
        Feature: true,
        Scenario: true,
        codecept_helper: true,
      },

      ecmaVersion: 2019,
      sourceType: "module",
    },

    rules: {
      "no-console": "error",
      "linebreak-style": ["error", "unix"],
      quotes: ["error", "single"],
      semi: ["error", "always"],
      "comma-dangle": ["error", "never"],
      eqeqeq: "error",
      "require-yield": "off",
      "mocha/no-exclusive-tests": "error",
    },
  },
]);
