const PayrollRecord = require('../models/PayrollRecord');
const Employee = require('../models/Employee');
const Attendance = require('../models/Attendance');
const PayrollConfig = require('../models/PayrollConfig');
const AuditLog = require('../models/AuditLog');
const { calculatePayroll } = require('../utils/payrollCalculator');

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

// @desc    Preview calculation for an employee without saving
// @route   POST /api/payroll/preview
// @access  Private (Admin, Payroll Manager)
const previewCalculation = async (req, res, next) => {
  try {
    const { employeeId, month, year, customBonuses = [], customDeductions = [] } = req.body;

    if (!employeeId || !month || !year) {
      return res.status(400).json({ success: false, message: 'employeeId, month, and year are required' });
    }

    const employee = await Employee.findById(employeeId).populate('department designation');
    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    const config = (await PayrollConfig.findOne()) || {};
    const attendance = (await Attendance.findOne({ employee: employeeId, month: Number(month), year: Number(year) })) || {
      totalWorkingDays: config.standardWorkingDaysPerMonth || 22,
      presentDays: config.standardWorkingDaysPerMonth || 22,
      unpaidLeaveDays: 0,
      overtimeHours: 0,
    };

    const calculated = calculatePayroll({
      employee,
      attendance,
      config,
      customBonuses,
      customDeductions,
    });

    res.json({
      success: true,
      data: {
        employee: {
          id: employee._id,
          employeeCode: employee.employeeCode,
          name: employee.fullName,
          department: employee.department?.name,
          designation: employee.designation?.title,
          bankDetails: employee.bankDetails,
        },
        payPeriod: `${MONTH_NAMES[Number(month) - 1]} ${year}`,
        ...calculated,
      },
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Process / Generate monthly payroll (single or batch)
// @route   POST /api/payroll/process
// @access  Private (Admin, Payroll Manager)
const processPayroll = async (req, res, next) => {
  try {
    const { month, year, department, employeeIds, notes } = req.body;

    if (!month || !year) {
      return res.status(400).json({ success: false, message: 'Month (1-12) and Year are required' });
    }

    const m = Number(month);
    const y = Number(year);
    if (m < 1 || m > 12) {
      return res.status(400).json({ success: false, message: 'Month must be between 1 and 12' });
    }

    const payPeriod = `${MONTH_NAMES[m - 1]} ${y}`;
    const config = (await PayrollConfig.findOne()) || {};

    // Build employee filter
    const empQuery = { status: 'Active' };
    if (department) empQuery.department = department;
    if (employeeIds && Array.isArray(employeeIds) && employeeIds.length > 0) {
      empQuery._id = { $in: employeeIds };
    }

    const employees = await Employee.find(empQuery).populate('department designation');

    if (employees.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No active employees found matching the specified criteria.',
      });
    }

    const createdRecords = [];
    const skippedRecords = [];

    for (const emp of employees) {
      // 1. Prevent duplicate payroll runs for the same employee and period
      const existing = await PayrollRecord.findOne({ employee: emp._id, month: m, year: y });
      if (existing) {
        skippedRecords.push({
          employeeId: emp._id,
          employeeCode: emp.employeeCode,
          name: emp.fullName,
          reason: `Payroll already exists for ${payPeriod} (Status: ${existing.status})`,
        });
        continue;
      }

      // 2. Fetch or initialize attendance
      let attendance = await Attendance.findOne({ employee: emp._id, month: m, year: y });
      if (!attendance) {
        attendance = {
          totalWorkingDays: config.standardWorkingDaysPerMonth || 22,
          presentDays: config.standardWorkingDaysPerMonth || 22,
          unpaidLeaveDays: 0,
          overtimeHours: 0,
        };
      }

      // 3. Compute salary breakdown
      const calculation = calculatePayroll({
        employee: emp,
        attendance,
        config,
      });

      // 4. Create new PayrollRecord in 'Draft' status
      const record = new PayrollRecord({
        employee: emp._id,
        month: m,
        year: y,
        payPeriod,
        workingDays: calculation.workingDays,
        presentDays: calculation.presentDays,
        unpaidLeaveDays: calculation.unpaidLeaveDays,
        overtimeHours: calculation.overtimeHours,
        currency: calculation.currency,
        basicSalary: calculation.basicSalary,
        earnings: calculation.earnings,
        grossSalary: calculation.grossSalary,
        deductions: calculation.deductions,
        lopDeduction: calculation.lopDeduction,
        totalDeductions: calculation.totalDeductions,
        netSalary: calculation.netSalary,
        netSalaryInWords: calculation.netSalaryInWords,
        status: 'Draft',
        notes: notes || `Generated for ${payPeriod}`,
        createdBy: req.user._id,
        auditTrail: [
          {
            action: 'CREATED',
            changedBy: req.user._id,
            changedByName: req.user.name,
            fromStatus: '',
            toStatus: 'Draft',
            timestamp: new Date(),
            notes: `Payroll draft initialized for ${payPeriod}`,
          },
        ],
      });

      try {
        await record.save();
        createdRecords.push(record);
      } catch (saveErr) {
        if (saveErr.code === 11000) {
          skippedRecords.push({
            employeeId: emp._id,
            employeeCode: emp.employeeCode,
            name: emp.fullName,
            reason: 'Duplicate payroll run prevented by database unique index.',
          });
        } else {
          throw saveErr;
        }
      }
    }

    // Enterprise audit logging
    await AuditLog.create({
      entityType: 'Payroll',
      action: 'BATCH_PAYROLL_RUN',
      performedBy: req.user._id,
      performedByName: req.user.name,
      details: {
        payPeriod,
        createdCount: createdRecords.length,
        skippedCount: skippedRecords.length,
      },
    });

    const totalGross = createdRecords.reduce((acc, r) => acc + r.grossSalary, 0);
    const totalNet = createdRecords.reduce((acc, r) => acc + r.netSalary, 0);

    res.status(201).json({
      success: true,
      message: `Processed payroll for ${payPeriod}: ${createdRecords.length} created, ${skippedRecords.length} skipped (duplicates prevented).`,
      summary: {
        payPeriod,
        totalCreated: createdRecords.length,
        totalSkipped: skippedRecords.length,
        totalGross: Math.round(totalGross * 100) / 100,
        totalNet: Math.round(totalNet * 100) / 100,
      },
      created: createdRecords,
      skipped: skippedRecords,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get payroll records with comprehensive filters
// @route   GET /api/payroll
// @access  Private
const getPayrollRecords = async (req, res, next) => {
  try {
    const { month, year, status, department, search, page = 1, limit = 50 } = req.query;
    const query = {};

    // Strict role-based isolation: Employees can ONLY view their own records!
    if (req.user.role === 'Employee') {
      if (!req.user.employeeId) {
        return res.json({ success: true, count: 0, total: 0, data: [] });
      }
      query.employee = req.user.employeeId;
      // Employees only see approved or paid records unless configured otherwise
      query.status = { $in: ['Approved', 'Paid'] };
    } else {
      if (status) query.status = status;
    }

    if (month) query.month = Number(month);
    if (year) query.year = Number(year);

    let employeeMatch = {};
    if (department) employeeMatch.department = department;
    if (search) {
      employeeMatch.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { employeeCode: { $regex: search, $options: 'i' } },
      ];
    }

    let records = await PayrollRecord.find(query)
      .populate({
        path: 'employee',
        match: Object.keys(employeeMatch).length > 0 ? employeeMatch : undefined,
        populate: ['department', 'designation'],
      })
      .populate('createdBy', 'name')
      .populate('reviewedBy', 'name')
      .populate('approvedBy', 'name')
      .sort({ year: -1, month: -1, createdAt: -1 });

    // Filter out records where employee didn't match the populate filter
    if (Object.keys(employeeMatch).length > 0) {
      records = records.filter((r) => r.employee !== null);
    }

    const total = records.length;
    const startIndex = (page - 1) * limit;
    const paginated = records.slice(startIndex, startIndex + Number(limit));

    res.json({
      success: true,
      count: paginated.length,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / limit) || 1,
      data: paginated,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single payroll record (Payslip view)
// @route   GET /api/payroll/:id
// @access  Private (Role protected: Employees can only view their own)
const getPayrollRecordById = async (req, res, next) => {
  try {
    const record = await PayrollRecord.findById(req.params.id)
      .populate({
        path: 'employee',
        populate: ['department', 'designation'],
      })
      .populate('createdBy', 'name email role')
      .populate('reviewedBy', 'name email role')
      .populate('approvedBy', 'name email role')
      .populate('auditTrail.changedBy', 'name role');

    if (!record) {
      return res.status(404).json({ success: false, message: 'Payroll record not found' });
    }

    // Role-based access enforcement: Employee can ONLY view their own payslip
    if (req.user.role === 'Employee') {
      if (!req.user.employeeId || req.user.employeeId.toString() !== record.employee._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Access Denied: You are not authorized to view another employee’s payslip.',
        });
      }
    }

    // Load active company configuration for branding and payslip headers
    const config = (await PayrollConfig.findOne()) || {};

    res.json({
      success: true,
      data: record,
      company: {
        name: config.companyName || 'Nexus Enterprises Inc.',
        email: config.companyEmail || 'payroll@nexus-ems.internal',
        address: config.companyAddress || '100 Innovation Way, Suite 400, Tech Park',
        phone: config.companyPhone || '+1 (555) 019-8234',
        currency: config.currency,
      },
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update draft payroll record (bonuses, deductions, notes)
// @route   PUT /api/payroll/:id
// @access  Private (Admin, Payroll Manager)
const updatePayrollRecord = async (req, res, next) => {
  try {
    const record = await PayrollRecord.findById(req.params.id).populate('employee');
    if (!record) {
      return res.status(404).json({ success: false, message: 'Payroll record not found' });
    }

    if (record.status !== 'Draft') {
      return res.status(400).json({
        success: false,
        message: `Cannot edit payroll record in '${record.status}' status. Only 'Draft' records can be edited.`,
      });
    }

    const { customBonuses, customDeductions, notes } = req.body;
    const config = (await PayrollConfig.findOne()) || {};
    const attendance = (await Attendance.findOne({
      employee: record.employee._id,
      month: record.month,
      year: record.year,
    })) || {
      totalWorkingDays: record.workingDays,
      presentDays: record.presentDays,
      unpaidLeaveDays: record.unpaidLeaveDays,
      overtimeHours: record.overtimeHours,
    };

    const calculation = calculatePayroll({
      employee: record.employee,
      attendance,
      config,
      customBonuses: customBonuses || [],
      customDeductions: customDeductions || [],
    });

    record.basicSalary = calculation.basicSalary;
    record.earnings = calculation.earnings;
    record.grossSalary = calculation.grossSalary;
    record.deductions = calculation.deductions;
    record.lopDeduction = calculation.lopDeduction;
    record.totalDeductions = calculation.totalDeductions;
    record.netSalary = calculation.netSalary;
    record.netSalaryInWords = calculation.netSalaryInWords;
    if (notes) record.notes = notes;

    record.auditTrail.push({
      action: 'MANUAL_EDIT',
      changedBy: req.user._id,
      changedByName: req.user.name,
      fromStatus: record.status,
      toStatus: record.status,
      timestamp: new Date(),
      notes: notes || 'Updated earnings and deductions breakdown',
    });

    await record.save();

    res.json({ success: true, data: record, message: 'Payroll draft updated successfully' });
  } catch (err) {
    next(err);
  }
};

// @desc    Update status workflow (Draft -> Under Review -> Approved -> Paid)
// @route   PATCH /api/payroll/:id/status
// @access  Private (Admin, Payroll Manager)
const updatePayrollStatus = async (req, res, next) => {
  try {
    const { status, notes, paymentReference, paymentMethod } = req.body;
    const allowedStatuses = ['Draft', 'Under Review', 'Approved', 'Paid'];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: [${allowedStatuses.join(', ')}]`,
      });
    }

    const record = await PayrollRecord.findById(req.params.id);
    if (!record) {
      return res.status(404).json({ success: false, message: 'Payroll record not found' });
    }

    // Role verification for approval
    if (status === 'Approved' || status === 'Paid') {
      if (!['Admin', 'Payroll Manager'].includes(req.user.role)) {
        return res.status(403).json({
          success: false,
          message: 'Forbidden: Only Admin or Payroll Manager can approve or mark payroll as paid.',
        });
      }
    }

    const previousStatus = record.status;
    record.status = status;

    if (status === 'Under Review') {
      record.reviewedBy = req.user._id;
    } else if (status === 'Approved') {
      record.approvedBy = req.user._id;
    } else if (status === 'Paid') {
      record.paymentDate = new Date();
      record.paymentReference = paymentReference || `PAY-${record.month}${record.year}-${record._id.toString().slice(-6).toUpperCase()}`;
      if (paymentMethod) record.paymentMethod = paymentMethod;
    }

    record.auditTrail.push({
      action: `STATUS_CHANGE_TO_${status.toUpperCase().replace(/\s+/g, '_')}`,
      changedBy: req.user._id,
      changedByName: req.user.name,
      fromStatus: previousStatus,
      toStatus: status,
      timestamp: new Date(),
      notes: notes || `Status changed from ${previousStatus} to ${status}`,
    });

    await record.save();

    await AuditLog.create({
      entityType: 'Payroll',
      entityId: record._id.toString(),
      action: 'PAYROLL_STATUS_TRANSITION',
      performedBy: req.user._id,
      performedByName: req.user.name,
      details: {
        payPeriod: record.payPeriod,
        fromStatus: previousStatus,
        toStatus: status,
        notes,
      },
    });

    res.json({
      success: true,
      data: record,
      message: `Payroll status updated to '${status}'.`,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Batch status transition (e.g. approve all records in review for a period)
// @route   POST /api/payroll/batch-status
// @access  Private (Admin, Payroll Manager)
const batchStatusUpdate = async (req, res, next) => {
  try {
    const { ids, targetStatus, notes } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0 || !targetStatus) {
      return res.status(400).json({ success: false, message: 'Array of ids and targetStatus are required' });
    }

    let updatedCount = 0;
    for (const id of ids) {
      const record = await PayrollRecord.findById(id);
      if (!record) continue;

      const prev = record.status;
      record.status = targetStatus;

      if (targetStatus === 'Approved') record.approvedBy = req.user._id;
      if (targetStatus === 'Under Review') record.reviewedBy = req.user._id;
      if (targetStatus === 'Paid') {
        record.paymentDate = new Date();
        record.paymentReference = `PAY-BATCH-${Date.now()}`;
      }

      record.auditTrail.push({
        action: `BATCH_TRANSITION_TO_${targetStatus.toUpperCase()}`,
        changedBy: req.user._id,
        changedByName: req.user.name,
        fromStatus: prev,
        toStatus: targetStatus,
        timestamp: new Date(),
        notes: notes || `Batch updated to ${targetStatus}`,
      });

      await record.save();
      updatedCount++;
    }

    res.json({
      success: true,
      message: `Successfully updated ${updatedCount} records to '${targetStatus}'.`,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete payroll record (only allowed if in Draft status)
// @route   DELETE /api/payroll/:id
// @access  Private (Admin, Payroll Manager)
const deletePayrollRecord = async (req, res, next) => {
  try {
    const record = await PayrollRecord.findById(req.params.id);
    if (!record) {
      return res.status(404).json({ success: false, message: 'Payroll record not found' });
    }

    if (record.status !== 'Draft') {
      return res.status(400).json({
        success: false,
        message: `Cannot delete payroll record in '${record.status}' status. Only 'Draft' records can be deleted.`,
      });
    }

    await PayrollRecord.findByIdAndDelete(req.params.id);

    await AuditLog.create({
      entityType: 'Payroll',
      entityId: req.params.id,
      action: 'DELETE_PAYROLL_DRAFT',
      performedBy: req.user._id,
      performedByName: req.user.name,
      details: { payPeriod: record.payPeriod, employee: record.employee },
    });

    res.json({ success: true, message: 'Draft payroll record deleted successfully' });
  } catch (err) {
    next(err);
  }
};

// @desc    Get currently logged in employee's payslips
// @route   GET /api/payroll/my/payslips
// @access  Private (Employee)
const getMyPayslips = async (req, res, next) => {
  try {
    if (!req.user.employeeId) {
      return res.json({ success: true, count: 0, data: [] });
    }

    const payslips = await PayrollRecord.find({
      employee: req.user.employeeId,
      status: { $in: ['Approved', 'Paid'] },
    })
      .populate({
        path: 'employee',
        populate: ['department', 'designation'],
      })
      .sort({ year: -1, month: -1 });

    res.json({ success: true, count: payslips.length, data: payslips });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  previewCalculation,
  processPayroll,
  getPayrollRecords,
  getPayrollRecordById,
  updatePayrollRecord,
  updatePayrollStatus,
  batchStatusUpdate,
  deletePayrollRecord,
  getMyPayslips,
};
