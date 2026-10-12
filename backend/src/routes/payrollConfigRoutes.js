const express = require('express');
const router = express.Router();
const { getConfig, updateConfig } = require('../controllers/payrollConfigController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/roleCheck');

router.use(protect);

router.route('/')
  .get(getConfig)
  .put(authorize('Admin', 'Payroll Manager'), updateConfig);

module.exports = router;
