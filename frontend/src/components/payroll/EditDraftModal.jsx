import React, { useState } from 'react';
import { payrollService } from '../../services/payrollService';
import { useNotification } from '../../context/NotificationContext';
import { Plus, Trash2, Edit3 } from 'lucide-react';

export const EditDraftModal = ({ record, onClose, onUpdated }) => {
  const [notes, setNotes] = useState(record.notes || '');
  const [bonuses, setBonuses] = useState([
    ...record.earnings
      .filter((e) => e.type === 'bonus')
      .map((b) => ({ name: b.name, amount: b.amount })),
  ]);
  const [deductions, setDeductions] = useState([
    ...record.deductions
      .filter((d) => d.type === 'custom_deduction')
      .map((d) => ({ name: d.name, amount: d.amount })),
  ]);
  const [loading, setLoading] = useState(false);

  const { success, error } = useNotification();

  const addBonusRow = () => {
    setBonuses([...bonuses, { name: 'Performance Bonus', amount: 500 }]);
  };

  const removeBonusRow = (index) => {
    setBonuses(bonuses.filter((_, i) => i !== index));
  };

  const updateBonus = (index, field, value) => {
    const updated = [...bonuses];
    updated[index][field] = field === 'amount' ? Number(value) : value;
    setBonuses(updated);
  };

  const addDeductionRow = () => {
    setDeductions([...deductions, { name: 'Loan Advance Recovery', amount: 200 }]);
  };

  const removeDeductionRow = (index) => {
    setDeductions(deductions.filter((_, i) => i !== index));
  };

  const updateDeduction = (index, field, value) => {
    const updated = [...deductions];
    updated[index][field] = field === 'amount' ? Number(value) : value;
    setDeductions(updated);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await payrollService.updatePayrollRecord(record._id, {
        customBonuses: bonuses,
        customDeductions: deductions,
        notes,
      });

      success('Payroll draft updated and recalculated successfully!');
      if (onUpdated) onUpdated();
      onClose();
    } catch (err) {
      error(`Failed to update draft: ${err.response?.data?.message || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="modal fade show d-block"
      tabIndex="-1"
      style={{ backgroundColor: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(4px)' }}
    >
      <div className="modal-dialog modal-md modal-dialog-centered">
        <div className="modal-content border-0 shadow-lg" style={{ borderRadius: 16 }}>
          <div className="modal-header border-bottom py-3 px-4">
            <h5 className="modal-title fw-bold text-dark mb-0 d-flex align-items-center gap-2">
              <Edit3 size={18} className="text-primary" />
              <span>Edit Draft Payroll ({record.payPeriod})</span>
            </h5>
            <button type="button" className="btn-close" onClick={onClose} />
          </div>

          <form onSubmit={handleSave}>
            <div className="modal-body p-4">
              <div className="mb-3 p-2 bg-light rounded border small">
                <strong>Employee:</strong> {record.employee?.firstName} {record.employee?.lastName} ({record.employee?.employeeCode})<br />
                <strong>Base Salary:</strong> ${record.basicSalary?.toLocaleString()}
              </div>

              {/* Custom Bonuses */}
              <div className="mb-4">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <label className="form-label small fw-bold text-secondary mb-0">Custom Bonuses / Additions</label>
                  <button type="button" className="btn btn-outline-primary btn-sm py-0 px-2" onClick={addBonusRow}>
                    <Plus size={14} /> Add Bonus
                  </button>
                </div>
                {bonuses.length === 0 ? (
                  <div className="text-muted small">No custom bonuses added.</div>
                ) : (
                  bonuses.map((b, i) => (
                    <div className="row g-2 mb-2 align-items-center" key={i}>
                      <div className="col-7">
                        <input
                          type="text"
                          className="form-control form-control-sm"
                          value={b.name}
                          onChange={(e) => updateBonus(i, 'name', e.target.value)}
                          placeholder="Bonus description"
                          required
                        />
                      </div>
                      <div className="col-4">
                        <input
                          type="number"
                          className="form-control form-control-sm"
                          value={b.amount}
                          onChange={(e) => updateBonus(i, 'amount', e.target.value)}
                          placeholder="Amount"
                          required
                        />
                      </div>
                      <div className="col-1 text-end">
                        <button
                          type="button"
                          className="btn btn-link text-danger p-0"
                          onClick={() => removeBonusRow(i)}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Custom Deductions */}
              <div className="mb-4">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <label className="form-label small fw-bold text-secondary mb-0">Custom Deductions</label>
                  <button type="button" className="btn btn-outline-primary btn-sm py-0 px-2" onClick={addDeductionRow}>
                    <Plus size={14} /> Add Deduction
                  </button>
                </div>
                {deductions.length === 0 ? (
                  <div className="text-muted small">No custom deductions added.</div>
                ) : (
                  deductions.map((d, i) => (
                    <div className="row g-2 mb-2 align-items-center" key={i}>
                      <div className="col-7">
                        <input
                          type="text"
                          className="form-control form-control-sm"
                          value={d.name}
                          onChange={(e) => updateDeduction(i, 'name', e.target.value)}
                          placeholder="Deduction reason"
                          required
                        />
                      </div>
                      <div className="col-4">
                        <input
                          type="number"
                          className="form-control form-control-sm"
                          value={d.amount}
                          onChange={(e) => updateDeduction(i, 'amount', e.target.value)}
                          placeholder="Amount"
                          required
                        />
                      </div>
                      <div className="col-1 text-end">
                        <button
                          type="button"
                          className="btn btn-link text-danger p-0"
                          onClick={() => removeDeductionRow(i)}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Remarks */}
              <div className="mb-3">
                <label className="form-label small fw-bold text-secondary">Notes / Remarks</label>
                <textarea
                  className="form-control form-control-sm"
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </div>

            <div className="modal-footer py-2 px-4">
              <button type="button" className="btn btn-secondary btn-sm" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary-nexus btn-sm" disabled={loading}>
                {loading ? 'Saving...' : 'Save & Recalculate'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
