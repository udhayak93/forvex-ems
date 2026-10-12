const Employee = require('../models/Employee');
const User = require('../models/User');
const Department = require('../models/Department');
const Designation = require('../models/Designation');
const AuditLog = require('../models/AuditLog');

// @desc    Get all employees with filtering & pagination
// @route   GET /api/employees
// @access  Private (Admin, HR, Payroll Manager)
const getEmployees = async (req, res, next) => {
  try {
    const { department, status, search, page = 1, limit = 50 } = req.query;
    const query = {};

    if (department) {
      query.department = department;
    }

    if (status) {
      query.status = status;
    }

    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { employeeCode: { $regex: search, $options: 'i' } },
      ];
    }

    const total = await Employee.countDocuments(query);
    const employees = await Employee.find(query)
      .populate('department', 'name code')
      .populate('designation', 'title level')
      .populate('user', 'role isActive')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({
      success: true,
      count: employees.length,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / limit) || 1,
      data: employees,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single employee
// @route   GET /api/employees/:id
// @access  Private
const getEmployeeById = async (req, res, next) => {
  try {
    // If Employee role, verify they can only view their own profile
    if (req.user.role === 'Employee') {
      if (!req.user.employeeId || req.user.employeeId.toString() !== req.params.id) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: Employees can only view their own profile.',
        });
      }
    }

    const employee = await Employee.findById(req.params.id)
      .populate('department')
      .populate('designation')
      .populate('user', 'email role isActive');

    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    res.json({ success: true, data: employee });
  } catch (err) {
    next(err);
  }
};

// @desc    Create new employee
// @route   POST /api/employees
// @access  Private (Admin, HR)
const createEmployee = async (req, res, next) => {
  try {
    const {
      firstName,
      lastName,
      email,
      phone,
      department,
      designation,
      employmentType,
      dateOfJoining,
      dateOfBirth,
      bankDetails,
      emergencyContact,
      salaryStructure,
      createUserAccount,
      accountRole = 'Employee',
      initialPassword = 'Password@123',
    } = req.body;

    // Check existing email
    const existingEmp = await Employee.findOne({ email: email.toLowerCase() });
    if (existingEmp) {
      return res.status(400).json({ success: false, message: 'An employee with this email already exists.' });
    }

    // Auto-generate employeeCode if not passed
    let employeeCode = req.body.employeeCode;
    if (!employeeCode) {
      const count = await Employee.countDocuments();
      employeeCode = `EMP-${String(1001 + count).padStart(4, '0')}`;
    }

    // Default salary structure if not provided
    const finalSalary = salaryStructure || {
      baseSalary: 5000,
      allowances: [
        { name: 'House Rent Allowance (HRA)', type: 'percentage', value: 20 },
        { name: 'Medical Allowance', type: 'fixed', value: 250 },
        { name: 'Conveyance Allowance', type: 'fixed', value: 150 },
      ],
      deductions: [
        { name: 'Provident Fund (PF)', type: 'percentage', value: 5 },
        { name: 'Health Insurance', type: 'fixed', value: 100 },
      ],
    };

    const employee = new Employee({
      employeeCode,
      firstName,
      lastName,
      email: email.toLowerCase(),
      phone,
      department,
      designation,
      employmentType: employmentType || 'Full-time',
      dateOfJoining: dateOfJoining || new Date(),
      dateOfBirth,
      bankDetails: bankDetails || {},
      emergencyContact: emergencyContact || {},
      salaryStructure: finalSalary,
      status: 'Active',
    });

    await employee.save();

    // Create user login account if requested
    if (createUserAccount) {
      const existingUser = await User.findOne({ email: email.toLowerCase() });
      if (!existingUser) {
        const newUser = await User.create({
          name: `${firstName} ${lastName}`,
          email: email.toLowerCase(),
          password: initialPassword,
          role: accountRole,
          employeeId: employee._id,
        });
        employee.user = newUser._id;
        await employee.save();
      }
    }

    const populated = await Employee.findById(employee._id)
      .populate('department', 'name code')
      .populate('designation', 'title level')
      .populate('user', 'role isActive');

    await AuditLog.create({
      entityType: 'Employee',
      entityId: employee._id.toString(),
      action: 'CREATE_EMPLOYEE',
      performedBy: req.user._id,
      performedByName: req.user.name,
      details: { code: employee.employeeCode, email: employee.email, name: `${firstName} ${lastName}` },
    });

    res.status(201).json({ success: true, data: populated });
  } catch (err) {
    next(err);
  }
};

// @desc    Update employee
// @route   PUT /api/employees/:id
// @access  Private (Admin, HR)
const updateEmployee = async (req, res, next) => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    const updated = await Employee.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    })
      .populate('department', 'name code')
      .populate('designation', 'title level')
      .populate('user', 'role isActive');

    await AuditLog.create({
      entityType: 'Employee',
      entityId: employee._id.toString(),
      action: 'UPDATE_EMPLOYEE',
      performedBy: req.user._id,
      performedByName: req.user.name,
      details: { updatedFields: Object.keys(req.body) },
    });

    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
};

// @desc    Deactivate / activate employee status
// @route   PATCH /api/employees/:id/status
// @access  Private (Admin, HR)
const toggleEmployeeStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!['Active', 'Inactive', 'On Leave'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status value' });
    }

    const employee = await Employee.findById(req.params.id);
    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    const oldStatus = employee.status;
    employee.status = status;
    await employee.save();

    // If deactivated, deactivate linked user login account too
    if (employee.user) {
      await User.findByIdAndUpdate(employee.user, { isActive: status === 'Active' });
    }

    await AuditLog.create({
      entityType: 'Employee',
      entityId: employee._id.toString(),
      action: 'STATUS_CHANGE',
      performedBy: req.user._id,
      performedByName: req.user.name,
      details: { from: oldStatus, to: status, employeeCode: employee.employeeCode },
    });

    res.json({ success: true, data: employee, message: `Status updated to ${status}` });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  toggleEmployeeStatus,
};
