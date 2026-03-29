import { gradeChip } from '../../utils/colorHelpers';

export default function GradeTag({ value }) {
  const c = gradeChip(value);
  return (
    <span
      style={{ background: c.bg, color: c.text, borderColor: c.border }}
      className="border rounded-[5px] px-2.5 py-[3px] text-[12px] font-bold font-mono tracking-[0.5px]"
    >
      {value}
    </span>
  );
}
