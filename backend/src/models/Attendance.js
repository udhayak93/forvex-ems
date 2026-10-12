const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema(
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
    totalWorkingDays: {
      type: Number,
      required: true,
      default: 22,
    },
    presentDays: {
      type: Number,
      required: true,
      default: 22,
    },
    paidLeaveDays: {
      type: Number,
      default: 0,
    },
    unpaidLeaveDays: {
      type: Number,
      default: 0,
    },
    overtimeHours: {
      type: Number,
      default: 0,
    },
    notes: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate attendance for same employee in same month & year
attendanceSchema.index({ employee: 1, month: 1, year: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', attendanceSchema);
