const PayrollConfig = require('../models/PayrollConfig');
const AuditLog = require('../models/AuditLog');

// Default initial config template for India
const getDefaultConfigData = () => ({
  companyName: 'Forvex Technologies India Pvt. Ltd.',
  companyEmail: 'payroll@forvex.in',
  companyAddress: 'Prestige Tech Park, Outer Ring Road, Marathahalli - Sarjapur, Bengaluru, Karnataka 560103',
  companyPhone: '+91 (080) 4123-4567',
  currency: {
    code: 'INR',
    symbol: '₹',
    name: 'Indian Rupees',
  },
  standardWorkingDaysPerMonth: 22,
  overtimeHourlyRateMultiplier: 1.5,
  taxRules: [
    { deductionName: 'TDS (Income Tax Slab 1)', minSalary: 0, maxSalary: 25000, ratePercent: 0 },
    { deductionName: 'TDS (Income Tax Slab 2 - 5%)', minSalary: 25001, maxSalary: 58333, ratePercent: 5 },
    { deductionName: 'TDS (Income Tax Slab 3 - 10%)', minSalary: 58334, maxSalary: 83333, ratePercent: 10 },
    { deductionName: 'TDS (Income Tax Slab 4 - 15%)', minSalary: 83334, maxSalary: 125000, ratePercent: 15 },
    { deductionName: 'TDS (Income Tax Slab 5 - 20%)', minSalary: 125001, maxSalary: null, ratePercent: 20 },
  ],
  defaultAllowances: [
    { name: 'House Rent Allowance (HRA)', type: 'percentage', value: 40, description: '40% of basic pay (Non-metro rate)', isTaxable: true },
    { name: 'Special Allowance', type: 'percentage', value: 15, description: 'Flexible benefit allowance', isTaxable: true },
    { name: 'Conveyance Allowance', type: 'fixed', value: 1600, description: 'Commute and transit assistance', isTaxable: false },
    { name: 'Medical Allowance', type: 'fixed', value: 1250, description: 'Standard health and wellness support', isTaxable: false },
  ],
  defaultDeductions: [
    { name: 'Employee Provident Fund (EPF / PF)', type: 'percentage', value: 12, description: '12% statutory employee contribution', isTaxable: false },
    { name: 'Professional Tax (PT)', type: 'fixed', value: 200, description: 'State municipal professional tax', isTaxable: false },
    { name: 'Group Health Insurance Plan', type: 'fixed', value: 750, description: 'Corporate medical insurance coverage', isTaxable: false },
  ],
});

// @desc    Get active payroll configuration
// @route   GET /api/payroll-config
// @access  Private
const getConfig = async (req, res, next) => {
  try {
    let config = await PayrollConfig.findOne().populate('updatedBy', 'name email');
    if (!config) {
      config = await PayrollConfig.create(getDefaultConfigData());
    }
    res.json({ success: true, data: config });
  } catch (err) {
    next(err);
  }
};

// @desc    Update payroll configuration
// @route   PUT /api/payroll-config
// @access  Private (Admin, Payroll Manager)
const updateConfig = async (req, res, next) => {
  try {
    let config = await PayrollConfig.findOne();
    if (!config) {
      config = new PayrollConfig(getDefaultConfigData());
    }

    Object.assign(config, req.body);
    config.updatedBy = req.user._id;
    await config.save();

    await AuditLog.create({
      entityType: 'Config',
      entityId: config._id.toString(),
      action: 'UPDATE_PAYROLL_CONFIG',
      performedBy: req.user._id,
      performedByName: req.user.name,
      details: {
        currency: config.currency,
        standardWorkingDaysPerMonth: config.standardWorkingDaysPerMonth,
        taxRulesCount: config.taxRules.length,
      },
    });

    res.json({ success: true, data: config, message: 'Payroll configuration updated successfully' });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getConfig,
  updateConfig,
};
