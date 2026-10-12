const mongoose = require('mongoose');
const dotenv = require('dotenv');
const { connectDB, closeDB } = require('../config/db');
const User = require('../models/User');
const Department = require('../models/Department');
const Designation = require('../models/Designation');
const Employee = require('../models/Employee');
const Attendance = require('../models/Attendance');
const Leave = require('../models/Leave');
const PayrollConfig = require('../models/PayrollConfig');
const PayrollRecord = require('../models/PayrollRecord');
const AuditLog = require('../models/AuditLog');
const { calculatePayroll } = require('../utils/payrollCalculator');

dotenv.config();

const seedData = async () => {
  try {
    console.log('[Seeder] Connecting to database...');
    await connectDB();

    console.log('[Seeder] Clearing existing data in nexus_ems...');
    await User.deleteMany({});
    await Department.deleteMany({});
    await Designation.deleteMany({});
    await Employee.deleteMany({});
    await Attendance.deleteMany({});
    await Leave.deleteMany({});
    await PayrollConfig.deleteMany({});
    await PayrollRecord.deleteMany({});
    await AuditLog.deleteMany({});

    // 1. Create Departments
    console.log('[Seeder] Creating Indian departments...');
    const departments = await Department.create([
      { name: 'Software Engineering', code: 'ENG', description: 'Core software engineering and cloud infrastructure', headOfDepartment: 'Aditya Varma' },
      { name: 'Finance & Accounts', code: 'FIN', description: 'Corporate finance, taxation, and payroll compliance', headOfDepartment: 'Vikram Iyer' },
      { name: 'People Operations (HR)', code: 'HR', description: 'Talent management, employee relations, and HR ops', headOfDepartment: 'Ananya Rao' },
      { name: 'Product & UX Design', code: 'PRD', description: 'Product strategy, system architecture, and UX design', headOfDepartment: 'Priya Patel' },
      { name: 'Enterprise Sales', code: 'SLS', description: 'Domestic & global enterprise client partnerships', headOfDepartment: 'Rajesh Kumar' },
    ]);

    const deptMap = {};
    departments.forEach(d => { deptMap[d.code] = d._id; });

    // 2. Create Designations with Minimal, Clean Salary Bands
    console.log('[Seeder] Creating designations with minimal salary bands...');
    const designations = await Designation.create([
      { title: 'Senior Software Engineer', department: deptMap.ENG, level: 'Senior', minSalary: 10000, maxSalary: 25000 },
      { title: 'Lead DevOps Specialist', department: deptMap.ENG, level: 'Lead', minSalary: 12000, maxSalary: 30000 },
      { title: 'Payroll & Compliance Lead', department: deptMap.FIN, level: 'Senior', minSalary: 10000, maxSalary: 25000 },
      { title: 'Financial Analyst', department: deptMap.FIN, level: 'Mid', minSalary: 8000, maxSalary: 20000 },
      { title: 'HR Business Partner', department: deptMap.HR, level: 'Senior', minSalary: 10000, maxSalary: 22000 },
      { title: 'Lead Product Designer', department: deptMap.PRD, level: 'Lead', minSalary: 12000, maxSalary: 26000 },
      { title: 'Enterprise Account Executive', department: deptMap.SLS, level: 'Senior', minSalary: 9000, maxSalary: 20000 },
    ]);

    const desigMap = {};
    designations.forEach(d => { desigMap[d.title] = d._id; });

    // 3. Create Indian Payroll Configuration with Minimal Salary Rules
    console.log('[Seeder] Creating minimal statutory payroll configuration for Forvex...');
    const payrollConfig = await PayrollConfig.create({
      companyName: 'Forvex Technologies India Pvt. Ltd.',
      companyEmail: 'payroll@forvex.in',
      companyAddress: 'Prestige Tech Park, Outer Ring Road, Marathahalli - Sarjapur, Bengaluru, Karnataka 560103',
      companyPhone: '+91 (080) 4123-4567',
      currency: { code: 'INR', symbol: '₹', name: 'Indian Rupees' },
      standardWorkingDaysPerMonth: 22,
      overtimeHourlyRateMultiplier: 1.5,
      taxRules: [
        { deductionName: 'TDS (Income Tax Slab 1 - 0%)', minSalary: 0, maxSalary: 25000, ratePercent: 0 },
        { deductionName: 'TDS (Income Tax Slab 2 - 5%)', minSalary: 25001, maxSalary: 50000, ratePercent: 5 },
      ],
      defaultAllowances: [
        { name: 'House Rent Allowance (HRA)', type: 'fixed', value: 2000, isTaxable: true },
        { name: 'Travel Allowance', type: 'fixed', value: 1000, isTaxable: false },
      ],
      defaultDeductions: [
        { name: 'Employee Provident Fund (EPF / PF)', type: 'fixed', value: 500, isTaxable: false },
        { name: 'Professional Tax (PT)', type: 'fixed', value: 200, isTaxable: false },
      ],
    });

    // 4. Create Employees with Indian Banking Details & Identifiers
    console.log('[Seeder] Creating Indian employee records...');
    const rawEmployees = [
      {
        employeeCode: 'EMP-1001',
        firstName: 'Rahul',
        lastName: 'Sharma',
        email: 'rahul.sharma@forvex.in',
        phone: '+91 98451 23456',
        dateOfBirth: new Date('1992-04-15'),
        dateOfJoining: new Date('2022-01-10'),
        department: deptMap.ENG,
        designation: desigMap['Senior Software Engineer'],
        employmentType: 'Full-time',
        status: 'Active',
        bankDetails: {
          bankName: 'HDFC Bank Ltd.',
          accountNumber: '50100234891234',
          ifscCode: 'HDFC0001234',
          panNumber: 'ABCPS1234E',
          uanNumber: '101234567890',
          taxId: 'ABCPS1234E',
        },
        salaryStructure: {
          baseSalary: 10000,
          allowances: [
            { name: 'House Rent Allowance (HRA)', type: 'fixed', value: 2000 },
            { name: 'Travel Allowance', type: 'fixed', value: 1000 },
          ],
          deductions: [
            { name: 'Employee Provident Fund (EPF / PF)', type: 'fixed', value: 500 },
            { name: 'Professional Tax (PT)', type: 'fixed', value: 200 },
          ],
        },
      },
      {
        employeeCode: 'EMP-1002',
        firstName: 'Priya',
        lastName: 'Patel',
        email: 'priya.patel@forvex.in',
        phone: '+91 97312 89012',
        dateOfBirth: new Date('1994-08-20'),
        dateOfJoining: new Date('2021-06-15'),
        department: deptMap.PRD,
        designation: desigMap['Lead Product Designer'],
        employmentType: 'Full-time',
        status: 'Active',
        bankDetails: {
          bankName: 'ICICI Bank Ltd.',
          accountNumber: '001105009843',
          ifscCode: 'ICIC0000456',
          panNumber: 'ABCPP5678K',
          uanNumber: '101234567891',
          taxId: 'ABCPP5678K',
        },
        salaryStructure: {
          baseSalary: 12000,
          allowances: [
            { name: 'House Rent Allowance (HRA)', type: 'fixed', value: 2000 },
            { name: 'Travel Allowance', type: 'fixed', value: 1000 },
          ],
          deductions: [
            { name: 'Employee Provident Fund (EPF / PF)', type: 'fixed', value: 500 },
            { name: 'Professional Tax (PT)', type: 'fixed', value: 200 },
          ],
        },
      },
      {
        employeeCode: 'EMP-1003',
        firstName: 'Ananya',
        lastName: 'Rao',
        email: 'hr@forvex.in',
        phone: '+91 98860 34567',
        dateOfBirth: new Date('1989-11-05'),
        dateOfJoining: new Date('2020-03-01'),
        department: deptMap.HR,
        designation: desigMap['HR Business Partner'],
        employmentType: 'Full-time',
        status: 'Active',
        bankDetails: {
          bankName: 'State Bank of India (SBI)',
          accountNumber: '31245678901',
          ifscCode: 'SBIN0007890',
          panNumber: 'ABCPA9012M',
          uanNumber: '101234567892',
          taxId: 'ABCPA9012M',
        },
        salaryStructure: {
          baseSalary: 14000,
          allowances: [
            { name: 'House Rent Allowance (HRA)', type: 'fixed', value: 2000 },
            { name: 'Travel Allowance', type: 'fixed', value: 1000 },
          ],
          deductions: [
            { name: 'Employee Provident Fund (EPF / PF)', type: 'fixed', value: 500 },
            { name: 'Professional Tax (PT)', type: 'fixed', value: 200 },
          ],
        },
      },
      {
        employeeCode: 'EMP-1004',
        firstName: 'Vikram',
        lastName: 'Iyer',
        email: 'payroll@forvex.in',
        phone: '+91 99001 56789',
        dateOfBirth: new Date('1987-02-14'),
        dateOfJoining: new Date('2019-09-12'),
        department: deptMap.FIN,
        designation: desigMap['Payroll & Compliance Lead'],
        employmentType: 'Full-time',
        status: 'Active',
        bankDetails: {
          bankName: 'Axis Bank Ltd.',
          accountNumber: '915010023456789',
          ifscCode: 'UTIB0001122',
          panNumber: 'ABCPI3456L',
          uanNumber: '101234567893',
          taxId: 'ABCPI3456L',
        },
        salaryStructure: {
          baseSalary: 15000,
          allowances: [
            { name: 'House Rent Allowance (HRA)', type: 'fixed', value: 2000 },
            { name: 'Travel Allowance', type: 'fixed', value: 1000 },
          ],
          deductions: [
            { name: 'Employee Provident Fund (EPF / PF)', type: 'fixed', value: 500 },
            { name: 'Professional Tax (PT)', type: 'fixed', value: 200 },
          ],
        },
      },
      {
        employeeCode: 'EMP-1005',
        firstName: 'Rajesh',
        lastName: 'Kumar',
        email: 'rajesh.kumar@forvex.in',
        phone: '+91 96112 67890',
        dateOfBirth: new Date('1995-07-22'),
        dateOfJoining: new Date('2023-04-18'),
        department: deptMap.SLS,
        designation: desigMap['Enterprise Account Executive'],
        employmentType: 'Full-time',
        status: 'Active',
        bankDetails: {
          bankName: 'Kotak Mahindra Bank',
          accountNumber: '7812003456',
          ifscCode: 'KKBK0008899',
          panNumber: 'ABCPK7890R',
          uanNumber: '101234567894',
          taxId: 'ABCPK7890R',
        },
        salaryStructure: {
          baseSalary: 11000,
          allowances: [
            { name: 'House Rent Allowance (HRA)', type: 'fixed', value: 2000 },
            { name: 'Travel Allowance', type: 'fixed', value: 1000 },
          ],
          deductions: [
            { name: 'Employee Provident Fund (EPF / PF)', type: 'fixed', value: 500 },
            { name: 'Professional Tax (PT)', type: 'fixed', value: 200 },
          ],
        },
      },
      {
        employeeCode: 'EMP-1006',
        firstName: 'Sneha',
        lastName: 'Reddy',
        email: 'sneha.reddy@forvex.in',
        phone: '+91 97405 89012',
        dateOfBirth: new Date('1996-09-10'),
        dateOfJoining: new Date('2024-02-01'),
        department: deptMap.ENG,
        designation: desigMap['Lead DevOps Specialist'],
        employmentType: 'Full-time',
        status: 'Active',
        bankDetails: {
          bankName: 'HDFC Bank Ltd.',
          accountNumber: '50100987654321',
          ifscCode: 'HDFC0005566',
          panNumber: 'ABCPS4321S',
          uanNumber: '101234567895',
          taxId: 'ABCPS4321S',
        },
        salaryStructure: {
          baseSalary: 16000,
          allowances: [
            { name: 'House Rent Allowance (HRA)', type: 'fixed', value: 2000 },
            { name: 'Travel Allowance', type: 'fixed', value: 1000 },
          ],
          deductions: [
            { name: 'Employee Provident Fund (EPF / PF)', type: 'fixed', value: 500 },
            { name: 'Professional Tax (PT)', type: 'fixed', value: 200 },
          ],
        },
      },
    ];

    const employees = await Employee.create(rawEmployees);
    const empMap = {};
    employees.forEach(e => { empMap[e.email] = e; });

    // 5. Create Users (Admin, HR, Payroll Manager, Employees)
    console.log('[Seeder] Creating user accounts with Indian credentials...');
    const users = await User.create([
      {
        name: 'Udhaya (Admin & HR)',
        email: 'udhaya@gmail.com',
        password: 'udhaya@123',
        role: 'Admin',
        isActive: true,
      },
      {
        name: 'Aditya Varma (Admin)',
        email: 'admin@forvex.in',
        password: 'Admin@123',
        role: 'Admin',
        isActive: true,
      },
      {
        name: 'Ananya Rao (HR Manager)',
        email: 'hr@forvex.in',
        password: 'Hr@123',
        role: 'HR',
        employeeId: empMap['hr@forvex.in']._id,
        isActive: true,
      },
      {
        name: 'Vikram Iyer (Payroll Manager)',
        email: 'payroll@forvex.in',
        password: 'Payroll@123',
        role: 'Payroll Manager',
        employeeId: empMap['payroll@forvex.in']._id,
        isActive: true,
      },
      {
        name: 'Rahul Sharma',
        email: 'rahul.sharma@forvex.in',
        password: 'Employee@123',
        role: 'Employee',
        employeeId: empMap['rahul.sharma@forvex.in']._id,
        isActive: true,
      },
      {
        name: 'Priya Patel',
        email: 'priya.patel@forvex.in',
        password: 'Employee@123',
        role: 'Employee',
        employeeId: empMap['priya.patel@forvex.in']._id,
        isActive: true,
      },
    ]);

    for (const u of users) {
      if (u.employeeId) {
        await Employee.findByIdAndUpdate(u.employeeId, { user: u._id });
      }
    }

    const adminUser = users[0];
    const payrollUser = users[2];

    // 6. Attendance records
    console.log('[Seeder] Creating attendance records...');
    const attendanceRecords = [];

    // September 2026
    for (const emp of employees) {
      attendanceRecords.push({
        employee: emp._id,
        month: 9,
        year: 2026,
        totalWorkingDays: 22,
        presentDays: 22,
        paidLeaveDays: 0,
        unpaidLeaveDays: 0,
        overtimeHours: emp.employeeCode === 'EMP-1006' ? 6 : 0,
      });
    }

    // October 2026 (EMP-1001 Rahul Sharma has 2 days LOP)
    for (const emp of employees) {
      const isLOP = emp.employeeCode === 'EMP-1001';
      attendanceRecords.push({
        employee: emp._id,
        month: 10,
        year: 2026,
        totalWorkingDays: 22,
        presentDays: isLOP ? 20 : 22,
        paidLeaveDays: isLOP ? 0 : 1,
        unpaidLeaveDays: isLOP ? 2 : 0,
        overtimeHours: emp.employeeCode === 'EMP-1001' ? 4 : 0,
        notes: isLOP ? '2 days unpaid emergency leave' : 'Normal schedule',
      });
    }

    await Attendance.create(attendanceRecords);

    // 7. Seed Sample Payroll Records in INR
    console.log('[Seeder] Creating demo payroll records in INR (₹)...');

    // September 2026: Approved & Paid records
    for (const emp of employees) {
      const att = attendanceRecords.find(a => a.employee.toString() === emp._id.toString() && a.month === 9);
      const calc = calculatePayroll({
        employee: emp,
        attendance: att,
        config: payrollConfig,
      });

      await PayrollRecord.create({
        employee: emp._id,
        month: 9,
        year: 2026,
        payPeriod: 'September 2026',
        workingDays: calc.workingDays,
        presentDays: calc.presentDays,
        unpaidLeaveDays: calc.unpaidLeaveDays,
        overtimeHours: calc.overtimeHours,
        currency: '₹',
        basicSalary: calc.basicSalary,
        earnings: calc.earnings,
        grossSalary: calc.grossSalary,
        deductions: calc.deductions,
        lopDeduction: calc.lopDeduction,
        totalDeductions: calc.totalDeductions,
        netSalary: calc.netSalary,
        netSalaryInWords: calc.netSalaryInWords,
        status: 'Paid',
        paymentDate: new Date('2026-09-30'),
        paymentReference: `NEFT-SEP26-${emp.employeeCode}`,
        paymentMethod: 'Bank Transfer',
        notes: 'September 2026 salary disbursement via NEFT',
        createdBy: payrollUser._id,
        approvedBy: adminUser._id,
        auditTrail: [
          {
            action: 'CREATED',
            changedBy: payrollUser._id,
            changedByName: payrollUser.name,
            fromStatus: '',
            toStatus: 'Draft',
            timestamp: new Date('2026-09-25'),
            notes: 'Generated September 2026 draft',
          },
          {
            action: 'STATUS_CHANGE_TO_APPROVED',
            changedBy: adminUser._id,
            changedByName: adminUser.name,
            fromStatus: 'Under Review',
            toStatus: 'Approved',
            timestamp: new Date('2026-09-28'),
            notes: 'Approved without remarks',
          },
          {
            action: 'STATUS_CHANGE_TO_PAID',
            changedBy: payrollUser._id,
            changedByName: payrollUser.name,
            fromStatus: 'Approved',
            toStatus: 'Paid',
            timestamp: new Date('2026-09-30'),
            notes: 'Disbursed via bank transfer',
          },
        ],
      });
    }

    // October 2026: Records in review and draft
    const octStatuses = ['Under Review', 'Under Review', 'Draft', 'Approved', 'Draft', 'Under Review'];
    for (let i = 0; i < employees.length; i++) {
      const emp = employees[i];
      const status = octStatuses[i % octStatuses.length];
      const att = attendanceRecords.find(a => a.employee.toString() === emp._id.toString() && a.month === 10);
      const calc = calculatePayroll({
        employee: emp,
        attendance: att,
        config: payrollConfig,
        customBonuses: emp.employeeCode === 'EMP-1002' ? [{ name: 'Diwali Performance Bonus', amount: 15000 }] : [],
      });

      await PayrollRecord.create({
        employee: emp._id,
        month: 10,
        year: 2026,
        payPeriod: 'October 2026',
        workingDays: calc.workingDays,
        presentDays: calc.presentDays,
        unpaidLeaveDays: calc.unpaidLeaveDays,
        overtimeHours: calc.overtimeHours,
        currency: '₹',
        basicSalary: calc.basicSalary,
        earnings: calc.earnings,
        grossSalary: calc.grossSalary,
        deductions: calc.deductions,
        lopDeduction: calc.lopDeduction,
        totalDeductions: calc.totalDeductions,
        netSalary: calc.netSalary,
        netSalaryInWords: calc.netSalaryInWords,
        status,
        notes: `October 2026 payroll run - ${status}`,
        createdBy: payrollUser._id,
        reviewedBy: status === 'Under Review' || status === 'Approved' ? payrollUser._id : null,
        approvedBy: status === 'Approved' ? adminUser._id : null,
        auditTrail: [
          {
            action: 'CREATED',
            changedBy: payrollUser._id,
            changedByName: payrollUser.name,
            fromStatus: '',
            toStatus: 'Draft',
            timestamp: new Date('2026-10-01'),
            notes: 'Generated October 2026 draft',
          },
        ],
      });
    }

    console.log('[Seeder] Creating sample leaves...');
    await Leave.create([
      {
        employee: empMap['rahul.sharma@forvex.in']._id,
        leaveType: 'Unpaid',
        startDate: new Date('2026-10-05'),
        endDate: new Date('2026-10-06'),
        days: 2,
        reason: 'Personal family emergency',
        status: 'Approved',
        reviewedBy: adminUser._id,
        reviewNotes: 'Approved - 2 days LOP applied to October salary',
      },
      {
        employee: empMap['priya.patel@forvex.in']._id,
        leaveType: 'Annual',
        startDate: new Date('2026-10-25'),
        endDate: new Date('2026-10-28'),
        days: 3,
        reason: 'Festive season vacation',
        status: 'Pending',
      },
    ]);

    console.log('=====================================================');
    console.log('✅ Forvex EMS seed completed with minimal salary numbers!');
    console.log('Demo Credentials:');
    console.log('  Admin & HR:      udhaya@gmail.com   / udhaya@123');
    console.log('  Admin (Alt):     admin@forvex.in    / Admin@123');
    console.log('  HR Manager:      hr@forvex.in       / Hr@123');
    console.log('  Payroll Manager: payroll@forvex.in  / Payroll@123');
    console.log('  Employee 1:      rahul.sharma@forvex.in / Employee@123');
    console.log('  Employee 2:      priya.patel@forvex.in  / Employee@123');
    console.log('=====================================================');

    await closeDB();
    process.exit(0);
  } catch (err) {
    console.error('[Seeder] Error during database seeding:', err);
    await closeDB();
    process.exit(1);
  }
};

seedData();
