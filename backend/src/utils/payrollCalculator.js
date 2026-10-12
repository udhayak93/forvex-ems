const { numberToWords } = require('./numberToWords');

/**
 * Calculates monthly payroll for an employee based on their salary structure,
 * attendance record, and configurable payroll rules.
 *
 * @param {Object} params
 * @param {Object} params.employee - Employee document with salaryStructure
 * @param {Object} params.attendance - Attendance record (workingDays, presentDays, unpaidLeaveDays, overtimeHours)
 * @param {Object} params.config - PayrollConfig document (currency, taxRules, defaultAllowances, etc.)
 * @param {Array}  params.customBonuses - Optional manual bonuses for this period [{ name, amount }]
 * @param {Array}  params.customDeductions - Optional manual deductions for this period [{ name, amount }]
 * @returns {Object} Calculated payroll breakdown
 */
function calculatePayroll({
  employee,
  attendance = {},
  config = {},
  customBonuses = [],
  customDeductions = []
}) {
  const salaryStructure = employee.salaryStructure || {};
  const basicSalary = Number(salaryStructure.baseSalary || 0);

  const standardWorkingDays = Number(config.standardWorkingDaysPerMonth || 22);
  const workingDays = Number(attendance.totalWorkingDays || standardWorkingDays);
  const unpaidLeaveDays = Number(attendance.unpaidLeaveDays || 0);
  const presentDays = Number(attendance.presentDays || (workingDays - unpaidLeaveDays));
  const overtimeHours = Number(attendance.overtimeHours || 0);
  const overtimeMultiplier = Number(config.overtimeHourlyRateMultiplier || 1.5);

  const currencySymbol = config.currency?.symbol || '$';
  const currencyName = config.currency?.name || 'Dollars';

  // 1. Calculate Allowances
  const earnings = [];
  earnings.push({
    name: 'Basic Salary',
    amount: Math.round(basicSalary * 100) / 100,
    type: 'base'
  });

  let totalAllowances = 0;
  const allowancesList = (salaryStructure.allowances && salaryStructure.allowances.length > 0)
    ? salaryStructure.allowances
    : (config.defaultAllowances || []);

  for (const item of allowancesList) {
    let amount = 0;
    if (item.type === 'percentage') {
      amount = (basicSalary * Number(item.value || 0)) / 100;
    } else {
      amount = Number(item.value || 0);
    }
    amount = Math.round(amount * 100) / 100;
    totalAllowances += amount;
    earnings.push({
      name: item.name,
      amount,
      type: 'allowance'
    });
  }

  // 2. Overtime Pay
  let overtimePay = 0;
  if (overtimeHours > 0 && workingDays > 0) {
    const hourlyRate = basicSalary / (workingDays * 8);
    overtimePay = Math.round((hourlyRate * overtimeMultiplier * overtimeHours) * 100) / 100;
    earnings.push({
      name: `Overtime Pay (${overtimeHours} hrs @ ${overtimeMultiplier}x)`,
      amount: overtimePay,
      type: 'overtime'
    });
  }

  // 3. Custom / Performance Bonuses
  let totalBonuses = 0;
  for (const b of customBonuses) {
    const bAmt = Math.round(Number(b.amount || 0) * 100) / 100;
    if (bAmt > 0) {
      totalBonuses += bAmt;
      earnings.push({
        name: b.name || 'Performance Bonus',
        amount: bAmt,
        type: 'bonus'
      });
    }
  }

  // Gross Salary
  const grossSalary = Math.round((basicSalary + totalAllowances + overtimePay + totalBonuses) * 100) / 100;

  // 4. Calculate Deductions
  const deductions = [];
  let totalFixedDeductions = 0;

  const deductionsList = (salaryStructure.deductions && salaryStructure.deductions.length > 0)
    ? salaryStructure.deductions
    : (config.defaultDeductions || []);

  for (const item of deductionsList) {
    let amount = 0;
    if (item.type === 'percentage') {
      amount = (basicSalary * Number(item.value || 0)) / 100;
    } else {
      amount = Number(item.value || 0);
    }
    amount = Math.round(amount * 100) / 100;
    totalFixedDeductions += amount;
    deductions.push({
      name: item.name,
      amount,
      type: 'standard_deduction'
    });
  }

  // 5. Configurable Tax Calculation (Rules-based, not hardcoded)
  let calculatedTax = 0;
  if (config.taxRules && Array.isArray(config.taxRules) && config.taxRules.length > 0) {
    // Check applicable bracket based on grossSalary or basic
    for (const rule of config.taxRules) {
      const min = Number(rule.minSalary || 0);
      const max = rule.maxSalary !== null && rule.maxSalary !== undefined ? Number(rule.maxSalary) : Infinity;
      if (grossSalary >= min && grossSalary <= max) {
        calculatedTax = Math.round(((grossSalary * Number(rule.ratePercent || 0)) / 100) * 100) / 100;
        if (calculatedTax > 0) {
          deductions.push({
            name: rule.deductionName || `Income Tax (${rule.ratePercent}%)`,
            amount: calculatedTax,
            type: 'tax'
          });
        }
        break;
      }
    }
  }

  // 6. Loss of Pay (LOP) for Unpaid Leave Days
  let lopDeduction = 0;
  if (unpaidLeaveDays > 0 && workingDays > 0) {
    const dailyWage = basicSalary / workingDays;
    lopDeduction = Math.round((dailyWage * unpaidLeaveDays) * 100) / 100;
    deductions.push({
      name: `Loss of Pay (LOP: ${unpaidLeaveDays} days)`,
      amount: lopDeduction,
      type: 'lop'
    });
  }

  // 7. Custom Deductions
  let totalCustomDeductions = 0;
  for (const d of customDeductions) {
    const dAmt = Math.round(Number(d.amount || 0) * 100) / 100;
    if (dAmt > 0) {
      totalCustomDeductions += dAmt;
      deductions.push({
        name: d.name || 'Other Deduction',
        amount: dAmt,
        type: 'custom_deduction'
      });
    }
  }

  const totalDeductions = Math.round((totalFixedDeductions + calculatedTax + lopDeduction + totalCustomDeductions) * 100) / 100;
  const netSalary = Math.max(0, Math.round((grossSalary - totalDeductions) * 100) / 100);
  const netSalaryInWords = numberToWords(netSalary, currencyName);

  return {
    basicSalary,
    workingDays,
    presentDays,
    unpaidLeaveDays,
    overtimeHours,
    currency: currencySymbol,
    earnings,
    grossSalary,
    deductions,
    lopDeduction,
    totalDeductions,
    netSalary,
    netSalaryInWords
  };
}

module.exports = { calculatePayroll };
