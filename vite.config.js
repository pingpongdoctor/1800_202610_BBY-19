import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        index: resolve(__dirname, "index.html"),
        challenges: resolve(__dirname, "app/html/challenges.html"),
        itemshop: resolve(__dirname, "app/html/itemshop.html"),
        login: resolve(__dirname, "app/html/login.html"),
        profile: resolve(__dirname, "app/html/profile.html"),
      },
    },
  },
});
