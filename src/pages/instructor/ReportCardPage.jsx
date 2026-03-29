import { useState, useEffect, useMemo } from 'react';
import axios from '../../api/axios';
import PageHeader from '../../components/ui/PageHeader';
import GradeTag from '../../components/ui/GradeTag';
import Modal from '../../components/ui/Modal';
import EmptyState from '../../components/ui/EmptyState';
import { AICS_LOGO } from '../../constants/logo';
import { gradeChip, barHue } from '../../utils/colorHelpers';

/* ── Report Card View (used inside modal) ── */
function ReportCardView({ student, sectionSubjects, section }) {
  // Calculate GPA from final grades
  const { gpa, pct } = useMemo(() => {
    let totalPoints = 0;
    let totalUnits = 0;
    
    sectionSubjects.forEach(ss => {
      if (ss.final_grade != null) {
        totalPoints += ss.final_grade * (ss.subject?.units || 3);
        totalUnits += ss.subject?.units || 3;
      }
    });
    
    const gpa = totalUnits > 0 ? totalPoints / totalUnits : 0;
    const pct = gpa; // GPA to percentage conversion approximation
    return { gpa, pct };
  }, [sectionSubjects]);

  const gc = gradeChip(gpa);

  return (
    <div>
      {/* Letterhead */}
      <div className="text-center mb-5 pb-4 relative">
        <img src={AICS_LOGO} alt="AICS Logo" className="w-16 h-16 rounded-full object-cover mx-auto mb-2.5 block" />
        <div className="text-[18px] font-extrabold text-navy-900 font-display tracking-[2px]">AICS</div>
        <div className="text-[11px] text-navy-400 font-semibold mt-0.5">Asian Institute of Computer Studies</div>
        <div className="text-[11px] text-gray-400 mt-0.5">Official Student Report Card · 2nd Semester, A.Y. 2025–2026</div>
        <div className="h-0.5 mt-3.5 rounded-sm" style={{ background: 'linear-gradient(90deg, transparent, #1c2f58, #d4a017, #1c2f58, transparent)' }} />
      </div>

      {/* Student info */}
      <div className="grid grid-cols-2 gap-2 mb-[18px]">
        {[
          { label: 'Student Name', value: `${student.user?.first_name} ${student.user?.last_name}` },
          { label: 'Student ID', value: student.student_id },
          { label: 'Program', value: section?.course?.course_name || '-' },
          { label: 'Section', value: section?.section_name },
        ].map(({ label, value }) => (
          <div key={label} className="bg-gray-50 border border-gray-200 rounded-[7px] px-[13px] py-2">
            <div className="text-[10px] text-gray-400 uppercase tracking-[0.6px] font-semibold mb-0.5">{label}</div>
            <div className="text-[14px] font-bold text-navy-900">{value}</div>
          </div>
        ))}
      </div>

      {/* Subject grades table */}
      <div className="text-[11px] font-bold text-gray-500 uppercase tracking-[0.8px] mb-2">Subject Grades</div>
      <div className="border border-gray-200 rounded-[10px] overflow-hidden mb-4">
        <table className="w-full border-collapse text-[12px]">
          <thead>
            <tr className="bg-navy-50 border-b border-navy-100">
              {['Code', 'Subject Title', 'Units', 'Final Grade'].map(h => (
                <th key={h} className="px-3 py-[9px] font-semibold text-navy-700 text-[10px] uppercase tracking-[0.6px]"
                    style={{ textAlign: h === 'Subject Title' ? 'left' : 'center' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sectionSubjects.map((ss, i) => {
              const grade = ss.final_grade;
              const gc2 = gradeChip(grade);
              return (
                <tr key={ss.id} className="border-b border-gray-100 last:border-none" style={{ background: i % 2 === 0 ? '#fff' : '#f8f9fc' }}>
                  <td className="px-3 py-[9px] text-center font-mono font-bold text-navy-500 text-[11px]">{ss.subject?.subject_code}</td>
                  <td className="px-3 py-[9px] text-navy-900 font-medium">{ss.subject?.subject_name}</td>
                  <td className="px-3 py-[9px] text-center text-gray-500">{ss.subject?.units}</td>
                  <td className="px-3 py-[9px] text-center">
                    {grade != null ? (
                      <span className="font-mono font-bold" style={{ color: gc2.text }}>{grade.toFixed(2)}</span>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-2.5 px-5 py-4 bg-gradient-to-br from-navy-50 to-white rounded-[10px] border border-navy-100">
        {[
          { label: 'Semestral Grade (%)', value: `${pct.toFixed(1)}%`, color: barHue(parseFloat(pct)) },
          { label: 'Semestral GPA', value: gpa.toFixed(2), color: gc.text, bg: gc.bg, border: gc.border },
        ].map(({ label, value, color, bg, border }) => (
          <div key={label} className="text-center rounded-lg p-3 border" style={{ background: bg || 'transparent', borderColor: border || 'transparent' }}>
            <div className="text-[10px] text-gray-400 uppercase tracking-[0.8px] font-semibold mb-[5px]">{label}</div>
            <div className="text-[26px] font-extrabold font-mono" style={{ color }}>{value}</div>
          </div>
        ))}
      </div>
      <div className="mt-3.5 text-[10px] text-gray-300 text-center">
        Generated: {new Date().toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })}
      </div>
    </div>
  );
}

/* ── Report Card Page ── */
export default function ReportCardPage() {
  // State for storing fetched data
  const [sectionSubjects, setSectionSubjects] = useState([]);
  const [sectionsData, setSectionsData] = useState({}); // { sectionId: { section, students, finalGrades } }
  
  // UI state
  const [loading, setLoading] = useState(true);
  const [selectedSectionId, setSelectedSectionId] = useState('');
  const [selStudentData, setSelStudentData] = useState(null);

  // Get current user
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const professorId = user?.professor?.professor_id;

  // Fetch data on mount
  useEffect(() => {
    fetchData();
  }, []);

  // Fetch section-subjects and related data
  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Get section-subjects for professor
      const ssRes = await axios.get(`/section-subjects?professor_id=${professorId}&per_page=500`);
      const ssData = ssRes.data.data || ssRes.data;
      setSectionSubjects(ssData);

      // Get unique section IDs
      const sectionIds = [...new Set(ssData.map(ss => ss.section_id))];
      
      // Fetch students and final grades for each section
      const sectionsDataObj = {};
      for (const sectionId of sectionIds) {
        try {
          const [studentsRes, fgRes] = await Promise.all([
            axios.get(`/students?section_id=${sectionId}&per_page=500`),
            axios.get(`/student-final-grades?section_subject_id=${ssData.find(ss => ss.section_id === sectionId)?.id}`),
          ]);
          
          const students = studentsRes.data.data || studentsRes.data;
          const finalGrades = fgRes.data.data || fgRes.data;
          
          // Get section info
          const ss = ssData.find(s => s.section_id === sectionId);
          
          sectionsDataObj[sectionId] = {
            section: ss?.section,
            students: students.map(st => ({
              ...st,
              finalGrades: finalGrades.filter(fg => fg.student_id === st.id),
            })),
          };
        } catch (err) {
          console.error(`Failed to fetch data for section ${sectionId}`, err);
        }
      }
      
      setSectionsData(sectionsDataObj);
      
      // Set default selected section
      if (sectionIds.length > 0) {
        setSelectedSectionId(sectionIds[0]);
      }
    } catch (err) {
      console.error('Failed to fetch data', err);
    } finally {
      setLoading(false);
    }
  };

  // Get unique sections for dropdown
  const uniqueSections = useMemo(() => {
    const seen = new Set();
    return sectionSubjects.filter(ss => {
      if (seen.has(ss.section_id)) return false;
      seen.add(ss.section_id);
      return true;
    }).map(ss => ({ id: ss.section_id, section: ss.section }));
  }, [sectionSubjects]);

  // Get current section data
  const currentSectionData = sectionsData[selectedSectionId] || {};

  // Calculate GPA for a student
  const calcStudentGpa = (student) => {
    const studentSs = sectionSubjects.filter(ss => ss.section_id === selectedSectionId);
    let totalPoints = 0;
    let totalUnits = 0;
    
    student.finalGrades?.forEach(fg => {
      if (fg.final_grade != null) {
        const ss = studentSs.find(s => s.id === fg.section_subject_id);
        const units = ss?.subject?.units || 3;
        totalPoints += fg.final_grade * units;
        totalUnits += units;
      }
    });
    
    return totalUnits > 0 ? totalPoints / totalUnits : 0;
  };

  // Table columns
  const cols = [
    { 
      key: 'student_id', 
      label: 'Student ID',
      render: r => <span className="font-mono font-semibold text-navy-600">{r.student_id}</span>
    },
    { 
      key: 'name', 
      label: 'Name',
      render: r => (
        <span className="font-semibold text-navy-900">
          {r.user?.first_name} {r.user?.last_name}
        </span>
      )
    },
    { 
      key: 'gpa', 
      label: 'GPA',
      render: r => {
        const gpa = calcStudentGpa(r);
        return <GradeTag value={gpa.toFixed(2)} />;
      }
    },
    { 
      key: 'actions', 
      label: '',
      render: r => (
        <button
          className="btn-primary !text-[11px] !px-3 !py-[5px]"
          onClick={() => {
            const studentSs = sectionSubjects
              .filter(ss => ss.section_id === selectedSectionId)
              .map(ss => ({
                ...ss,
                final_grade: r.finalGrades?.find(fg => fg.section_subject_id === ss.id)?.final_grade,
              }));
            setSelStudentData({ student: r, sectionSubjects: studentSs, section: currentSectionData.section });
          }}
        >
          View Card
        </button>
      )
    },
  ];

  return (
    <div>
      <PageHeader title="Report Card" sub="View and generate student report cards" />

      <div className="animate-fade-up mb-3.5">
        <select 
          className="input-field max-w-[240px]" 
          value={selectedSectionId} 
          onChange={e => setSelectedSectionId(e.target.value)}
          disabled={loading}
        >
          {uniqueSections.map(s => (
            <option key={s.id} value={s.id}>{s.section?.section_name}</option>
          ))}
        </select>
      </div>

      <div className="animate-fade-up-1 bg-white border border-gray-200 rounded-[12px] overflow-hidden shadow-card">
        {loading ? (
          <div className="p-8 text-center text-gray-400">Loading...</div>
        ) : !currentSectionData.students || currentSectionData.students.length === 0 ? (
          <EmptyState text="No students in this section" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-[13px]">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="px-[14px] py-[10px] font-semibold text-gray-500 text-[11px] uppercase tracking-[0.6px] bg-gray-50 text-left">Student ID</th>
                  <th className="px-[14px] py-[10px] font-semibold text-gray-500 text-[11px] uppercase tracking-[0.6px] bg-gray-50 text-left">Name</th>
                  <th className="px-[14px] py-[10px] font-semibold text-gray-500 text-[11px] uppercase tracking-[0.6px] bg-gray-50 text-center">GPA</th>
                  <th className="px-[14px] py-[10px] font-semibold text-gray-500 text-[11px] uppercase tracking-[0.6px] bg-gray-50 text-right"></th>
                </tr>
              </thead>
              <tbody>
                {currentSectionData.students.map(st => {
                  const gpa = calcStudentGpa(st);
                  return (
                    <tr key={st.id} className="table-row border-b border-gray-100">
                      <td className="px-[14px] py-[11px] font-mono font-semibold text-navy-500">{st.student_id}</td>
                      <td className="px-[14px] py-[11px] font-bold text-navy-900">{st.user?.first_name} {st.user?.last_name}</td>
                      <td className="px-[14px] py-[11px] text-center"><GradeTag value={gpa.toFixed(2)} /></td>
                      <td className="px-[14px] py-[11px] text-right">
                        <button
                          className="btn-primary !text-[11px] !px-3 !py-[5px]"
                          onClick={() => {
                            const studentSs = sectionSubjects
                              .filter(ss => ss.section_id === selectedSectionId)
                              .map(ss => ({
                                ...ss,
                                final_grade: st.finalGrades?.find(fg => fg.section_subject_id === ss.id)?.final_grade,
                              }));
                            setSelStudentData({ student: st, sectionSubjects: studentSs, section: currentSectionData.section });
                          }}
                        >
                          View Card
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selStudentData && (
        <Modal
          title="Report Card"
          subtitle={`${selStudentData.student.user?.first_name} ${selStudentData.student.user?.last_name} · ${selStudentData.section?.section_name}`}
          onClose={() => setSelStudentData(null)}
          maxWidth="720px"
        >
          <ReportCardView 
            student={selStudentData.student} 
            sectionSubjects={selStudentData.sectionSubjects} 
            section={selStudentData.section} 
          />
        </Modal>
      )}
    </div>
  );
}
