import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
import {defineConfig} from 'vite';

function assetsPlugin() {
  return {
    name: 'serve-assets-plugin',
    configureServer(server: any) {
      server.middlewares.use((req: any, res: any, next: any) => {
        if (req.url && req.url.startsWith('/assets/')) {
          const cleanUrl = req.url.split('?')[0];
          const decodedUrl = decodeURIComponent(cleanUrl);
          const filePath = path.join(process.cwd(), decodedUrl);
          
          if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
            const ext = path.extname(filePath).toLowerCase();
            let contentType = 'application/octet-stream';
            if (ext === '.m4a') contentType = 'audio/mp4';
            else if (ext === '.mp3') contentType = 'audio/mpeg';
            else if (ext === '.json') contentType = 'application/json';
            else if (ext === '.png') contentType = 'image/png';
            else if (ext === '.jpg' || ext === '.jpeg') contentType = 'image/jpeg';
            else if (ext === '.svg') contentType = 'image/svg+xml';
            
            const stat = fs.statSync(filePath);
            const total = stat.size;
            const range = req.headers.range;

            if (range) {
              const parts = range.replace(/bytes=/, "").split("-");
              const partialstart = parts[0];
              const partialend = parts[1];
              const start = parseInt(partialstart, 10);
              const end = partialend ? parseInt(partialend, 10) : total - 1;
              const chunksize = (end - start) + 1;

              res.writeHead(206, {
                "Content-Range": "bytes " + start + "-" + end + "/" + total,
                "Accept-Ranges": "bytes",
                "Content-Length": chunksize,
                "Content-Type": contentType
              });

              const fileStream = fs.createReadStream(filePath, { start: start, end: end });
              fileStream.pipe(res);
            } else {
              res.writeHead(200, {
                "Content-Length": total,
                "Content-Type": contentType
              });
              fs.createReadStream(filePath).pipe(res);
            }
            return;
          }
        }
        next();
      });
    },
    closeBundle() {
      const srcDir = path.resolve(process.cwd(), 'assets');
      const destDir = path.resolve(process.cwd(), 'dist/assets');
      if (fs.existsSync(srcDir)) {
        copyRecursiveSync(srcDir, destDir);
      }
    }
  };
}

function copyRecursiveSync(src: string, dest: string) {
  const exists = fs.existsSync(src);
  const stats = exists && fs.statSync(src);
  const isDirectory = stats && stats.isDirectory();
  if (isDirectory) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    fs.readdirSync(src).forEach((childItemName) => {
      copyRecursiveSync(path.join(src, childItemName), path.join(dest, childItemName));
    });
  } else {
    fs.copyFileSync(src, dest);
  }
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), assetsPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
