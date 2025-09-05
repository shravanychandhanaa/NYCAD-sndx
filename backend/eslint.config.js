import js from "@eslint/js";
import globals from "globals";

export default [
  {
    files: ["**/*.js"],
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest, // ✅ fixes "test"/"expect" undefined in tests
      },
    },
    rules: {
      "no-unused-vars": "off", // ✅ turns off warnings for unused vars like "_"
      "no-empty": "off",       // ✅ turns off warnings for empty blocks
    },
  },
];
