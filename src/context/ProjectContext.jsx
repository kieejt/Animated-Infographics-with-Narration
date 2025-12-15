/* eslint-disable react/prop-types */
import { createContext, useContext, useState } from 'react';

const ProjectContext = createContext();

export const ProjectProvider = ({ children }) => {
    const [csvData, setCsvData] = useState(null);
    const [columns, setColumns] = useState([]);

    // Tracks state: Array of { id, name, scenes: [] }
    const [tracks, setTracks] = useState([
        { id: 'track-1', name: 'Main Track', scenes: [] }
    ]);

    const [narrationScript, setNarrationScript] = useState('');
    const [audioUrl, setAudioUrl] = useState(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [selectedSceneId, setSelectedSceneId] = useState(null);

    // Subtitle Customization State
    const [subtitleSettings, setSubtitleSettings] = useState({
        textColor: '#000000',
        backgroundColor: '#ffffff',
        borderColor: 'transparent',
        borderWidth: 0,
        fontSize: 45,
        marginBottom:0,
        showBackground: false
    });

    // TTS Voice & Speed
    const [ttsVoice, setTtsVoice] = useState('en');
    const [ttsSpeed, setTtsSpeed] = useState(1.0);

    const addScene = () => {
        const newTracks = [...tracks];
        if (newTracks.length === 0) return;

        const newScene = {
            id: crypto.randomUUID(),
            type: 'bar',
            title: 'New Chart',
            xAxis: columns[0] || '',
            yAxis: columns[1] || '',
            duration: 10,
            chartColor: '#3b82f6',
            textColor: '#1f2937',
            showValues: true,
            showLabels: true,
            // Advanced Props Defaults
            animationSpeed: 'medium', // slow, medium, fast
            animationType: 'grow',    // grow, fade
            barRoundness: 5,
            barGap: 10,
            lineWidth: 8,
            dotSize: 8,
            pieInnerRadius: 0,        // 0 = pie, >0 = donut
            piePadAngle: 0
        };

        newTracks[0].scenes.push(newScene);
        setTracks(newTracks);
    };

    const value = {
        csvData, setCsvData,
        columns, setColumns,
        tracks, setTracks,
        narrationScript, setNarrationScript,
        audioUrl, setAudioUrl,
        isGenerating, setIsGenerating,
        selectedSceneId, setSelectedSceneId,
        subtitleSettings, setSubtitleSettings,
        ttsVoice, setTtsVoice,
        ttsSpeed, setTtsSpeed,
        addScene
    };

    return (
        <ProjectContext.Provider value={value}>
            {children}
        </ProjectContext.Provider>
    );
};

export const useProject = () => useContext(ProjectContext);
