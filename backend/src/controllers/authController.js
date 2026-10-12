const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Employee = require('../models/Employee');
const Department = require('../models/Department');
const Designation = require('../models/Designation');
const AuditLog = require('../models/AuditLog');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'nexus_ems_super_secure_jwt_secret_key_2026_phase5', {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

// @desc    Register a new user account & create linked employee profile
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res, next) => {
  try {
    const { name, email, password, role = 'Employee', phone } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and password are required for registration.',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters in length.',
      });
    }

    const cleanEmail = email.toLowerCase().trim();
    const existingUser = await User.findOne({ email: cleanEmail });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email address already exists. Please sign in.',
      });
    }

    // Split name into first and last name
    const nameParts = name.trim().split(' ');
    const firstName = nameParts[0] || 'User';
    const lastName = nameParts.slice(1).join(' ') || 'Member';

    // Public registration is strictly restricted to Employee self-service accounts.
    // Privileged accounts (Admin, HR, Payroll Manager) cannot be created publicly and must be provisioned internally.
    const assignedRole = 'Employee';

    // Find default department & designation
    let department = await Department.findOne();
    if (!department) {
      department = await Department.create({ name: 'General', code: 'GEN', description: 'General Department' });
    }

    let designation = await Designation.findOne({ department: department._id });
    if (!designation) {
      designation = await Designation.create({
        title: 'Associate Specialist',
        department: department._id,
        level: 'Mid',
        minSalary: 45000,
        maxSalary: 95000,
      });
    }

    // Auto-generate employeeCode
    const count = await Employee.countDocuments();
    const employeeCode = `EMP-${String(1001 + count).padStart(4, '0')}`;

    // Create Employee record
    const employee = await Employee.create({
      employeeCode,
      firstName,
      lastName,
      email: cleanEmail,
      phone: phone || '',
      department: department._id,
      designation: designation._id,
      employmentType: 'Full-time',
      status: 'Active',
      bankDetails: {
        bankName: 'HDFC Bank Ltd.',
        accountNumber: '50100' + Math.floor(1000000 + Math.random() * 9000000),
        ifscCode: 'HDFC0001234',
        panNumber: 'ABC' + firstName.substring(0, 1).toUpperCase() + 'P' + Math.floor(1000 + Math.random() * 9000) + 'Z',
        uanNumber: '10' + Math.floor(1000000000 + Math.random() * 9000000000),
      },
      salaryStructure: {
        baseSalary: 10000,
        allowances: [
          { name: 'House Rent Allowance (HRA)', type: 'fixed', value: 2000 },
          { name: 'Travel Allowance', type: 'fixed', value: 1000 },
        ],
        deductions: [
          { name: 'Employee Provident Fund (EPF / PF)', type: 'fixed', value: 500 },
          { name: 'Professional Tax (PT)', type: 'fixed', value: 200 },
        ],
      },
    });

    // Create User record linked to employee
    const user = await User.create({
      name: name.trim(),
      email: cleanEmail,
      password,
      role: assignedRole, // Strictly 'Employee' for public registration
      employeeId: employee._id,
      isActive: true,
    });

    employee.user = user._id;
    await employee.save();

    await AuditLog.create({
      entityType: 'Auth',
      entityId: user._id.toString(),
      action: 'USER_REGISTERED',
      performedBy: user._id,
      performedByName: user.name,
      details: { role: user.role, email: user.email, employeeCode },
    });

    res.status(201).json({
      success: true,
      message: 'Account registered successfully! You can now sign in using your email and password.',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        employeeCode: employee.employeeCode,
      },
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password').populate('employeeId');

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials. If you are new, please Sign Up.' });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Account has been deactivated. Please contact HR.' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials. Please verify your password.' });
    }

    user.lastLogin = new Date();
    await user.save();

    const token = generateToken(user._id);

    // Audit log
    await AuditLog.create({
      entityType: 'Auth',
      entityId: user._id.toString(),
      action: 'LOGIN',
      performedBy: user._id,
      performedByName: user.name,
      details: { role: user.role, email: user.email },
    });

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        employeeId: user.employeeId ? user.employeeId._id : null,
        employeeDetails: user.employeeId || null,
      },
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id)
      .populate({
        path: 'employeeId',
        populate: ['department', 'designation'],
      });

    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        employeeId: user.employeeId ? user.employeeId._id : null,
        employeeDetails: user.employeeId || null,
      },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { register, login, getMe };
