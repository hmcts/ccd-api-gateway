import { defineConfig } from "eslint/config";
import mocha from "eslint-plugin-mocha";
import globals from "globals";
import path from "node:path";
import { fileURLToPath } from "node:url";
import js from "@eslint/js";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
});

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
    extends: compat.extends("eslint:recommended"),

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

      ecmaVersion: 2022,
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
