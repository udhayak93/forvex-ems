const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const request = require('supertest');
const app = require('../src/server');
const User = require('../src/models/User');
const Employee = require('../src/models/Employee');
const Department = require('../src/models/Department');
const Designation = require('../src/models/Designation');
const PayrollConfig = require('../src/models/PayrollConfig');
const PayrollRecord = require('../src/models/PayrollRecord');

let mongoServer;
let adminToken;
let payrollManagerToken;
let employeeToken;
let testEmployee;
let testDepartment;
let testDesignation;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());

  // Setup department and designation
  testDepartment = await Department.create({ name: 'Engineering', code: 'ENG' });
  testDesignation = await Designation.create({
    title: 'Senior Engineer',
    department: testDepartment._id,
  });

  // Setup test employee
  testEmployee = await Employee.create({
    employeeCode: 'EMP-9001',
    firstName: 'Alice',
    lastName: 'Wong',
    email: 'alice.wong@nexus.internal',
    department: testDepartment._id,
    designation: testDesignation._id,
    salaryStructure: {
      baseSalary: 6000,
      allowances: [{ name: 'HRA', type: 'percentage', value: 20 }],
      deductions: [{ name: 'PF', type: 'percentage', value: 5 }],
    },
  });

  // Setup default config
  await PayrollConfig.create({
    standardWorkingDaysPerMonth: 22,
    taxRules: [{ minSalary: 0, maxSalary: 10000, ratePercent: 5, deductionName: 'Income Tax' }],
  });

  // Create Users & generate tokens
  const adminUser = await User.create({
    name: 'Admin Test',
    email: 'admin.test@nexus.internal',
    password: 'Password@123',
    role: 'Admin',
  });

  const payrollUser = await User.create({
    name: 'Payroll Lead',
    email: 'payroll.test@nexus.internal',
    password: 'Password@123',
    role: 'Payroll Manager',
  });

  const empUser = await User.create({
    name: 'Alice Wong',
    email: 'alice.wong@nexus.internal',
    password: 'Password@123',
    role: 'Employee',
    employeeId: testEmployee._id,
  });

  // Login to get tokens
  const adminLogin = await request(app).post('/api/auth/login').send({
    email: 'admin.test@nexus.internal',
    password: 'Password@123',
  });
  adminToken = adminLogin.body.token;

  const payrollLogin = await request(app).post('/api/auth/login').send({
    email: 'payroll.test@nexus.internal',
    password: 'Password@123',
  });
  payrollManagerToken = payrollLogin.body.token;

  const empLogin = await request(app).post('/api/auth/login').send({
    email: 'alice.wong@nexus.internal',
    password: 'Password@123',
  });
  employeeToken = empLogin.body.token;
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('Payroll Processing Workflow & Duplicate Prevention', () => {
  let createdRecordId;

  test('successfully generates payroll for a monthly period in Draft status', async () => {
    const res = await request(app)
      .post('/api/payroll/process')
      .set('Authorization', `Bearer ${payrollManagerToken}`)
      .send({
        month: 11,
        year: 2026,
        employeeIds: [testEmployee._id.toString()],
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.summary.totalCreated).toBe(1);
    expect(res.body.created.length).toBe(1);

    const record = res.body.created[0];
    expect(record.status).toBe('Draft');
    expect(record.month).toBe(11);
    expect(record.year).toBe(2026);
    expect(record.auditTrail.length).toBeGreaterThanOrEqual(1);

    createdRecordId = record._id;
  });

  test('prevents duplicate payroll run for the same employee and period', async () => {
    const res = await request(app)
      .post('/api/payroll/process')
      .set('Authorization', `Bearer ${payrollManagerToken}`)
      .send({
        month: 11,
        year: 2026,
        employeeIds: [testEmployee._id.toString()],
      });

    expect(res.status).toBe(201);
    expect(res.body.summary.totalCreated).toBe(0);
    expect(res.body.summary.totalSkipped).toBe(1);
    expect(res.body.skipped[0].reason).toContain('Payroll already exists');
  });

  test('transitions payroll status from Draft -> Under Review -> Approved -> Paid with audit log', async () => {
    // 1. Move to Under Review
    const reviewRes = await request(app)
      .patch(`/api/payroll/${createdRecordId}/status`)
      .set('Authorization', `Bearer ${payrollManagerToken}`)
      .send({
        status: 'Under Review',
        notes: 'Submitted for verification',
      });
    expect(reviewRes.status).toBe(200);
    expect(reviewRes.body.data.status).toBe('Under Review');

    // 2. Move to Approved
    const approveRes = await request(app)
      .patch(`/api/payroll/${createdRecordId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        status: 'Approved',
        notes: 'Approved by Admin',
      });
    expect(approveRes.status).toBe(200);
    expect(approveRes.body.data.status).toBe('Approved');
    expect(approveRes.body.data.approvedBy).toBeDefined();

    // 3. Move to Paid
    const paidRes = await request(app)
      .patch(`/api/payroll/${createdRecordId}/status`)
      .set('Authorization', `Bearer ${payrollManagerToken}`)
      .send({
        status: 'Paid',
        paymentReference: 'TXN-TEST-1234',
        paymentMethod: 'Direct Deposit',
      });
    expect(paidRes.status).toBe(200);
    expect(paidRes.body.data.status).toBe('Paid');
    expect(paidRes.body.data.paymentDate).toBeDefined();

    // 4. Verify audit trail stored all transitions
    const finalRecord = await PayrollRecord.findById(createdRecordId);
    expect(finalRecord.auditTrail.length).toBe(4); // CREATED + REVIEW + APPROVE + PAID
  });
});
