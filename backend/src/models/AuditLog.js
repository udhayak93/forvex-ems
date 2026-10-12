const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema(
  {
    entityType: {
      type: String,
      enum: ['Payroll', 'Employee', 'Department', 'Attendance', 'Config', 'Auth'],
      required: true,
    },
    entityId: {
      type: String,
      default: '',
    },
    action: {
      type: String,
      required: true, // e.g. "CREATE_PAYROLL", "STATUS_CHANGE", "APPROVE_PAYROLL"
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    performedByName: {
      type: String,
      default: 'System',
    },
    ipAddress: {
      type: String,
      default: '',
    },
    details: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('AuditLog', auditLogSchema);
