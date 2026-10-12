const Department = require('../models/Department');
const Designation = require('../models/Designation');
const Employee = require('../models/Employee');
const AuditLog = require('../models/AuditLog');

// @desc    Get all departments with employee counts
// @route   GET /api/departments
// @access  Private
const getDepartments = async (req, res, next) => {
  try {
    const departments = await Department.find().sort({ name: 1 });
    
    // Aggregate employee count per department
    const employeeCounts = await Employee.aggregate([
      { $match: { status: { $ne: 'Inactive' } } },
      { $group: { _id: '$department', count: { $sum: 1 } } }
    ]);

    const countMap = {};
    employeeCounts.forEach(c => {
      countMap[c._id.toString()] = c.count;
    });

    const results = departments.map(dept => ({
      ...dept.toObject(),
      employeeCount: countMap[dept._id.toString()] || 0,
    }));

    res.json({ success: true, count: results.length, data: results });
  } catch (err) {
    next(err);
  }
};

// @desc    Create department
// @route   POST /api/departments
// @access  Admin, HR
const createDepartment = async (req, res, next) => {
  try {
    const department = await Department.create(req.body);

    await AuditLog.create({
      entityType: 'Department',
      entityId: department._id.toString(),
      action: 'CREATE_DEPARTMENT',
      performedBy: req.user._id,
      performedByName: req.user.name,
      details: department.toObject(),
    });

    res.status(201).json({ success: true, data: department });
  } catch (err) {
    next(err);
  }
};

// @desc    Update department
// @route   PUT /api/departments/:id
// @access  Admin, HR
const updateDepartment = async (req, res, next) => {
  try {
    const department = await Department.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!department) {
      return res.status(404).json({ success: false, message: 'Department not found' });
    }

    res.json({ success: true, data: department });
  } catch (err) {
    next(err);
  }
};

// @desc    Get designations (optionally filtered by department)
// @route   GET /api/departments/designations
// @access  Private
const getDesignations = async (req, res, next) => {
  try {
    const query = {};
    if (req.query.department) {
      query.department = req.query.department;
    }
    const designations = await Designation.find(query).populate('department', 'name code').sort({ title: 1 });
    res.json({ success: true, count: designations.length, data: designations });
  } catch (err) {
    next(err);
  }
};

// @desc    Create designation
// @route   POST /api/departments/designations
// @access  Admin, HR
const createDesignation = async (req, res, next) => {
  try {
    const designation = await Designation.create(req.body);
    const populated = await designation.populate('department', 'name code');
    res.status(201).json({ success: true, data: populated });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getDepartments,
  createDepartment,
  updateDepartment,
  getDesignations,
  createDesignation,
};
