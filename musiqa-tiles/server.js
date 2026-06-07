import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 8080;

// Serve static assets from 'dist' directory with custom headers
app.use(express.static(path.join(__dirname, 'dist'), {
  setHeaders: (res, filePath) => {
    // Enable range requests for audio files (m4a and mp3)
    if (filePath.endsWith('.m4a') || filePath.endsWith('.mp3')) {
      res.setHeader('Accept-Ranges', 'bytes');
    }
  }
}));

// Fallback all SPA routing to index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Production server running on http://0.0.0.0:${port}`);
});
