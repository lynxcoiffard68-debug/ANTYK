import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        // Split heavy vendor libraries into separately-cached chunks.
        // These rarely change so browsers cache them across deploys.
        manualChunks: {
          // React runtime — tiny but changes never; cache forever
          "vendor-react": ["react", "react-dom"],
          // Router — changes rarely
          "vendor-router": ["react-router-dom"],
          // Radix UI primitives — large but stable
          "vendor-radix": [
            "@radix-ui/react-dialog",
            "@radix-ui/react-dropdown-menu",
            "@radix-ui/react-select",
            "@radix-ui/react-tabs",
            "@radix-ui/react-tooltip",
            "@radix-ui/react-avatar",
            "@radix-ui/react-checkbox",
            "@radix-ui/react-label",
            "@radix-ui/react-popover",
            "@radix-ui/react-switch",
            "@radix-ui/react-accordion",
            "@radix-ui/react-scroll-area",
          ],
          // Supabase client — large but stable
          "vendor-supabase": ["@supabase/supabase-js"],
          // React Query — stable
          "vendor-query": ["@tanstack/react-query"],
          // Animation — stable
          "vendor-motion": ["framer-motion"],
        },
        // Prevent tiny icon chunks from creating extra request-chain depth
        experimentalMinChunkSize: 10_000,
      },
    },
  },
}));
