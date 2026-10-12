/**
 * Converts a numeric amount to words in the Indian Numbering System (Crores, Lakhs, Thousands, Hundreds).
 * @param {number} amount
 * @param {string} currencyName e.g. "Rupees"
 * @returns {string} e.g. "One Lakh Twenty-Five Thousand Four Hundred Rupees Only"
 */
function numberToWords(amount, currencyName = 'Rupees') {
  if (amount === undefined || amount === null || isNaN(amount)) {
    return `Zero ${currencyName} Only`;
  }

  const num = Math.floor(Math.abs(amount));
  if (num === 0) return `Zero ${currencyName} Only`;

  const ones = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
    'Seventeen', 'Eighteen', 'Nineteen'
  ];

  const tens = [
    '', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'
  ];

  function numToWordsUnderThousand(n) {
    let str = '';
    if (n >= 100) {
      str += ones[Math.floor(n / 100)] + ' Hundred ';
      n %= 100;
    }
    if (n >= 20) {
      str += tens[Math.floor(n / 10)] + ' ';
      n %= 10;
    }
    if (n > 0) {
      str += ones[n] + ' ';
    }
    return str.trim();
  }

  const parts = [];

  // Crores (1 Crore = 10,000,000)
  const crore = Math.floor(num / 10000000);
  let rem = num % 10000000;
  if (crore > 0) {
    parts.push(`${numToWordsUnderThousand(crore)} Crore`);
  }

  // Lakhs (1 Lakh = 100,000)
  const lakh = Math.floor(rem / 100000);
  rem %= 100000;
  if (lakh > 0) {
    parts.push(`${numToWordsUnderThousand(lakh)} Lakh`);
  }

  // Thousands (1 Thousand = 1,000)
  const thousand = Math.floor(rem / 1000);
  rem %= 1000;
  if (thousand > 0) {
    parts.push(`${numToWordsUnderThousand(thousand)} Thousand`);
  }

  // Hundreds & Remaining units
  if (rem > 0) {
    parts.push(numToWordsUnderThousand(rem));
  }

  const result = parts.join(' ').trim();
  return `${result} ${currencyName} Only`;
}

module.exports = { numberToWords };
