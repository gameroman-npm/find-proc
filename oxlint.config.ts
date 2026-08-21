import { defineConfig } from "@gameroman/config/oxlint/ts";

export default defineConfig({
  rules: { "prefer-template": "off" },
  overrides: [
    { files: ["**/tests/**"], rules: { "no-floating-promises": "off" } },
  ],
});
