import React, { useRef, useEffect } from 'react';
import { useCurrentFrame, useVideoConfig, spring } from 'remotion';

export default function PieChart({
    data, xAxis, yAxis, title,
    chartColor = '#3b82f6',
    textColor = '#1f2937',
    showValues = true,
    showLabels = true,
    // New Props
    animationSpeed = 'medium',
    pieInnerRadius = 0
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

    const chartData = data.slice(0, 6); // Limit slices
    const total = chartData.reduce((acc, d) => acc + (Number(d[yAxis]) || 0), 0);

    // Generate colors
    const colors = [chartColor, '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.clearRect(0, 0, width, height);

        const centerX = width / 2;
        const centerY = height / 2;
        const radius = 300;
        const innerRadius = pieInnerRadius; // e.g. 100

        // --- Title ---
        ctx.save();
        ctx.globalAlpha = Math.min(1, progress * 1.5);
        // Basic slide-in effect
        const titleY = 100 + (1 - progress) * 50;
        ctx.fillStyle = textColor;
        ctx.font = 'bold 60px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(title, width / 2, titleY);
        ctx.restore();

        // --- Pie Slices ---
        let currentAngle = 0; // Radians 0 is 3 o'clock. 

        chartData.forEach((d, i) => {
            const val = Number(d[yAxis]) || 0;
            const sliceFraction = val / total;
            const sliceAngle = sliceFraction * (Math.PI * 2);

            // Animate angle sweep
            const drawAngle = sliceAngle * progress;

            const startAngle = currentAngle;
            const endAngle = currentAngle + drawAngle;

            ctx.save();
            ctx.beginPath();

            // Donut logic vs Pie Logic
            if (innerRadius > 0) {
                // Calculate points
                const x1_outer = centerX + Math.cos(startAngle) * radius;
                const y1_outer = centerY + Math.sin(startAngle) * radius;

                const x2_inner = centerX + Math.cos(endAngle) * innerRadius;
                const y2_inner = centerY + Math.sin(endAngle) * innerRadius;

                // 1. Move to Outer Start
                ctx.moveTo(x1_outer, y1_outer);
                // 2. Arc Outer to End
                ctx.arc(centerX, centerY, radius, startAngle, endAngle, false);
                // 3. Line to Inner End
                ctx.lineTo(x2_inner, y2_inner);
                // 4. Arc Inner backwards to Start
                ctx.arc(centerX, centerY, innerRadius, endAngle, startAngle, true);
                // 5. Close checks out
                ctx.closePath();

            } else {
                // Standard Pie
                ctx.moveTo(centerX, centerY);
                ctx.arc(centerX, centerY, radius, startAngle, endAngle);
                ctx.closePath();
            }

            ctx.fillStyle = colors[i % colors.length];
            // Stroke
            ctx.strokeStyle = 'white';
            ctx.lineWidth = 4;
            ctx.stroke();
            ctx.fill();
            ctx.restore();

            // --- Labels ---
            // Only draw if this slice is somewhat drawn
            if (progress > 0.1) {
                const midAngle = startAngle + (drawAngle / 2);
                // Label radius
                const labelR = radius + 60;
                const labelX = centerX + Math.cos(midAngle) * labelR;
                const labelY = centerY + Math.sin(midAngle) * labelR;

                ctx.save();
                ctx.globalAlpha = progress;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';

                // Label (Category)
                if (showLabels) {
                    ctx.fillStyle = textColor;
                    ctx.font = '24px sans-serif';
                    ctx.fillText(String(d[xAxis]).substring(0, 10), labelX, labelY);
                }

                // Value
                if (showValues) {
                    ctx.fillStyle = textColor;
                    ctx.font = 'bold 24px sans-serif';
                    ctx.fillText(val.toLocaleString(), labelX, labelY + 30);
                }
                ctx.restore();
            }

            // Move start for next slice (based on full size, so positions are correct)
            // But wait, if we animate "progress", do we want them all to grow together or spin out?
            // "sliceAngle * progress" means each slice grows from 0 to its size. 
            // Correct for "Angle Stretches" (fan open).
            currentAngle += sliceAngle;
        });

    }, [width, height, title, chartData, colors, progress, textColor, showLabels, showValues, total, pieInnerRadius, animationSpeed]);

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
