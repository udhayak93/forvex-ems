import React, { useState, useEffect } from 'react';
import { employeeService } from '../../services/employeeService';
import { departmentService } from '../../services/departmentService';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Loader } from '../../components/common/Loader';
import { formatCurrency, formatDate } from '../../utils/formatters';
import {
  Users,
  UserPlus,
  Search,
  Filter,
  Eye,
  Edit2,
  Power,
  Building2,
  Mail,
  Phone,
  CreditCard,
  X,
} from 'lucide-react';

export const EmployeeList = () => {
  const { hasRole } = useAuth();
  const { success, error } = useNotification();

  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [designations, setDesignations] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modals
  const [viewEmployee, setViewEmployee] = useState(null);
  const [editEmployee, setEditEmployee] = useState(null);
  const [isNew, setIsNew] = useState(false);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const res = await employeeService.getEmployees({
        search: search || undefined,
        department: departmentFilter || undefined,
        status: statusFilter || undefined,
      });
      if (res.success) setEmployees(res.data);
    } catch (err) {
      error('Failed to load employees');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    Promise.all([
      departmentService.getDepartments(),
      departmentService.getDesignations(),
    ]).then(([deptRes, desigRes]) => {
      if (deptRes.success) setDepartments(deptRes.data);
      if (desigRes.success) setDesignations(desigRes.data);
    }).catch(console.error);
  }, []);

  useEffect(() => {
    fetchEmployees();
  }, [departmentFilter, statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchEmployees();
  };

  const handleToggleStatus = async (emp) => {
    const nextStatus = emp.status === 'Active' ? 'Inactive' : 'Active';
    try {
      await employeeService.toggleStatus(emp._id, nextStatus);
      success(`Updated status of ${emp.fullName} to ${nextStatus}`);
      fetchEmployees();
    } catch (err) {
      error(`Failed to update status: ${err.message}`);
    }
  };

  const handleSaveEmployee = async (formData) => {
    try {
      if (isNew) {
        await employeeService.createEmployee(formData);
        success('Employee created successfully!');
      } else {
        await employeeService.updateEmployee(editEmployee._id, formData);
        success('Employee updated successfully!');
      }
      setEditEmployee(null);
      setIsNew(false);
      fetchEmployees();
    } catch (err) {
      error(err.response?.data?.message || 'Error saving employee');
    }
  };

  return (
    <div className="container-fluid p-0">
      {/* Page Header */}
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
        <div>
          <h3 className="fw-bold text-dark mb-1">Workforce Management</h3>
          <p className="text-muted small mb-0">View Indian employee profiles, PAN, IFSC codes, UAN, and salary structures</p>
        </div>
        {hasRole('Admin', 'HR') && (
          <button
            className="btn btn-primary-nexus btn-sm"
            onClick={() => {
              setIsNew(true);
              setEditEmployee({
                firstName: '',
                lastName: '',
                email: '',
                phone: '',
                department: departments[0]?._id || '',
                designation: designations[0]?._id || '',
                employmentType: 'Full-time',
                bankDetails: { bankName: 'HDFC Bank Ltd.', accountNumber: '', ifscCode: '', panNumber: '', uanNumber: '' },
                salaryStructure: {
                  baseSalary: 60000,
                  allowances: [
                    { name: 'House Rent Allowance (HRA)', type: 'percentage', value: 40 },
                    { name: 'Special Allowance', type: 'percentage', value: 15 },
                    { name: 'Conveyance Allowance', type: 'fixed', value: 1600 },
                  ],
                  deductions: [
                    { name: 'Employee Provident Fund (EPF / PF)', type: 'percentage', value: 12 },
                    { name: 'Professional Tax (PT)', type: 'fixed', value: 200 },
                  ],
                },
                createUserAccount: true,
                accountRole: 'Employee',
              });
            }}
          >
            <UserPlus size={16} /> Add Employee
          </button>
        )}
      </div>

      {/* Filter Bar */}
      <div className="nexus-card p-3 mb-4">
        <form onSubmit={handleSearchSubmit} className="row g-2 align-items-center">
          <div className="col-12 col-md-5">
            <div className="input-group input-group-sm">
              <span className="input-group-text bg-light border-end-0">
                <Search size={14} className="text-muted" />
              </span>
              <input
                type="text"
                className="form-control border-start-0"
                placeholder="Search by name, employee code or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="col-12 col-md-3">
            <select
              className="form-select form-select-sm"
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
            >
              <option value="">All Departments</option>
              {departments.map((d) => (
                <option key={d._id} value={d._id}>
                  {d.name} ({d.code})
                </option>
              ))}
            </select>
          </div>

          <div className="col-6 col-md-2">
            <select
              className="form-select form-select-sm"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="Active">Active</option>
              <option value="On Leave">On Leave</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>

          <div className="col-6 col-md-2 text-end">
            <button type="submit" className="btn btn-outline-primary btn-sm w-100">
              Apply Filter
            </button>
          </div>
        </form>
      </div>

      {/* Employees Table */}
      <div className="nexus-table-container">
        {loading ? (
          <Loader message="Loading employee directory..." />
        ) : employees.length === 0 ? (
          <div className="text-muted text-center py-5">
            No employees found matching the filter criteria.
          </div>
        ) : (
          <div className="table-responsive">
            <table className="nexus-table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Employee</th>
                  <th>Department & Role</th>
                  <th>PAN & Bank</th>
                  <th>Base Pay (₹)</th>
                  <th>Status</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {employees.map((emp) => (
                  <tr key={emp._id}>
                    <td>
                      <span className="badge bg-light text-dark fw-bold border">
                        {emp.employeeCode}
                      </span>
                    </td>
                    <td>
                      <div className="d-flex align-items-center gap-2">
                        <div
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: '50%',
                            background: '#e0e7ff',
                            color: '#4338ca',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 700,
                            fontSize: '0.8rem',
                          }}
                        >
                          {emp.firstName.charAt(0)}{emp.lastName.charAt(0)}
                        </div>
                        <div>
                          <div className="fw-semibold text-dark">{emp.fullName}</div>
                          <div className="small text-muted">{emp.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div>
                        <span className="fw-medium text-dark">{emp.designation?.title || '—'}</span>
                        <span className="small text-muted d-block">{emp.department?.name || '—'}</span>
                      </div>
                    </td>
                    <td>
                      <div className="small">
                        <span className="fw-bold text-dark">{emp.bankDetails?.panNumber || '—'}</span>
                        <span className="text-muted d-block">{emp.bankDetails?.bankName || '—'}</span>
                      </div>
                    </td>
                    <td>
                      <span className="fw-semibold text-dark">
                        {formatCurrency(emp.salaryStructure?.baseSalary || 0)}
                      </span>
                      <span className="small text-muted d-block">
                        +{emp.salaryStructure?.allowances?.length || 0} allowances
                      </span>
                    </td>
                    <td>
                      <StatusBadge status={emp.status} />
                    </td>
                    <td className="text-end">
                      <div className="btn-group btn-group-sm">
                        <button
                          className="btn btn-outline-secondary"
                          title="View Profile Details"
                          onClick={() => setViewEmployee(emp)}
                        >
                          <Eye size={14} />
                        </button>
                        {hasRole('Admin', 'HR') && (
                          <>
                            <button
                              className="btn btn-outline-primary"
                              title="Edit Employee"
                              onClick={() => {
                                setIsNew(false);
                                setEditEmployee(emp);
                              }}
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              className={`btn ${emp.status === 'Active' ? 'btn-outline-danger' : 'btn-outline-success'}`}
                              title={emp.status === 'Active' ? 'Deactivate' : 'Activate'}
                              onClick={() => handleToggleStatus(emp)}
                            >
                              <Power size={14} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* View Profile Modal */}
      {viewEmployee && (
        <div
          className="modal fade show d-block"
          tabIndex="-1"
          style={{ backgroundColor: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(4px)' }}
        >
          <div className="modal-dialog modal-md modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg" style={{ borderRadius: 16 }}>
              <div className="modal-header border-bottom py-3 px-4">
                <h5 className="modal-title fw-bold text-dark mb-0">Employee Profile (India)</h5>
                <button type="button" className="btn-close" onClick={() => setViewEmployee(null)} />
              </div>
              <div className="modal-body p-4">
                <div className="text-center mb-4">
                  <div
                    style={{
                      width: 56,
                      height: 56,
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #4f46e5, #06b6d4)',
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 800,
                      fontSize: '1.4rem',
                      margin: '0 auto 0.75rem',
                    }}
                  >
                    {viewEmployee.firstName.charAt(0)}{viewEmployee.lastName.charAt(0)}
                  </div>
                  <h5 className="fw-bold text-dark mb-0">{viewEmployee.fullName}</h5>
                  <span className="badge bg-light text-primary border">{viewEmployee.employeeCode}</span>
                  <div className="mt-1">
                    <StatusBadge status={viewEmployee.status} />
                  </div>
                </div>

                <div className="p-3 bg-light rounded border mb-3 small">
                  <div className="row g-2">
                    <div className="col-6">
                      <span className="text-muted d-block">Department:</span>
                      <strong>{viewEmployee.department?.name || '—'}</strong>
                    </div>
                    <div className="col-6">
                      <span className="text-muted d-block">Designation:</span>
                      <strong>{viewEmployee.designation?.title || '—'}</strong>
                    </div>
                    <div className="col-6">
                      <span className="text-muted d-block">Email:</span>
                      <span>{viewEmployee.email}</span>
                    </div>
                    <div className="col-6">
                      <span className="text-muted d-block">Phone:</span>
                      <span>{viewEmployee.phone || '—'}</span>
                    </div>
                    <div className="col-6">
                      <span className="text-muted d-block">Joined:</span>
                      <span>{formatDate(viewEmployee.dateOfJoining)}</span>
                    </div>
                    <div className="col-6">
                      <span className="text-muted d-block">Employment Type:</span>
                      <span>{viewEmployee.employmentType}</span>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-light rounded border small">
                  <h6 className="fw-bold mb-2">Banking & Statutory Compliance (India)</h6>
                  <div className="row g-2">
                    <div className="col-6">
                      <span className="text-muted d-block">Bank Name:</span>
                      <strong>{viewEmployee.bankDetails?.bankName || 'HDFC Bank Ltd.'}</strong>
                    </div>
                    <div className="col-6">
                      <span className="text-muted d-block">Account Number:</span>
                      <span>{viewEmployee.bankDetails?.accountNumber || '—'}</span>
                    </div>
                    <div className="col-6">
                      <span className="text-muted d-block">IFSC Code:</span>
                      <strong className="text-primary">{viewEmployee.bankDetails?.ifscCode || 'HDFC0001234'}</strong>
                    </div>
                    <div className="col-6">
                      <span className="text-muted d-block">PAN Number:</span>
                      <strong className="text-dark">{viewEmployee.bankDetails?.panNumber || '—'}</strong>
                    </div>
                    <div className="col-6">
                      <span className="text-muted d-block">UAN (EPFO):</span>
                      <span>{viewEmployee.bankDetails?.uanNumber || '—'}</span>
                    </div>
                    <div className="col-6">
                      <span className="text-muted d-block">Monthly Basic Pay:</span>
                      <strong className="text-success">{formatCurrency(viewEmployee.salaryStructure?.baseSalary || 0)}</strong>
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer py-2 px-4">
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setViewEmployee(null)}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Employee Modal */}
      {editEmployee && (
        <EmployeeFormModal
          initialData={editEmployee}
          departments={departments}
          designations={designations}
          isNew={isNew}
          onClose={() => setEditEmployee(null)}
          onSave={handleSaveEmployee}
        />
      )}
    </div>
  );
};

// Form modal for Add / Edit
const EmployeeFormModal = ({ initialData, departments, designations, isNew, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    ...initialData,
    department: typeof initialData?.department === 'object' ? initialData.department?._id : (initialData?.department || ''),
    designation: typeof initialData?.designation === 'object' ? initialData.designation?._id : (initialData?.designation || ''),
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.firstName?.trim() || !formData.lastName?.trim() || !formData.email?.trim()) {
      alert('Please fill in First Name, Last Name, and Email Address.');
      return;
    }
    setIsSubmitting(true);
    try {
      await onSave(formData);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="modal fade show d-block"
      tabIndex="-1"
      style={{ backgroundColor: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(4px)' }}
    >
      <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
        <div className="modal-content border-0 shadow-lg" style={{ borderRadius: 16 }}>
          <div className="modal-header border-bottom py-3 px-4">
            <h5 className="modal-title fw-bold text-dark mb-0">
              {isNew ? 'Create New Employee (India)' : 'Edit Employee Profile'}
            </h5>
            <button type="button" className="btn-close" onClick={onClose} />
          </div>

          <form onSubmit={handleSubmit}>
            <div className="modal-body p-4">
              <h6 className="fw-bold text-secondary mb-3">1. Personal Information</h6>
              <div className="row g-3 mb-3">
                <div className="col-md-6">
                  <label className="form-label small fw-bold">First Name</label>
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    required
                    value={formData.firstName || ''}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label small fw-bold">Last Name</label>
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    required
                    value={formData.lastName || ''}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label small fw-bold">Email Address</label>
                  <input
                    type="email"
                    className="form-control form-control-sm"
                    required
                    value={formData.email || ''}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label small fw-bold">Phone Number (+91)</label>
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    value={formData.phone || ''}
                    placeholder="+91 98451 23456"
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
              </div>

              <h6 className="fw-bold text-secondary mb-3">2. Department & Designation</h6>
              <div className="row g-3 mb-3">
                <div className="col-md-6">
                  <label className="form-label small fw-bold">Department</label>
                  <select
                    className="form-select form-select-sm"
                    value={formData.department || ''}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    required
                  >
                    <option value="">Select Department</option>
                    {departments.map((d) => (
                      <option key={d._id} value={d._id}>{d.name} ({d.code})</option>
                    ))}
                  </select>
                </div>
                <div className="col-md-6">
                  <label className="form-label small fw-bold">Designation</label>
                  <select
                    className="form-select form-select-sm"
                    value={formData.designation || ''}
                    onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                    required
                  >
                    <option value="">Select Designation</option>
                    {designations.map((d) => (
                      <option key={d._id} value={d._id}>{d.title} ({d.level})</option>
                    ))}
                  </select>
                </div>
              </div>

              <h6 className="fw-bold text-secondary mb-3">3. Salary Structure (INR)</h6>
              <div className="row g-3 mb-3">
                <div className="col-md-6">
                  <label className="form-label small fw-bold">Base Monthly Salary (₹)</label>
                  <input
                    type="number"
                    className="form-control form-control-sm"
                    required
                    value={formData.salaryStructure?.baseSalary || 0}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        salaryStructure: {
                          ...formData.salaryStructure,
                          baseSalary: Number(e.target.value),
                        },
                      })
                    }
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label small fw-bold">Employment Type</label>
                  <select
                    className="form-select form-select-sm"
                    value={formData.employmentType || 'Full-time'}
                    onChange={(e) => setFormData({ ...formData, employmentType: e.target.value })}
                  >
                    <option value="Full-time">Full-time</option>
                    <option value="Part-time">Part-time</option>
                    <option value="Contract">Contract</option>
                  </select>
                </div>
              </div>

              <h6 className="fw-bold text-secondary mb-3">4. Indian Banking & Statutory Details</h6>
              <div className="row g-3 mb-3">
                <div className="col-md-6">
                  <label className="form-label small fw-bold">Bank Name</label>
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    placeholder="e.g. HDFC Bank, ICICI Bank, SBI"
                    value={formData.bankDetails?.bankName || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        bankDetails: { ...formData.bankDetails, bankName: e.target.value },
                      })
                    }
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label small fw-bold">Account Number</label>
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    value={formData.bankDetails?.accountNumber || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        bankDetails: { ...formData.bankDetails, accountNumber: e.target.value },
                      })
                    }
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label small fw-bold">IFSC Code</label>
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    placeholder="e.g. HDFC0001234"
                    value={formData.bankDetails?.ifscCode || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        bankDetails: { ...formData.bankDetails, ifscCode: e.target.value.toUpperCase() },
                      })
                    }
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label small fw-bold">PAN Number</label>
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    placeholder="e.g. ABCPS1234E"
                    value={formData.bankDetails?.panNumber || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        bankDetails: { ...formData.bankDetails, panNumber: e.target.value.toUpperCase() },
                      })
                    }
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label small fw-bold">UAN (EPFO)</label>
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    placeholder="e.g. 101234567890"
                    value={formData.bankDetails?.uanNumber || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        bankDetails: { ...formData.bankDetails, uanNumber: e.target.value },
                      })
                    }
                  />
                </div>
              </div>
            </div>

            <div className="modal-footer py-2 px-4">
              <button type="button" className="btn btn-secondary btn-sm" onClick={onClose} disabled={isSubmitting}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary-nexus btn-sm" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : 'Save Employee'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
