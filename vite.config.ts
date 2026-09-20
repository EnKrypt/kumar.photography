import mdx from "@mdx-js/rollup";
import { reactRouter } from "@react-router/dev/vite";
import remarkFrontmatter from "remark-frontmatter";
import { defineConfig } from "vite";
import { imagetools } from "vite-imagetools";
import remarkYamlFrontmatter from "./app/frontmatter/mdx-frontmatter.ts";

export default defineConfig({
  resolve: { tsconfigPaths: true },
  plugins: [
    { enforce: "pre", ...mdx({ remarkPlugins: [remarkFrontmatter, remarkYamlFrontmatter] }) },
    imagetools(),
    reactRouter(),
  ],
});
