function clampPage(page) {
  const p = parseInt(page, 10);
  return Number.isNaN(p) || p < 1 ? 1 : p;
}

function clampLimit(limit) {
  const l = parseInt(limit, 10);
  if (Number.isNaN(l)) return 25;
  return Math.min(Math.max(l, 1), 200);
}

module.exports = { clampPage, clampLimit };
