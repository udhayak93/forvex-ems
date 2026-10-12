import React, { useState } from 'react';
import { formatCurrency } from '../../utils/formatters';

export const BarChartGraph = ({
  title = 'Payroll Outlay by Department',
  subtitle = 'Expenditure and allocation comparison',
  data = [],
  currency = '₹',
  height = 280,
  showToggle = true,
}) => {
  const [metricMode, setMetricMode] = useState('net'); // 'net' | 'gross' | 'employees'
  const [hoveredIdx, setHoveredIdx] = useState(null);

  if (!data || data.length === 0) {
    return (
      <div className="nexus-card p-4 h-100 d-flex flex-column justify-content-center align-items-center text-center">
        <h6 className="fw-bold text-dark mb-1">{title}</h6>
        <p className="text-muted small mb-3">{subtitle}</p>
        <div className="py-4 text-muted small">No chart data available for current period.</div>
      </div>
    );
  }

  // Extract values based on metricMode
  const chartItems = data.map((item) => {
    const label = item._id || item.label || 'Unknown';
    let val = 0;
    if (metricMode === 'net') val = Number(item.totalAmount || item.net || item.value || 0);
    else if (metricMode === 'gross') val = Number(item.totalGross || item.gross || item.value || 0);
    else if (metricMode === 'employees') val = Number(item.employeeCount || item.count || item.value || 0);

    const secondaryVal = Number(item.totalDeductions || item.deductions || 0);
    const empCount = Number(item.employeeCount || item.count || 0);

    return {
      label,
      value: val,
      secondaryVal,
      empCount,
      raw: item,
    };
  });

  const totalValue = chartItems.reduce((acc, curr) => acc + curr.value, 0);
  const maxVal = Math.max(...chartItems.map((d) => d.value), 1);

  // SVG dimensions
  const svgWidth = 620;
  const svgHeight = height;
  const paddingLeft = 65;
  const paddingRight = 20;
  const paddingTop = 25;
  const paddingBottom = 45;

  const chartW = svgWidth - paddingLeft - paddingRight;
  const chartH = svgHeight - paddingTop - paddingBottom;

  // Nice tick values for Y axis
  const tickCount = 4;
  const yTicks = Array.from({ length: tickCount + 1 }, (_, i) => {
    const val = (maxVal / tickCount) * i;
    return Math.round(val);
  });

  const barCount = chartItems.length;
  const barSlotWidth = chartW / Math.max(barCount, 1);
  const barWidth = Math.min(Math.max(barSlotWidth * 0.52, 22), 48);

  const formatTick = (val) => {
    if (metricMode === 'employees') return `${val}`;
    if (val >= 10000000) return `${currency}${(val / 10000000).toFixed(1)}Cr`;
    if (val >= 100000) return `${currency}${(val / 100000).toFixed(1)}L`;
    if (val >= 1000) return `${currency}${(val / 1000).toFixed(0)}k`;
    return `${currency}${val}`;
  };

  return (
    <div className="nexus-card p-4 h-100 d-flex flex-column justify-content-between">
      {/* Header & Mode Switcher */}
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
        <div>
          <h6 className="fw-bold text-dark mb-0 d-flex align-items-center gap-2">
            <span>{title}</span>
          </h6>
          <p className="text-muted small mb-0">{subtitle}</p>
        </div>

        {showToggle && (
          <div className="btn-group btn-group-sm bg-light p-1 rounded-3 border">
            <button
              type="button"
              className={`btn btn-sm py-1 px-2 ${metricMode === 'net' ? 'btn-primary fw-semibold' : 'btn-light text-muted'}`}
              style={{ fontSize: '0.75rem', borderRadius: 6 }}
              onClick={() => setMetricMode('net')}
            >
              Net Disbursed
            </button>
            <button
              type="button"
              className={`btn btn-sm py-1 px-2 ${metricMode === 'gross' ? 'btn-primary fw-semibold' : 'btn-light text-muted'}`}
              style={{ fontSize: '0.75rem', borderRadius: 6 }}
              onClick={() => setMetricMode('gross')}
            >
              Gross Outlay
            </button>
            <button
              type="button"
              className={`btn btn-sm py-1 px-2 ${metricMode === 'employees' ? 'btn-primary fw-semibold' : 'btn-light text-muted'}`}
              style={{ fontSize: '0.75rem', borderRadius: 6 }}
              onClick={() => setMetricMode('employees')}
            >
              Headcount
            </button>
          </div>
        )}
      </div>

      {/* Responsive SVG Chart */}
      <div className="position-relative w-100" style={{ minHeight: height }}>
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-100 h-auto"
          style={{ overflow: 'visible' }}
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            <linearGradient id="barTealGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#00b8a9" />
              <stop offset="100%" stopColor="#045d56" />
            </linearGradient>
            <linearGradient id="barIndigoGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#6366f1" />
              <stop offset="100%" stopColor="#4338ca" />
            </linearGradient>
            <linearGradient id="barAmberGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#fbbf24" />
              <stop offset="100%" stopColor="#d97706" />
            </linearGradient>
            <filter id="barShadow" x="-10%" y="-10%" width="120%" height="120%">
              <feDropShadow dx="0" dy="2" stdDeviation="2" floodOpacity="0.12" />
            </filter>
          </defs>

          {/* Grid lines and Y axis ticks */}
          {yTicks.map((tick, i) => {
            const y = paddingTop + chartH - (tick / maxVal) * chartH;
            return (
              <g key={i}>
                <line
                  x1={paddingLeft}
                  y1={y}
                  x2={svgWidth - paddingRight}
                  y2={y}
                  stroke="#e2e8f0"
                  strokeDasharray={i === 0 ? 'none' : '3,3'}
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
                  {formatTick(tick)}
                </text>
              </g>
            );
          })}

          {/* Bars */}
          {chartItems.map((item, idx) => {
            const x = paddingLeft + idx * barSlotWidth + (barSlotWidth - barWidth) / 2;
            const barH = Math.max((item.value / maxVal) * chartH, 4);
            const y = paddingTop + chartH - barH;
            const isHovered = hoveredIdx === idx;
            const pctOfTotal = totalValue > 0 ? Math.round((item.value / totalValue) * 100) : 0;

            const gradientUrl =
              metricMode === 'employees'
                ? 'url(#barAmberGradient)'
                : idx % 2 === 0
                ? 'url(#barTealGradient)'
                : 'url(#barIndigoGradient)';

            return (
              <g
                key={idx}
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
                style={{ cursor: 'pointer' }}
              >
                {/* Bar Rectangle */}
                <rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={barH}
                  rx="6"
                  ry="6"
                  fill={gradientUrl}
                  filter="url(#barShadow)"
                  opacity={hoveredIdx !== null && !isHovered ? 0.45 : 1}
                  style={{
                    transition: 'all 0.22s ease',
                    transform: isHovered ? `scaleY(1.02)` : 'none',
                    transformOrigin: `center ${paddingTop + chartH}px`,
                  }}
                />

                {/* Value on top of bar on hover */}
                {isHovered && (
                  <text
                    x={x + barWidth / 2}
                    y={Math.max(y - 8, 14)}
                    textAnchor="middle"
                    fill="#0f172a"
                    fontSize="11"
                    fontWeight="700"
                  >
                    {metricMode === 'employees' ? `${item.value} staff` : formatCurrency(item.value, currency)}
                  </text>
                )}

                {/* X axis Label */}
                <text
                  x={x + barWidth / 2}
                  y={paddingTop + chartH + 18}
                  textAnchor="middle"
                  fill={isHovered ? '#0f172a' : '#64748b'}
                  fontSize="11"
                  fontWeight={isHovered ? '700' : '500'}
                >
                  {item.label.length > 12 ? `${item.label.substring(0, 10)}…` : item.label}
                </text>
                <text
                  x={x + barWidth / 2}
                  y={paddingTop + chartH + 31}
                  textAnchor="middle"
                  fill="#94a3b8"
                  fontSize="9.5"
                  fontWeight="500"
                >
                  {pctOfTotal}%
                </text>
              </g>
            );
          })}
        </svg>

        {/* Hover details floating badge */}
        {hoveredIdx !== null && chartItems[hoveredIdx] && (
          <div
            className="position-absolute shadow-sm bg-white border rounded-3 p-2 small pointer-events-none"
            style={{
              top: 6,
              right: 12,
              zIndex: 5,
              fontSize: '0.78rem',
              minWidth: 160,
              pointerEvents: 'none',
            }}
          >
            <div className="fw-bold text-dark">{chartItems[hoveredIdx].label}</div>
            <div className="text-primary fw-semibold">
              {metricMode === 'employees'
                ? `${chartItems[hoveredIdx].value} Employees`
                : `${metricMode === 'net' ? 'Net: ' : 'Gross: '}${formatCurrency(chartItems[hoveredIdx].value, currency)}`}
            </div>
            {chartItems[hoveredIdx].empCount > 0 && metricMode !== 'employees' && (
              <div className="text-muted" style={{ fontSize: '0.72rem' }}>
                Headcount: {chartItems[hoveredIdx].empCount} staff
              </div>
            )}
            {chartItems[hoveredIdx].secondaryVal > 0 && metricMode !== 'employees' && (
              <div className="text-danger" style={{ fontSize: '0.72rem' }}>
                Deductions: -{formatCurrency(chartItems[hoveredIdx].secondaryVal, currency)}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Legend & Summary Row */}
      <div className="d-flex flex-wrap justify-content-between align-items-center pt-2 mt-2 border-top">
        <div className="d-flex align-items-center gap-3">
          <div className="d-flex align-items-center gap-1 small text-muted">
            <span style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: '#00b8a9' }} />
            <span>Primary Units</span>
          </div>
          <div className="d-flex align-items-center gap-1 small text-muted">
            <span style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: '#6366f1' }} />
            <span>Secondary Units</span>
          </div>
        </div>
        <div className="small fw-semibold text-secondary">
          Total: <strong className="text-dark">{metricMode === 'employees' ? `${totalValue} staff` : formatCurrency(totalValue, currency)}</strong>
        </div>
      </div>
    </div>
  );
};
