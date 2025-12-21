import { useState } from 'react';
import { useProject } from '../context/ProjectContext';
import { generateNarration } from '../services/gemini';
import { getTTSAudioUrls } from '../services/tts';
import { Sparkles, Mic, Play, Volume2 } from 'lucide-react';

export default function NarrationGenerator() {
    const {
        csvData, tracks,
        narrationScript, setNarrationScript,
        setAudioUrl, audioUrl,
        isGenerating, setIsGenerating,
        ttsVoice, setTtsVoice,
        ttsSpeed, setTtsSpeed
    } = useProject();

    const scenes = tracks ? tracks.flatMap(t => t.scenes) : [];

    const [apiKey, setApiKey] = useState('');
    const [error, setError] = useState('');

    const handleGenerateScript = async () => {
        if (!apiKey) {
            setError('Please enter a Google Gemini API Key');
            return;
        }
        if (scenes.length === 0) {
            setError('Please add at least one scene first');
            return;
        }

        setIsGenerating(true);
        setError('');

        try {
            const script = await generateNarration(apiKey, csvData, scenes, ttsVoice);
            setNarrationScript(script);
            // Automatically generate audio/subtitles
            await generateAudio(script);
        } catch (err) {
            setError('Error generating script: ' + err.message);
        } finally {
            setIsGenerating(false);
        }
    };

    const generateAudio = async (text) => {
        if (!text) return;

        try {
            // split into sentences and get URLs
            const results = getTTSAudioUrls(text, ttsVoice, ttsSpeed);

            // Calculate duration for each segment
            const segmentsWithDuration = await Promise.all(results.map(async (segment) => {
                return new Promise((resolve) => {
                    const audio = new Audio(segment.url);
                    audio.onloadedmetadata = () => {
                        console.log(`Loaded metadata for segment ${segment.index}: ${audio.duration}s`);
                        resolve({
                            ...segment,
                            durationInSeconds: audio.duration
                        });
                    };
                    audio.onerror = (e) => {
                        console.error("Failed to load audio for duration:", segment.url, e);
                        resolve({
                            ...segment,
                            durationInSeconds: 5 // fallback
                        });
                    };
                    // Force load
                    audio.load();
                });
            }));

            console.log("Audio Segments:", segmentsWithDuration);
            setAudioUrl(segmentsWithDuration);
        } catch (err) {
            console.error("Generate Audio Error:", err);
            setError("TTS Error: " + err.message);
        }
    };

    const handleGenerateAudio = () => generateAudio(narrationScript);

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                    <label className="block text-sm font-medium text-gray-700">Gemini API Key</label>
                    <input
                        type="password"
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        placeholder="Enter your Gemini API Key"
                        className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                    />
                    <p className="text-xs text-gray-500">
                        Get a free key at <a href="https://aistudio.google.com/app/apikey" target="_blank" className="text-blue-600 hover:underline">Google AI Studio</a>
                    </p>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="block text-sm font-medium text-gray-700">Language</label>
                            <select
                                value={ttsVoice}
                                onChange={(e) => setTtsVoice(e.target.value)}
                                className="w-full bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-3 outline-none"
                            >
                                <option value="en">English (US)</option>
                                <option value="en-GB">English (UK)</option>
                                <option value="en-AU">English (AU)</option>
                                <option value="vi">Vietnamese</option>
                                <option value="ja">Japanese</option>
                                <option value="ko">Korean</option>
                                <option value="fr">French</option>
                                <option value="es">Spanish</option>
                                <option value="de">German</option>
                            </select>
                        </div>
                        <div className="space-y-1">
                            <label className="block text-sm font-medium text-gray-700">Speed ({ttsSpeed}x)</label>
                            <input
                                type="range"
                                min="0.5"
                                max="2.0"
                                step="0.1"
                                value={ttsSpeed}
                                onChange={(e) => setTtsSpeed(parseFloat(e.target.value))}
                                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer mt-4"
                            />
                        </div>
                    </div>

                    <button
                        onClick={handleGenerateScript}
                        disabled={isGenerating || !scenes.length}
                        className={`w-full flex items-center justify-center py-3 rounded-lg font-bold text-white transition-all shadow-md
               ${isGenerating ? 'bg-gray-400 cursor-not-allowed' : 'bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 hover:shadow-lg transform hover:-translate-y-0.5'}`}
                    >
                        {isGenerating ? 'Generating...' : (
                            <>
                                Generate Script
                            </>
                        )}
                    </button>

                    {error && <p className="text-red-500 text-sm">{error}</p>}
                </div>

                <div className="space-y-4">
                    <label className="block text-sm font-medium text-gray-700">Narration Script</label>
                    <textarea
                        value={narrationScript}
                        onChange={(e) => setNarrationScript(e.target.value)}
                        className="w-full h-40 border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                        placeholder="Generated script will appear here..."
                    />
                </div>
            </div>

            <div className="flex items-center justify-between bg-gray-100 p-4 rounded-lg">
                <div className="flex items-center gap-2 text-gray-700">
                    <Volume2 className="w-5 h-5" />
                    <span className="font-medium text-sm">Audio Voiceover</span>
                </div>

                <button
                    onClick={handleGenerateAudio}
                    disabled={!narrationScript}
                    className={`px-6 py-2 rounded-full font-bold text-sm flex items-center gap-2 transition
             ${!narrationScript ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700 shadow'}`}
                >
                    <Mic className="w-4 h-4" /> Convert to Speech
                </button>
            </div>

            {audioUrl && Array.isArray(audioUrl) && audioUrl.length > 0 && (
                <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
                    <p className="text-green-800 font-medium mb-3 flex items-center gap-2">
                        <Play className="w-4 h-4" /> Audio Segments ({audioUrl.length})
                    </p>
                    <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                        {audioUrl.map((seg, idx) => (
                            <div key={idx} className="bg-white p-3 rounded-md border border-gray-100 shadow-sm">
                                <p className="text-xs text-gray-500 mb-1 font-mono">Segment {idx + 1} ({seg.durationInSeconds.toFixed(1)}s)</p>
                                <p className="text-sm text-gray-800 mb-2 italic">"{seg.shortText.substring(0, 60)}..."</p>
                                <audio controls className="w-full h-8" src={seg.url} />
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
