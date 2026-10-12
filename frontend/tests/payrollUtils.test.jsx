import { describe, it, expect } from 'vitest';
import { formatCurrency, formatDate, getStatusBadgeClass } from '../src/utils/formatters';

describe('Frontend Payroll Utilities & Formatters (Indian Localization)', () => {
  it('correctly formats numeric currencies with Indian Rupee symbol and en-IN Lakhs grouping', () => {
    // 50000 in en-IN -> ₹50,000.00
    expect(formatCurrency(50000)).toBe('₹50,000.00');
    // 125000 in en-IN -> ₹1,25,000.00 (Lakhs grouping: 2, 2, 3)
    expect(formatCurrency(125000)).toBe('₹1,25,000.00');
    // 10000000 in en-IN -> ₹1,00,00,000.00 (Crores grouping)
    expect(formatCurrency(10000000)).toBe('₹1,00,00,000.00');
    expect(formatCurrency(0)).toBe('₹0.00');
    expect(formatCurrency(null)).toBe('₹0.00');
  });

  it('correctly formats currencies with custom symbols ($ , €)', () => {
    expect(formatCurrency(4500, '$')).toBe('$4,500.00');
    expect(formatCurrency(3200, '€')).toBe('€3,200.00');
  });

  it('correctly maps status strings to badge CSS classes', () => {
    expect(getStatusBadgeClass('Draft')).toBe('badge-draft');
    expect(getStatusBadgeClass('Under Review')).toBe('badge-under-review');
    expect(getStatusBadgeClass('Approved')).toBe('badge-approved');
    expect(getStatusBadgeClass('Paid')).toBe('badge-paid');
    expect(getStatusBadgeClass('Active')).toBe('badge-active');
    expect(getStatusBadgeClass('On Leave')).toBe('badge-on-leave');
    expect(getStatusBadgeClass('Inactive')).toBe('badge-inactive');
  });

  it('formats dates cleanly in Indian locale', () => {
    expect(formatDate(null)).toBe('—');
    const formatted = formatDate('2026-10-12T00:00:00.000Z');
    expect(formatted).toContain('2026');
  });
});
