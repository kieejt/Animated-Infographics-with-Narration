import CsvUploader from './components/CsvUploader';
import { useProject } from './context/ProjectContext';
import SceneInspector from './components/SceneInspector';
import Timeline from './components/Timeline/Timeline';
import NarrationGenerator from './components/NarrationGenerator';
import { Player } from '@remotion/player';
import MyComposition from './remotion/MyComposition';

import SubtitleInspector from './components/SubtitleInspector';

function AppContent() {
  const { csvData, tracks, audioUrl, selectedSceneId, subtitleSettings, addScene, ttsSpeed } = useProject();

  // Approx total duration is max track duration
  // Calculate max length of all tracks
  const totalDuration = Math.max(
    ...tracks.map(t => t.scenes.reduce((acc, s) => acc + (s.duration || 5) * 30, 0)),
    150 // default minimum
  );

  return (
    <div className="min-h-screen bg-gray-50 p-8 font-sans text-gray-900 flex flex-col">
      <header className="mb-6 flex items-center justify-between">
        <div className="flex-1 text-center">
          <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 mb-1 tracking-tight">Animated Infographics with Narration</h1>
        </div>
        <button
          onClick={async (e) => {
            const btn = e.target;
            const originalText = "Export MP4";
            btn.disabled = true;

            try {
              // 0. Save Input Props trước khi render
              btn.innerText = "Saving props...";
              const propsRes = await fetch('/api/render/save-props', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  tracks,
                  csvData,
                  audioUrls: audioUrl,
                  subtitleSettings,
                  ttsSpeed
                })
              });
              
              if (!propsRes.ok) {
                const propsData = await propsRes.json();
                throw new Error(propsData.error || 'Failed to save input props');
              }

              // 1. Start Render
              btn.innerText = "Starting...";
              const startRes = await fetch('/api/render/start');
              if (startRes.status === 409) {
                // Already running, just join logic
              } else if (!startRes.ok) throw new Error('Failed to start render');

              // 2. Poll Status
              const poll = setInterval(async () => {
                try {
                  const statusRes = await fetch('/api/render/status');
                  const statusData = await statusRes.json();

                  if (statusData.status === 'rendering') {
                    btn.innerText = `Rendering... ${statusData.progress}%`;
                  } else if (statusData.status === 'done') {
                    clearInterval(poll);
                    btn.innerText = "Download Ready!";

                    // 3. Trigger Download
                    // 3. Trigger Download
                    const link = document.createElement('a');
                    link.href = '/api/render/download';
                    link.download = 'infographic.mp4';
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);

                    setTimeout(() => {
                      btn.innerText = originalText;
                      btn.disabled = false;
                    }, 3000);
                  } else if (statusData.status === 'error') {
                    clearInterval(poll);
                    throw new Error(statusData.error || 'Unknown error');
                  }
                } catch (err) {
                  clearInterval(poll);
                  alert("Render Error: " + err.message);
                  btn.innerText = "Error";
                  btn.disabled = false;
                }
              }, 1000);

            } catch (error) {
              alert("Export start failed: " + error.message);
              btn.innerText = originalText;
              btn.disabled = false;
            }
          }}
          className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-full font-bold shadow-lg transition transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed w-48"
        >
          Export MP4
        </button>
      </header>

      <main className="flex-1 max-w-[1600px] mx-auto w-full grid grid-cols-12 gap-6">
        {/* Left Column: Data & Inspector */}
        <div className="col-span-12 lg:col-span-3 space-y-6">
          <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <h2 className="text-lg font-bold mb-4">1. Data Source</h2>
            <CsvUploader />
          </section>

          {csvData && (
            <section className="bg-white px-4 py-0 rounded-xl shadow-sm border border-gray-100 flex-1 min-h-[400px]">
              {selectedSceneId ? (
                <SceneInspector />
              ) : (
                <div className="flex flex-col gap-4 h-full">
                  {/* Create Scene Panel */}
                  <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
                    <h3 className="font-bold text-gray-800">Scenes</h3>
                    <button
                      onClick={addScene}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition shadow flex items-center gap-2"
                    >                  + Add Scene
                    </button>
                  </div>

                  {/* Subtitle Inspector */}
                  <SubtitleInspector />
                </div>
              )}
            </section>
          )}
        </div>

        {/* Center Column: Timeline & Preview */}
        <div className="col-span-12 lg:col-span-9 flex flex-col gap-6">
          {/* Preview Area */}
          <div className="bg-black rounded-xl overflow-hidden shadow-lg aspect-video w-full relative group">
            {/* Hack to force 16:9 container but keep player portrait if needed, or just let player fill */}
            {/* For shorts (9:16), it will look pillboxed in 16:9 container. That's fine. */}
            {csvData ? (
              <Player
                component={MyComposition}
                inputProps={{ tracks, csvData, audioUrls: audioUrl, subtitleSettings, ttsSpeed }}
                durationInFrames={totalDuration}
                fps={30}
                compositionWidth={1920}
                compositionHeight={1080}
                style={{ width: '100%', height: '100%' }}
                controls
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-gray-500">
                No Data Loaded
              </div>
            )}
          </div>

          {/* Timeline Area */}
          {
            csvData && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                <Timeline />
              </div>
            )
          }

          {/* AI Tools Area */}
          {
            csvData && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                <h2 className="text-lg font-bold mb-4">AI Narration</h2>
                {/* Pass flat scenes for narration context? NarrationGenerator expects 'scenes'. 
                        We should update NarrationGenerator to use Tracks, or flatten them.
                    */}
                <NarrationGenerator />
              </div>
            )
          }
        </div >
      </main >
    </div >
  );
}

export default function App() {
  return <AppContent />;
}
