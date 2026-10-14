import { globalIgnores } from "eslint/config";
import { defineConfigWithVueTs, vueTsConfigs } from "@vue/eslint-config-typescript";
import pluginVue from "eslint-plugin-vue";
import skipFormatting from "@vue/eslint-config-prettier/skip-formatting";
import tsdoc from "eslint-plugin-tsdoc";

// To allow more languages other than `ts` in `.vue` files, uncomment the following lines:
// import { configureVueProject } from '@vue/eslint-config-typescript'
// configureVueProject({ scriptLangs: ['ts', 'tsx'] })
// More info at https://github.com/vuejs/eslint-config-typescript/#advanced-setup

export default defineConfigWithVueTs(
  {
    name: "app/files-to-lint",
    files: ["**/*.{ts,mts,tsx,vue}"],
    rules: {
      semi: ["error", "always"],
      quotes: ["error", "double"],
      eqeqeq: ["error", "always"],

      "no-console": ["warn"],
      "no-unused-vars": ["error"],

      "vue/no-unused-components": ["error"],
      "vue/require-prop-types": ["error"],
      "vue/require-v-for-key": ["error"],
      "vue/max-attributes-per-line": ["error", { singleline: 1 }],

      "vue/multi-word-component-names": ["error"],
      "vue/component-definition-name-casing": ["error", "PascalCase"],
      "vue/component-name-in-template-casing": ["error", "kebab-case"],
      "vue/prop-name-casing": ["error", "camelCase"],

      "@typescript-eslint/no-unused-vars": ["error"],
      "@typescript-eslint/no-empty-function": ["error"],
      "@typescript-eslint/naming-convention": [
        "error",
        {
          selector: ["variable", "function"],
          format: ["camelCase"],
        },
        {
          selector: ["typeLike", "enumMember"],
          format: ["PascalCase"],
        },
      ],

      "@typescript-eslint/strict-boolean-expressions": "error",
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/consistent-type-definitions": ["error", "type"],

      "tsdoc/syntax": "error",
    },
    plugins: {
      tsdoc,
    },
  },

  globalIgnores(["**/dist/**", "**/dist-ssr/**", "**/coverage/**"]),

  pluginVue.configs["flat/essential"],
  vueTsConfigs.recommended,
  skipFormatting
);
