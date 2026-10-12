/**
 * Formats a number into a localized Indian currency string (INR - Lakhs & Crores grouping).
 * @param {number} amount
 * @param {string} symbol
 */
export function formatCurrency(amount, symbol = '₹') {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return `${symbol}0.00`;
  }
  const formatted = Number(amount).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${symbol}${formatted}`;
}

/**
 * Formats an ISO date string into readable format e.g. "12 Oct 2026"
 * @param {string|Date} dateStr
 */
export function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Returns CSS badge class based on status name
 * @param {string} status
 */
export function getStatusBadgeClass(status) {
  switch (status) {
    case 'Draft':
      return 'badge-draft';
    case 'Under Review':
    case 'In Review':
      return 'badge-under-review';
    case 'Approved':
      return 'badge-approved';
    case 'Paid':
      return 'badge-paid';
    case 'Active':
      return 'badge-active';
    case 'On Leave':
      return 'badge-on-leave';
    case 'Inactive':
    case 'Rejected':
      return 'badge-inactive';
    default:
      return 'badge-secondary';
  }
}
