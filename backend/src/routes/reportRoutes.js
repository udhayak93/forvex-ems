const express = require('express');
const router = express.Router();
const {
  getDashboardStats,
  getPayrollSummaryReport,
  getAuditLogs,
} = require('../controllers/reportController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/roleCheck');

router.use(protect);

router.get('/dashboard-stats', authorize('Admin', 'Payroll Manager', 'HR'), getDashboardStats);
router.get('/payroll-summary', authorize('Admin', 'Payroll Manager'), getPayrollSummaryReport);
router.get('/audit-logs', authorize('Admin'), getAuditLogs);

module.exports = router;
