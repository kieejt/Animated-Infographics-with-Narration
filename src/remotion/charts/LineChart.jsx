import React, { useRef, useEffect } from 'react';
import { useCurrentFrame, useVideoConfig, spring } from 'remotion';

export default function LineChart({
    data, xAxis, yAxis, yColumns, title,
    chartColor = '#ef4444',
    textColor = '#1f2937',
    showValues = true,
    showLabels = true,
    // New Props
    animationSpeed = 'medium',
    animationType = 'grow',
    lineWidth = 8,
    dotSize = 8
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
    });

    const chartData = data.slice(0, 15);
    const maxValue = Math.max(...chartData.map(d => Number(d[yAxis]) || 0));

    const chartWidth = width * 0.8;
    const chartHeight = height * 0.5;
    const startX = (width - chartWidth) / 2;
    const startY = (height - chartHeight) / 2 + 50;

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.clearRect(0, 0, width, height);

        // --- Title ---
        ctx.save();
        ctx.globalAlpha = Math.min(1, progress * 1.5);
        ctx.fillStyle = textColor;
        ctx.font = 'bold 60px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(title, width / 2, startY - 80);
        ctx.restore();

        // --- Axes ---
        ctx.save();
        ctx.lineWidth = 4;
        ctx.strokeStyle = textColor;
        ctx.lineJoin = 'miter';
        ctx.beginPath();
        // Y Axis top
        ctx.moveTo(startX, startY);
        // To Origin
        ctx.lineTo(startX, startY + chartHeight);
        // To X Axis end
        ctx.lineTo(startX + chartWidth, startY + chartHeight);
        ctx.stroke();
        ctx.restore();

        // --- Line Path (Multi Series) ---
        const seriesKeys = (yColumns && yColumns.length > 0) ? yColumns : [yAxis];
        // Global Max
        let globalMax = 0;
        chartData.forEach(d => {
            seriesKeys.forEach(key => {
                const v = Number(d[key]) || 0;
                if (v > globalMax) globalMax = v;
            });
        });

        const palette = [chartColor, '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#6366f1'];

        if (chartData.length > 1) {

            seriesKeys.forEach((key, serIdx) => {
                const currentSeriesColor = palette[serIdx % palette.length];

                ctx.save();
                ctx.globalAlpha = animationType === 'fade' ? progress : 1;

                if (animationType === 'reveal') {
                    ctx.beginPath();
                    ctx.rect(startX, 0, chartWidth * progress, height);
                    ctx.clip();
                }

                ctx.beginPath();
                ctx.lineWidth = lineWidth;
                ctx.strokeStyle = currentSeriesColor;
                ctx.lineCap = 'round';
                ctx.lineJoin = 'round';

                const points = chartData.map((d, i) => {
                    const x = startX + (i / (chartData.length - 1)) * chartWidth;
                    const val = Number(d[key]) || 0;
                    const y = startY + chartHeight - ((val / globalMax) * chartHeight);
                    return { x, y, val, label: d[xAxis] };
                });

                ctx.moveTo(points[0].x, points[0].y);
                points.forEach((p, i) => {
                    if (i > 0) ctx.lineTo(p.x, p.y);
                });

                // Animation Logic
                if (animationType === 'grow' || animationType === 'slide') {
                    const pathLength = chartWidth * 2;
                    ctx.setLineDash([pathLength]);
                    ctx.lineDashOffset = pathLength * (1 - progress);
                }

                ctx.stroke();
                ctx.restore();

                // --- Dots & Labels ---
                points.forEach((p, i) => {
                    // Only draw labels for the FIRST series to avoid clutter?
                    // Or shared labels.
                    // Let's allow dots for all.

                    const pointProgress = i / (points.length - 1);
                    let isVisible = progress > pointProgress;
                    // Reveal dots as the line grows.
                    // Scale trigger so the last point starts fading in earlier (at 85%) to be fully visible by 100%.
                    const trigger = animationType === 'reveal' ? pointProgress : pointProgress * 0.85;

                    // Use epsilon to ensure last point (1.0) is visible when progress is 1.0
                    isVisible = progress > (trigger - 0.0001);

                    // Multiply by bigger factor to saturate quickly
                    let opacity = 0;
                    if (animationType === 'reveal') {
                        opacity = isVisible ? Math.min(1, (progress - trigger) * 50) : 0; // Fast pop
                    } else {
                        opacity = Math.max(0, (progress - trigger) * 8);
                        opacity = Math.min(1, opacity);
                    }

                    if (!isVisible || opacity <= 0) return;

                    ctx.save();
                    ctx.globalAlpha = opacity;

                    if (dotSize > 0) {
                        ctx.beginPath();
                        ctx.arc(p.x, p.y, dotSize, 0, Math.PI * 2);
                        ctx.fillStyle = 'white';
                        ctx.fill();
                        ctx.lineWidth = Math.max(2, lineWidth / 2);
                        ctx.strokeStyle = currentSeriesColor;
                        ctx.stroke();
                    }

                    // Value
                    if (showValues) {
                        ctx.fillStyle = textColor;
                        ctx.font = 'bold 16px sans-serif';

                        // If first point, put label to the left to avoid axis overlap
                        if (i === 0) {
                            ctx.textAlign = 'right';
                            ctx.textBaseline = 'middle';
                            ctx.fillText(p.val.toLocaleString(), p.x - (dotSize + 10), p.y);
                        } else {
                            ctx.textAlign = 'center';
                            ctx.textBaseline = 'alphabetic'; // Default
                            ctx.fillText(p.val.toLocaleString(), p.x, p.y - (dotSize + 15));
                        }
                    }

                    // Label (X-Axis) - Only draw once (e.g. for first series)
                    if (serIdx === 0 && showLabels) {
                        if (chartData.length <= 10 || i % 2 === 0) {
                            ctx.fillStyle = textColor;
                            ctx.font = '20px sans-serif';
                            ctx.fillText(String(p.label).substring(0, 10), p.x, startY + chartHeight + 40);
                        }
                    }
                    ctx.restore();
                });
            });

            // --- Legend ---
            if (seriesKeys.length > 1) {
                ctx.save();
                ctx.globalAlpha = progress;
                const legendY = startY - 30;
                let currentLegendX = startX;

                seriesKeys.forEach((key, idx) => {
                    const color = palette[idx % palette.length];
                    ctx.fillStyle = color;
                    ctx.fillRect(currentLegendX, legendY, 20, 20);
                    ctx.fillStyle = textColor;
                    ctx.font = 'bold 16px sans-serif';
                    ctx.textAlign = 'left';
                    ctx.textBaseline = 'top';
                    ctx.fillText(key, currentLegendX + 25, legendY);

                    const textMetrics = ctx.measureText(key);
                    currentLegendX += 25 + textMetrics.width + 20;
                });
                ctx.restore();
            }
        }

    }, [width, height, title, chartData, chartColor, textColor, progress, startX, startY, chartWidth, chartHeight, showLabels, showValues, animationType, lineWidth, dotSize, yColumns, yAxis]);

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
