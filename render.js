import path from 'path';
import { fileURLToPath } from 'url';
import { bundle } from '@remotion/bundler';
import { getCompositions, renderMedia } from '@remotion/renderer';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Đường dẫn đến entry point của Remotion
const entryPoint = path.resolve(__dirname, 'src/remotion/index.js');
const outputLocation = path.resolve(__dirname, 'out/video.mp4');
const inputPropsFile = path.resolve(__dirname, 'out/input-props.json');

// Đảm bảo thư mục out tồn tại
const outDir = path.dirname(outputLocation);
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

async function render() {
  try {
    // Đọc input props từ file TRƯỚC khi bundle để có thể copy audio files vào public
    let inputProps = {};
    if (fs.existsSync(inputPropsFile)) {
      try {
        const propsData = fs.readFileSync(inputPropsFile, 'utf-8');
        inputProps = JSON.parse(propsData);
        console.log('Loaded input props from file');
        console.log(`  - Tracks: ${inputProps.tracks?.length || 0}`);
        console.log(`  - CSV Data rows: ${inputProps.csvData?.length || 0}`);
        console.log(`  - Audio URLs: ${inputProps.audioUrls?.length || 0}`);
      } catch (err) {
        console.warn('Could not load input props, using defaults:', err.message);
      }
    }

    // Convert audio URLs từ /api/tts?text=... sang đường dẫn public TRƯỚC khi bundle
    if (inputProps.audioUrls && inputProps.audioUrls.length > 0) {
      const crypto = await import('crypto');
      const cacheDir = path.resolve(__dirname, 'node_modules/.cache/tts');
      const publicAudioDir = path.resolve(__dirname, 'public/audio');
      
      // Đảm bảo thư mục cache và public/audio tồn tại
      if (!fs.existsSync(cacheDir)) {
        fs.mkdirSync(cacheDir, { recursive: true });
      }
      if (!fs.existsSync(publicAudioDir)) {
        fs.mkdirSync(publicAudioDir, { recursive: true });
      }
      
      console.log('Converting audio URLs to public file paths...');
      inputProps.audioUrls = await Promise.all(inputProps.audioUrls.map(async (segment) => {
        // Parse URL để lấy text, lang và speed
        // Update regex to handle potential speed param
        const urlMatch = segment.url.match(/\/api\/tts\?text=([^&]+)&lang=([^&]+)(?:&speed=([^&]+))?/);
        if (!urlMatch) {
          // Nếu không phải API URL, giữ nguyên (có thể đã là file path)
          if (segment.url.startsWith('/audio/') || segment.url.startsWith('http')) {
            return segment;
          }
          console.warn(`Could not parse URL: ${segment.url}`);
          return segment;
        }
        
        const text = decodeURIComponent(urlMatch[1]);
        const lang = urlMatch[2];
        const speed = parseFloat(urlMatch[3] || '1.0');
        
        // Tạo hash giống như TTS endpoint (update with speed)
        const hash = crypto.createHash('md5').update(text + lang + speed).digest('hex');
        const cacheFile = path.join(cacheDir, `${hash}.mp3`);
        const publicFile = path.join(publicAudioDir, `${hash}.mp3`);
        
        // Kiểm tra xem file đã tồn tại trong cache chưa
        if (fs.existsSync(cacheFile)) {
          // Copy từ cache sang public nếu chưa có trong public
          if (!fs.existsSync(publicFile)) {
            fs.copyFileSync(cacheFile, publicFile);
            console.log(`  ✓ Copied cached audio to public: ${hash}.mp3`);
          } else {
            console.log(`  ✓ Found audio in public: ${hash}.mp3`);
          }
          // Sử dụng đường dẫn tương đối từ public
          return {
            ...segment,
            url: `/audio/${hash}.mp3`
          };
        } else {
          // Nếu file chưa tồn tại, cần download từ Google TTS
          console.log(`Downloading audio for: "${text.substring(0, 50)}..." (speed: ${speed})`);
          try {
            const googleTTSModule = await import('google-tts-api');
            const getAudioUrl = googleTTSModule.getAudioUrl || googleTTSModule.default?.getAudioUrl;
            
            if (!getAudioUrl) {
              throw new Error('Could not find getAudioUrl in google-tts-api');
            }
            
            // Start with normal speed download
            const audioUrl = getAudioUrl(text, {
              lang: lang,
              slow: false,
              host: 'https://translate.google.com',
            });
            
            const audioRes = await fetch(audioUrl);
            if (!audioRes.ok) {
              throw new Error(`Google TTS failed: ${audioRes.status}`);
            }
            
            const arrayBuffer = await audioRes.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            
            // Check for speed adjustment
            if (Math.abs(speed - 1.0) < 0.01) {
                fs.writeFileSync(cacheFile, buffer);
                fs.writeFileSync(publicFile, buffer);
                console.log(`  ✓ Downloaded and saved: ${hash}.mp3`);
            } else {
                 console.log(`  Processing audio speed: ${speed}x`);
                 const tempInput = path.join(cacheDir, `${hash}_raw.mp3`);
                 fs.writeFileSync(tempInput, buffer);
                 
                 const ffmpeg = (await import('fluent-ffmpeg')).default;
                 const ffmpegPath = (await import('@ffmpeg-installer/ffmpeg')).default.path;
                 ffmpeg.setFfmpegPath(ffmpegPath);
                 
                 await new Promise((resolve, reject) => {
                     let command = ffmpeg(tempInput);
                     let safeSpeed = Math.max(0.5, Math.min(2.0, speed));
                     
                     command.audioFilters(`atempo=${safeSpeed}`);
                     
                     command
                        .toFormat('mp3')
                        .on('error', (err) => {
                            console.error('  FFmpeg error:', err);
                            reject(err);
                        })
                        .on('end', () => {
                            console.log(`  ✓ Processed and saved: ${hash}.mp3`);
                            resolve();
                        })
                        .save(cacheFile);
                 });
                 
                 // Cleanup temp
                 if (fs.existsSync(tempInput)) fs.unlinkSync(tempInput);
                 
                 // Copy to public
                 fs.copyFileSync(cacheFile, publicFile);
            }
            
            // Sử dụng đường dẫn tương đối từ public
            return {
              ...segment,
              url: `/audio/${hash}.mp3`
            };
          } catch (err) {
            console.error(`  Failed to download audio: ${err.message}`);
            // Trả về segment gốc, có thể sẽ fail khi render nhưng ít nhất không crash
            return segment;
          }
        }
      }));
      
      console.log('Audio URLs converted to public file paths');
    }

    console.log('Bundling Remotion project...');
    
    // Bundle dự án Remotion (tự động phát hiện Vite)
    const bundleLocation = await bundle({
      entryPoint,
      // Chỉ rõ thư mục public để copy static assets (audio, images, ...)
      publicDir: path.resolve(__dirname, 'public'),
      onProgress: (progress) => {
        const percentage = Math.round(progress * 100);
        console.log(`Bundling: ${percentage}%`);
      },
    });

    console.log('Bundle completed:', bundleLocation);

    // Copy audio files vào bundle location để Remotion có thể serve chúng
    if (inputProps.audioUrls && inputProps.audioUrls.length > 0) {
      const bundleAudioDir = path.join(bundleLocation, 'audio');
      const publicAudioDir = path.resolve(__dirname, 'public/audio');
      
      // Đảm bảo thư mục audio trong bundle tồn tại
      if (!fs.existsSync(bundleAudioDir)) {
        fs.mkdirSync(bundleAudioDir, { recursive: true });
      }
      
      console.log('Copying audio files to bundle location...');
      for (const segment of inputProps.audioUrls) {
        if (segment.url && segment.url.startsWith('/audio/')) {
          const fileName = segment.url.replace('/audio/', '');
          const sourceFile = path.join(publicAudioDir, fileName);
          const destFile = path.join(bundleAudioDir, fileName);
          
          if (fs.existsSync(sourceFile)) {
            fs.copyFileSync(sourceFile, destFile);
            console.log(`  ✓ Copied: ${fileName}`);
          } else {
            console.warn(`File not found: ${sourceFile}`);
          }
        }
      }
      console.log('Audio files copied to bundle');
    }

    // inputProps đã được load và convert audio URLs ở trên

    console.log('Getting compositions...');
    
    // Lấy danh sách compositions với input props để tính duration đúng
    const compositions = await getCompositions(bundleLocation, {
      inputProps,
    });

    console.log(`Found ${compositions.length} composition(s):`, compositions.map(c => c.id));

    // Tìm composition "Infographic"
    const composition = compositions.find((c) => c.id === 'Infographic');

    if (!composition) {
      throw new Error(`Composition với ID "Infographic" không tồn tại`);
    }

    console.log('Starting render...');
    console.log(`Composition: ${composition.id}`);
    console.log(`Duration: ${composition.durationInFrames} frames (${(composition.durationInFrames / composition.fps).toFixed(2)}s)`);
    console.log(`Resolution: ${composition.width}x${composition.height}`);
    console.log(`FPS: ${composition.fps}`);
    console.log(`Input Props Summary:`);
    console.log(`  - Tracks: ${inputProps.tracks?.length || 0}`);
    if (inputProps.tracks && inputProps.tracks.length > 0) {
      console.log(`  - Total scenes: ${inputProps.tracks.reduce((acc, t) => acc + (t.scenes?.length || 0), 0)}`);
    }
    console.log(`  - CSV Data: ${inputProps.csvData ? `${inputProps.csvData.length} rows` : 'none'}`);
    console.log(`  - Audio URLs: ${inputProps.audioUrls?.length || 0}`);

    // Render video
    await renderMedia({
      composition,
      serveUrl: bundleLocation,
      codec: 'h264',
      outputLocation,
      inputProps,
      onProgress: ({ renderedFrames, encodedFrames, renderedDoneIn, encodedDoneIn }) => {
        const progress = composition.durationInFrames > 0 
          ? Math.round((renderedFrames / composition.durationInFrames) * 100)
          : 0;
        
        if (renderedFrames > 0) {
          console.log(`Rendering: ${progress}% (${renderedFrames}/${composition.durationInFrames} frames)`);
        }
        
        if (encodedFrames > 0 && renderedDoneIn !== null) {
          const encodingProgress = Math.round((encodedFrames / composition.durationInFrames) * 100);
          console.log(`Encoding: ${encodingProgress}% (${encodedFrames}/${composition.durationInFrames} frames)`);
        }
      },
    });

    console.log('Render completed successfully!');
    console.log(`Output: ${outputLocation}`);
    
    process.exit(0);
  } catch (error) {
    console.error('Render failed:', error);
    process.exit(1);
  }
}

render();

