import { defineConfig } from "vite";

export default defineConfig({
  // Ensure assets resolve correctly when served from /<repo>/ on GitHub Pages
  base:
    process.env.GITHUB_REPOSITORY !== undefined
      ? `/${process.env.GITHUB_REPOSITORY.split("/")[1]}/`
      : "/"
});
