const { calculatePayroll } = require('../src/utils/payrollCalculator');
const { numberToWords } = require('../src/utils/numberToWords');

describe('Payroll Calculator Unit Tests (Indian Localization)', () => {
  const sampleIndianConfig = {
    standardWorkingDaysPerMonth: 22,
    overtimeHourlyRateMultiplier: 1.5,
    currency: { symbol: '₹', name: 'Rupees' },
    taxRules: [
      { minSalary: 0, maxSalary: 25000, ratePercent: 0, deductionName: 'TDS (0%)' },
      { minSalary: 25001, maxSalary: 58333, ratePercent: 5, deductionName: 'TDS (5%)' },
      { minSalary: 58334, maxSalary: null, ratePercent: 10, deductionName: 'TDS (10%)' },
    ],
  };

  test('correctly calculates basic salary, percentage and fixed allowances in INR', () => {
    const employee = {
      salaryStructure: {
        baseSalary: 50000,
        allowances: [
          { name: 'HRA', type: 'percentage', value: 40 }, // 20000
          { name: 'Medical', type: 'fixed', value: 1250 },  // 1250
        ],
        deductions: [
          { name: 'EPF', type: 'percentage', value: 12 },   // 6000
          { name: 'PT', type: 'fixed', value: 200 },        // 200
        ],
      },
    };

    const attendance = { totalWorkingDays: 22, presentDays: 22, unpaidLeaveDays: 0, overtimeHours: 0 };

    const result = calculatePayroll({ employee, attendance, config: sampleIndianConfig });

    // Gross: 50000 + 20000 + 1250 = 71250
    expect(result.grossSalary).toBe(71250);

    // Deductions: EPF(6000) + PT(200) + TDS (10% of 71250 = 7125)
    // Total Deductions: 6000 + 200 + 7125 = 13325
    expect(result.totalDeductions).toBe(13325);

    // Net Salary: 71250 - 13325 = 57925
    expect(result.netSalary).toBe(57925);
    expect(result.lopDeduction).toBe(0);
    expect(result.currency).toBe('₹');
    expect(result.netSalaryInWords).toContain('Fifty Seven Thousand Nine Hundred Twenty Five Rupees Only');
  });

  test('correctly calculates Loss of Pay (LOP) for unpaid leave days in INR', () => {
    const employee = {
      salaryStructure: {
        baseSalary: 44000,
        allowances: [],
        deductions: [],
      },
    };

    // 22 working days, 2 unpaid leave days => daily wage = 44000 / 22 = 2000
    // LOP = 2000 * 2 = 4000
    const attendance = { totalWorkingDays: 22, presentDays: 20, unpaidLeaveDays: 2, overtimeHours: 0 };

    const result = calculatePayroll({ employee, attendance, config: sampleIndianConfig });

    expect(result.basicSalary).toBe(44000);
    expect(result.lopDeduction).toBe(4000);
    // Gross: 44000. TDS 5% (2200). Total deductions = 2200 + 4000 = 6200
    // Net: 44000 - 6200 = 37800
    expect(result.netSalary).toBe(37800);
  });

  test('correctly converts numbers to words in Indian scales (Lakhs, Crores, Thousands)', () => {
    expect(numberToWords(0, 'Rupees')).toBe('Zero Rupees Only');
    expect(numberToWords(1250, 'Rupees')).toBe('One Thousand Two Hundred Fifty Rupees Only');
    expect(numberToWords(100000, 'Rupees')).toBe('One Lakh Rupees Only');
    expect(numberToWords(125000, 'Rupees')).toBe('One Lakh Twenty Five Thousand Rupees Only');
    expect(numberToWords(1500000, 'Rupees')).toBe('Fifteen Lakh Rupees Only');
    expect(numberToWords(10000000, 'Rupees')).toBe('One Crore Rupees Only');
  });
});
