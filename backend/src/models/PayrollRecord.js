const mongoose = require('mongoose');

const earningsItemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    amount: { type: Number, required: true },
    type: { type: String, default: 'allowance' },
  },
  { _id: false }
);

const deductionsItemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    amount: { type: Number, required: true },
    type: { type: String, default: 'deduction' },
  },
  { _id: false }
);

const auditEntrySchema = new mongoose.Schema(
  {
    action: { type: String, required: true },
    changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    changedByName: { type: String, default: '' },
    fromStatus: { type: String, default: '' },
    toStatus: { type: String, default: '' },
    timestamp: { type: Date, default: Date.now },
    notes: { type: String, default: '' },
  },
  { _id: true }
);

const payrollRecordSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
    },
    month: {
      type: Number,
      required: true,
      min: 1,
      max: 12,
    },
    year: {
      type: Number,
      required: true,
    },
    payPeriod: {
      type: String,
      required: true, // e.g. "October 2026"
    },
    workingDays: {
      type: Number,
      default: 22,
    },
    presentDays: {
      type: Number,
      default: 22,
    },
    unpaidLeaveDays: {
      type: Number,
      default: 0,
    },
    overtimeHours: {
      type: Number,
      default: 0,
    },
    currency: {
      type: String,
      default: '$',
    },
    basicSalary: {
      type: Number,
      required: true,
      default: 0,
    },
    earnings: [earningsItemSchema],
    grossSalary: {
      type: Number,
      required: true,
      default: 0,
    },
    deductions: [deductionsItemSchema],
    lopDeduction: {
      type: Number,
      default: 0,
    },
    totalDeductions: {
      type: Number,
      required: true,
      default: 0,
    },
    netSalary: {
      type: Number,
      required: true,
      default: 0,
    },
    netSalaryInWords: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['Draft', 'Under Review', 'Approved', 'Paid'],
      default: 'Draft',
    },
    paymentDate: {
      type: Date,
      default: null,
    },
    paymentReference: {
      type: String,
      default: '',
    },
    paymentMethod: {
      type: String,
      enum: ['Direct Deposit', 'Bank Transfer', 'Check', 'Cash', 'Pending'],
      default: 'Direct Deposit',
    },
    notes: {
      type: String,
      default: '',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    auditTrail: [auditEntrySchema],
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate payroll runs for the same employee and period
payrollRecordSchema.index({ employee: 1, month: 1, year: 1 }, { unique: true });

module.exports = mongoose.model('PayrollRecord', payrollRecordSchema);
