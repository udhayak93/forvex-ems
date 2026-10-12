const mongoose = require('mongoose');

const allowanceItemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    type: { type: String, enum: ['fixed', 'percentage'], default: 'fixed' },
    value: { type: Number, required: true, default: 0 },
  },
  { _id: false }
);

const deductionItemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    type: { type: String, enum: ['fixed', 'percentage'], default: 'fixed' },
    value: { type: Number, required: true, default: 0 },
  },
  { _id: false }
);

const employeeSchema = new mongoose.Schema(
  {
    employeeCode: {
      type: String,
      required: [true, 'Employee code is required'],
      unique: true,
      trim: true,
      uppercase: true,
    },
    firstName: {
      type: String,
      required: [true, 'First name is required'],
      trim: true,
    },
    lastName: {
      type: String,
      required: [true, 'Last name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
      default: '',
    },
    dateOfBirth: {
      type: Date,
      default: null,
    },
    dateOfJoining: {
      type: Date,
      default: Date.now,
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      required: [true, 'Department is required'],
    },
    designation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Designation',
      required: [true, 'Designation is required'],
    },
    employmentType: {
      type: String,
      enum: ['Full-time', 'Part-time', 'Contract', 'Intern'],
      default: 'Full-time',
    },
    status: {
      type: String,
      enum: ['Active', 'On Leave', 'Inactive'],
      default: 'Active',
    },
    bankDetails: {
      bankName: { type: String, default: '' },
      accountNumber: { type: String, default: '' },
      ifscCode: { type: String, default: '', uppercase: true, trim: true },
      panNumber: { type: String, default: '', uppercase: true, trim: true },
      uanNumber: { type: String, default: '', trim: true },
      routingCode: { type: String, default: '' },
      taxId: { type: String, default: '' },
    },
    emergencyContact: {
      name: { type: String, default: '' },
      relationship: { type: String, default: '' },
      phone: { type: String, default: '' },
    },
    salaryStructure: {
      baseSalary: { type: Number, required: true, default: 0 },
      allowances: [allowanceItemSchema],
      deductions: [deductionItemSchema],
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

employeeSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`;
});

module.exports = mongoose.model('Employee', employeeSchema);
