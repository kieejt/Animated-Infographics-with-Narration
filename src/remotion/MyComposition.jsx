import { AbsoluteFill, Series, Audio } from 'remotion';
import BarChart from './charts/BarChart.jsx';
import LineChart from './charts/LineChart.jsx';
import PieChart from './charts/PieChart.jsx';
import Subtitle from './Subtitle.jsx';

export default function MyComposition({ tracks, csvData, audioUrls, subtitleSettings, ttsSpeed }) {
    if (!csvData || !tracks || tracks.length === 0) {
        return (
            <AbsoluteFill style={{ backgroundColor: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <h1 style={{ fontSize: '2.25rem', fontWeight: 'bold', color: '#9ca3af' }}>No Tracks Configured</h1>
            </AbsoluteFill>
        )
    }

    return (
        <AbsoluteFill style={{ backgroundColor: '#ffffff' }}>
            {/* Audio Layer */}
            {/* Audio & Subtitle Layer */}
            {audioUrls && audioUrls.length > 0 && (
                <AbsoluteFill style={{ zIndex: 20 }}>
                    <Series>
                        {audioUrls.map((segment) => {
                            const durationFrames = Math.ceil(segment.durationInSeconds * 30);
                            return (
                                <Series.Sequence key={segment.index} durationInFrames={durationFrames}>
                                    <Audio src={segment.url} />
                                    <Subtitle text={segment.shortText} settings={subtitleSettings || {}} />
                                </Series.Sequence>
                            );
                        })}
                    </Series>
                </AbsoluteFill>
            )}

            {/* Render Tracks as Layers */}
            {tracks.map((track) => (
                <AbsoluteFill key={track.id} style={{ zIndex: 10 }}>
                    <Series>
                        {track.scenes.map((scene) => {
                            const durationFrames = (scene.duration || 5) * 30; // 30 fps

                            return (
                                <Series.Sequence key={scene.id} durationInFrames={durationFrames}>
                                    <AbsoluteFill>
                                        {/* Chart Container - Transparent to allow stacking. Shifted UP for subtitles. */}
                                        <div style={{ width: '100%', height: '100%', transform: 'translateY(-50px)' }}>
                                            {scene.type === 'bar' && (
                                                <BarChart
                                                    data={csvData}
                                                    xAxis={scene.xAxis}
                                                    yAxis={scene.yAxis}
                                                    yColumns={scene.yColumns} // Pass multi-series
                                                    title={scene.title}
                                                    chartColor={scene.chartColor}
                                                    textColor={scene.textColor}
                                                    showValues={scene.showValues}
                                                    showLabels={scene.showLabels}
                                                    // Advanced Props
                                                    animationSpeed={scene.animationSpeed}
                                                    animationType={scene.animationType}
                                                    barRoundness={scene.barRoundness}
                                                    barGap={scene.barGap}
                                                />
                                            )}
                                            {scene.type === 'line' && (
                                                <LineChart
                                                    data={csvData}
                                                    xAxis={scene.xAxis}
                                                    yAxis={scene.yAxis}
                                                    yColumns={scene.yColumns} // Pass multi-series
                                                    title={scene.title}
                                                    chartColor={scene.chartColor}
                                                    textColor={scene.textColor}
                                                    showValues={scene.showValues}
                                                    showLabels={scene.showLabels}
                                                    // Advanced Props
                                                    animationSpeed={scene.animationSpeed}
                                                    animationType={scene.animationType}
                                                    lineWidth={scene.lineWidth}
                                                    dotSize={scene.dotSize}
                                                />
                                            )}
                                            {scene.type === 'pie' && (
                                                <PieChart
                                                    data={csvData}
                                                    xAxis={scene.xAxis}
                                                    yAxis={scene.yAxis}
                                                    // Pie usually single series, effectively yColumns[0]
                                                    yColumns={scene.yColumns}
                                                    title={scene.title}
                                                    chartColor={scene.chartColor}
                                                    textColor={scene.textColor}
                                                    showValues={scene.showValues}
                                                    showLabels={scene.showLabels}
                                                    // Advanced Props
                                                    animationSpeed={scene.animationSpeed}
                                                    animationType={scene.animationType} // Not strictly used in pie yet but safe to pass
                                                    pieInnerRadius={scene.pieInnerRadius}
                                                />
                                            )}
                                        </div>
                                    </AbsoluteFill>
                                </Series.Sequence>
                            )
                        })}
                    </Series>
                </AbsoluteFill>
            ))}
        </AbsoluteFill>
    )
}
