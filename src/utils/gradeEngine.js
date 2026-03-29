export const genId = () => Math.random().toString(36).slice(2, 9);

export function pctToGrade(p) {
  if (p >= 97) return 1.00; if (p >= 93) return 1.25; if (p >= 89) return 1.50;
  if (p >= 85) return 1.75; if (p >= 81) return 2.00; if (p >= 77) return 2.25;
  if (p >= 75) return 2.50; if (p >= 70) return 2.75; if (p >= 65) return 3.00;
  return 5.00;
}

export function calcCompAvg(items) {
  if (!items?.length) return 0;
  return items.reduce((s, i) => s + (i.score / i.total) * 100, 0) / items.length;
}

export function calcStanding(comps) {
  let t = 0, w = 0;
  Object.values(comps).forEach(c => { t += calcCompAvg(c.items) * c.weight; w += c.weight; });
  return w > 0 ? t / w : 0;
}

export function calcSemGrade(subjects) {
  if (!subjects?.length) return { gpa: 0, pct: '0.0' };
  let tp = 0, tu = 0;
  subjects.forEach(s => { const cs = calcStanding(s.components); tp += cs * (s.units || 0); tu += s.units || 0; });
  const pct = tu > 0 ? tp / tu : 0;
  return { gpa: pctToGrade(pct), pct: pct.toFixed(1) };
}

export const avg = items =>
  !items?.length ? 0 : items.reduce((a, i) => a + (i.score / i.total) * 100, 0) / items.length;
