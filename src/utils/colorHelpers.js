import { T } from '../constants/tokens';

export function gradeChip(g) {
  const v = parseFloat(g);
  if (v <= 1.25) return { bg: T.green100,  text: T.green700,  border: T.green200 };
  if (v <= 1.75) return { bg: '#e4f7ec',   text: '#1a6e3a',   border: '#90d4ac' };
  if (v <= 2.25) return { bg: T.amber100,  text: T.amber700,  border: T.amber200 };
  if (v <= 2.75) return { bg: T.orange100, text: T.orange700, border: T.orange200 };
  if (v <= 3.00) return { bg: '#fff4f4',   text: '#8a2020',   border: '#f0b0b0' };
  return               { bg: T.red100,    text: T.red700,    border: T.red200 };
}

export function barHue(p) {
  if (p >= 90) return '#1e9660';
  if (p >= 80) return '#4a9820';
  if (p >= 70) return '#c89020';
  if (p >= 60) return '#c86010';
  return '#c83030';
}
