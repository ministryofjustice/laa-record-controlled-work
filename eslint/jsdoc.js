import jsdocPlugin from "eslint-plugin-jsdoc";

export default {
  name: "project/jsdoc",
  files: ["**/*.ts", "**/*.tsx"],
  plugins: {
    jsdoc: jsdocPlugin,
  },
  rules: {
    "jsdoc/check-alignment": "error",
    "jsdoc/check-param-names": "error",
    "jsdoc/check-tag-names": "error",
    "jsdoc/implements-on-classes": "error",
    "jsdoc/newline-after-description": "off",
    "jsdoc/require-description": "error",
    "jsdoc/require-jsdoc": [
      "error",
      {
        require: {
          ArrowFunctionExpression: false,
          ClassDeclaration: true,
          FunctionDeclaration: true,
          FunctionExpression: false,
          MethodDefinition: true,
        },
      },
    ],
    "jsdoc/require-param": "error",
    "jsdoc/require-param-description": "error",
    "jsdoc/require-param-name": "error",
    "jsdoc/require-returns": "error",
    "jsdoc/require-returns-check": "error",
    "jsdoc/require-returns-description": "error",
  },
};
