import path from "node:path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { "@": path.resolve(__dirname, "src") },
  },
  server: {
    host: true,
    port: 5173,
    strictPort: true,
    proxy: {
      "/api": { target: "http://127.0.0.1:8001", changeOrigin: true },
      "/media": { target: "http://127.0.0.1:8001", changeOrigin: true },
      "/static": { target: "http://127.0.0.1:8001", changeOrigin: true },
    },
  },
})
