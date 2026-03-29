import { useState, useEffect, useMemo } from 'react';
import axios from '../../api/axios';
import PageHeader from '../../components/ui/PageHeader';
import DataTable from '../../components/ui/DataTable';
import EmptyState from '../../components/ui/EmptyState';

export default function ClassRosterPage() {
  // State for storing fetched data
  const [sectionSubjects, setSectionSubjects] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [studentsLoading, setStudentsLoading] = useState(false);
  
  // Selected section-subject
  const [selectedSsId, setSelectedSsId] = useState('');

  // Get current user
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const professorId = user?.professor?.professor_id;

  // Fetch section-subjects on mount
  useEffect(() => {
    fetchSectionSubjects();
  }, []);

  // Fetch students when section-subject changes
  useEffect(() => {
    if (selectedSsId) {
      fetchStudents();
    } else {
      setStudents([]);
    }
  }, [selectedSsId]);

  // Fetch section-subjects for professor
  const fetchSectionSubjects = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`/section-subjects?professor_id=${professorId}&per_page=500`);
      setSectionSubjects(res.data.data || res.data);
      
      // Auto-select first if available
      if (res.data.data?.length > 0 || res.data.length > 0) {
        const first = res.data.data || res.data;
        setSelectedSsId(first[0].id);
      }
    } catch (err) {
      console.error('Failed to fetch section subjects', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch students for selected section
  const fetchStudents = async () => {
    try {
      setStudentsLoading(true);
      const ss = sectionSubjects.find(s => s.id === selectedSsId);
      if (!ss) return;
      
      const res = await axios.get(`/students?section_id=${ss.section_id}&per_page=500`);
      setStudents(res.data.data || res.data);
    } catch (err) {
      console.error('Failed to fetch students', err);
    } finally {
      setStudentsLoading(false);
    }
  };

  // Get selected section-subject info
  const selectedSs = useMemo(() => 
    sectionSubjects.find(s => s.id === selectedSsId), 
  [sectionSubjects, selectedSsId]);

  const cols = [
    { 
      key: 'studentId', 
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
      ), 
      wrap: true 
    },
  ];

  return (
    <div>
      <PageHeader title="Class Roster" sub="Students enrolled per section and subject" />

      <div className="animate-fade-up mb-3.5 flex gap-2.5 items-center flex-wrap">
        <select
          className="input-field max-w-[340px]"
          value={selectedSsId}
          onChange={e => setSelectedSsId(e.target.value)}
          disabled={loading}
        >
          {sectionSubjects.map(ss => (
            <option key={ss.id} value={ss.id}>
              {ss.subject?.subject_code} — {ss.section?.section_name}
            </option>
          ))}
        </select>
        
        {selectedSs && (
          <span className="text-[12px] text-gray-400 bg-gray-100 px-2.5 py-1 rounded-md">
            {students.length} student(s) enrolled
          </span>
        )}
      </div>

      <div className="animate-fade-up-1 bg-white border border-gray-200 rounded-[12px] overflow-hidden shadow-card">
        {selectedSs && (
          <div className="px-4 py-2.5 bg-navy-50 border-b border-navy-100 flex justify-between items-center">
            <span className="text-[12px] font-bold text-navy-700">
              {selectedSs.subject?.subject_code} — {selectedSs.subject?.subject_name}
            </span>
            <span className="text-[11px] text-gray-400">
              Section: <strong className="text-navy-600">{selectedSs.section?.section_name}</strong>
            </span>
          </div>
        )}
        
        {studentsLoading ? (
          <div className="p-8 text-center text-gray-400">Loading students...</div>
        ) : students.length === 0 ? (
          <EmptyState text="No students found in this section" />
        ) : (
          <DataTable columns={cols} rows={students} />
        )}
      </div>
    </div>
  );
}
