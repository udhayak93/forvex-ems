import React from 'react';

export const Sparkline = ({
  data = [10, 15, 12, 22, 18, 28],
  color = '#4f46e5',
  type = 'curve', // 'curve' | 'bars'
  width = 90,
  height = 24,
}) => {
  if (!data || data.length === 0) return null;

  if (type === 'bars') {
    const barWidth = 6;
    const gap = 4;
    const maxVal = Math.max(...data, 1);
    const totalW = data.length * barWidth + (data.length - 1) * gap;

    return (
      <svg
        width={totalW}
        height={height}
        viewBox={`0 0 ${totalW} ${height}`}
        style={{ overflow: 'visible', flexShrink: 0 }}
      >
        {data.map((val, idx) => {
          const barH = Math.max((val / maxVal) * (height - 4), 3);
          const x = idx * (barWidth + gap);
          const y = height - barH;
          return (
            <rect
              key={idx}
              x={x}
              y={y}
              width={barWidth}
              height={barH}
              rx={2}
              fill={color}
              opacity={0.35 + (idx / data.length) * 0.65}
            />
          );
        })}
      </svg>
    );
  }

  // Smooth Curve calculation
  const paddingY = 4;
  const paddingX = 2;
  const minVal = Math.min(...data);
  const maxVal = Math.max(...data, minVal + 1);
  const range = maxVal - minVal || 1;

  const points = data.map((val, idx) => {
    const x = paddingX + (idx / (data.length - 1)) * (width - 2 * paddingX);
    const y = height - paddingY - ((val - minVal) / range) * (height - 2 * paddingY);
    return [x, y];
  });

  // Build smooth cubic bezier path
  let pathD = `M ${points[0][0]},${points[0][1]}`;
  for (let i = 0; i < points.length - 1; i++) {
    const [x0, y0] = points[i];
    const [x1, y1] = points[i + 1];
    const cpx1 = x0 + (x1 - x0) / 2;
    const cpy1 = y0;
    const cpx2 = x0 + (x1 - x0) / 2;
    const cpy2 = y1;
    pathD += ` C ${cpx1},${cpy1} ${cpx2},${cpy2} ${x1},${y1}`;
  }

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      style={{ overflow: 'visible', flexShrink: 0 }}
    >
      <path
        d={pathD}
        fill="none"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};
