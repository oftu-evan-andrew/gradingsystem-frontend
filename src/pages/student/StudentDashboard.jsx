import { useState, useMemo } from 'react';
import GradeTag from '../../components/ui/GradeTag';
import ProgressBar from '../../components/ui/ProgressBar';
import Avatar from '../../components/ui/Avatar';
import SectionBanner from '../../components/ui/SectionBanner';
import SubjectDetailModal from '../../components/ui/SubjectDetailModal';
import { COMP_META } from '../../constants/compMeta';
import { avg } from '../../utils/gradeEngine';
import { gradeChip, barHue } from '../../utils/colorHelpers';
import { T } from '../../constants/tokens';

export default function StudentDashboard({ student, subjects }) {
  const [selectedPeriod, setSelectedPeriod] = useState(1);
  const [sel, setSel] = useState(null);
  const totalUnits = subjects.reduce((a, s) => a + s.units, 0);
  const gc = gradeChip(student.cumulativeGPA.toFixed(2));

  const subjectsWithActivePeriod = useMemo(() => {
    return subjects.map(s => {
      const periodData = s.periods?.find(p => p.period === selectedPeriod);
      return {
        ...s,
        components: periodData?.components || s.components,
        periodicRating: periodData?.periodicRating ?? null,
        classStanding: periodData?.classStanding || null,
      };
    });
  }, [subjects, selectedPeriod]);

  const periodOptions = [
    { value: 1, label: 'Prelims' },
    { value: 2, label: 'Midterms' },
    { value: 3, label: 'Finals' },
  ];

  const availablePeriods = periodOptions.filter(opt => 
    subjects.some(s => s.periods?.some(p => p.period === opt.value))
  );

  return (
    <div>
      {/* Hero student card */}
      <div
        className="animate-fade-up rounded-[14px] p-6 mb-5 flex items-center gap-5 flex-wrap shadow-[0_8px_32px_rgba(27,42,74,0.25)] relative overflow-hidden"
        style={{ background: `linear-gradient(135deg, ${T.navy800} 0%, ${T.navy700} 100%)` }}
      >
        {/* Decorative circles */}
        <div className="absolute -right-5 -top-5 w-[140px] h-[140px] rounded-full" style={{ border: `1px solid ${T.gold400}18` }} />
        <div className="absolute right-10 top-10 w-20 h-20 rounded-full" style={{ border: `1px solid ${T.gold400}10` }} />

        <Avatar
          name={student.name}
          size={58}
          bg={`linear-gradient(135deg, ${T.navy500}, ${T.navy300})`}
          color={T.gold200}
        />
        <div className="flex-1 min-w-[150px]">
          <div className="text-[11px] text-gold-400 font-semibold tracking-[2px] uppercase mb-1">
            {student.studentId}
          </div>
          <div className="text-[22px] font-extrabold text-white font-display leading-[1.1] mb-1">
            {student.name}
          </div>
          <div className="text-[13px] text-white/50">
            {student.program} &nbsp;·&nbsp; {student.year}
          </div>
        </div>

        <div className="flex gap-2.5 flex-wrap">
          {[
            { label: 'Section',     value: student.section,                  bg: 'rgba(255,255,255,0.08)', color: T.gold300,             border: 'rgba(255,255,255,0.12)' },
            { label: 'Total Units', value: `${totalUnits} units`,            bg: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.8)', border: 'rgba(255,255,255,0.08)' },
            { label: 'Cum. GPA',    value: student.cumulativeGPA.toFixed(2), bg: gc.bg,                   color: gc.text,                border: gc.border },
          ].map(({ label, value, bg, color, border }) => (
            <div
              key={label}
              className="rounded-[10px] px-4 py-2.5 text-center min-w-[90px] border"
              style={{ background: bg, borderColor: border }}
            >
              <div
                className="text-[9px] uppercase tracking-[1px] font-semibold mb-1"
                style={{ color: label === 'Cum. GPA' ? gc.text : 'rgba(255,255,255,0.4)' }}
              >
                {label}
              </div>
              <div className="text-[16px] font-extrabold font-mono" style={{ color }}>{value}</div>
            </div>
          ))}
        </div>
      </div>

      <SectionBanner section={student.section} />

      {/* Grading Period Selector */}
      {availablePeriods.length > 0 && (
        <div className="flex gap-2 mb-4">
          {availablePeriods.map(opt => (
            <button
              key={opt.value}
              onClick={() => setSelectedPeriod(opt.value)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                selectedPeriod === opt.value
                  ? 'bg-navy-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}

      <div className="animate-fade-up-1 flex justify-between items-center mb-3.5">
        <div className="text-[11px] font-bold text-gray-400 uppercase tracking-[1.2px]">
          Enrolled Subjects — {subjects.length} subjects
        </div>
        <div className="text-[11px] text-gray-300">Click a card to view breakdown</div>
      </div>

      <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
        {subjectsWithActivePeriod.map((s, idx) => {
          const gc = gradeChip(s.grade);
          return (
            <div
              key={s.id}
              className={`card-hover animate-fade-up-${Math.min(idx + 2, 5)} bg-white border border-gray-200 rounded-[12px] p-[18px] cursor-pointer shadow-card`}
              onClick={() => setSel({ ...s, periods: s.periods || s.periods })}
            >
              {/* Card header */}
              <div className="flex justify-between items-start mb-2.5">
                <div className="flex-1 pr-2.5">
                  <div className="text-[10px] text-navy-400 font-bold tracking-[1.5px] uppercase mb-[3px]">
                    {s.code} · {s.units} units
                  </div>
                  <div className="text-[14px] font-bold text-navy-900 leading-[1.3]">{s.title}</div>
                </div>
                <GradeTag value={s.grade} />
              </div>

              {/* Instructor */}
              <div className="text-[11px] text-gray-400 mb-3 flex items-center gap-1.5">
                <div className="w-1 h-1 rounded-full bg-gray-300" />
                {s.instructor.name}
              </div>

              {/* Component bars */}
              <div className="grid grid-cols-2 gap-1.5 mb-3">
                {Object.keys(s.components || {}).map(k => {
                  const a = avg((s.components || {})[k]?.items);
                  return (
                    <div key={k} className="bg-gray-50 rounded-md p-[7px] border border-gray-100">
                      <div className="text-[10px] text-gray-400 mb-[5px] font-medium">
                        {COMP_META[k]?.abbr || k} — {COMP_META[k]?.label || k}
                      </div>
                      <div className="flex items-center gap-[7px]">
                        <div className="flex-1"><ProgressBar pct={a} height={3} /></div>
                        <span className="text-[10px] font-mono font-bold shrink-0" style={{ color: barHue(a) }}>
                          {typeof a === 'number' ? a.toFixed(0) : '0'}%
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Footer */}
              <div className="flex justify-between pt-2.5 border-t border-gray-100 text-[11px] text-gray-400">
                <span>Periodic: <strong style={{ color: barHue(s.periodicRating) }}>{typeof s.periodicRating === 'number' ? s.periodicRating.toFixed(2) : '—'}</strong></span>
                <span>Final: <strong style={{ color: barHue(s.finalRating) }}>{typeof s.finalRating === 'number' ? s.finalRating.toFixed(2) : '—'}</strong></span>
                <span className="text-navy-400 font-semibold">View →</span>
              </div>
            </div>
          );
        })}
      </div>

      {sel && <SubjectDetailModal subject={sel} onClose={() => setSel(null)} />}
    </div>
  );
}
