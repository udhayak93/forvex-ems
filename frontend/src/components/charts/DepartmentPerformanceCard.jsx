import React, { useState } from 'react';
import { Link } from 'react-router-dom';

export const DepartmentPerformanceCard = ({
  title = 'Department Performance',
  data = [
    { name: 'Engineering', percentage: 94, color: '#818cf8', staffCount: 14 },
    { name: 'Marketing', percentage: 82, color: '#34d399', staffCount: 8 },
    { name: 'Operations', percentage: 76, color: '#fbbf24', staffCount: 11 },
    { name: 'HR & Admin', percentage: 89, color: '#a78bfa', staffCount: 6 },
    { name: 'Sales', percentage: 64, color: '#f87171', staffCount: 9 },
    { name: 'Customer Success', percentage: 91, color: '#2dd4bf', staffCount: 7 },
  ],
}) => {
  const [hoveredIdx, setHoveredIdx] = useState(null);

  const items = data && data.length > 0 ? data : [];

  return (
    <div className="nexus-card p-4 h-100 d-flex flex-column justify-content-between">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          <h6 className="fw-bold text-dark mb-0">{title}</h6>
          <p className="text-muted small mb-0">Operational efficiency & task completion scores</p>
        </div>
        <Link
          to="/departments"
          className="small fw-semibold text-primary text-decoration-none hover-underline"
          style={{ fontSize: '0.8rem' }}
        >
          View All
        </Link>
      </div>

      {/* Progress Bars List */}
      <div className="d-flex flex-column gap-3 my-auto">
        {items.map((dept, idx) => {
          const isHovered = hoveredIdx === idx;
          return (
            <div
              key={idx}
              className={`p-2 rounded-3 transition-all ${isHovered ? 'bg-light' : 'bg-transparent'}`}
              style={{ cursor: 'default', transition: 'all 0.18s ease' }}
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
            >
              <div className="d-flex justify-content-between align-items-center mb-1">
                <span className={`small ${isHovered ? 'fw-bold text-dark' : 'fw-medium text-secondary'}`}>
                  {dept.name}
                </span>
                <span
                  className="small fw-bold"
                  style={{ color: dept.color, fontSize: '0.82rem' }}
                >
                  {dept.percentage}%
                </span>
              </div>

              {/* Rounded Bar Track */}
              <div
                className="progress"
                style={{
                  height: 7,
                  borderRadius: 10,
                  backgroundColor: '#f1f5f9',
                  overflow: 'hidden',
                }}
              >
                <div
                  className="progress-bar"
                  role="progressbar"
                  style={{
                    width: `${dept.percentage}%`,
                    backgroundColor: dept.color,
                    borderRadius: 10,
                    transition: 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
                  }}
                  aria-valuenow={dept.percentage}
                  aria-valuemin="0"
                  aria-valuemax="100"
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer Summary */}
      <div className="d-flex justify-content-between align-items-center pt-2 mt-2 border-top small text-muted">
        <span>Average Efficiency: <strong>82.7%</strong></span>
        <span className="text-success fw-semibold">Top: Engineering (94%)</span>
      </div>
    </div>
  );
};
