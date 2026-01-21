import resolve from "@rollup/plugin-node-resolve";

export default {
  input: "ol.js",
  output: {
    dir: "dist",
    format: "es",
    preserveModules: true,
    preserveModulesRoot: "node_modules",
  },
  plugins: [resolve()],
};
