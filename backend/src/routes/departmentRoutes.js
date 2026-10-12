const express = require('express');
const router = express.Router();
const {
  getDepartments,
  createDepartment,
  updateDepartment,
  getDesignations,
  createDesignation,
} = require('../controllers/departmentController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/roleCheck');

router.use(protect);

router.route('/')
  .get(getDepartments)
  .post(authorize('Admin', 'HR'), createDepartment);

router.route('/:id')
  .put(authorize('Admin', 'HR'), updateDepartment);

router.route('/designations/all')
  .get(getDesignations)
  .post(authorize('Admin', 'HR'), createDesignation);

module.exports = router;
