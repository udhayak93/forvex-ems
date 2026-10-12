import React from 'react';
import { getStatusBadgeClass } from '../../utils/formatters';

export const StatusBadge = ({ status }) => {
  if (!status) return null;
  const badgeClass = getStatusBadgeClass(status);
  const displayLabel = status === 'Under Review' ? 'In Review' : status;

  return (
    <span
      className={`badge-status ${badgeClass}`}
      style={{
        whiteSpace: 'nowrap',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '5px',
        padding: '3px 10px',
        fontSize: '0.74rem',
        fontWeight: 600,
        borderRadius: '9999px',
        lineHeight: 1.2,
      }}
    >
      <span
        style={{
          width: '6px',
          height: '6px',
          borderRadius: '50%',
          backgroundColor: 'currentColor',
          display: 'inline-block',
          flexShrink: 0,
        }}
      />
      <span>{displayLabel}</span>
    </span>
  );
};
