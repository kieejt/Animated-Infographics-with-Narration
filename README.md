# Infographic Video Generator

A powerful web application that turns CSV data into animated infographic videos with AI-generated narration.

## Features

- **📊 Dynamic Charts**: Support for Bar, Line, and Pie charts directly from CSV data.
- **🤖 AI Script Generation**: Uses Google Gemini to analyze your data and write compelling narration scripts.
- **🗣️ Advanced Text-to-Speech**:
  - Multi-language support (English, Vietnamese, Japanese, etc.).
  - **Granular Speed Control**: Adjust playback speed from 0.5x to 2.0x (powered by FFmpeg).
- **🎬 Professional Video Export**: Built with [Remotion](https://www.remotion.dev/) for high-quality MP4 rendering.
- **📝 Subtitles**: Auto-generated subtitles synchronized with the narration.

## Prerequisites

- **Node.js** (v16 or higher)
- **Google Gemini API Key** (Free tier available at [Google AI Studio](https://aistudio.google.com/))

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/kieejt/Animated-Infographics-with-Narration.git
   cd Animated-Infographics-with-Narration
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

   > **Note**: This project requires `@ffmpeg-installer/ffmpeg` for audio processing. The install script handles this automatically.

## Usage

### 1. Start the Development Server
```bash
npm run dev
```
Open your browser and navigate to the URL shown (usually `http://localhost:5173`).

### 2. Create Your Video
1.  **Upload Data**: Upload your CSV file containing the data you want to visualize.
2.  **Configure Scenes**: Add scenes (Bar, Line, Pie) and map the CSV columns to chart axes.
3.  **Generate Narration**:
    -   Enter your Gemini API Key.
    -   Select language and voice.
    -   Adjust **Speed** using the slider (supports 0.5x - 2.0x).
    -   Click "Generate Script" creates the text, then "Convert to Speech" to generate audio.
4.  **Preview**: Play the video in the preview player to check timing and animations.
5.  **Edit**: Adjust subtitles, colors, and timing as needed.

### 3. Export Video
To render the final MP4 file:
```bash
# Render via CLI (optional, UI button also available)
npm run render
```
The output video will be saved in the `out/` directory.

## Troubleshooting

-   **Speed Slider Not Working?** Ensure you have restarted the dev server after installing dependencies (`npm run dev`). The `ffmpeg` backend is required for speed adjustment.
-   **Render Failed?** Check the console logs for detailed error messages. Ensure all audio assets are downloaded correctly.

## Tech Stack
-   **Frontend**: React, Vite, TailwindCSS
-   **Video Engine**: Remotion
-   **AI/TTS**: Google Gemini, Google TTS API, FFmpeg
