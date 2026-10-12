import React from 'react';
import { Sparkline } from '../charts/Sparkline';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export const StatCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  accent = '#4f46e5',
  trend,
  trendPositive = true,
  sparklineData,
  sparklineType = 'curve',
}) => {
  const isPositive = trend?.startsWith('+');
  const isNegative = trend?.startsWith('-');
  const isStatic = trend === 'Static' || trend === '0%';

  return (
    <div className="stat-card d-flex flex-column justify-content-between">
      {/* Top row: Icon on left, Trend badge on right */}
      <div className="d-flex justify-content-between align-items-center w-100 mb-2">
        <div
          className="stat-icon"
          style={{
            backgroundColor: `${accent}18`,
            color: accent,
            width: 40,
            height: 40,
            borderRadius: 10,
          }}
        >
          {Icon && <Icon size={20} />}
        </div>

        {trend && (
          <div
            className="d-flex align-items-center gap-1 px-2 py-1 rounded-pill"
            style={{
              fontSize: '0.72rem',
              fontWeight: 600,
              backgroundColor: isNegative
                ? '#fee2e2'
                : isPositive
                ? '#dcfce7'
                : '#f1f5f9',
              color: isNegative
                ? '#dc2626'
                : isPositive
                ? '#16a34a'
                : '#64748b',
            }}
          >
            {isPositive && <TrendingUp size={12} />}
            {isNegative && <TrendingDown size={12} />}
            {isStatic && <Minus size={12} />}
            <span>{trend}</span>
          </div>
        )}
      </div>

      {/* Middle row: Label and Main numeric Value */}
      <div className="w-100 my-1">
        <div className="stat-label text-truncate">{title}</div>
        <div className="stat-value">{value}</div>
      </div>

      {/* Bottom row: Sparkline or subtitle */}
      <div className="d-flex justify-content-between align-items-end w-100 mt-2">
        {subtitle && (
          <div
            className="text-muted text-truncate"
            style={{ fontSize: '0.74rem', maxWidth: sparklineData ? '55%' : '100%' }}
          >
            {subtitle}
          </div>
        )}

        {sparklineData && (
          <div className="ms-auto">
            <Sparkline
              data={sparklineData}
              color={accent}
              type={sparklineType}
              width={90}
              height={22}
            />
          </div>
        )}
      </div>
    </div>
  );
};
