import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  target: "node20",
  platform: "node",
  outDir: "dist",
  clean: true,
  sourcemap: true,
  dts: true,
  splitting: false,
  treeshake: true,
  minify: false,
  bundle: true,
  external: [
    "browser-use-sdk",
    "chalk",
    "glob",
    "gray-matter",
  ],
  shims: false,
  onSuccess: "chmod +x dist/index.js",
});