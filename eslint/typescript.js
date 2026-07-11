import tsParser from "@typescript-eslint/parser";

export default {
  name: "project/typescript",
  files: ["**/*.ts", "**/*.tsx"],
  languageOptions: {
    parser: tsParser,
    parserOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
    },
  },
  rules: {
    "no-negated-condition": "off", // Allow negated conditions as they can improve readability in certain contexts
    "no-param-reassign": [
      "error",
      {
        props: true,
        ignorePropertyModificationsFor: [
          "req", // Express request
          "request", // Express request (alternative name)
          "res", // Express response
          "response", // Express response (alternative name)
        ],
      },
    ],
    "prefer-named-capture-group": "off", // Don't require named capture groups
    "require-unicode-regexp": "off", // Don't require v flag on regexes
    "@typescript-eslint/consistent-type-definitions": ["error", "interface"],
    "@typescript-eslint/consistent-type-imports": "error",
    "@typescript-eslint/init-declarations": "off", // Allow uninitialised declarations e.g. before try/catch
    "@typescript-eslint/no-extraneous-class": [
      "error",
      { allowStaticOnly: true },
    ],
    // Allow destructuring from member expressions e.g. const { x } = obj.prop
    // Accepted tradeoff - this won't error either: const x = obj.prop.x
    "@typescript-eslint/prefer-destructuring": [
      "error",
      { array: true, object: true },
      {
        enforceForDeclarationWithTypeAnnotation: false,
        enforceForRenamedProperties: false,
      },
    ],
    "@typescript-eslint/strict-boolean-expressions": [
      "error",
      {
        allowNullableBoolean: true,
        allowNullableObject: true,
        allowNullableString: true,
        allowString: true,
      },
    ],
    "@typescript-eslint/triple-slash-reference": [
      "error",
      { lib: "never", path: "never", types: "prefer-import" },
    ],
  },
};
