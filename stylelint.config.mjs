/** @type {import("stylelint").Config} */
export default {
  extends: ["stylelint-config-standard"],
  plugins: ["stylelint-order"],
  customSyntax: "postcss-html", // für <style> in .vue
  rules: {
    "block-no-empty": true,
    "declaration-block-no-duplicate-properties": true,
    "length-zero-no-unit": true,

    "selector-class-pattern": "^[a-z][a-z0-9-]+$",
    "selector-id-pattern": "^[a-z][a-z0-9-]+$",
    "max-nesting-depth": 3,
    // Vue-Pseudoklassen in <style scoped>
    "selector-pseudo-class-no-unknown": [true, { ignorePseudoClasses: ["deep", "global", "slotted"] }],

    "order/properties-alphabetical-order": true,
  },
};
