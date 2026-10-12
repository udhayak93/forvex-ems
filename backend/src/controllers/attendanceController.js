const Attendance = require('../models/Attendance');
const Leave = require('../models/Leave');
const Employee = require('../models/Employee');
const AuditLog = require('../models/AuditLog');

// @desc    Get attendance records (filter by month & year, or employee)
// @route   GET /api/attendance
// @access  Private
const getAttendance = async (req, res, next) => {
  try {
    const { month, year, employeeId } = req.query;
    const query = {};

    if (month) query.month = Number(month);
    if (year) query.year = Number(year);

    // If Employee role, restrict to their own ID
    if (req.user.role === 'Employee') {
      if (!req.user.employeeId) {
        return res.json({ success: true, count: 0, data: [] });
      }
      query.employee = req.user.employeeId;
    } else if (employeeId) {
      query.employee = employeeId;
    }

    const records = await Attendance.find(query)
      .populate('employee', 'firstName lastName employeeCode department')
      .sort({ year: -1, month: -1 });

    res.json({ success: true, count: records.length, data: records });
  } catch (err) {
    next(err);
  }
};

// @desc    Upsert attendance record
// @route   POST /api/attendance
// @access  Private (Admin, HR, Payroll Manager)
const recordAttendance = async (req, res, next) => {
  try {
    const { employee, month, year, totalWorkingDays, presentDays, paidLeaveDays, unpaidLeaveDays, overtimeHours, notes } = req.body;

    if (!employee || !month || !year) {
      return res.status(400).json({ success: false, message: 'Employee, month, and year are required' });
    }

    const attendance = await Attendance.findOneAndUpdate(
      { employee, month: Number(month), year: Number(year) },
      {
        totalWorkingDays: Number(totalWorkingDays || 22),
        presentDays: Number(presentDays || 22),
        paidLeaveDays: Number(paidLeaveDays || 0),
        unpaidLeaveDays: Number(unpaidLeaveDays || 0),
        overtimeHours: Number(overtimeHours || 0),
        notes: notes || '',
      },
      { new: true, upsert: true, runValidators: true }
    ).populate('employee', 'firstName lastName employeeCode');

    res.status(200).json({ success: true, data: attendance });
  } catch (err) {
    next(err);
  }
};

// @desc    Get leave requests
// @route   GET /api/attendance/leaves
// @access  Private
const getLeaves = async (req, res, next) => {
  try {
    const query = {};

    // Restrict Employee to their own leaves
    if (req.user.role === 'Employee') {
      if (!req.user.employeeId) {
        return res.json({ success: true, count: 0, data: [] });
      }
      query.employee = req.user.employeeId;
    } else if (req.query.employeeId) {
      query.employee = req.query.employeeId;
    }

    if (req.query.status) {
      query.status = req.query.status;
    }

    const leaves = await Leave.find(query)
      .populate('employee', 'firstName lastName employeeCode department')
      .populate('reviewedBy', 'name role')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: leaves.length, data: leaves });
  } catch (err) {
    next(err);
  }
};

// @desc    Submit leave request
// @route   POST /api/attendance/leaves
// @access  Private
const applyLeave = async (req, res, next) => {
  try {
    let employeeId = req.body.employee;

    // If Employee role, force employee to be self
    if (req.user.role === 'Employee') {
      if (!req.user.employeeId) {
        return res.status(400).json({ success: false, message: 'No employee profile linked to your account' });
      }
      employeeId = req.user.employeeId;
    }

    const { leaveType, startDate, endDate, days, reason } = req.body;

    const leave = await Leave.create({
      employee: employeeId,
      leaveType: leaveType || 'Casual',
      startDate,
      endDate,
      days: Number(days || 1),
      reason,
      status: 'Pending',
    });

    const populated = await leave.populate('employee', 'firstName lastName employeeCode');
    res.status(201).json({ success: true, data: populated });
  } catch (err) {
    next(err);
  }
};

// @desc    Review (Approve/Reject) leave request
// @route   PATCH /api/attendance/leaves/:id/review
// @access  Private (Admin, HR)
const reviewLeave = async (req, res, next) => {
  try {
    const { status, reviewNotes } = req.body;
    if (!['Approved', 'Rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Status must be Approved or Rejected' });
    }

    const leave = await Leave.findById(req.params.id).populate('employee');
    if (!leave) {
      return res.status(404).json({ success: false, message: 'Leave request not found' });
    }

    leave.status = status;
    leave.reviewNotes = reviewNotes || '';
    leave.reviewedBy = req.user._id;
    await leave.save();

    // If approved and leaveType is Unpaid, update monthly attendance LOP days
    if (status === 'Approved' && leave.leaveType === 'Unpaid') {
      const leaveDate = new Date(leave.startDate);
      const month = leaveDate.getMonth() + 1;
      const year = leaveDate.getFullYear();

      await Attendance.findOneAndUpdate(
        { employee: leave.employee._id, month, year },
        {
          $inc: { unpaidLeaveDays: leave.days },
          $setOnInsert: { totalWorkingDays: 22, presentDays: 22 - leave.days },
        },
        { upsert: true }
      );
    }

    res.json({ success: true, data: leave });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAttendance,
  recordAttendance,
  getLeaves,
  applyLeave,
  reviewLeave,
};
