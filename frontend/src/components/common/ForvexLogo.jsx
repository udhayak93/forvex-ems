import React from 'react';

export const ForvexIcon = ({ size = 32, color = '#ffffff', className = '' }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ display: 'inline-block', verticalAlign: 'middle' }}
    >
      {/* Outer 7 / Chevron */}
      <path
        d="M28 20 H86 L36 84"
        stroke={color}
        strokeWidth="9"
        strokeLinecap="square"
        strokeLinejoin="miter"
      />
      {/* Inner Stem & Crossbar ┌ */}
      <path
        d="M28 66 V38 H58"
        stroke={color}
        strokeWidth="9"
        strokeLinecap="square"
        strokeLinejoin="miter"
      />
    </svg>
  );
};

export const ForvexLogo = ({
  iconSize = 32,
  textSize = '1.4rem',
  variant = 'white', // 'white' | 'dark' | 'teal'
  showSubtitle = false,
  className = '',
}) => {
  const iconColor = variant === 'teal' ? '#00b8a9' : variant === 'dark' ? '#0f172a' : '#ffffff';
  const textColor = variant === 'dark' ? '#0f172a' : '#ffffff';
  const subColor = variant === 'dark' ? '#64748b' : '#a0ded9';

  return (
    <div className={`d-inline-flex align-items-center gap-2 ${className}`}>
      <div
        className="d-flex align-items-center justify-content-center flex-shrink-0"
        style={{
          width: iconSize + 12,
          height: iconSize + 12,
          borderRadius: 12,
          background: variant === 'teal' 
            ? 'rgba(0, 184, 169, 0.12)' 
            : 'linear-gradient(135deg, #00b8a9 0%, #007a70 100%)',
          boxShadow: '0 6px 18px rgba(0, 184, 169, 0.3)',
          border: '1px solid rgba(255, 255, 255, 0.15)',
        }}
      >
        <ForvexIcon size={iconSize} color={variant === 'teal' ? '#00b8a9' : '#ffffff'} />
      </div>
      <div className="d-flex flex-column text-start">
        <span
          className="fw-bold lh-1"
          style={{
            color: textColor,
            fontSize: textSize,
            letterSpacing: '-0.03em',
            fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
          }}
        >
          Forvex
        </span>
        {showSubtitle && (
          <span
            className="fw-medium text-uppercase mt-1"
            style={{
              color: subColor,
              fontSize: '0.65rem',
              letterSpacing: '0.08em',
            }}
          >
            HR & Payroll EMS
          </span>
        )}
      </div>
    </div>
  );
};

export default ForvexLogo;
