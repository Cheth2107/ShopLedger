var test = require('node:test');
var assert = require('node:assert/strict');
var invoice = require('../lib/invoice');
var pricing = require('../lib/pricing');

test('invoice matches checkout for mixed HSN slabs and capped SAVE10', function () {
  var order = {
    items: [
      { name: 'Rice', hsn: '1006', price: 1120, qty: 1 },
      { name: 'Ghee', hsn: '0405', price: 560, qty: 2 }
    ],
    coupon: 'SAVE10'
  };
  var billed = pricing.computeTotals(order.items, order.coupon);
  var printed = invoice.computeInvoiceFigures(order);
  var { rows, ...totals } = printed;

  assert.equal(billed.discount, 150);
  assert.deepEqual(totals, {
    subtotal: billed.subtotal,
    discount: billed.discount,
    tax: billed.tax,
    cgst: billed.cgst,
    sgst: billed.sgst,
    total: billed.total
  });
  assert.deepEqual(rows.map(function (row) { return [row.gstPercent, row.lineTax]; }), [
    [5, 52.25],
    [12, 125.4]
  ]);
});

// Checkout snapshots carry HSN and typically omit gstRate.
test('#1001-style invoice uses the 5% and 12% HSN slabs', function () {
  var order = {
    items: [
      { name: 'Rice', hsn: '1006', price: 100, qty: 2 },
      { name: 'Ghee', hsn: '0405', price: 100, qty: 1 }
    ],
    coupon: ''
  };
  var printed = invoice.computeInvoiceFigures(order);
  var billed = pricing.computeTotals(order.items, order.coupon);

  assert.deepEqual(printed, {
    subtotal: 300, discount: 0, tax: 22, cgst: 11, sgst: 11, total: 322,
    rows: [
      { name: 'Rice', sku: '-', hsn: '1006', qty: 2, price: 100, gstPercent: 5, line: 200, lineTax: 10 },
      { name: 'Ghee', sku: '-', hsn: '0405', qty: 1, price: 100, gstPercent: 12, line: 100, lineTax: 12 }
    ]
  });
  assert.deepEqual(billed.lines.map(function (line) { return line.gstPercent; }), [5, 12]);
  assert.equal(billed.tax, 22);
  assert.equal(billed.total, 322);
});

test('#1002-style invoice applies SAVE10 before GST', function () {
  var order = {
    items: [{ name: 'Rice', hsn: '1006', price: 200, qty: 3 }],
    coupon: 'SAVE10'
  };
  var printed = invoice.computeInvoiceFigures(order);
  var billed = pricing.computeTotals(order.items, order.coupon);

  assert.deepEqual(printed, {
    subtotal: 600, discount: 60, tax: 27, cgst: 13.5, sgst: 13.5, total: 567,
    rows: [
      { name: 'Rice', sku: '-', hsn: '1006', qty: 3, price: 200, gstPercent: 5, line: 600, lineTax: 27 }
    ]
  });
  assert.equal(billed.discount, 60);
  assert.equal(billed.tax, 27);
  assert.equal(billed.total, 567);
});

test('#1004-style invoice caps SAVE10 at 150', function () {
  var order = {
    items: [{ name: 'Rice', hsn: '1006', price: 1120, qty: 2 }],
    coupon: 'SAVE10'
  };
  var printed = invoice.computeInvoiceFigures(order);
  var billed = pricing.computeTotals(order.items, order.coupon);

  assert.deepEqual(printed, {
    subtotal: 2240, discount: 150, tax: 104.5, cgst: 52.25, sgst: 52.25, total: 2194.5,
    rows: [
      { name: 'Rice', sku: '-', hsn: '1006', qty: 2, price: 1120, gstPercent: 5, line: 2240, lineTax: 104.5 }
    ]
  });
  assert.equal(billed.subtotal, 2240);
  assert.equal(billed.discount, 150);
  assert.equal(billed.tax, 104.5);
  assert.equal(billed.total, 2194.5);
});

test('CURRENT BEHAVIOUR: #1008-style invoice matches checkout at 18% without a coupon', function () {
  var order = {
    items: [
      { name: 'Tea', hsn: '0902', price: 150, qty: 2 },
      { name: 'Coffee', hsn: '0901', price: 200, qty: 1, gstRate: 18 }
    ],
    coupon: ''
  };
  var printed = invoice.computeInvoiceFigures(order);
  var billed = pricing.computeTotals(order.items, order.coupon);

  assert.deepEqual(printed, {
    subtotal: 500, discount: 0, tax: 90, cgst: 45, sgst: 45, total: 590,
    rows: [
      { name: 'Tea', sku: '-', hsn: '0902', qty: 2, price: 150, gstPercent: 18, line: 300, lineTax: 54 },
      { name: 'Coffee', sku: '-', hsn: '0901', qty: 1, price: 200, gstPercent: 18, line: 200, lineTax: 36 }
    ]
  });
  assert.equal(billed.subtotal, printed.subtotal);
  assert.equal(billed.discount, printed.discount);
  assert.equal(billed.tax, printed.tax);
  assert.equal(billed.cgst, printed.cgst);
  assert.equal(billed.sgst, printed.sgst);
  assert.equal(billed.total, printed.total);
});
