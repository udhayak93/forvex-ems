const mongoose = require('mongoose');

const designationSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Designation title is required'],
      trim: true,
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      required: [true, 'Department is required'],
    },
    level: {
      type: String,
      enum: ['Junior', 'Mid', 'Senior', 'Lead', 'Executive'],
      default: 'Mid',
    },
    minSalary: {
      type: Number,
      default: 0,
    },
    maxSalary: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Designation', designationSchema);
