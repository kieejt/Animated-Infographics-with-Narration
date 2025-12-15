import { useProject } from '../context/ProjectContext';
import { Type, Palette, Layout, Scaling, MoveVertical } from 'lucide-react';

export default function SubtitleInspector() {
    const { subtitleSettings, setSubtitleSettings } = useProject();

    const handleChange = (key, value) => {
        setSubtitleSettings(prev => ({ ...prev, [key]: value }));
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 h-full overflow-y-auto">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-100">
                <h3 className="font-bold text-gray-800 flex items-center gap-2">
                    <Type className="w-4 h-4 text-blue-500" /> Subtitle Settings
                </h3>
            </div>

            <div className="space-y-4">
                {/* Show Background Toggle */}
                <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                        <Layout className="w-4 h-4 text-gray-500" /> Show Background
                    </label>
                    <input
                        type="checkbox"
                        checked={subtitleSettings.showBackground}
                        onChange={(e) => handleChange('showBackground', e.target.checked)}
                        className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 border-gray-300 cursor-pointer"
                    />
                </div>

                {/* Text Color */}
                <div>
                    <label className="text-xs font-medium text-gray-500 mb-1 flex items-center gap-1">
                        <Palette className="w-3 h-3" /> Text Color
                    </label>
                    <div className="flex items-center gap-2">
                        <input
                            type="color"
                            value={subtitleSettings.textColor}
                            onChange={(e) => handleChange('textColor', e.target.value)}
                            className="w-8 h-8 rounded cursor-pointer border-0"
                        />
                        <span className="text-xs text-gray-600 font-mono">{subtitleSettings.textColor}</span>
                    </div>
                </div>

                {/* Background Color */}
                <div>
                    <label className="text-xs font-medium text-gray-500 mb-1 flex items-center gap-1">
                        <Layout className="w-3 h-3" /> Background Color
                    </label>
                    <div className="flex items-center gap-2">
                        <input
                            type="color"
                            value={subtitleSettings.backgroundColor}
                            onChange={(e) => handleChange('backgroundColor', e.target.value)}
                            className="w-8 h-8 rounded cursor-pointer border-0"
                        />
                        <span className="text-xs text-gray-600 font-mono">{subtitleSettings.backgroundColor}</span>
                    </div>
                </div>

                {/* Font Size */}
                <div>
                    <label className="text-xs font-medium text-gray-500 mb-1 flex items-center gap-1">
                        <Scaling className="w-3 h-3" /> Font Size ({subtitleSettings.fontSize}px)
                    </label>
                    <input
                        type="range"
                        min="12"
                        max="60"
                        value={subtitleSettings.fontSize}
                        onChange={(e) => handleChange('fontSize', parseInt(e.target.value))}
                        className="w-full accent-blue-500 h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                </div>

                {/* Position Y (Margin Bottom) */}
                <div>
                    <label className="text-xs font-medium text-gray-500 mb-1 flex items-center gap-1">
                        <MoveVertical className="w-3 h-3" /> Position Y (Bottom)
                    </label>
                    <input
                        type="range"
                        min="10"
                        max="300"
                        value={subtitleSettings.marginBottom}
                        onChange={(e) => handleChange('marginBottom', parseInt(e.target.value))}
                        className="w-full accent-blue-500 h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                        <span>Low</span>
                        <span>High</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
