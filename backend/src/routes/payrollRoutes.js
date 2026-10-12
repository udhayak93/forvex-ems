const express = require('express');
const router = express.Router();
const {
  previewCalculation,
  processPayroll,
  getPayrollRecords,
  getPayrollRecordById,
  updatePayrollRecord,
  updatePayrollStatus,
  batchStatusUpdate,
  deletePayrollRecord,
  getMyPayslips,
} = require('../controllers/payrollController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/roleCheck');

router.use(protect);

// Employee specific self-service route
router.get('/my/payslips', getMyPayslips);

// Manager calculation preview
router.post('/preview', authorize('Admin', 'Payroll Manager'), previewCalculation);

// Process / Run payroll
router.post('/process', authorize('Admin', 'Payroll Manager'), processPayroll);

// Batch status update
router.post('/batch-status', authorize('Admin', 'Payroll Manager'), batchStatusUpdate);

// Main list (Restricted to management roles)
router.get('/', authorize('Admin', 'Payroll Manager', 'HR'), getPayrollRecords);

// Single record / payslip view (Internally enforces role permissions)
router.get('/:id', getPayrollRecordById);

// Update draft
router.put('/:id', authorize('Admin', 'Payroll Manager'), updatePayrollRecord);

// Update status workflow (Draft -> Under Review -> Approved -> Paid)
router.patch('/:id/status', authorize('Admin', 'Payroll Manager'), updatePayrollStatus);

// Delete draft
router.delete('/:id', authorize('Admin', 'Payroll Manager'), deletePayrollRecord);

module.exports = router;
