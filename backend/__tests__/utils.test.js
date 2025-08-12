const { clampPage, clampLimit } = require('../src/setup/utils/validation');
const { mapRecord } = require('../src/setup/services/fetchAndStore');

test('clampPage clamps to >=1 and defaults to 1', () => {
  expect(clampPage(0)).toBe(1);
  expect(clampPage(-5)).toBe(1);
  expect(clampPage('foo')).toBe(1);
  expect(clampPage(3)).toBe(3);
});

test('clampLimit within 1..200 and default 25', () => {
  expect(clampLimit('foo')).toBe(25);
  expect(clampLimit(0)).toBe(1);
  expect(clampLimit(500)).toBe(200);
  expect(clampLimit(50)).toBe(50);
});

test('mapRecord extracts license and name robustly', () => {
  const rec = { license_number: 'ABC123', driver_name: 'Jane Doe', borough: 'Queens', active: 'true' };
  const m = mapRecord(rec);
  expect(m.license).toBe('ABC123');
  expect(m.name).toBe('Jane Doe');
  expect(m.borough).toBe('Queens');
  expect(m.active).toBe(true);
});
