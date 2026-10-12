/**
 * Grants access only to users with specific roles.
 * @param  {...string} roles
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: User role '${req.user.role}' is not authorized to access this resource. Required: [${roles.join(', ')}]`,
      });
    }

    next();
  };
};

/**
 * Ensures an employee can only access their own records/payslips.
 * Admins, HR, and Payroll Managers have elevated access.
 */
const authorizeSelfOrRoles = (paramKey = 'employeeId', ...allowedManagerRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    // Managers have access
    if (allowedManagerRoles.includes(req.user.role)) {
      return next();
    }

    // Employee role check
    const requestedEmployeeId = req.params[paramKey] || req.body[paramKey] || req.query[paramKey];
    if (
      req.user.role === 'Employee' &&
      req.user.employeeId &&
      requestedEmployeeId &&
      req.user.employeeId.toString() === requestedEmployeeId.toString()
    ) {
      return next();
    }

    return res.status(403).json({
      success: false,
      message: 'Forbidden: You are only permitted to access your own employee records.',
    });
  };
};

module.exports = { authorize, authorizeSelfOrRoles };
