import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { copyFileSync, mkdirSync, existsSync, readdirSync, statSync } from "fs";

// Plugin to copy XML files from data/ to public/data/ during build
function copyXMLFiles() {
  const copyDirectoryRecursive = (source: string, target: string) => {
    if (!existsSync(target)) {
      mkdirSync(target, { recursive: true });
    }
    
    const files = readdirSync(source);
    
    files.forEach(file => {
      const sourcePath = path.join(source, file);
      const targetPath = path.join(target, file);
      
      if (statSync(sourcePath).isDirectory()) {
        copyDirectoryRecursive(sourcePath, targetPath);
      } else if (file.endsWith('.xml')) {
        copyFileSync(sourcePath, targetPath);
      }
    });
  };

  return {
    name: 'copy-xml-files',
    configureServer(server) {
      // Copy XML files when dev server starts
      const sourceDir = path.resolve(__dirname, 'data');
      const targetDir = path.resolve(__dirname, 'public/data');
      
      if (existsSync(sourceDir)) {
        copyDirectoryRecursive(sourceDir, targetDir);
        console.log('XML files copied from data/ to public/data/');
      }
    },
    buildStart() {
      // Copy XML files during build
      const sourceDir = path.resolve(__dirname, 'data');
      const targetDir = path.resolve(__dirname, 'public/data');
      
      if (existsSync(sourceDir)) {
        // Ensure target directory exists
        if (!existsSync(targetDir)) {
          mkdirSync(targetDir, { recursive: true });
        }
        
        // Copy all XML files recursively
        copyDirectoryRecursive(sourceDir, targetDir);
        console.log('XML files copied from data/ to public/data/');
      }
    }
  };
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' && componentTagger(),
    copyXMLFiles()
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        // Ensure XML files are included in the build
        assetFileNames: (assetInfo) => {
          if (assetInfo.name && assetInfo.name.endsWith('.xml')) {
            return 'data/[name][extname]';
          }
          return 'assets/[name]-[hash][extname]';
        }
      }
    }
  },
  define: {
    // Environment variables for storage configuration
    __STORAGE_TYPE__: JSON.stringify(process.env.VITE_STORAGE_TYPE || 'local'),
    __SUPABASE_URL__: JSON.stringify(process.env.VITE_SUPABASE_URL || ''),
    __SUPABASE_KEY__: JSON.stringify(process.env.VITE_SUPABASE_ANON_KEY || ''),
  }
}));