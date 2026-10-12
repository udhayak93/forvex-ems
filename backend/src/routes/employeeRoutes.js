const express = require('express');
const router = express.Router();
const {
  getEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  toggleEmployeeStatus,
} = require('../controllers/employeeController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/roleCheck');

router.use(protect);

router.route('/')
  .get(authorize('Admin', 'HR', 'Payroll Manager'), getEmployees)
  .post(authorize('Admin', 'HR'), createEmployee);

router.route('/:id')
  .get(getEmployeeById) // internally handles employee viewing their own profile
  .put(authorize('Admin', 'HR'), updateEmployee);

router.route('/:id/status')
  .patch(authorize('Admin', 'HR'), toggleEmployeeStatus);

module.exports = router;
