import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { BarChartGraph } from '../src/components/charts/BarChartGraph';
import { PieChartGraph } from '../src/components/charts/PieChartGraph';
import { LineChartGraph } from '../src/components/charts/LineChartGraph';
import { Sparkline } from '../src/components/charts/Sparkline';
import { DepartmentPerformanceCard } from '../src/components/charts/DepartmentPerformanceCard';
import { RecentNotificationsCard } from '../src/components/common/RecentNotificationsCard';

describe('Chart & Analytics Components Suite', () => {
  const sampleDepartmentData = [
    { _id: 'Engineering', totalAmount: 32000, totalGross: 35000, totalDeductions: 3000, employeeCount: 2 },
    { _id: 'Finance', totalAmount: 18000, totalGross: 20000, totalDeductions: 2000, employeeCount: 1 },
    { _id: 'HR', totalAmount: 15000, totalGross: 16500, totalDeductions: 1500, employeeCount: 1 },
  ];

  it('renders BarChartGraph with titles and bars', () => {
    render(
      <BarChartGraph
        title="Department Payroll Outlay"
        subtitle="Test subtitle"
        data={sampleDepartmentData}
        currency="₹"
      />
    );

    expect(screen.getByText('Department Payroll Outlay')).toBeDefined();
    expect(screen.getByText('Test subtitle')).toBeDefined();
    expect(screen.getByText('Engineering')).toBeDefined();
    expect(screen.getByText('Finance')).toBeDefined();
    expect(screen.getByText('HR')).toBeDefined();
  });

  it('switches metric mode in BarChartGraph when toggled', () => {
    render(
      <BarChartGraph
        title="Department Payroll Outlay"
        data={sampleDepartmentData}
        currency="₹"
        showToggle={true}
      />
    );

    const grossBtn = screen.getByText('Gross Outlay');
    fireEvent.click(grossBtn);
    expect(grossBtn.className).toContain('btn-primary');

    const headcountBtn = screen.getByText('Headcount');
    fireEvent.click(headcountBtn);
    expect(headcountBtn.className).toContain('btn-primary');
  });

  it('renders PieChartGraph with slices and legend', () => {
    render(
      <PieChartGraph
        title="Budget Allocation Share"
        subtitle="Test pie subtitle"
        data={sampleDepartmentData}
        currency="₹"
        donut={true}
      />
    );

    expect(screen.getByText('Budget Allocation Share')).toBeDefined();
    expect(screen.getByText('Engineering')).toBeDefined();
    expect(screen.getByText('Finance')).toBeDefined();
  });

  it('renders Sparkline curve and bars without crashing', () => {
    const { container: curveContainer } = render(
      <Sparkline data={[10, 20, 15, 30]} color="#3b82f6" type="curve" />
    );
    expect(curveContainer.querySelector('path')).toBeDefined();

    const { container: barsContainer } = render(
      <Sparkline data={[10, 20, 15, 30]} color="#10b981" type="bars" />
    );
    expect(barsContainer.querySelectorAll('rect').length).toBe(4);
  });

  it('renders LineChartGraph with Weekly Attendance Trend data', () => {
    const attendanceData = [
      { day: 'Mon', rate: 72, present: 924 },
      { day: 'Tue', rate: 78, present: 1001 },
      { day: 'Wed', rate: 74, present: 950 },
      { day: 'Thu', rate: 84, present: 1078 },
      { day: 'Fri', rate: 81, present: 1040 },
      { day: 'Sat', rate: 87, present: 1117 },
      { day: 'Sun', rate: 96, present: 1232 },
    ];

    render(
      <LineChartGraph
        title="Weekly Attendance Trend"
        data={attendanceData}
        totalHeadcount={1284}
      />
    );

    expect(screen.getByText('Weekly Attendance Trend')).toBeDefined();
    expect(screen.getByText('Mon')).toBeDefined();
    expect(screen.getByText('Sun')).toBeDefined();
  });

  it('renders DepartmentPerformanceCard with department completion rates', () => {
    const depts = [
      { name: 'Engineering', percentage: 94, color: '#818cf8' },
      { name: 'Marketing', percentage: 82, color: '#34d399' },
    ];

    render(
      <BrowserRouter>
        <DepartmentPerformanceCard data={depts} />
      </BrowserRouter>
    );

    expect(screen.getByText('Department Performance')).toBeDefined();
    expect(screen.getByText('Engineering')).toBeDefined();
    expect(screen.getByText('94%')).toBeDefined();
    expect(screen.getByText('Marketing')).toBeDefined();
    expect(screen.getByText('82%')).toBeDefined();
  });

  it('renders RecentNotificationsCard and filters unread notifications', () => {
    const notifications = [
      { id: '1', title: 'Employee Birthday', description: 'Wish him', type: 'birthday', timeAgo: '2h', unread: true },
      { id: '2', title: 'Salary Processed', description: 'Completed', type: 'payroll', timeAgo: '1d', unread: false },
    ];

    render(
      <RecentNotificationsCard
        title="Recent Notifications"
        notifications={notifications}
      />
    );

    expect(screen.getByText('Recent Notifications')).toBeDefined();
    expect(screen.getByText('Employee Birthday')).toBeDefined();
    expect(screen.getByText('Salary Processed')).toBeDefined();

    // Click Unread filter
    const unreadBtn = screen.getByText('Unread');
    fireEvent.click(unreadBtn);
    expect(screen.getByText('Employee Birthday')).toBeDefined();
    expect(screen.queryByText('Salary Processed')).toBeNull();
  });
});
