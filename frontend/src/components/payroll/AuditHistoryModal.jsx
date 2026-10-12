import React from 'react';
import { formatDate } from '../../utils/formatters';
import { History, Shield, Check, Clock } from 'lucide-react';

export const AuditHistoryModal = ({ record, onClose }) => {
  if (!record) return null;

  const trails = record.auditTrail || [];

  return (
    <div
      className="modal fade show d-block"
      tabIndex="-1"
      style={{ backgroundColor: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(4px)' }}
    >
      <div className="modal-dialog modal-md modal-dialog-centered modal-dialog-scrollable">
        <div className="modal-content border-0 shadow-lg" style={{ borderRadius: 16 }}>
          <div className="modal-header border-bottom py-3 px-4">
            <h5 className="modal-title fw-bold text-dark mb-0 d-flex align-items-center gap-2">
              <History size={18} className="text-primary" />
              <span>Audit Trail: {record.payPeriod}</span>
            </h5>
            <button type="button" className="btn-close" onClick={onClose} />
          </div>

          <div className="modal-body p-4">
            <div className="d-flex align-items-center justify-content-between p-2 mb-3 bg-light rounded border">
              <div>
                <strong className="d-block">{record.employee?.firstName} {record.employee?.lastName}</strong>
                <span className="small text-muted">{record.employee?.employeeCode}</span>
              </div>
              <div className="text-end">
                <span className="badge bg-primary text-uppercase">{record.status}</span>
              </div>
            </div>

            {trails.length === 0 ? (
              <p className="text-muted text-center py-3">No audit history entries recorded.</p>
            ) : (
              <div className="position-relative ps-4 border-start border-2 ms-2">
                {trails.map((entry, idx) => (
                  <div className="mb-4 position-relative" key={idx}>
                    {/* Timeline bullet */}
                    <div
                      style={{
                        position: 'absolute',
                        left: -24,
                        top: 2,
                        width: 14,
                        height: 14,
                        borderRadius: '50%',
                        backgroundColor: '#4f46e5',
                        border: '3px solid #ffffff',
                        boxShadow: '0 0 0 2px #c7d2fe',
                      }}
                    />

                    <div>
                      <div className="d-flex align-items-center gap-2">
                        <strong className="text-dark small" style={{ letterSpacing: '0.02em' }}>
                          {entry.action}
                        </strong>
                        <span className="badge bg-secondary-subtle text-secondary small">
                          {entry.toStatus || 'Draft'}
                        </span>
                      </div>
                      <div className="small text-muted mt-1 d-flex align-items-center gap-1">
                        <Clock size={12} />
                        <span>{new Date(entry.timestamp).toLocaleString()}</span>
                        <span>•</span>
                        <span className="fw-semibold text-dark">{entry.changedByName || 'System'}</span>
                      </div>
                      {entry.notes && (
                        <div
                          className="p-2 rounded mt-2 bg-light border small text-secondary"
                          style={{ fontStyle: 'italic' }}
                        >
                          "{entry.notes}"
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="modal-footer py-2 px-4">
            <button type="button" className="btn btn-secondary btn-sm" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
