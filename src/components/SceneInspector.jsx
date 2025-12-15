import { useProject } from '../context/ProjectContext';
import { Trash2, BarChart2, PieChart, Activity, Palette, Tag, Plus, X } from 'lucide-react';

export default function SceneInspector() {
    const { tracks, setTracks, selectedSceneId, setSelectedSceneId, columns, addScene } = useProject();

    const selectedTrackIndex = tracks.findIndex(t => t.scenes.some(s => s.id === selectedSceneId));
    const selectedScene = selectedTrackIndex !== -1
        ? tracks[selectedTrackIndex].scenes.find(s => s.id === selectedSceneId)
        : null;

    const updateScene = (field, value) => {
        if (!selectedScene) return;

        const newTracks = [...tracks];
        const track = newTracks[selectedTrackIndex];
        const sceneIndex = track.scenes.findIndex(s => s.id === selectedSceneId);

        track.scenes[sceneIndex] = { ...track.scenes[sceneIndex], [field]: value };
        setTracks(newTracks);
    };

    const removeScene = () => {
        if (!selectedScene) return;
        const newTracks = [...tracks];
        const track = newTracks[selectedTrackIndex];
        track.scenes = track.scenes.filter(s => s.id !== selectedSceneId);
        setTracks(newTracks);
    };

    if (!selectedScene) {
        return (
            <div className="h-full flex flex-col items-center justify-center p-8 text-center border-2 border-dashed border-gray-200 rounded-xl bg-gray-50">
                <p className="text-gray-500 mb-4">Select a clip in the timeline to edit settings</p>
                <button
                    onClick={addScene}
                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition shadow"
                >
                    <Plus size={16} /> Create New Scene
                </button>
            </div>
        );
    }

    return (
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm h-full overflow-y-auto">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
                <h3 className="font-bold text-lg text-gray-800">Scene Settings</h3>
                <div className="flex gap-2">
                    <button
                        onClick={removeScene}
                        className="text-red-400 hover:text-red-600 p-2 hover:bg-red-50 rounded-full transition"
                        title="Delete Scene"
                    >
                        <Trash2 size={20} />
                    </button>
                    <button
                        onClick={() => setSelectedSceneId(null)}
                        className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-full transition"
                        title="Close Inspector"
                    >
                        <X size={20} />
                    </button>
                </div>
            </div>

            <div className="space-y-6">
                {/* Title */}
                <div className="space-y-2">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Title</label>
                    <input
                        type="text"
                        value={selectedScene.title}
                        onChange={(e) => updateScene('title', e.target.value)}
                        className="font-bold text-lg bg-gray-50 border border-gray-300 rounded-lg p-3 w-full focus:ring-2 focus:ring-blue-500 outline-none"
                        placeholder="Scene Title"
                    />
                </div>

                {/* Type */}
                <div className="space-y-2">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Chart Type</label>
                    <div className="flex bg-gray-50 rounded-lg p-1 border border-gray-200">
                        {[
                            { id: 'bar', icon: BarChart2, label: 'Bar' },
                            { id: 'line', icon: Activity, label: 'Line' },
                            { id: 'pie', icon: PieChart, label: 'Pie' },
                        ].map((type) => (
                            <button
                                key={type.id}
                                onClick={() => updateScene('type', type.id)}
                                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-all ${selectedScene.type === type.id
                                    ? 'bg-white text-blue-600 shadow-sm ring-1 ring-gray-200'
                                    : 'text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                <type.icon size={16} />
                                {type.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Axes */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">X Axis</label>
                        <select
                            value={selectedScene.xAxis}
                            onChange={(e) => updateScene('xAxis', e.target.value)}
                            className="w-full bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 block p-2.5"
                        >
                            {columns.map(col => <option key={col} value={col}>{col}</option>)}
                        </select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Y Axis (Series)</label>
                        <div className="bg-white border border-gray-300 rounded-lg p-2 max-h-32 overflow-y-auto">
                            {columns.map(col => {
                                // Logic: use yColumns if exists, else fallback to yAxis single value check
                                const currentYColumns = selectedScene.yColumns || (selectedScene.yAxis ? [selectedScene.yAxis] : []);
                                const isChecked = currentYColumns.includes(col);

                                return (
                                    <label key={col} className="flex items-center gap-2 mb-1 cursor-pointer hover:bg-gray-50 p-1 rounded">
                                        <input
                                            type="checkbox"
                                            checked={isChecked}
                                            onChange={(e) => {
                                                const newChecked = e.target.checked;
                                                let newSeries = [...currentYColumns];
                                                if (newChecked) {
                                                    if (!newSeries.includes(col)) newSeries.push(col);
                                                } else {
                                                    newSeries = newSeries.filter(c => c !== col);
                                                }
                                                // Update both yColumns and legacy yAxis for safety, 
                                                // though rendering will primarily use yColumns now.
                                                updateScene('yColumns', newSeries);
                                                // Keep yAxis as the first selected default just in case
                                                if (newSeries.length > 0) updateScene('yAxis', newSeries[0]);
                                            }}
                                            className="accent-blue-600 rounded"
                                        />
                                        <span className="text-sm text-gray-700 truncate" title={col}>{col}</span>
                                    </label>
                                )
                            })}
                        </div>
                    </div>
                </div>

                {/* Style */}
                <div className="space-y-2">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1">
                        <Palette size={12} /> Appearance
                    </label>
                    <div className="flex gap-2">
                        <div className="flex-1 flex items-center gap-2 bg-white border border-gray-300 rounded-lg p-2">
                            <input
                                type="color"
                                value={selectedScene.chartColor || '#3b82f6'}
                                onChange={(e) => updateScene('chartColor', e.target.value)}
                                className="w-8 h-8 rounded cursor-pointer border-none bg-transparent p-0"
                            />
                            <span className="text-xs text-gray-500">Chart Color</span>
                        </div>
                        <div className="flex-1 flex items-center gap-2 bg-white border border-gray-300 rounded-lg p-2">
                            <input
                                type="color"
                                value={selectedScene.textColor || '#1f2937'}
                                onChange={(e) => updateScene('textColor', e.target.value)}
                                className="w-8 h-8 rounded cursor-pointer border-none bg-transparent p-0"
                            />
                            <span className="text-xs text-gray-500">Text Color</span>
                        </div>
                    </div>
                </div>

                <div className="flex gap-2">
                    <label className="flex items-center gap-2 bg-white border border-gray-300 rounded-lg p-2 flex-1 cursor-pointer hover:bg-gray-50 text-sm">
                        <input
                            type="checkbox"
                            checked={selectedScene.showValues !== false}
                            onChange={(e) => updateScene('showValues', e.target.checked)}
                            className="accent-blue-600"
                        />
                        Values
                    </label>
                    <label className="flex items-center gap-2 bg-white border border-gray-300 rounded-lg p-2 flex-1 cursor-pointer hover:bg-gray-50 text-sm">
                        <input
                            type="checkbox"
                            checked={selectedScene.showLabels !== false}
                            onChange={(e) => updateScene('showLabels', e.target.checked)}
                            className="accent-blue-600"
                        />
                        Labels
                    </label>
                </div>

                <div className="space-y-2">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Duration (Sec)</label>
                    <input
                        type="number"
                        min="1"
                        max="60"
                        value={selectedScene.duration}
                        onChange={(e) => updateScene('duration', parseInt(e.target.value) || 5)}
                        className="w-full bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 block p-2.5"
                    />
                </div>

                {/* Advanced Animation Settings */}
                <div className="pt-4 border-t border-gray-100">
                    <h4 className="text-sm font-bold text-gray-700 mb-3">Animation</h4>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-xs text-gray-500">Speed</label>
                            <select
                                value={selectedScene.animationSpeed || 'medium'}
                                onChange={(e) => updateScene('animationSpeed', e.target.value)}
                                className="w-full bg-white border border-gray-300 text-sm rounded-lg p-2"
                            >
                                <option value="slow">Slow</option>
                                <option value="medium">Medium</option>
                                <option value="fast">Fast</option>
                            </select>
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs text-gray-500">Type</label>
                            <select
                                value={selectedScene.animationType || 'grow'}
                                onChange={(e) => updateScene('animationType', e.target.value)}
                                className="w-full bg-white border border-gray-300 text-sm rounded-lg p-2"
                            >
                                <option value="grow">Grow/Draw</option>
                                <option value="fade">Fade In</option>
                                <option value="slide">Slide In</option>
                                <option value="reveal">Reveal (One by One)</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Specific Chart Style Settings */}
                <div className="pt-4 border-t border-gray-100">
                    <h4 className="text-sm font-bold text-gray-700 mb-3">Chart Style</h4>

                    {/* Bar Chart Settings */}
                    {selectedScene.type === 'bar' && (
                        <div className="space-y-3">
                            <div className="space-y-1">
                                <label className="text-xs text-gray-500 flex justify-between">
                                    <span>Corner Roundness</span>
                                    <span>{selectedScene.barRoundness || 0}px</span>
                                </label>
                                <input
                                    type="range" min="0" max="20"
                                    value={selectedScene.barRoundness || 0}
                                    onChange={(e) => updateScene('barRoundness', parseInt(e.target.value))}
                                    className="w-full accent-blue-600 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs text-gray-500 flex justify-between">
                                    <span>Bar Gap</span>
                                    <span>{selectedScene.barGap || 0}px</span>
                                </label>
                                <input
                                    type="range" min="0" max="50"
                                    value={selectedScene.barGap || 0}
                                    onChange={(e) => updateScene('barGap', parseInt(e.target.value))}
                                    className="w-full accent-blue-600 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                                />
                            </div>
                        </div>
                    )}

                    {/* Line Chart Settings */}
                    {selectedScene.type === 'line' && (
                        <div className="space-y-3">
                            <div className="space-y-1">
                                <label className="text-xs text-gray-500 flex justify-between">
                                    <span>Line Width</span>
                                    <span>{selectedScene.lineWidth || 8}px</span>
                                </label>
                                <input
                                    type="range" min="1" max="20"
                                    value={selectedScene.lineWidth || 8}
                                    onChange={(e) => updateScene('lineWidth', parseInt(e.target.value))}
                                    className="w-full accent-blue-600 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs text-gray-500 flex justify-between">
                                    <span>Dot Size</span>
                                    <span>{selectedScene.dotSize || 8}px</span>
                                </label>
                                <input
                                    type="range" min="0" max="20"
                                    value={selectedScene.dotSize || 8}
                                    onChange={(e) => updateScene('dotSize', parseInt(e.target.value))}
                                    className="w-full accent-blue-600 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                                />
                            </div>
                        </div>
                    )}

                    {/* Pie Chart Settings */}
                    {selectedScene.type === 'pie' && (
                        <div className="space-y-3">
                            <div className="space-y-1">
                                <label className="text-xs text-gray-500 flex justify-between">
                                    <span>Inner Radius (Donut)</span>
                                    <span>{selectedScene.pieInnerRadius || 0}</span>
                                </label>
                                <input
                                    type="range" min="0" max="150"
                                    value={selectedScene.pieInnerRadius || 0}
                                    onChange={(e) => updateScene('pieInnerRadius', parseInt(e.target.value))}
                                    className="w-full accent-blue-600 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                                />
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
