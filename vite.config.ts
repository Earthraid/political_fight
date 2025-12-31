import { defineConfig } from "vite";

export default defineConfig({
  // Ensure assets resolve when served from /<repo>/ on GitHub Pages
  base:
    process.env.GITHUB_REPOSITORY !== undefined
      ? `/${process.env.GITHUB_REPOSITORY.split("/")[1]}/`
      : "/",
  server: {
    open: true
  }
});
