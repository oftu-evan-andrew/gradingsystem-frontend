import { useState, useMemo } from 'react';
import ProgressBar from '../../components/ui/ProgressBar';
import { COMP_META } from '../../constants/compMeta';
import { avg } from '../../utils/gradeEngine';
import { gradeChip, barHue } from '../../utils/colorHelpers';

export default function StudentClassStanding({ subjects }) {
  const [selectedPeriod, setSelectedPeriod] = useState(1);

  const subjectsWithActivePeriod = useMemo(() => {
    return subjects.map(s => {
      const periodData = s.periods?.find(p => p.period === selectedPeriod);
      return {
        ...s,
        components: periodData?.components || s.components,
        periodicRating: periodData?.periodicRating ?? null,
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
      <div className="flex justify-between items-center mb-4">
        <div className="animate-fade-up text-[11px] font-bold text-gray-400 uppercase tracking-[1.2px]">
          Performance Breakdown per Subject
        </div>
        {availablePeriods.length > 0 && (
          <div className="flex gap-1.5">
            {availablePeriods.map(opt => (
              <button
                key={opt.value}
                onClick={() => setSelectedPeriod(opt.value)}
                className={`px-3 py-1 rounded text-xs font-semibold transition-colors ${
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
      </div>

      <div className="flex flex-col gap-3">
        {subjectsWithActivePeriod.map((s, si) => (
          <div
            key={s.id}
            className={`animate-fade-up-${Math.min(si + 1, 5)} bg-white border border-gray-200 rounded-[12px] overflow-hidden shadow-card`}
          >
            {/* Subject header */}
            <div className="px-5 py-3.5 bg-gradient-to-r from-navy-50 to-white border-b border-gray-100 flex justify-between items-center flex-wrap gap-2.5">
              <div>
                <div className="text-[10px] text-navy-400 font-bold tracking-[1.5px] uppercase mb-0.5">{s.code}</div>
                <div className="text-[15px] font-bold text-navy-900">{s.title}</div>
                <div className="text-[11px] text-gray-400 mt-px">{s.instructor.name}</div>
              </div>
              <div className="flex gap-2 flex-wrap">
                {[
                  { label: 'Periodic', value: `${typeof s.periodicRating === 'number' ? s.periodicRating.toFixed(2) : '—'}`, color: barHue(s.periodicRating) },
                  { label: 'Final',    value: `${typeof s.finalRating === 'number' ? s.finalRating.toFixed(2) : '—'}`,    color: barHue(s.finalRating) },
                  { label: 'Grade',    value: s.grade, ...gradeChip(s.grade) },
                ].map(({ label, value, bg, text, border, color }) => (
                  <div
                    key={label}
                    className="rounded-lg px-3 py-1.5 text-center min-w-[70px] border"
                    style={{ background: bg || '#f3f4f6', borderColor: border || '#e5e7eb' }}
                  >
                    <div className="text-[9px] text-gray-400 uppercase tracking-[0.8px] font-semibold mb-0.5">
                      {label}
                    </div>
                    <div className="text-[14px] font-extrabold font-mono" style={{ color: text || color || '#1a2440' }}>
                      {value}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Component breakdown */}
            <div className="px-5 py-3.5 grid gap-2.5" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))' }}>
              {Object.keys(s.components || {}).map(k => {
                const comp = (s.components || {})[k] || {};
                const a = avg(comp.items);
                return (
                  <div key={k} className="bg-gray-50 rounded-lg p-[11px] border border-gray-100">
                    <div className="flex justify-between items-center mb-[9px]">
                      <span className="text-[12px] font-bold text-navy-700">{COMP_META[k]?.label || k}</span>
                      <span className="text-[10px] text-gray-400 bg-gray-200 px-1.5 py-px rounded">
                        wt {typeof comp.weight === 'number' ? (comp.weight * 100).toFixed(0) : '0'}%
                      </span>
                    </div>
                    {(comp.items || []).map((item, i) => {
                      const pct = (item.score / item.total) * 100;
                      return (
                        <div key={i} className="mb-[7px]">
                          <div className="flex justify-between text-[11px] text-gray-500 mb-[3px]">
                            <span>{item.label}</span>
                            <span className="font-mono font-semibold" style={{ color: barHue(pct) }}>
                              {item.score}/{item.total}{' '}
                              <span className="text-gray-400 font-normal">({typeof pct === 'number' ? pct.toFixed(0) : '0'}%)</span>
                            </span>
                          </div>
                          <ProgressBar pct={pct} height={3} />
                        </div>
                      );
                    })}
                    <div className="mt-[9px] pt-[7px] border-t border-gray-200 text-[11px] text-gray-500 flex justify-between items-center">
                      <span className="font-medium">Component Avg</span>
                      <strong className="font-mono text-[13px]" style={{ color: barHue(a) }}>{typeof a === 'number' ? a.toFixed(1) : '0'}%</strong>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
