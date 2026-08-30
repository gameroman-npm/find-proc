import { defineConfig } from "tsdown";

export default defineConfig({
  dts: true,
  exports: true,
  outputOptions: { comments: false },
});
