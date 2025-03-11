import globals from "globals";
import pluginJs from "@eslint/js";

/** @type {import('eslint').Linter.Config[]} */
export default [
  {
    languageOptions: {
      globals: globals.node,
    },
  },
  pluginJs.configs.recommended,
  {
    rules: {
      "no-global-assign": "off",
      "no-unused-vars": "off",
      "no-undef": "warn",
      "no-undef-init": "warn",
      "no-undefined": "warn",
      "no-self-assign": "off",
      "no-extra-semi": "off",
      "no-mixed-spaces-and-tabs": "off",
      "no-irregular-whitespace": "off",
      "no-case-declarations": "off",
      "no-useless-catch": "off",
      "no-console": "off",
      "no-process-exit": "warn",
      "no-shadow": "warn",
      "eqeqeq": ["warn", "always"],
      "curly": ["warn", "multi-line"],
      "prefer-const": "warn",
      "strict": ["warn", "global"],
      "handle-callback-err": "warn",
      "no-buffer-constructor": "warn",
      "callback-return": "warn",
    },
  },
];
