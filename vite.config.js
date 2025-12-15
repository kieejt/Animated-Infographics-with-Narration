import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { exec } from 'child_process'
import fs from 'fs'
import path from 'path'

// Custom plugin for rendering
const renderPlugin = () => {
  let renderProcess = null;
  let renderProgress = 0;
  let renderStatus = 'idle'; // idle, rendering, error, done
  let renderError = '';
  const inputPropsFile = path.resolve('out/input-props.json');

  return {
    name: 'render-plugin',
    configureServer(server) {
        // Save Input Props Endpoint (POST)
        server.middlewares.use('/api/render/save-props', async (req, res, next) => {
            if (req.method !== 'POST') return next();
            
            try {
                let body = '';
                req.on('data', chunk => {
                    body += chunk.toString();
                });
                
                req.on('end', async () => {
                    try {
                        const inputProps = JSON.parse(body);
                        
                        // Đảm bảo thư mục out tồn tại
                        const outDir = path.dirname(inputPropsFile);
                        if (!fs.existsSync(outDir)) {
                            fs.mkdirSync(outDir, { recursive: true });
                        }
                        
                        // Lưu input props vào file
                        fs.writeFileSync(inputPropsFile, JSON.stringify(inputProps, null, 2));
                        
                        res.setHeader('Content-Type', 'application/json');
                        res.end(JSON.stringify({ success: true, message: 'Input props saved' }));
                    } catch (err) {
                        console.error('Error saving input props:', err);
                        res.statusCode = 400;
                        res.end(JSON.stringify({ success: false, error: err.message }));
                    }
                });
            } catch (err) {
                res.statusCode = 500;
                res.end(JSON.stringify({ success: false, error: err.message }));
            }
        });

        // Start Render Endpoint
        server.middlewares.use('/api/render/start', async (req, res, next) => {
            
            if (renderStatus === 'rendering') {
                res.statusCode = 409; // Conflict
                res.end(JSON.stringify({ message: 'Render already in progress' }));
                return;
            }

            console.log('Starting render process with Remotion Bundler...');
            renderStatus = 'rendering';
            renderProgress = 0;
            renderError = '';

            const { spawn } = await import('child_process');
            // Sử dụng script render.js mới với Remotion Bundler
            renderProcess = spawn('node', ['render.js'], { 
                shell: true,
                cwd: process.cwd()
            });

            renderProcess.stdout.on('data', (data) => {
                const output = data.toString();
                console.log(output);
                
                // Parse progress từ output của render.js
                // Format: "Bundling: 50%" hoặc "Rendering: 75% (150/200 frames)" hoặc "Encoding: 90%"
                const bundlingMatch = output.match(/Bundling:\s*(\d+)%/);
                const renderingMatch = output.match(/Rendering:\s*(\d+)%/);
                const encodingMatch = output.match(/Encoding:\s*(\d+)%/);
                
                if (bundlingMatch) {
                    // Bundling chiếm 20% của quá trình
                    renderProgress = Math.min(20, parseInt(bundlingMatch[1]) * 0.2);
                } else if (renderingMatch) {
                    // Rendering chiếm 60% của quá trình (20-80%)
                    renderProgress = 20 + (parseInt(renderingMatch[1]) * 0.6);
                } else if (encodingMatch) {
                    // Encoding chiếm 20% của quá trình (80-100%)
                    renderProgress = 80 + (parseInt(encodingMatch[1]) * 0.2);
                }
            });

            renderProcess.stderr.on('data', (data) => {
                const output = data.toString();
                console.error(`Render stderr: ${output}`);
                
                // Kiểm tra lỗi
                if (output.includes('Error') || output.includes('error') || output.includes('❌')) {
                    renderError = output;
                }
            });

            renderProcess.on('close', (code) => {
                if (code === 0) {
                    renderStatus = 'done';
                    renderProgress = 100;
                } else {
                    renderStatus = 'error';
                    renderError = renderError || `Process exited with code ${code}`;
                }
                renderProcess = null;
            });

            res.end(JSON.stringify({ status: 'started' }));
        });

        // Check Status Endpoint
        server.middlewares.use('/api/render/status', (req, res, next) => {
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ status: renderStatus, progress: renderProgress, error: renderError }));
        });

        // TTS Endpoint
        server.middlewares.use('/api/tts', async (req, res, next) => {
           // req.url is typically '/' or '/?query=' when mounted.
           const urlObj = new URL(req.originalUrl || req.url, `http://${req.headers.host}`);
           const text = urlObj.searchParams.get('text');
           const lang = urlObj.searchParams.get('lang') || 'en';
           
           // ... (middleware checks) ...
           if (req.url !== '/' && !req.url.startsWith('/?')) {
               return next();
           }
           
           if (!text) {
             console.log('Missing text param');
             res.statusCode = 400;
             res.end('Missing text');
             return;
           }

           try {
             // CACHING LOGIC
             const crypto = await import('crypto');
             // Create a hash of the text + lang to use as filename
             const hash = crypto.createHash('md5').update(text + lang).digest('hex');
             const cacheDir = path.resolve('node_modules/.cache/tts');
             const cacheFile = path.join(cacheDir, `${hash}.mp3`);

             // Answer cache logic... (Check cacheFile)
             if (fs.existsSync(cacheFile)) {
                 // ... serve ...
                 const stat = fs.statSync(cacheFile);
                 res.writeHead(200, {
                     'Content-Type': 'audio/mpeg',
                     'Content-Length': stat.size
                 });
                 fs.createReadStream(cacheFile).pipe(res);
                 return;
             }

             // If not in cache, fetch from Google
             const googleTTSModule = await import('google-tts-api');
             const getAudioUrl = googleTTSModule.getAudioUrl || googleTTSModule.default?.getAudioUrl;

             if (!getAudioUrl) {
                throw new Error('Could not find getAudioUrl in google-tts-api');
             }

             const url = getAudioUrl(text, {
                lang: lang,
                slow: false,
                host: 'https://translate.google.com',
             });
             
             console.log('Fetching/Caching TTS ->', url);

             const audioRes = await fetch(url);
             if (!audioRes.ok) throw new Error(`Google TTS upstream failed: ${audioRes.status}`);
             
             const arrayBuffer = await audioRes.arrayBuffer();
             const buffer = Buffer.from(arrayBuffer);
             
             // Write to cache
             fs.writeFileSync(cacheFile, buffer);
             
             // Serve
             res.setHeader('Content-Type', 'audio/mpeg');
             res.setHeader('Content-Length', buffer.length);
             res.end(buffer);
             
           } catch (err) {
             console.error('TTS Proxy Error:', err);
             res.statusCode = 500;
             res.end('TTS Failed: ' + err.message);
           }
        });

        // Download Endpoint
        server.middlewares.use('/api/render/download', (req, res, next) => {
            
            const filePath = path.resolve('out/video.mp4');
            if (fs.existsSync(filePath)) {
                const stat = fs.statSync(filePath);
                res.writeHead(200, {
                    'Content-Type': 'video/mp4',
                    'Content-Length': stat.size,
                    'Content-Disposition': 'attachment; filename="infographic.mp4"'
                });
                fs.createReadStream(filePath).pipe(res);
            } else {
                res.statusCode = 404;
                res.end('Output file not found');
            }
        });
    }
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), renderPlugin()],
})
