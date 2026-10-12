const mongoose = require('mongoose');

const taxRuleSchema = new mongoose.Schema(
  {
    deductionName: { type: String, default: 'Income Tax (TDS)' },
    minSalary: { type: Number, required: true, default: 0 },
    maxSalary: { type: Number, default: null }, // null means no upper limit
    ratePercent: { type: Number, required: true, default: 0 },
  },
  { _id: false }
);

const componentRuleSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    type: { type: String, enum: ['fixed', 'percentage'], default: 'fixed' },
    value: { type: Number, required: true, default: 0 },
    description: { type: String, default: '' },
    isTaxable: { type: Boolean, default: true },
  },
  { _id: false }
);

const payrollConfigSchema = new mongoose.Schema(
  {
    companyName: {
      type: String,
      default: 'Forvex Technologies India Pvt. Ltd.',
    },
    companyEmail: {
      type: String,
      default: 'payroll@forvex.in',
    },
    companyAddress: {
      type: String,
      default: 'Prestige Tech Park, Outer Ring Road, Marathahalli - Sarjapur, Bengaluru, Karnataka 560103',
    },
    companyPhone: {
      type: String,
      default: '+91 (080) 4123-4567',
    },
    currency: {
      code: { type: String, default: 'INR' },
      symbol: { type: String, default: '₹' },
      name: { type: String, default: 'Indian Rupees' },
    },
    standardWorkingDaysPerMonth: {
      type: Number,
      default: 22,
    },
    overtimeHourlyRateMultiplier: {
      type: Number,
      default: 1.5,
    },
    taxRules: [taxRuleSchema],
    defaultAllowances: [componentRuleSchema],
    defaultDeductions: [componentRuleSchema],
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('PayrollConfig', payrollConfigSchema);
