import jsoncPlugin from "eslint-plugin-jsonc";

export default [
  ...jsoncPlugin.configs["flat/recommended-with-json"],
  // Allow comments in tsconfig and VS Code config files (JSONC)
  {
    name: "project/jsonc-allow-comments",
    files: ["**/tsconfig*.json", ".vscode/*.json"],
    rules: {
      "jsonc/no-comments": "off",
    },
  },
  // Disable jsonc formatting rules that conflict with Prettier
  ...jsoncPlugin.configs["flat/prettier"],
];
