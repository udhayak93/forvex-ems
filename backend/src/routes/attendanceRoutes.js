const express = require('express');
const router = express.Router();
const {
  getAttendance,
  recordAttendance,
  getLeaves,
  applyLeave,
  reviewLeave,
} = require('../controllers/attendanceController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/roleCheck');

router.use(protect);

router.route('/')
  .get(getAttendance)
  .post(authorize('Admin', 'HR', 'Payroll Manager'), recordAttendance);

router.route('/leaves')
  .get(getLeaves)
  .post(applyLeave);

router.route('/leaves/:id/review')
  .patch(authorize('Admin', 'HR'), reviewLeave);

module.exports = router;
