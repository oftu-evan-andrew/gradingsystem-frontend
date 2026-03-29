import { useEffect, useState, useMemo } from 'react';
import axios from '../../api/axios';
import PageHeader from '../../components/ui/PageHeader';
import EmptyState from '../../components/ui/EmptyState';

export default function FacultyLoadPage() {
  // State for storing fetched data
  const [sectionSubjects, setSectionSubjects] = useState([]);
  const [loading, setLoading] = useState(true);

  // Get current user
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const professorId = user?.professor?.professor_id;

  // Fetch data on mount
  useEffect(() => {
    fetchData();
  }, []);

  // Fetch section-subjects for current professor
  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`/section-subjects?professor_id=${professorId}&per_page=500`);
      setSectionSubjects(res.data.data || res.data);
    } catch (err) {
      console.error('Failed to fetch faculty load', err);
    } finally {
      setLoading(false);
    }
  };

  // Group by subject
  const grouped = useMemo(() => {
    const groups = {};
    sectionSubjects.forEach(ss => {
      const subjectId = ss.subject_id;
      if (!groups[subjectId]) {
        groups[subjectId] = {
          subject: ss.subject,
          sections: [],
        };
      }
      groups[subjectId].sections.push({
        id: ss.id,
        sectionName: ss.section?.section_name,
        semester: ss.semester,
      });
    });
    return groups;
  }, [sectionSubjects]);

  return (
    <div>
      <PageHeader title="Faculty Load" sub="Sections you are handling per subject" />
      
      {loading ? (
        <div className="p-8 text-center text-gray-400">Loading...</div>
      ) : Object.keys(grouped).length === 0 ? (
        <EmptyState text="No faculty load. Add subject loads first." />
      ) : (
        <div className="flex flex-col gap-2.5">
          {Object.values(grouped).map(({ subject, sections }, i) => (
            <div
              key={subject?.id}
              className={`animate-fade-up-${Math.min(i + 1, 5)} bg-white border border-gray-200 rounded-[12px] overflow-hidden shadow-card`}
            >
              <div className="px-[18px] py-[13px] bg-navy-50 border-b border-navy-100 flex justify-between items-center">
                <div>
                  <span className="text-[10px] text-navy-400 font-bold tracking-[1.5px] uppercase">{subject?.subject_code}</span>
                  <div className="text-[15px] font-bold text-navy-900">{subject?.subject_name}</div>
                </div>
                <span className="text-[12px] text-gray-400 bg-white border border-gray-200 rounded-md px-2.5 py-[3px]">
                  {subject?.units} units
                </span>
              </div>
              <div className="px-[18px] py-3 flex gap-2 flex-wrap">
                {sections.map(sec => (
                  <div key={sec.id} className="bg-navy-50 border border-navy-100 rounded-[7px] px-3.5 py-2">
                    <div className="text-[13px] font-bold text-navy-800">{sec.sectionName}</div>
                    <div className="text-[10px] text-gray-400 mt-px">
                      {sec.semester === 1 ? '1st' : '2nd'} Semester
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
