import { resolve } from "path";
import { federation } from "@module-federation/vite";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  resolve: {
    alias: {
      "~": resolve(__dirname, "src"),
    },
  },
  plugins: [
    react(),
    tailwindcss(),
    federation({
      name: "hello-orca-app",
      filename: "app.js",
      exposes: {
        "./OrcaApp": "./src/OrcaApp.tsx",
      },
      shared: {
        react: { singleton: true, requiredVersion: "^19" },
        "react-dom": { singleton: true, requiredVersion: "^19" },
      },
    }),
  ],
  build: {
    target: "esnext",
    outDir: resolve(__dirname, "dist"),
    assetsDir: "",
    sourcemap: true,
  },
  server: {
    port: 4173,
  },
});
