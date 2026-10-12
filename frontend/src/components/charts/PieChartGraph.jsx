import React, { useState } from 'react';
import { formatCurrency } from '../../utils/formatters';

const DEFAULT_COLORS = [
  '#00b8a9', // Forvex Teal
  '#6366f1', // Indigo
  '#06b6d4', // Cyan
  '#f59e0b', // Amber
  '#ec4899', // Pink
  '#8b5cf6', // Purple
  '#10b981', // Emerald
  '#f97316', // Orange
];

export const PieChartGraph = ({
  title = 'Payroll Allocation by Department',
  subtitle = 'Percentage distribution of disbursed funds',
  data = [],
  currency = '₹',
  donut = true,
  centerLabel = 'Total Outlay',
}) => {
  const [hoveredIdx, setHoveredIdx] = useState(null);

  if (!data || data.length === 0) {
    return (
      <div className="nexus-card p-4 h-100 d-flex flex-column justify-content-center align-items-center text-center">
        <h6 className="fw-bold text-dark mb-1">{title}</h6>
        <p className="text-muted small mb-3">{subtitle}</p>
        <div className="py-4 text-muted small">No distribution data available for current period.</div>
      </div>
    );
  }

  // Normalize data items
  const chartItems = data
    .filter((d) => (d.totalAmount || d.value || d.count || 0) > 0)
    .map((d, i) => {
      const val = Number(d.totalAmount || d.value || d.count || 0);
      const label = d._id || d.label || `Item ${i + 1}`;
      const color = d.color || DEFAULT_COLORS[i % DEFAULT_COLORS.length];
      const count = d.employeeCount || d.count || 0;
      return {
        label,
        value: val,
        color,
        count,
        raw: d,
      };
    });

  const totalValue = chartItems.reduce((acc, curr) => acc + curr.value, 0);

  // SVG Geometry
  const svgWidth = 440;
  const svgHeight = 280;
  const cx = 135;
  const cy = 140;
  const outerR = 95;
  const innerR = donut ? 60 : 0;

  // Calculate arc slices
  let cumulativeAngle = -Math.PI / 2; // Start from top (12 o'clock)
  const slices = chartItems.map((item, idx) => {
    const fraction = totalValue > 0 ? item.value / totalValue : 0;
    const angle = fraction * 2 * Math.PI;
    const startAngle = cumulativeAngle;
    const endAngle = cumulativeAngle + angle;
    cumulativeAngle = endAngle;

    // Helper to get coordinates
    const getCoords = (r, a) => [cx + r * Math.cos(a), cy + r * Math.sin(a)];

    const [x1, y1] = getCoords(outerR, startAngle);
    const [x2, y2] = getCoords(outerR, endAngle);
    const [x3, y3] = getCoords(innerR, endAngle);
    const [x4, y4] = getCoords(innerR, startAngle);

    const largeArc = angle > Math.PI ? 1 : 0;

    let pathData = '';
    if (fraction >= 0.999) {
      // Full circle donut
      pathData = `
        M ${cx} ${cy - outerR}
        A ${outerR} ${outerR} 0 1 0 ${cx} ${cy + outerR}
        A ${outerR} ${outerR} 0 1 0 ${cx} ${cy - outerR}
        M ${cx} ${cy - innerR}
        A ${innerR} ${innerR} 0 1 1 ${cx} ${cy + innerR}
        A ${innerR} ${innerR} 0 1 1 ${cx} ${cy - innerR}
        Z
      `;
    } else {
      pathData = `
        M ${x1} ${y1}
        A ${outerR} ${outerR} 0 ${largeArc} 1 ${x2} ${y2}
        L ${x3} ${y3}
        A ${innerR} ${innerR} 0 ${largeArc} 0 ${x4} ${y4}
        Z
      `;
    }

    return {
      ...item,
      percentage: Math.round(fraction * 1000) / 10,
      pathData,
      idx,
    };
  });

  const activeItem = hoveredIdx !== null ? slices[hoveredIdx] : null;

  return (
    <div className="nexus-card p-4 h-100 d-flex flex-column justify-content-between">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-2">
        <div>
          <h6 className="fw-bold text-dark mb-0">{title}</h6>
          <p className="text-muted small mb-0">{subtitle}</p>
        </div>
        <span className="badge bg-light text-secondary border small">Live Share</span>
      </div>

      {/* SVG & Legend Flex Container */}
      <div className="row g-2 align-items-center my-auto">
        {/* SVG Donut / Pie */}
        <div className="col-12 col-sm-6 text-center position-relative">
          <svg
            viewBox={`0 0 270 280`}
            className="w-100 h-auto"
            style={{ maxHeight: 240, overflow: 'visible' }}
            preserveAspectRatio="xMidYMid meet"
          >
            <defs>
              <filter id="pieShadow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.15" />
              </filter>
            </defs>

            {/* Slices */}
            {slices.map((slice) => {
              const isHovered = hoveredIdx === slice.idx;
              return (
                <path
                  key={slice.idx}
                  d={slice.pathData}
                  fill={slice.color}
                  stroke="#ffffff"
                  strokeWidth="2.5"
                  filter={isHovered ? 'url(#pieShadow)' : 'none'}
                  opacity={hoveredIdx !== null && !isHovered ? 0.4 : 1}
                  style={{
                    cursor: 'pointer',
                    transition: 'all 0.22s ease',
                    transform: isHovered ? `scale(1.03)` : 'none',
                    transformOrigin: `${cx}px ${cy}px`,
                  }}
                  onMouseEnter={() => setHoveredIdx(slice.idx)}
                  onMouseLeave={() => setHoveredIdx(null)}
                />
              );
            })}

            {/* Center Label Hub */}
            {donut && (
              <g pointerEvents="none">
                <circle cx={cx} cy={cy} r={innerR - 2} fill="#ffffff" />
                <text
                  x={cx}
                  y={cy - 8}
                  textAnchor="middle"
                  fill="#64748b"
                  fontSize="9.5"
                  fontWeight="600"
                  style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}
                >
                  {activeItem ? activeItem.label.substring(0, 11) : centerLabel}
                </text>
                <text
                  x={cx}
                  y={cy + 13}
                  textAnchor="middle"
                  fill="#0f172a"
                  fontSize={activeItem ? '12.5' : '14'}
                  fontWeight="700"
                >
                  {activeItem
                    ? `${activeItem.percentage}%`
                    : formatCurrency(totalValue, currency)}
                </text>
                {activeItem && (
                  <text
                    x={cx}
                    y={cy + 26}
                    textAnchor="middle"
                    fill="#475569"
                    fontSize="9"
                    fontWeight="500"
                  >
                    {formatCurrency(activeItem.value, currency)}
                  </text>
                )}
              </g>
            )}
          </svg>
        </div>

        {/* Legend List */}
        <div className="col-12 col-sm-6">
          <div className="d-flex flex-column gap-2" style={{ maxHeight: 220, overflowY: 'auto' }}>
            {slices.map((slice) => {
              const isHovered = hoveredIdx === slice.idx;
              return (
                <div
                  key={slice.idx}
                  className={`p-2 rounded-2 transition-all d-flex align-items-center justify-content-between ${
                    isHovered ? 'bg-light border' : 'bg-transparent'
                  }`}
                  style={{
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={() => setHoveredIdx(slice.idx)}
                  onMouseLeave={() => setHoveredIdx(null)}
                >
                  <div className="d-flex align-items-center gap-2 text-truncate me-2">
                    <span
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: 3,
                        backgroundColor: slice.color,
                        flexShrink: 0,
                      }}
                    />
                    <span
                      className={`small text-truncate ${isHovered ? 'fw-bold text-dark' : 'text-secondary'}`}
                      style={{ fontSize: '0.8rem' }}
                      title={slice.label}
                    >
                      {slice.label}
                    </span>
                  </div>

                  <div className="d-flex align-items-center gap-2 flex-shrink-0">
                    <span className="small fw-semibold text-dark" style={{ fontSize: '0.78rem' }}>
                      {formatCurrency(slice.value, currency)}
                    </span>
                    <span
                      className="badge rounded-pill"
                      style={{
                        backgroundColor: `${slice.color}15`,
                        color: slice.color,
                        fontSize: '0.7rem',
                        fontWeight: 600,
                      }}
                    >
                      {slice.percentage}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Summary Footer */}
      <div className="d-flex justify-content-between align-items-center pt-2 mt-2 border-top small text-muted">
        <span>Units: {slices.length} Categories</span>
        <span>
          Total:{' '}
          <strong className="text-dark">
            {formatCurrency(totalValue, currency)}
          </strong>
        </span>
      </div>
    </div>
  );
};
