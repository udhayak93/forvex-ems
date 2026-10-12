import React, { useState, useEffect } from 'react';
import { departmentService } from '../../services/departmentService';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { Loader } from '../../components/common/Loader';
import { formatCurrency } from '../../utils/formatters';
import { Building2, Plus, Users, Briefcase } from 'lucide-react';

export const DepartmentList = () => {
  const { hasRole } = useAuth();
  const { success, error } = useNotification();

  const [departments, setDepartments] = useState([]);
  const [designations, setDesignations] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showDeptModal, setShowDeptModal] = useState(false);
  const [showDesigModal, setShowDesigModal] = useState(false);
  const [newDept, setNewDept] = useState({ name: '', code: '', description: '', headOfDepartment: '' });
  const [newDesig, setNewDesig] = useState({ title: '', department: '', level: 'Mid', minSalary: 4000, maxSalary: 8000 });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [deptRes, desigRes] = await Promise.all([
        departmentService.getDepartments(),
        departmentService.getDesignations(),
      ]);
      if (deptRes.success) setDepartments(deptRes.data);
      if (desigRes.success) setDesignations(desigRes.data);
    } catch (err) {
      error('Failed to load departments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateDept = async (e) => {
    e.preventDefault();
    try {
      await departmentService.createDepartment(newDept);
      success(`Department '${newDept.name}' created!`);
      setShowDeptModal(false);
      setNewDept({ name: '', code: '', description: '', headOfDepartment: '' });
      fetchData();
    } catch (err) {
      error(err.response?.data?.message || 'Error creating department');
    }
  };

  const handleCreateDesig = async (e) => {
    e.preventDefault();
    try {
      await departmentService.createDesignation(newDesig);
      success(`Designation '${newDesig.title}' created!`);
      setShowDesigModal(false);
      setNewDesig({ title: '', department: '', level: 'Mid', minSalary: 4000, maxSalary: 8000 });
      fetchData();
    } catch (err) {
      error(err.response?.data?.message || 'Error creating designation');
    }
  };

  if (loading) return <Loader message="Loading departments & roles..." />;

  return (
    <div className="container-fluid p-0">
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
        <div>
          <h3 className="fw-bold text-dark mb-1">Departments & Designations</h3>
          <p className="text-muted small mb-0">Organizational hierarchy, departments, and role salary tiers</p>
        </div>
        {hasRole('Admin', 'HR') && (
          <div className="d-flex align-items-center gap-2">
            <button className="btn btn-primary-nexus btn-sm" onClick={() => setShowDeptModal(true)}>
              <Plus size={16} /> Add Department
            </button>
            <button className="btn btn-outline-secondary btn-sm" onClick={() => setShowDesigModal(true)}>
              <Briefcase size={16} /> Add Designation
            </button>
          </div>
        )}
      </div>

      <div className="row g-4">
        {/* Departments List */}
        <div className="col-12 col-lg-6">
          <div className="nexus-card p-4">
            <h5 className="fw-bold text-dark mb-3 d-flex align-items-center gap-2">
              <Building2 size={20} className="text-primary" />
              <span>Departments ({departments.length})</span>
            </h5>

            <div className="d-flex flex-column gap-3">
              {departments.map((dept) => (
                <div key={dept._id} className="p-3 bg-light rounded border">
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <strong className="text-dark fs-6">{dept.name}</strong>
                    <span className="badge bg-primary-subtle text-primary fw-bold">
                      {dept.code}
                    </span>
                  </div>
                  <p className="text-muted small mb-2">{dept.description || 'No description'}</p>
                  <div className="d-flex justify-content-between text-secondary small pt-2 border-top">
                    <span>Head: <strong>{dept.headOfDepartment || 'Unassigned'}</strong></span>
                    <span>Staff: <strong className="text-primary">{dept.employeeCount || 0} members</strong></span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Designations List */}
        <div className="col-12 col-lg-6">
          <div className="nexus-card p-4">
            <h5 className="fw-bold text-dark mb-3 d-flex align-items-center gap-2">
              <Briefcase size={20} className="text-info" />
              <span>Job Designations & Salary Bands ({designations.length})</span>
            </h5>

            <div className="table-responsive">
              <table className="nexus-table">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Department</th>
                    <th>Level</th>
                    <th className="text-end">Salary Band</th>
                  </tr>
                </thead>
                <tbody>
                  {designations.map((desig) => (
                    <tr key={desig._id}>
                      <td className="fw-medium text-dark">{desig.title}</td>
                      <td>
                        <span className="badge bg-light text-secondary border">
                          {desig.department?.name || '—'}
                        </span>
                      </td>
                      <td>
                        <span className="badge bg-secondary-subtle text-secondary small">
                          {desig.level}
                        </span>
                      </td>
                      <td className="text-end small">
                        {formatCurrency(desig.minSalary)} - {formatCurrency(desig.maxSalary)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Add Department Modal */}
      {showDeptModal && (
        <div
          className="modal fade show d-block"
          tabIndex="-1"
          style={{ backgroundColor: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(4px)' }}
        >
          <div className="modal-dialog modal-md modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg" style={{ borderRadius: 16 }}>
              <div className="modal-header border-bottom py-3 px-4">
                <h5 className="modal-title fw-bold text-dark mb-0">Add Department</h5>
                <button type="button" className="btn-close" onClick={() => setShowDeptModal(false)} />
              </div>
              <form onSubmit={handleCreateDept}>
                <div className="modal-body p-4">
                  <div className="mb-3">
                    <label className="form-label small fw-bold">Department Name</label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      placeholder="e.g. Quality Assurance"
                      value={newDept.name}
                      onChange={(e) => setNewDept({ ...newDept, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label small fw-bold">Department Code</label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      placeholder="e.g. QA"
                      value={newDept.code}
                      onChange={(e) => setNewDept({ ...newDept, code: e.target.value.toUpperCase() })}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label small fw-bold">Head of Department</label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      placeholder="e.g. Jane Foster"
                      value={newDept.headOfDepartment}
                      onChange={(e) => setNewDept({ ...newDept, headOfDepartment: e.target.value })}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label small fw-bold">Description</label>
                    <textarea
                      className="form-control form-control-sm"
                      rows={2}
                      value={newDept.description}
                      onChange={(e) => setNewDept({ ...newDept, description: e.target.value })}
                    />
                  </div>
                </div>
                <div className="modal-footer py-2 px-4">
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowDeptModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary-nexus btn-sm">
                    Create Department
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Add Designation Modal */}
      {showDesigModal && (
        <div
          className="modal fade show d-block"
          tabIndex="-1"
          style={{ backgroundColor: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(4px)' }}
        >
          <div className="modal-dialog modal-md modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg" style={{ borderRadius: 16 }}>
              <div className="modal-header border-bottom py-3 px-4">
                <h5 className="modal-title fw-bold text-dark mb-0">Add Designation</h5>
                <button type="button" className="btn-close" onClick={() => setShowDesigModal(false)} />
              </div>
              <form onSubmit={handleCreateDesig}>
                <div className="modal-body p-4">
                  <div className="mb-3">
                    <label className="form-label small fw-bold">Designation Title</label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      placeholder="e.g. QA Automation Specialist"
                      value={newDesig.title}
                      onChange={(e) => setNewDesig({ ...newDesig, title: e.target.value })}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label small fw-bold">Department</label>
                    <select
                      className="form-select form-select-sm"
                      value={newDesig.department}
                      onChange={(e) => setNewDesig({ ...newDesig, department: e.target.value })}
                      required
                    >
                      <option value="">Select Department</option>
                      {departments.map((d) => (
                        <option key={d._id} value={d._id}>{d.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="row g-2 mb-3">
                    <div className="col-6">
                      <label className="form-label small fw-bold">Min Salary ($)</label>
                      <input
                        type="number"
                        className="form-control form-control-sm"
                        value={newDesig.minSalary}
                        onChange={(e) => setNewDesig({ ...newDesig, minSalary: Number(e.target.value) })}
                      />
                    </div>
                    <div className="col-6">
                      <label className="form-label small fw-bold">Max Salary ($)</label>
                      <input
                        type="number"
                        className="form-control form-control-sm"
                        value={newDesig.maxSalary}
                        onChange={(e) => setNewDesig({ ...newDesig, maxSalary: Number(e.target.value) })}
                      />
                    </div>
                  </div>
                </div>
                <div className="modal-footer py-2 px-4">
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowDesigModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary-nexus btn-sm">
                    Create Designation
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
