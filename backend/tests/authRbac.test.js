const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const request = require('supertest');
const app = require('../src/server');
const User = require('../src/models/User');
const Employee = require('../src/models/Employee');
const Department = require('../src/models/Department');
const Designation = require('../src/models/Designation');
const PayrollRecord = require('../src/models/PayrollRecord');

let mongoServer;
let employee1Token;
let employee2Token;
let emp1;
let emp2;
let payslip1;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());

  const dept = await Department.create({ name: 'HR', code: 'HR' });
  const desig = await Designation.create({ title: 'Analyst', department: dept._id });

  emp1 = await Employee.create({
    employeeCode: 'EMP-7001',
    firstName: 'UserOne',
    lastName: 'Test',
    email: 'user1@nexus.internal',
    department: dept._id,
    designation: desig._id,
    salaryStructure: { baseSalary: 4000 },
  });

  emp2 = await Employee.create({
    employeeCode: 'EMP-7002',
    firstName: 'UserTwo',
    lastName: 'Test',
    email: 'user2@nexus.internal',
    department: dept._id,
    designation: desig._id,
    salaryStructure: { baseSalary: 4500 },
  });

  await User.create({
    name: 'User One',
    email: 'user1@nexus.internal',
    password: 'Password@123',
    role: 'Employee',
    employeeId: emp1._id,
  });

  await User.create({
    name: 'User Two',
    email: 'user2@nexus.internal',
    password: 'Password@123',
    role: 'Employee',
    employeeId: emp2._id,
  });

  const login1 = await request(app).post('/api/auth/login').send({
    email: 'user1@nexus.internal',
    password: 'Password@123',
  });
  employee1Token = login1.body.token;

  const login2 = await request(app).post('/api/auth/login').send({
    email: 'user2@nexus.internal',
    password: 'Password@123',
  });
  employee2Token = login2.body.token;

  payslip1 = await PayrollRecord.create({
    employee: emp1._id,
    month: 10,
    year: 2026,
    payPeriod: 'October 2026',
    basicSalary: 4000,
    grossSalary: 4000,
    deductions: [],
    totalDeductions: 0,
    netSalary: 4000,
    status: 'Approved',
  });
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('User Registration & Sign In Flow', () => {
  test('successfully registers new account and allows signing in with credentials', async () => {
    const regRes = await request(app).post('/api/auth/register').send({
      name: 'Kavita Menon',
      email: 'kavita.menon@nexus.co.in',
      password: 'MySecretPassword@123',
      role: 'Employee',
    });

    expect(regRes.status).toBe(201);
    expect(regRes.body.success).toBe(true);
    expect(regRes.body.user.name).toBe('Kavita Menon');
    expect(regRes.body.user.employeeCode).toBeDefined();

    // Now sign in with the newly created account
    const loginRes = await request(app).post('/api/auth/login').send({
      email: 'kavita.menon@nexus.co.in',
      password: 'MySecretPassword@123',
    });

    expect(loginRes.status).toBe(200);
    expect(loginRes.body.success).toBe(true);
    expect(loginRes.body.token).toBeDefined();
    expect(loginRes.body.user.email).toBe('kavita.menon@nexus.co.in');
  });

  test('rejects registration with existing email address', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Duplicate User',
      email: 'kavita.menon@nexus.co.in',
      password: 'Password@123',
    });

    expect(res.status).toBe(400);
    expect(res.body.message).toContain('already exists');
  });

  test('strictly enforces Employee role and prevents public sign-up as Admin or HR', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Sneaky User',
      email: 'sneaky.user@forvex.in',
      password: 'AdminPassword@123',
      role: 'Admin', // Attempting to sign up as Admin publicly
    });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    // Role must be Employee, NEVER Admin
    expect(res.body.user.role).toBe('Employee');

    const createdUser = await User.findOne({ email: 'sneaky.user@forvex.in' });
    expect(createdUser.role).toBe('Employee');
  });
});

describe('RBAC Security & Payslip Access Restrictions', () => {
  test('unauthenticated request is rejected with 401', async () => {
    const res = await request(app).get('/api/payroll');
    expect(res.status).toBe(401);
  });

  test('regular employee is forbidden from processing payroll (403)', async () => {
    const res = await request(app)
      .post('/api/payroll/process')
      .set('Authorization', `Bearer ${employee1Token}`)
      .send({ month: 10, year: 2026 });
    expect(res.status).toBe(403);
  });

  test('employee can successfully access their own approved payslip', async () => {
    const res = await request(app)
      .get(`/api/payroll/${payslip1._id}`)
      .set('Authorization', `Bearer ${employee1Token}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data._id.toString()).toBe(payslip1._id.toString());
  });

  test('employee is forbidden (403) from accessing another employee’s payslip', async () => {
    const res = await request(app)
      .get(`/api/payroll/${payslip1._id}`)
      .set('Authorization', `Bearer ${employee2Token}`);
    expect(res.status).toBe(403);
    expect(res.body.message).toContain('Access Denied');
  });
});
