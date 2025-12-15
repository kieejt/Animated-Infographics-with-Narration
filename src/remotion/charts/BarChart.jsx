import React, { useRef, useEffect } from 'react';
import { useCurrentFrame, useVideoConfig, spring } from 'remotion';

export default function BarChart({
    data, xAxis, yAxis, yColumns, title,
    chartColor = '#3b82f6',
    textColor = '#1f2937',
    showValues = true,
    showLabels = true,
    // New Props
    animationSpeed = 'medium',
    animationType = 'grow',
    barRoundness = 5,
    barGap = 10
}) {
    const { fps, width, height } = useVideoConfig();
    const frame = useCurrentFrame();
    const canvasRef = useRef(null);

    // Speed Config
    // Tuned for "Infographic" feel: Slower, more deliberate, smoother.
    const speedConfig = {
        slow: { mass: 4, stiffness: 20, damping: 30 },   // Very slow (3-5s)
        medium: { mass: 2, stiffness: 60, damping: 20 },   // Normal (1-2s)
        fast: { mass: 1, stiffness: 120, damping: 15 }   // Quick (<1s)
    };

    const currentConfig = speedConfig[animationSpeed] || speedConfig.medium;

    const progress = spring({
        frame,
        fps,
        config: currentConfig,
        durationInFrames: animationSpeed === 'slow' ? 150 : undefined // Optional override if spring allows, but physics is key
    });

    // Data processing
    const chartData = data.slice(0, 24);
    const maxValue = Math.max(...chartData.map(d => Number(d[yAxis]) || 0));

    // Dimensions
    const chartWidth = width * 0.8;
    const chartHeight = height * 0.5;
    const margin = { top: 40, right: 40, bottom: 60, left: 60 };
    const startX = (width - chartWidth) / 2;
    const startY = (height - chartHeight) / 2 + 50;

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Clear canvas
        ctx.clearRect(0, 0, width, height);

        // --- Draw Title ---
        ctx.save();
        ctx.globalAlpha = Math.min(1, progress * 1.5); // Fade in title faster
        ctx.fillStyle = textColor;
        ctx.font = 'bold 60px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(title, width / 2, startY - 80);
        ctx.restore();

        // --- Draw Bars ---

        // Resolve Series
        const seriesKeys = (yColumns && yColumns.length > 0) ? yColumns : [yAxis];
        // Calculate Global Max Value across all series
        let globalMax = 0;
        chartData.forEach(d => {
            seriesKeys.forEach(key => {
                const v = Number(d[key]) || 0;
                if (v > globalMax) globalMax = v;
            });
        });

        // Colors Palette
        const palette = [chartColor, '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#6366f1'];

        // Dimensions per category
        const itemWidth = chartWidth / chartData.length;
        const totalGap = barGap * 2; // Gap between categories
        const groupWidth = Math.max(1, itemWidth - totalGap);
        const singleBarWidth = groupWidth / seriesKeys.length;

        // Axis Line Width
        const axisWidth = 4;

        chartData.forEach((d, i) => {
            const groupStartX = startX + (i * itemWidth) + (barGap); // Shift by left gap

            seriesKeys.forEach((key, serIdx) => {
                const val = Number(d[key]) || 0;
                const finalBarHeight = (val / globalMax) * (chartHeight * 0.8);

                // Animation
                let currentBarHeight = finalBarHeight;
                let barOpacity = 1;

                if (animationType === 'grow') {
                    currentBarHeight = finalBarHeight * progress;
                } else if (animationType === 'fade') {
                    barOpacity = progress;
                } else if (animationType === 'slide') {
                    currentBarHeight = finalBarHeight * progress;
                    barOpacity = progress;
                } else if (animationType === 'reveal') {
                    const totalBars = chartData.length * seriesKeys.length;
                    const currentBarIndex = (i * seriesKeys.length) + serIdx;

                    const startP = currentBarIndex / totalBars;
                    const durationP = 1 / totalBars;

                    let localProgress = (progress - startP) / durationP;
                    localProgress = Math.max(0, Math.min(1, localProgress));

                    currentBarHeight = finalBarHeight * localProgress;
                    barOpacity = localProgress > 0 ? 1 : 0;
                }

                const barX = groupStartX + (serIdx * singleBarWidth);
                const bottomY = startY + chartHeight - (axisWidth / 2);
                const barY = bottomY - currentBarHeight;

                // Color
                const seriesColor = palette[serIdx % palette.length];

                ctx.save();
                ctx.globalAlpha = barOpacity;
                ctx.fillStyle = seriesColor;

                ctx.beginPath();
                if (ctx.roundRect) {
                    ctx.roundRect(barX, barY, singleBarWidth - 2, currentBarHeight, [barRoundness, barRoundness, 0, 0]); // -2 for slight separate
                } else {
                    ctx.rect(barX, barY, singleBarWidth - 2, currentBarHeight);
                }
                ctx.fill();

                // Value Labels (only if single series or enough space?)
                // If multi series, values might get cluttered.
                // Let's show only if single series OR strictly requested.
                if (showValues && progress > 0.5) {
                    ctx.globalAlpha = barOpacity * (progress > 0.5 ? (progress - 0.5) * 2 : 0);
                    ctx.fillStyle = textColor;
                    ctx.font = seriesKeys.length > 1 ? 'bold 16px sans-serif' : 'bold 32px sans-serif';
                    ctx.textAlign = 'center';
                    ctx.fillText(val.toLocaleString(), barX + singleBarWidth / 2, barY - 10);
                }
                ctx.restore();
            });

            // Category Label (Centered on Group)
            if (showLabels && progress > 0.2) {
                const textAlpha = Math.max(0, (progress - 0.2) * 1.5);
                ctx.save();
                ctx.globalAlpha = textAlpha;
                ctx.fillStyle = textColor;
                ctx.font = '20px sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText(
                    String(d[xAxis]).substring(0, 10),
                    groupStartX + (groupWidth / 2),
                    startY + chartHeight + 40
                );
                ctx.restore();
            }
        });

        // --- Legend (Middle Top or Top Right) ---
        if (seriesKeys.length > 1) {
            ctx.save();
            ctx.globalAlpha = progress;
            const legendY = startY - 30; // Below title
            let currentLegendX = startX;

            seriesKeys.forEach((key, idx) => {
                const color = palette[idx % palette.length];

                // Draw color box
                ctx.fillStyle = color;
                ctx.fillRect(currentLegendX, legendY, 20, 20);

                // Text
                ctx.fillStyle = textColor;
                ctx.font = 'bold 16px sans-serif';
                ctx.textAlign = 'left';
                ctx.textBaseline = 'top';
                ctx.fillText(key, currentLegendX + 25, legendY);

                // Advance
                const textMetrics = ctx.measureText(key);
                currentLegendX += 25 + textMetrics.width + 20; // 20px padding
            });
            ctx.restore();
        }

        // --- Draw Axes (On Top) ---
        ctx.save();
        ctx.lineWidth = axisWidth;
        ctx.strokeStyle = textColor;
        ctx.globalAlpha = 1;
        ctx.lineJoin = 'miter';
        ctx.beginPath();
        // Start top-left of Y axis
        ctx.moveTo(startX, startY);
        // Down to Origin
        ctx.lineTo(startX, startY + chartHeight);
        // Right to end of X axis
        ctx.lineTo(startX + chartWidth, startY + chartHeight);
        ctx.stroke();
        ctx.restore();

    }, [width, height, title, chartData, xAxis, yAxis, progress, chartColor, textColor, showLabels, showValues, startX, startY, chartWidth, chartHeight, animationType, barGap, barRoundness]);

    return (
        <div className="w-full h-full bg-white relative">
            <canvas
                ref={canvasRef}
                width={width}
                height={height}
                className="w-full h-full"
            />
        </div>
    );
}
