import { useEffect, useState } from 'react';
import axios from '../../api/axios';
import PageHeader from '../../components/ui/PageHeader';
import DataTable from '../../components/ui/DataTable';
import EmptyState from '../../components/ui/EmptyState';

export default function SubjectLoadPage() {
  const [sectionSubjects, setSectionSubjects] = useState([]);
  const [loading, setLoading] = useState(true);

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const professorId = user?.professor?.professor_id;

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`/section-subjects?professor_id=${professorId}&per_page=500`);
      setSectionSubjects(res.data.data || res.data);
    } catch (err) {
      console.error('Failed to fetch data', err);
    } finally {
      setLoading(false);
    }
  };

  const cols = [
    { 
      key: 'subject', 
      label: 'Subject',
      render: r => (
        <div>
          <div className="text-[13px] font-bold text-navy-900">{r.subject?.subject_name || '-'}</div>
          <div className="text-[10px] text-gray-400">{r.subject?.subject_code}</div>
        </div>
      ),
    },
    { 
      key: 'section', 
      label: 'Section',
      render: r => (
        <span className="bg-navy-50 border border-navy-100 rounded px-2 py-0.5 text-[11px] font-semibold text-navy-600">
          {r.section?.section_name || '-'}
        </span>
      ),
    },
    { 
      key: 'semester', 
      label: 'Semester',
      render: r => r.semester === 1 ? '1st Sem' : '2nd Sem'
    },
  ];

  return (
    <div>
      <PageHeader
        title="Subject Load"
        sub="Subjects currently assigned to you"
      />

      <div className="animate-fade-up bg-white border border-gray-200 rounded-[12px] overflow-hidden shadow-card">
        {loading ? (
          <div className="p-8 text-center text-gray-400">Loading...</div>
        ) : sectionSubjects.length === 0 ? (
          <EmptyState text="No subject loads found" />
        ) : (
          <DataTable
            columns={cols}
            rows={sectionSubjects}
          />
        )}
      </div>
    </div>
  );
}