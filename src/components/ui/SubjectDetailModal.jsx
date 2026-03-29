import { useState } from 'react';
import Modal from '../ui/Modal';
import Avatar from '../ui/Avatar';
import ProgressBar from '../ui/ProgressBar';
import { COMP_META } from '../../constants/compMeta';
import { avg } from '../../utils/gradeEngine';
import { gradeChip, barHue } from '../../utils/colorHelpers';
import { T } from '../../constants/tokens';

export default function SubjectDetailModal({ subject, onClose }) {
  const [periodTab, setPeriodTab] = useState(() => {
    return subject.periods?.[0]?.period || 1;
  });
  const [tab, setTab] = useState('quiz');

  const availablePeriods = subject.periods || [];
  const activePeriodData = availablePeriods.find(p => p.period === periodTab) || availablePeriods[0];
  const components = activePeriodData?.components || subject.components || {};
  const keys = Object.keys(components);
  const gc = gradeChip(subject.grade);

  return (
    <Modal
      title={subject.title}
      subtitle={`${subject.code} · ${subject.units} units · ${subject.schedule} · ${subject.room}`}
      onClose={onClose}
      maxWidth="680px"
    >
      {/* Instructor strip */}
      <div className="flex items-center gap-3 p-3 bg-navy-50 rounded-lg border border-navy-100 mb-[18px]">
        <Avatar name={subject.instructor.name} size={36} />
        <div>
          <div className="text-[14px] font-semibold text-navy-800">{subject.instructor.name}</div>
          <div className="text-[11px] text-gray-400">{subject.instructor.dept}</div>
        </div>
      </div>

      {/* Grading Period Tabs */}
      {availablePeriods.length > 0 && (
        <div className="flex gap-1.5 mb-4 pb-3 border-b border-gray-100">
          {availablePeriods.map(p => (
            <button
              key={p.period}
              className={`px-3 py-1.5 rounded text-xs font-semibold ${periodTab === p.period ? 'bg-navy-600 text-white' : 'bg-gray-100 text-gray-600'}`}
              onClick={() => setPeriodTab(p.period)}
            >
              {p.periodName}
            </button>
          ))}
        </div>
      )}

      {/* Rating row */}
      <div className="grid grid-cols-3 gap-2.5 mb-5">
        {[
          { label: 'Periodic Rating', value: `${typeof activePeriodData?.periodicRating === 'number' ? activePeriodData.periodicRating.toFixed(2) : '—'}`, bg: T.navy50,  color: barHue(activePeriodData?.periodicRating), border: T.navy100 },
          { label: 'Final Rating',    value: `${typeof subject.finalRating === 'number' ? subject.finalRating.toFixed(2) : '—'}`,    bg: T.navy50,  color: barHue(subject.finalRating),    border: T.navy100 },
          { label: 'Final Grade',     value: subject.grade, bg: gc.bg, color: gc.text, border: gc.border },
        ].map(({ label, value, bg, color, border }) => (
          <div
            key={label}
            className="rounded-[10px] p-[14px] text-center border"
            style={{ background: bg, borderColor: border }}
          >
            <div className="text-[10px] text-gray-400 uppercase tracking-[0.8px] font-semibold mb-1.5">
              {label}
            </div>
            <div className="text-[22px] font-extrabold font-mono tracking-[0.5px]" style={{ color }}>
              {value}
            </div>
          </div>
        ))}
      </div>

      {/* Component tabs */}
      <div className="flex gap-1.5 flex-wrap mb-4 pb-3.5 border-b border-gray-100">
        {keys.map(k => (
          <button key={k} className={`tab-btn${tab === k ? ' active' : ''}`} onClick={() => setTab(k)}>
            {COMP_META[k]?.label || k}
          </button>
        ))}
      </div>

      {/* Component items */}
      {keys.map(k => tab !== k ? null : (
        <div key={k}>
          <div className="flex justify-between mb-3 text-[12px] text-gray-400">
            <span>
              Weight: <strong className="text-gray-700">{typeof components[k]?.weight === 'number' ? (components[k].weight * 100).toFixed(0) : '0'}%
            </strong>
            </span>
            <span>
              Component Average:{' '}
              <strong style={{ color: barHue(avg(components[k]?.items)) }}>
                {typeof avg(components[k]?.items) === 'number' ? avg(components[k].items).toFixed(1) : '0'}%
              </strong>
            </span>
          </div>
          <div className="flex flex-col gap-2">
            {(components[k]?.items || []).map((item, i) => {
              const pct = (item.score / item.total) * 100;
              return (
                <div key={i} className="bg-gray-50 border border-gray-200 rounded-[9px] p-3">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[13px] font-semibold text-navy-800">{item.label}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[12px] font-mono text-gray-500">{item.score}/{item.total}</span>
                      <span className="text-[12px] font-bold font-mono" style={{ color: barHue(pct) }}>
                        {pct.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  <ProgressBar pct={pct} />
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </Modal>
  );
}
