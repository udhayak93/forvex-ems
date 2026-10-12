import React, { useState } from 'react';

export const LineChartGraph = ({
  title = 'Weekly Attendance Trend',
  data = [
    { day: 'Mon', rate: 72, present: 924 },
    { day: 'Tue', rate: 78, present: 1001 },
    { day: 'Wed', rate: 74, present: 950 },
    { day: 'Thu', rate: 84, present: 1078 },
    { day: 'Fri', rate: 81, present: 1040 },
    { day: 'Sat', rate: 87, present: 1117 },
    { day: 'Sun', rate: 96, present: 1232 },
  ],
  totalHeadcount = 1284,
  lineColor = '#3b82f6',
  height = 280,
}) => {
  const [selectedRange, setSelectedRange] = useState('7d');
  const [hoveredIdx, setHoveredIdx] = useState(null);

  const chartData = data && data.length > 0 ? data : [
    { day: 'Mon', rate: 70, present: 900 },
    { day: 'Tue', rate: 75, present: 960 },
    { day: 'Wed', rate: 72, present: 925 },
    { day: 'Thu', rate: 82, present: 1050 },
    { day: 'Fri', rate: 80, present: 1025 },
    { day: 'Sat', rate: 85, present: 1090 },
    { day: 'Sun', rate: 95, present: 1220 },
  ];

  // SVG dimensions
  const svgWidth = 600;
  const svgHeight = height;
  const paddingLeft = 45;
  const paddingRight = 30;
  const paddingTop = 30;
  const paddingBottom = 45;

  const chartW = svgWidth - paddingLeft - paddingRight;
  const chartH = svgHeight - paddingTop - paddingBottom;

  const minRate = 50; // Base baseline
  const maxRate = 100;
  const rateRange = maxRate - minRate;

  // Grid tick lines
  const gridTicks = [60, 70, 80, 90, 100];

  // Compute points
  const points = chartData.map((d, i) => {
    const x = paddingLeft + (i / (chartData.length - 1)) * chartW;
    const clampedRate = Math.min(Math.max(d.rate, minRate), maxRate);
    const y = paddingTop + chartH - ((clampedRate - minRate) / rateRange) * chartH;
    return { ...d, x, y, idx: i };
  });

  // Smooth line path
  let linePathD = `M ${points[0].x},${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i];
    const p1 = points[i + 1];
    const cpX = (p0.x + p1.x) / 2;
    linePathD += ` C ${cpX},${p0.y} ${cpX},${p1.y} ${p1.x},${p1.y}`;
  }

  // Area path (closed at the bottom)
  const lastP = points[points.length - 1];
  const firstP = points[0];
  const bottomY = paddingTop + chartH;
  const areaPathD = `${linePathD} L ${lastP.x},${bottomY} L ${firstP.x},${bottomY} Z`;

  const avgRate = Math.round(chartData.reduce((acc, curr) => acc + curr.rate, 0) / chartData.length);
  const peakDay = [...chartData].sort((a, b) => b.rate - a.rate)[0];

  return (
    <div className="nexus-card p-4 h-100 d-flex flex-column justify-content-between">
      {/* Header with Range Filter */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          <h6 className="fw-bold text-dark mb-0">{title}</h6>
          <p className="text-muted small mb-0">Daily employee attendance and check-in rates</p>
        </div>

        <div className="d-flex align-items-center gap-2">
          <select
            className="form-select form-select-sm"
            style={{ width: 130, fontSize: '0.8rem', borderRadius: 8 }}
            value={selectedRange}
            onChange={(e) => setSelectedRange(e.target.value)}
          >
            <option value="7d">Last 7 Days</option>
            <option value="14d">Last 14 Days</option>
            <option value="30d">This Month</option>
          </select>
        </div>
      </div>

      {/* SVG Canvas */}
      <div className="position-relative w-100 my-auto" style={{ minHeight: height - 60 }}>
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-100 h-auto"
          style={{ overflow: 'visible' }}
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            <linearGradient id="attendanceAreaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={lineColor} stopOpacity="0.32" />
              <stop offset="70%" stopColor={lineColor} stopOpacity="0.08" />
              <stop offset="100%" stopColor={lineColor} stopOpacity="0.00" />
            </linearGradient>

            <filter id="lineGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor={lineColor} floodOpacity="0.35" />
            </filter>
          </defs>

          {/* Grid lines */}
          {gridTicks.map((tick) => {
            const y = paddingTop + chartH - ((tick - minRate) / rateRange) * chartH;
            return (
              <g key={tick}>
                <line
                  x1={paddingLeft}
                  y1={y}
                  x2={svgWidth - paddingRight}
                  y2={y}
                  stroke="#e2e8f0"
                  strokeDasharray="4,4"
                  strokeWidth="1"
                />
                <text
                  x={paddingLeft - 8}
                  y={y + 4}
                  textAnchor="end"
                  fill="#94a3b8"
                  fontSize="10"
                  fontWeight="500"
                >
                  {tick}%
                </text>
              </g>
            );
          })}

          {/* Area Fill */}
          <path d={areaPathD} fill="url(#attendanceAreaGradient)" />

          {/* Smooth Stroke Line */}
          <path
            d={linePathD}
            fill="none"
            stroke={lineColor}
            strokeWidth="3.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            filter="url(#lineGlow)"
          />

          {/* Data Points and X labels */}
          {points.map((p, idx) => {
            const isHovered = hoveredIdx === idx;
            return (
              <g
                key={idx}
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
                style={{ cursor: 'pointer' }}
              >
                {/* Vertical hover guide */}
                {isHovered && (
                  <line
                    x1={p.x}
                    y1={paddingTop}
                    x2={p.x}
                    y2={bottomY}
                    stroke={lineColor}
                    strokeDasharray="2,2"
                    strokeWidth="1.2"
                    opacity="0.6"
                  />
                )}

                {/* Outer Glow Halo on Hover */}
                {isHovered && (
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r="12"
                    fill={lineColor}
                    opacity="0.2"
                  />
                )}

                {/* Vertex Circle Node */}
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={isHovered ? 6.5 : 4.5}
                  fill={isHovered ? '#ffffff' : lineColor}
                  stroke={isHovered ? lineColor : '#ffffff'}
                  strokeWidth="2.5"
                  style={{ transition: 'all 0.2s ease' }}
                />

                {/* X axis Day Label */}
                <text
                  x={p.x}
                  y={bottomY + 18}
                  textAnchor="middle"
                  fill={isHovered ? '#0f172a' : '#64748b'}
                  fontSize="11"
                  fontWeight={isHovered ? '700' : '500'}
                >
                  {p.day}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Floating Tooltip card */}
        {hoveredIdx !== null && points[hoveredIdx] && (
          <div
            className="position-absolute shadow-sm bg-white border rounded-3 p-2 small pointer-events-none"
            style={{
              top: 6,
              left: Math.min(Math.max((points[hoveredIdx].x / svgWidth) * 100 - 15, 5), 75) + '%',
              zIndex: 5,
              fontSize: '0.78rem',
              minWidth: 150,
              pointerEvents: 'none',
              animation: 'fadeIn 0.15s ease',
            }}
          >
            <div className="fw-bold text-dark">{points[hoveredIdx].day} Attendance</div>
            <div className="text-primary fw-bold fs-6">
              {points[hoveredIdx].rate}% Present
            </div>
            <div className="text-muted" style={{ fontSize: '0.72rem' }}>
              {points[hoveredIdx].present} of {totalHeadcount} staff checked in
            </div>
          </div>
        )}
      </div>

      {/* Footer Metrics */}
      <div className="d-flex flex-wrap justify-content-between align-items-center pt-2 mt-2 border-top small text-muted">
        <div>
          <span>Weekly Avg: </span>
          <strong className="text-primary">{avgRate}%</strong>
        </div>
        <div>
          <span>Peak Check-in: </span>
          <strong className="text-success">{peakDay?.day} ({peakDay?.rate}%)</strong>
        </div>
      </div>
    </div>
  );
};
