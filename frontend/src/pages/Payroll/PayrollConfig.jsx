import React, { useState, useEffect } from 'react';
import { payrollService } from '../../services/payrollService';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { Loader } from '../../components/common/Loader';
import { Sliders, Plus, Trash2, Save, Building, DollarSign } from 'lucide-react';

export const PayrollConfig = () => {
  const { hasRole } = useAuth();
  const { success, error } = useNotification();

  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    payrollService.getConfig().then((res) => {
      if (res.success) setConfig(res.data);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await payrollService.updateConfig(config);
      if (res.success) {
        success('Payroll rules & configuration saved successfully!');
        setConfig(res.data);
      }
    } catch (err) {
      error(err.response?.data?.message || 'Error updating payroll configuration');
    } finally {
      setSaving(false);
    }
  };

  // Tax Slab Row Manipulations
  const addTaxRule = () => {
    setConfig({
      ...config,
      taxRules: [
        ...config.taxRules,
        { deductionName: 'Income Tax', minSalary: 0, maxSalary: null, ratePercent: 10 },
      ],
    });
  };

  const removeTaxRule = (index) => {
    setConfig({
      ...config,
      taxRules: config.taxRules.filter((_, i) => i !== index),
    });
  };

  const updateTaxRule = (index, field, value) => {
    const updated = [...config.taxRules];
    updated[index][field] = field === 'deductionName' ? value : value === '' ? null : Number(value);
    setConfig({ ...config, taxRules: updated });
  };

  // Allowance Row Manipulations
  const addAllowance = () => {
    setConfig({
      ...config,
      defaultAllowances: [
        ...config.defaultAllowances,
        { name: 'New Allowance', type: 'percentage', value: 10, isTaxable: true },
      ],
    });
  };

  const removeAllowance = (index) => {
    setConfig({
      ...config,
      defaultAllowances: config.defaultAllowances.filter((_, i) => i !== index),
    });
  };

  const updateAllowance = (index, field, value) => {
    const updated = [...config.defaultAllowances];
    updated[index][field] = field === 'value' ? Number(value) : value;
    setConfig({ ...config, defaultAllowances: updated });
  };

  // Deduction Row Manipulations
  const addDeduction = () => {
    setConfig({
      ...config,
      defaultDeductions: [
        ...config.defaultDeductions,
        { name: 'New Deduction', type: 'fixed', value: 50, isTaxable: false },
      ],
    });
  };

  const removeDeduction = (index) => {
    setConfig({
      ...config,
      defaultDeductions: config.defaultDeductions.filter((_, i) => i !== index),
    });
  };

  const updateDeduction = (index, field, value) => {
    const updated = [...config.defaultDeductions];
    updated[index][field] = field === 'value' ? Number(value) : value;
    setConfig({ ...config, defaultDeductions: updated });
  };

  if (loading) return <Loader message="Loading payroll configuration engine..." />;

  return (
    <div className="container-fluid p-0">
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
        <div>
          <h3 className="fw-bold text-dark mb-1">Payroll Configuration & Rules</h3>
          <p className="text-muted small mb-0">Phase 5: Configurable tax slabs, currency settings, and allowance/deduction templates</p>
        </div>
        {hasRole('Admin', 'Payroll Manager') && (
          <button
            type="button"
            className="btn btn-primary-nexus btn-sm"
            onClick={handleSave}
            disabled={saving}
          >
            <Save size={16} /> {saving ? 'Saving Changes...' : 'Save Configuration'}
          </button>
        )}
      </div>

      <form onSubmit={handleSave}>
        <div className="row g-4">
          {/* Company & Currency Settings */}
          <div className="col-lg-6">
            <div className="nexus-card p-4 h-100">
              <h5 className="fw-bold text-dark mb-3 d-flex align-items-center gap-2">
                <Building size={20} className="text-primary" />
                <span>Company Branding & Payslip Details</span>
              </h5>

              <div className="mb-3">
                <label className="form-label small fw-bold">Company Legal Name</label>
                <input
                  type="text"
                  className="form-control form-control-sm"
                  value={config.companyName || ''}
                  onChange={(e) => setConfig({ ...config, companyName: e.target.value })}
                  required
                />
              </div>

              <div className="mb-3">
                <label className="form-label small fw-bold">Company Address</label>
                <input
                  type="text"
                  className="form-control form-control-sm"
                  value={config.companyAddress || ''}
                  onChange={(e) => setConfig({ ...config, companyAddress: e.target.value })}
                />
              </div>

              <div className="row g-2 mb-3">
                <div className="col-6">
                  <label className="form-label small fw-bold">Payroll Support Email</label>
                  <input
                    type="email"
                    className="form-control form-control-sm"
                    value={config.companyEmail || ''}
                    onChange={(e) => setConfig({ ...config, companyEmail: e.target.value })}
                  />
                </div>
                <div className="col-6">
                  <label className="form-label small fw-bold">Support Phone</label>
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    value={config.companyPhone || ''}
                    onChange={(e) => setConfig({ ...config, companyPhone: e.target.value })}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Currency & Monthly Standard Rules */}
          <div className="col-lg-6">
            <div className="nexus-card p-4 h-100">
              <h5 className="fw-bold text-dark mb-3 d-flex align-items-center gap-2">
                <DollarSign size={20} className="text-success" />
                <span>Currency & Working Days Rules</span>
              </h5>

              <div className="row g-2 mb-3">
                <div className="col-4">
                  <label className="form-label small fw-bold">Currency Code</label>
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    value={config.currency?.code || 'USD'}
                    onChange={(e) =>
                      setConfig({ ...config, currency: { ...config.currency, code: e.target.value.toUpperCase() } })
                    }
                    placeholder="e.g. USD, EUR, INR"
                    required
                  />
                </div>
                <div className="col-4">
                  <label className="form-label small fw-bold">Currency Symbol</label>
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    value={config.currency?.symbol || '$'}
                    onChange={(e) =>
                      setConfig({ ...config, currency: { ...config.currency, symbol: e.target.value } })
                    }
                    placeholder="e.g. $, €, ₹"
                    required
                  />
                </div>
                <div className="col-4">
                  <label className="form-label small fw-bold">Currency Name</label>
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    value={config.currency?.name || 'US Dollars'}
                    onChange={(e) =>
                      setConfig({ ...config, currency: { ...config.currency, name: e.target.value } })
                    }
                  />
                </div>
              </div>

              <div className="row g-2 mb-3">
                <div className="col-6">
                  <label className="form-label small fw-bold">Standard Workdays / Month</label>
                  <input
                    type="number"
                    className="form-control form-control-sm"
                    value={config.standardWorkingDaysPerMonth || 22}
                    onChange={(e) =>
                      setConfig({ ...config, standardWorkingDaysPerMonth: Number(e.target.value) })
                    }
                    required
                  />
                  <span className="text-muted small">Basis for Loss of Pay (LOP) calculations</span>
                </div>
                <div className="col-6">
                  <label className="form-label small fw-bold">Overtime Hourly Multiplier</label>
                  <input
                    type="number"
                    step="0.1"
                    className="form-control form-control-sm"
                    value={config.overtimeHourlyRateMultiplier || 1.5}
                    onChange={(e) =>
                      setConfig({ ...config, overtimeHourlyRateMultiplier: Number(e.target.value) })
                    }
                    required
                  />
                  <span className="text-muted small">Standard 1.5x regular wage rate</span>
                </div>
              </div>
            </div>
          </div>

          {/* Configurable Tax Slabs */}
          <div className="col-12">
            <div className="nexus-card p-4">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <div>
                  <h5 className="fw-bold text-dark mb-0">Configurable Income Tax Slabs</h5>
                  <p className="text-muted small mb-0">No hardcoded rates. Progressive deduction brackets applied to gross salary</p>
                </div>
                <button type="button" className="btn btn-outline-primary btn-sm" onClick={addTaxRule}>
                  <Plus size={14} /> Add Tax Slab
                </button>
              </div>

              <div className="table-responsive">
                <table className="nexus-table">
                  <thead>
                    <tr>
                      <th>Deduction Name</th>
                      <th>Min Gross Salary</th>
                      <th>Max Gross Salary</th>
                      <th>Tax Rate (%)</th>
                      <th className="text-end">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {config.taxRules?.map((rule, idx) => (
                      <tr key={idx}>
                        <td>
                          <input
                            type="text"
                            className="form-control form-control-sm"
                            value={rule.deductionName || ''}
                            onChange={(e) => updateTaxRule(idx, 'deductionName', e.target.value)}
                            required
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            className="form-control form-control-sm"
                            value={rule.minSalary}
                            onChange={(e) => updateTaxRule(idx, 'minSalary', e.target.value)}
                            required
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            className="form-control form-control-sm"
                            value={rule.maxSalary !== null ? rule.maxSalary : ''}
                            placeholder="No upper limit (Infinity)"
                            onChange={(e) => updateTaxRule(idx, 'maxSalary', e.target.value)}
                          />
                        </td>
                        <td>
                          <div className="input-group input-group-sm">
                            <input
                              type="number"
                              className="form-control"
                              value={rule.ratePercent}
                              onChange={(e) => updateTaxRule(idx, 'ratePercent', e.target.value)}
                              required
                            />
                            <span className="input-group-text">%</span>
                          </div>
                        </td>
                        <td className="text-end">
                          <button
                            type="button"
                            className="btn btn-outline-danger btn-sm"
                            onClick={() => removeTaxRule(idx)}
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Default Allowances & Deductions Templates */}
          <div className="col-lg-6">
            <div className="nexus-card p-4">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h6 className="fw-bold text-dark mb-0">Default Allowance Components</h6>
                <button type="button" className="btn btn-outline-primary btn-sm py-0 px-2" onClick={addAllowance}>
                  <Plus size={14} /> Add
                </button>
              </div>
              {config.defaultAllowances?.map((a, idx) => (
                <div className="row g-2 align-items-center mb-2" key={idx}>
                  <div className="col-5">
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      value={a.name}
                      onChange={(e) => updateAllowance(idx, 'name', e.target.value)}
                      required
                    />
                  </div>
                  <div className="col-3">
                    <select
                      className="form-select form-select-sm"
                      value={a.type}
                      onChange={(e) => updateAllowance(idx, 'type', e.target.value)}
                    >
                      <option value="percentage">% of Base</option>
                      <option value="fixed">Fixed ($)</option>
                    </select>
                  </div>
                  <div className="col-3">
                    <input
                      type="number"
                      className="form-control form-control-sm"
                      value={a.value}
                      onChange={(e) => updateAllowance(idx, 'value', e.target.value)}
                      required
                    />
                  </div>
                  <div className="col-1 text-end">
                    <button
                      type="button"
                      className="btn btn-link text-danger p-0"
                      onClick={() => removeAllowance(idx)}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="col-lg-6">
            <div className="nexus-card p-4">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h6 className="fw-bold text-dark mb-0">Default Deduction Components</h6>
                <button type="button" className="btn btn-outline-primary btn-sm py-0 px-2" onClick={addDeduction}>
                  <Plus size={14} /> Add
                </button>
              </div>
              {config.defaultDeductions?.map((d, idx) => (
                <div className="row g-2 align-items-center mb-2" key={idx}>
                  <div className="col-5">
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      value={d.name}
                      onChange={(e) => updateDeduction(idx, 'name', e.target.value)}
                      required
                    />
                  </div>
                  <div className="col-3">
                    <select
                      className="form-select form-select-sm"
                      value={d.type}
                      onChange={(e) => updateDeduction(idx, 'type', e.target.value)}
                    >
                      <option value="percentage">% of Base</option>
                      <option value="fixed">Fixed ($)</option>
                    </select>
                  </div>
                  <div className="col-3">
                    <input
                      type="number"
                      className="form-control form-control-sm"
                      value={d.value}
                      onChange={(e) => updateDeduction(idx, 'value', e.target.value)}
                      required
                    />
                  </div>
                  <div className="col-1 text-end">
                    <button
                      type="button"
                      className="btn btn-link text-danger p-0"
                      onClick={() => removeDeduction(idx)}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};
