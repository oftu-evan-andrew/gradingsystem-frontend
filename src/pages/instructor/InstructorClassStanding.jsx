import { useState, useEffect, useMemo } from 'react';
import axios from '../../api/axios';
import PageHeader from '../../components/ui/PageHeader';
import EmptyState from '../../components/ui/EmptyState';
import GradeTag from '../../components/ui/GradeTag';
import Modal from '../../components/ui/Modal';
import Field from '../../components/ui/Field';
import { gradeChip, barHue } from '../../utils/colorHelpers';

const COMPONENTS = [
  { 
    key: 'quiz', 
    label: 'Quiz', 
    endpoint: 'quiz-records',
    fields: [
      { name: 'number', label: 'Quiz #', type: 'number', required: true },
      { name: 'title', label: 'Title', type: 'text', required: false },
      { name: 'pts', label: 'Points', type: 'number', required: true },
      { name: 'items', label: 'Items', type: 'number', required: true },
      { name: 'rating', label: 'Score', type: 'number', readonly: true },
    ]
  },
  { 
    key: 'recitation', 
    label: 'Recitation', 
    endpoint: 'recitation-records',
    fields: [
      { name: 'rating', label: 'Score (0-100)', type: 'number', required: true },
      { name: 'remarks', label: 'Remarks', type: 'text', required: false },
    ]
  },
  { 
    key: 'attendance', 
    label: 'Attendance', 
    endpoint: 'attendance-records',
    fields: [
      { name: 'date', label: 'Date', type: 'date', required: true },
      { name: 'rating', label: 'Score (0-100)', type: 'number', required: true },
    ]
  },
  { 
    key: 'project', 
    label: 'Project', 
    endpoint: 'project-records',
    fields: [
      { name: 'number', label: 'Project #', type: 'number', required: true },
      { name: 'title', label: 'Title', type: 'text', required: false },
      { name: 'rating', label: 'Score (0-100)', type: 'number', required: true },
    ]
  },
];

const GRADING_PERIODS = [
  { value: 1, label: 'Prelims' },
  { value: 2, label: 'Midterms' },
  { value: 3, label: 'Finals' },
];

const GRADE_COMPONENTS = [
  { key: 'attendance_score', label: 'Attendance' },
  { key: 'recitation_score', label: 'Recitation' },
  { key: 'quiz_score', label: 'Quiz' },
  { key: 'project_score', label: 'Project' },
  { key: 'major_exam_score', label: 'Major Exam' },
];

export default function InstructorClassStanding() {
  const [sectionSubjects, setSectionSubjects] = useState([]);
  const [students, setStudents] = useState([]);
  const [records, setRecords] = useState({
    quiz: [],
    recitation: [],
    attendance: [],
    project: [],
  });
  
  const [loading, setLoading] = useState(true);
  const [selectedSsId, setSelectedSsId] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState(1);
  const [activeComp, setActiveComp] = useState('quiz');
  const [classStandings, setClassStandings] = useState([]);
  const [spreadsheetData, setSpreadsheetData] = useState({});
  const [savingSpreadsheet, setSavingSpreadsheet] = useState(false);
  const [submittingGrades, setSubmittingGrades] = useState(false);
  const [submittingFinalGrades, setSubmittingFinalGrades] = useState(false);
  const [periodsFinalized, setPeriodsFinalized] = useState({});
  
  const [modal, setModal] = useState(null);
  const [selStudent, setSelStudent] = useState(null);
  const [form, setForm] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [quizEditIndex, setQuizEditIndex] = useState(null);

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const professorId = user?.professor?.professor_id;

  useEffect(() => {
    fetchSectionSubjects();
  }, []);

  useEffect(() => {
    if (selectedSsId) {
      fetchData();
    }
  }, [selectedSsId, selectedPeriod]);

  const fetchSectionSubjects = async () => {
    try {
      const res = await axios.get(`/section-subjects?professor_id=${professorId}&per_page=500`);
      const data = res.data.data || res.data;
      setSectionSubjects(data);
      
      if (data.length > 0) {
        setSelectedSsId(data[0].id);
      }
    } catch (err) {
      console.error('Failed to fetch section subjects', err);
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      
      const ss = sectionSubjects.find(s => s.id === selectedSsId);
      if (!ss) return;

      const studentRes = await axios.get(`/students?section_id=${ss.section_id}&per_page=500`);
      const studentsData = studentRes.data.data || studentRes.data;

      const [quizRes, recRes, attRes, projRes, csRes] = await Promise.all([
        axios.get(`/quiz-records?section_subject_id=${selectedSsId}&grading_period=${selectedPeriod}&per_page=500`),
        axios.get(`/recitation-records?section_subject_id=${selectedSsId}&grading_period=${selectedPeriod}&per_page=500`),
        axios.get(`/attendance-records?section_subject_id=${selectedSsId}&grading_period=${selectedPeriod}&per_page=500`),
        axios.get(`/project-records?section_subject_id=${selectedSsId}&grading_period=${selectedPeriod}&per_page=500`),
        axios.get(`/class-standings?section_subject_id=${selectedSsId}&grading_period=${selectedPeriod}&per_page=500`),
      ]);

      const quizData = quizRes.data.data || quizRes.data;
      const recData = recRes.data.data || recRes.data;
      const attData = attRes.data.data || attRes.data;
      const projData = projRes.data.data || projRes.data;
      const csData = csRes.data.data || csRes.data;

      setStudents(studentsData);
      setRecords({
        quiz: quizData,
        recitation: recData,
        attendance: attData,
        project: projData,
      });
      setClassStandings(csData);

      // Check which periods are finalized
      await checkAllPeriodsFinalized();

      const spreadData = {};
      studentsData.forEach(st => {
        const stId = st.id || st.student_id;
        
        const stQuizzes = quizData
          .filter(q => (q.student_id === stId || q.student?.student_id === stId))
          .sort((a, b) => (a.quiz_number || 0) - (b.quiz_number || 0));
        
        const stRecitations = recData
          .filter(r => (r.student_id === stId || r.student?.student_id === stId))
          .sort((a, b) => (a.id || 0) - (b.id || 0));
        
        const stAttendances = attData
          .filter(a => (a.student_id === stId || a.student?.student_id === stId))
          .sort((a, b) => new Date(a.attendance_date || 0) - new Date(b.attendance_date || 0));
        
        const stProjects = projData
          .filter(p => (p.student_id === stId || p.student?.student_id === stId))
          .sort((a, b) => (a.project_number || 0) - (b.project_number || 0));
        
        const cs = csData.find(c => c.student_id === stId);
        
        spreadData[stId] = {
          id: cs?.id || null,
          student_id: stId,
          quizzes: stQuizzes.map(q => ({ id: q.id, number: q.quiz_number, rating: q.rating })),
          recitations: stRecitations.map(r => ({ id: r.id, rating: r.rating, remarks: r.remarks })),
          attendances: stAttendances.map(a => ({ id: a.id, date: a.attendance_date, rating: a.rating })),
          projects: stProjects.map(p => ({ id: p.id, number: p.project_number, rating: p.rating })),
          major_exam_score: cs?.major_exam_score ?? '',
        };
      });
      setSpreadsheetData(spreadData);
    } catch (err) {
      console.error('Failed to fetch data', err);
    } finally {
      setLoading(false);
    }
  };

  const getRecordsForStudent = (studentId) => {
    return {
      quiz: records.quiz.filter(r => r.student_id === studentId || r.student?.student_id === studentId),
      recitation: records.recitation.filter(r => r.student_id === studentId || r.student?.student_id === studentId),
      attendance: records.attendance.filter(r => r.student_id === studentId || r.student?.student_id === studentId),
      project: records.project.filter(r => r.student_id === studentId || r.student?.student_id === studentId),
    };
  };

  const calcAverage = (records) => {
    if (!records || records.length === 0) return null;
    const sum = records.reduce((acc, r) => acc + (r.rating || 0), 0);
    return sum / records.length;
  };

  const selectedSs = useMemo(() => 
    sectionSubjects.find(s => s.id === selectedSsId),
  [sectionSubjects, selectedSsId]);

  const currentComp = useMemo(() => 
    COMPONENTS.find(c => c.key === activeComp),
  [activeComp]);

  const overallStatus = useMemo(() => {
    if (classStandings.length === 0) return null;
    const statuses = classStandings.map(cs => cs.status);
    if (statuses.every(s => s === 'finalized')) return 'finalized';
    if (statuses.every(s => s === 'submitted')) return 'submitted';
    if (statuses.every(s => s === 'draft')) return 'draft';
    return 'mixed';
  }, [classStandings]);

  const isLocked = overallStatus === 'finalized';

  const openAddModal = (student) => {
    setSelStudent(student);
    setEditingRecord(null);
    setForm({});
    setModal('addRecord');
  };

  const openEditModal = (student, record) => {
    setSelStudent(student);
    setEditingRecord(record);
    
    if (activeComp === 'quiz') {
      setForm({
        number: record.quiz_number,
        title: record.quiz_title || '',
        rating: record.rating ?? '',
      });
    } else if (activeComp === 'project') {
      setForm({
        number: record.project_number,
        title: record.project_title || '',
        rating: record.rating ?? '',
      });
    } else if (activeComp === 'recitation') {
      setForm({
        rating: record.rating,
        remarks: record.remarks || '',
      });
    } else if (activeComp === 'attendance') {
      setForm({
        date: record.attendance_date,
        rating: record.rating ?? '',
      });
    }
    
    setModal('editRecord');
  };

  const handleSave = async () => {
    if (!selStudent || !currentComp) return;
    
    setSubmitting(true);
    try {
      const endpoint = currentComp.endpoint;
      let payload = {
        type: activeComp,
        section_subject_id: selectedSsId,
        grading_period: selectedPeriod,
      };

      if (activeComp === 'quiz') {
        payload = {
          ...payload,
          student_id: selStudent.student_id,
          quiz_number: parseInt(form.number) || 1,
          quiz_title: form.title || null,
        };
        if (editingRecord) {
          payload.rating = parseFloat(form.rating) || 0;
        } else {
          payload.pts = parseFloat(form.pts) || 0;
          payload.items = parseFloat(form.items) || 100;
        }
      } else if (activeComp === 'project') {
        payload = {
          ...payload,
          student_id: selStudent.student_id,
          project_number: parseInt(form.number) || 1,
          project_title: form.title || null,
          rating: parseFloat(form.rating) || 0,
        };
      } else if (activeComp === 'recitation') {
        payload = {
          ...payload,
          student_id: selStudent.student_id,
          rating: parseFloat(form.rating) || 0,
          remarks: form.remarks || null,
        };
      } else if (activeComp === 'attendance') {
        payload = {
          ...payload,
          student_id: selStudent.student_id,
          attendance_date: form.date,
          rating: parseFloat(form.rating) || 0,
        };
      }

      if (editingRecord) {
        await axios.put(`/${endpoint}/${editingRecord.id}`, payload);
      } else {
        await axios.post(`/${endpoint}`, payload);
      }

      await fetchData();
      setModal(null);
    } catch (err) {
      console.error('Failed to save', err);
      alert(err.response?.data?.message || 'Failed to save');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (record) => {
    if (!confirm('Delete this record?')) return;
    
    setSubmitting(true);
    try {
      await axios.delete(`/${currentComp.endpoint}/${record.id}`);
      await fetchData();
    } catch (err) {
      console.error('Failed to delete', err);
      alert(err.response?.data?.message || 'Failed to delete');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitGrades = async () => {
    if (!selectedSsId || !selectedPeriod) return;
    if (!confirm('Submit grades to move them to the next stage? After submission, you can still edit until finalization.')) return;

    setSubmittingGrades(true);
    try {
      const grades = Object.values(spreadsheetData)
        .filter(d => d.id)
        .map(d => ({
          class_standing_id: d.id,
          status: 'submitted',
        }));

      if (grades.length > 0) {
        await axios.put('/class-standings', { type: 'class_standing', grades });
      }
      alert('Grades submitted successfully');
      await fetchData();
    } catch (err) {
      console.error('Failed to submit grades', err);
      alert(err.response?.data?.message || 'Failed to submit grades');
    } finally {
      setSubmittingGrades(false);
    }
  };

  const handleSubmitFinalGrades = async () => {
    if (!selectedSsId) return;
    if (!confirm('Submit Final Grades to Admin for approval? This will calculate the average of all 3 grading periods.')) return;

    setSubmittingFinalGrades(true);
    try {
      const res = await axios.post('/student-final-grades/bulk/submit', {
        section_subject_id: selectedSsId,
      });
      alert(res.data.message || 'Final grades submitted successfully');
      await fetchData();
    } catch (err) {
      console.error('Failed to submit final grades', err);
      alert(err.response?.data?.message || 'Failed to submit final grades');
    } finally {
      setSubmittingFinalGrades(false);
    }
  };

  const checkAllPeriodsFinalized = async () => {
    if (!selectedSsId) return false;
    try {
      const res = await axios.get(`/class-standings?section_subject_id=${selectedSsId}&per_page=500`);
      const data = res.data.data || res.data;
      
      const periods = { 1: false, 2: false, 3: false };
      data.forEach(cs => {
        if (cs.status === 'finalized') {
          periods[cs.grading_period] = true;
        }
      });
      setPeriodsFinalized(periods);
      return periods[1] && periods[2] && periods[3];
    } catch (err) {
      console.error('Failed to check periods', err);
      return false;
    }
  };

  const handleSaveSpreadsheet = async () => {
    if (!selectedSsId || !selectedPeriod) return;

    setSavingSpreadsheet(true);
    try {
      // First, ensure ClassStanding records exist for all students
      const studentsWithoutCS = Object.values(spreadsheetData).filter(d => !d.id);
      
      if (studentsWithoutCS.length > 0) {
        const gradesToCreate = studentsWithoutCS.map(d => ({
          student_id: d.student_id,
          section_subject_id: selectedSsId,
          grading_period: selectedPeriod,
          major_exam_score: null,
        }));

        await axios.post('/class-standings/bulk', { 
          type: 'class_standing', 
          grades: gradesToCreate 
        });
        
        // Refresh data to get the new ClassStanding IDs
        await fetchData();
      }

      // Now update major exam scores
      const grades = Object.values(spreadsheetData)
        .filter(d => d.id)
        .map(d => ({
          class_standing_id: d.id,
          major_exam_score: d.major_exam_score === '' ? null : parseFloat(d.major_exam_score) || 0,
        }));

      if (grades.length > 0) {
        await axios.put('/class-standings', { type: 'class_standing', grades });
      }
      
      alert('Grades saved successfully');
      await fetchData();
    } catch (err) {
      console.error('Failed to save grades', err);
      alert(err.response?.data?.message || 'Failed to save grades');
    } finally {
      setSavingSpreadsheet(false);
    }
  };

  const handleSpreadsheetChange = (studentId, field, value) => {
    setSpreadsheetData(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [field]: value,
      },
    }));
  };

  const calcMaxColumns = () => {
    const maxCols = { quizzes: 0, recitations: 0, attendances: 0, projects: 0 };
    Object.values(spreadsheetData).forEach(data => {
      maxCols.quizzes = Math.max(maxCols.quizzes, (data.quizzes?.length || 0));
      maxCols.recitations = Math.max(maxCols.recitations, (data.recitations?.length || 0));
      maxCols.attendances = Math.max(maxCols.attendances, (data.attendances?.length || 0));
      maxCols.projects = Math.max(maxCols.projects, (data.projects?.length || 0));
    });
    return maxCols;
  };

  const calcAvg = (arr) => {
    if (!arr || arr.length === 0) return null;
    const sum = arr.reduce((acc, r) => acc + (parseFloat(r.rating) || 0), 0);
    return sum / arr.length;
  };

  const renderSpreadsheetHeaders = () => {
    const maxCols = calcMaxColumns();
    const headers = [];

    for (let i = 0; i < maxCols.quizzes; i++) {
      headers.push(
        <th key={`quiz-${i}`} className="px-2 py-2 text-center font-semibold text-gray-500 text-[10px] uppercase bg-gray-50 min-w-[60px]">
          Q{i + 1}
        </th>
      );
    }
    if (maxCols.quizzes > 0) {
      headers.push(
        <th key="quiz-avg" className="px-2 py-2 text-center font-bold text-navy-600 text-[10px] uppercase bg-navy-50 min-w-[60px]">
          Avg
        </th>
      );
    }
    {!isLocked && (
      <th key={`add-quiz-${maxCols.quizzes}`} className="px-1 py-2 text-center bg-gray-50 min-w-[30px]">
        <button
          className="text-green-600 hover:text-green-800 text-lg font-bold"
          onClick={() => handleAddColumn('quiz')}
          title="Add Quiz Column"
        >
          +
        </button>
      </th>
    )}

    for (let i = 0; i < maxCols.recitations; i++) {
      headers.push(
        <th key={`rec-${i}`} className="px-2 py-2 text-center font-semibold text-gray-500 text-[10px] uppercase bg-gray-50 min-w-[60px]">
          Rec {i + 1}
        </th>
      );
    }
    if (maxCols.recitations > 0) {
      headers.push(
        <th key="rec-avg" className="px-2 py-2 text-center font-bold text-navy-600 text-[10px] uppercase bg-navy-50 min-w-[60px]">
          Avg
        </th>
      );
    }
    {!isLocked && (
      <th key={`add-rec-${maxCols.recitations}`} className="px-1 py-2 text-center bg-gray-50 min-w-[30px]">
        <button
          className="text-green-600 hover:text-green-800 text-lg font-bold"
          onClick={() => handleAddColumn('recitation')}
          title="Add Recitation Column"
        >
          +
        </button>
      </th>
    )}

    for (let i = 0; i < maxCols.attendances; i++) {
      headers.push(
        <th key={`att-${i}`} className="px-2 py-2 text-center font-semibold text-gray-500 text-[10px] uppercase bg-gray-50 min-w-[60px]">
          Day {i + 1}
        </th>
      );
    }
    if (maxCols.attendances > 0) {
      headers.push(
        <th key="att-avg" className="px-2 py-2 text-center font-bold text-navy-600 text-[10px] uppercase bg-navy-50 min-w-[60px]">
          Avg
        </th>
      );
    }
    {!isLocked && (
      <th key={`add-att-${maxCols.attendances}`} className="px-1 py-2 text-center bg-gray-50 min-w-[30px]">
        <button
          className="text-green-600 hover:text-green-800 text-lg font-bold"
          onClick={() => handleAddColumn('attendance')}
          title="Add Attendance Column"
        >
          +
        </button>
      </th>
    )}

    for (let i = 0; i < maxCols.projects; i++) {
      headers.push(
        <th key={`proj-${i}`} className="px-2 py-2 text-center font-semibold text-gray-500 text-[10px] uppercase bg-gray-50 min-w-[60px]">
          P{i + 1}
        </th>
      );
    }
    if (maxCols.projects > 0) {
      headers.push(
        <th key="proj-avg" className="px-2 py-2 text-center font-bold text-navy-600 text-[10px] uppercase bg-navy-50 min-w-[60px]">
          Avg
        </th>
      );
    }
    {!isLocked && (
      <th key={`add-proj-${maxCols.projects}`} className="px-1 py-2 text-center bg-gray-50 min-w-[30px]">
        <button
          className="text-green-600 hover:text-green-800 text-lg font-bold"
          onClick={() => handleAddColumn('project')}
          title="Add Project Column"
        >
          +
        </button>
      </th>
    )}

    headers.push(
      <th key="major-exam" className="px-2 py-2 text-center font-semibold text-gray-500 text-[10px] uppercase bg-gray-50 min-w-[80px]">
        Major Exam
      </th>
    );

    if (!isLocked) {
      headers.push(
        <th key="add-col-general" className="px-2 py-2 text-center bg-gray-50 min-w-[40px]">
          <button
            className="text-green-600 hover:text-green-800 text-lg font-bold"
            onClick={() => setModal('addColumn')}
            title="Add Column"
          >
            +
          </button>
        </th>
      );
    }

    return headers;
  };

  const renderSpreadsheetRow = (studentId, data) => {
    const maxCols = calcMaxColumns();
    const cells = [];
    const student = students.find(s => (s.id || s.student_id) === studentId);

    for (let i = 0; i < maxCols.quizzes; i++) {
      const quiz = data.quizzes?.[i];
      cells.push(
        <td key={`quiz-${i}`} className="px-1 py-1 relative group">
          {quiz ? (
            <div className="flex items-center justify-center gap-1">
              <button
                className="font-mono font-bold text-[11px] text-center hover:bg-gray-100 rounded py-1 px-1"
                style={{ color: quiz.rating != null ? barHue(quiz.rating) : '#ccc' }}
                onClick={() => openQuizModal(student, quiz, i)}
                disabled={isLocked}
              >
                {quiz.rating != null ? quiz.rating.toFixed(1) : '—'}
              </button>
              {isLocked || quiz.id ? (
                <button
                  className="text-gray-300 hover:text-red-600 text-[10px] font-bold opacity-0 group-hover:opacity-100"
                  onClick={() => handleDeleteRecord(studentId, 'quiz', i)}
                >
                  ×
                </button>
              ) : null}
            </div>
          ) : (
            <button
              className="text-gray-300 hover:text-green-600 text-lg font-bold"
              onClick={() => openQuizModal(student, null, i)}
              disabled={isLocked}
            >
              +
            </button>
          )}
        </td>
      );
    }
    if (maxCols.quizzes > 0) {
      const avg = calcAvg(data.quizzes);
      cells.push(
        <td key="quiz-avg" className="px-1 py-1 bg-navy-50 text-center">
          <span className="font-mono font-bold text-[11px]" style={{ color: avg !== null ? barHue(avg) : '#ccc' }}>
            {avg !== null ? avg.toFixed(1) : '—'}
          </span>
        </td>
      );
    }

    for (let i = 0; i < maxCols.recitations; i++) {
      const rec = data.recitations?.[i];
      cells.push(
        <td key={`rec-${i}`} className="px-1 py-1">
          <input
            type="number"
            className="input-field !py-1 !text-center w-full text-[11px]"
            min="0"
            max="100"
            value={rec?.rating ?? ''}
            onChange={e => handleCellEdit(studentId, 'recitation', i, e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleCellSave(studentId, 'recitation', i)}
            onBlur={() => handleCellSave(studentId, 'recitation', i)}
            disabled={isLocked}
            placeholder="—"
          />
        </td>
      );
    }
    if (maxCols.recitations > 0) {
      const avg = calcAvg(data.recitations);
      cells.push(
        <td key="rec-avg" className="px-1 py-1 bg-navy-50 text-center">
          <span className="font-mono font-bold text-[11px]" style={{ color: avg !== null ? barHue(avg) : '#ccc' }}>
            {avg !== null ? avg.toFixed(1) : '—'}
          </span>
        </td>
      );
    }

    for (let i = 0; i < maxCols.attendances; i++) {
      const att = data.attendances?.[i];
      cells.push(
        <td key={`att-${i}`} className="px-1 py-1">
          <input
            type="number"
            className="input-field !py-1 !text-center w-full text-[11px]"
            min="0"
            max="100"
            value={att?.rating ?? ''}
            onChange={e => handleCellEdit(studentId, 'attendance', i, e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleCellSave(studentId, 'attendance', i)}
            onBlur={() => handleCellSave(studentId, 'attendance', i)}
            disabled={isLocked}
            placeholder="—"
          />
        </td>
      );
    }
    if (maxCols.attendances > 0) {
      const avg = calcAvg(data.attendances);
      cells.push(
        <td key="att-avg" className="px-1 py-1 bg-navy-50 text-center">
          <span className="font-mono font-bold text-[11px]" style={{ color: avg !== null ? barHue(avg) : '#ccc' }}>
            {avg !== null ? avg.toFixed(1) : '—'}
          </span>
        </td>
      );
    }

    for (let i = 0; i < maxCols.projects; i++) {
      const proj = data.projects?.[i];
      cells.push(
        <td key={`proj-${i}`} className="px-1 py-1">
          <input
            type="number"
            className="input-field !py-1 !text-center w-full text-[11px]"
            min="0"
            max="100"
            value={proj?.rating ?? ''}
            onChange={e => handleCellEdit(studentId, 'project', i, e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleCellSave(studentId, 'project', i)}
            onBlur={() => handleCellSave(studentId, 'project', i)}
            disabled={isLocked}
            placeholder="—"
          />
        </td>
      );
    }
    if (maxCols.projects > 0) {
      const avg = calcAvg(data.projects);
      cells.push(
        <td key="proj-avg" className="px-1 py-1 bg-navy-50 text-center">
          <span className="font-mono font-bold text-[11px]" style={{ color: avg !== null ? barHue(avg) : '#ccc' }}>
            {avg !== null ? avg.toFixed(1) : '—'}
          </span>
        </td>
      );
    }

    cells.push(
      <td key="major-exam" className="px-1 py-1">
        <button
          className="input-field !py-1 !text-center w-full text-[11px] cursor-pointer hover:bg-gray-50"
          onClick={() => openMajorExamModal(student, data)}
          disabled={isLocked}
        >
          {typeof data.major_exam_score === 'number' ? data.major_exam_score.toFixed(1) : '—'}
        </button>
      </td>
    );

    if (!isLocked) {
      cells.push(
        <td key={`add-row-${studentId}`} className="px-1 py-1 text-center">
          <button
            className="text-green-600 hover:text-green-800 text-sm font-bold"
            onClick={() => openAddRecordModal(student)}
            title="Add Record"
          >
            +
          </button>
        </td>
      );
    }

    return cells;
  };

  const handleCellEdit = (studentId, type, index, value) => {
    setSpreadsheetData(prev => {
      const data = { ...prev[studentId] };
      if (type === 'recitation') {
        const recs = [...(data.recitations || [])];
        const existing = recs[index];
        recs[index] = existing ? { ...existing, rating: value } : { rating: value, isNew: true };
        data.recitations = recs;
      } else if (type === 'attendance') {
        const atts = [...(data.attendances || [])];
        const existing = atts[index];
        atts[index] = existing ? { ...existing, rating: value, date: existing.date || new Date().toISOString().split('T')[0] } : { rating: value, date: new Date().toISOString().split('T')[0], isNew: true };
        data.attendances = atts;
      } else if (type === 'project') {
        const projs = [...(data.projects || [])];
        const existing = projs[index];
        projs[index] = existing ? { ...existing, rating: value } : { rating: value, isNew: true };
        data.projects = projs;
      }
      return { ...prev, [studentId]: data };
    });
  };

  const handleCellSave = async (studentId, type, index) => {
    const data = spreadsheetData[studentId];
    if (!data) return;

    let recordId = null;
    let endpoint = '';
    let isNew = false;
    
    if (type === 'recitation') {
      recordId = data.recitations?.[index]?.id;
      isNew = data.recitations?.[index]?.isNew;
      endpoint = 'recitation-records';
    } else if (type === 'attendance') {
      recordId = data.attendances?.[index]?.id;
      isNew = data.attendances?.[index]?.isNew;
      endpoint = 'attendance-records';
    } else if (type === 'project') {
      recordId = data.projects?.[index]?.id;
      isNew = data.projects?.[index]?.isNew;
      endpoint = 'project-records';
    }

    const student = students.find(s => (s.id || s.student_id) === studentId);
    if (!student) return;

    const value = type === 'recitation' ? data.recitations?.[index]?.rating :
                  type === 'attendance' ? data.attendances?.[index]?.rating :
                  data.projects?.[index]?.rating;

    if (value === undefined || value === '') return;

    try {
      const payload = { type, section_subject_id: selectedSsId, grading_period: selectedPeriod, student_id: student.student_id };
      if (type === 'recitation') {
        payload.rating = parseFloat(value) || 0;
      } else if (type === 'attendance') {
        payload.attendance_date = data.attendances?.[index]?.date || new Date().toISOString().split('T')[0];
        const rating = parseFloat(value) || 0;
        payload.rating = rating;
        payload.status = rating >= 70 ? 'present' : rating >= 1 && rating < 70 ? 'late' : 'absent';
      } else if (type === 'project') {
        payload.project_number = index + 1;
        payload.rating = parseFloat(value) || 0;
      }

      if (isNew) {
        await axios.post(`/${endpoint}`, payload);
      } else if (recordId) {
        await axios.put(`/${endpoint}/${recordId}`, payload);
      }
      await fetchData();
    } catch (err) {
      console.error('Failed to save', err);
      alert(err.response?.data?.message || 'Failed to save');
    }
  };

  const handleDeleteRecord = async (studentId, type, index) => {
    const data = spreadsheetData[studentId];
    let recordId = null;
    let endpoint = '';

    if (type === 'quiz') {
      recordId = data.quizzes?.[index]?.id;
      endpoint = 'quiz-records';
    } else if (type === 'recitation') {
      recordId = data.recitations?.[index]?.id;
      endpoint = 'recitation-records';
    } else if (type === 'attendance') {
      recordId = data.attendances?.[index]?.id;
      endpoint = 'attendance-records';
    } else if (type === 'project') {
      recordId = data.projects?.[index]?.id;
      endpoint = 'project-records';
    }

    if (!recordId) return;
    if (!confirm('Delete this record?')) return;

    try {
      await axios.delete(`/${endpoint}/${recordId}`);
      await fetchData();
    } catch (err) {
      console.error('Failed to delete', err);
      alert(err.response?.data?.message || 'Failed to delete');
    }
  };

  const openAddRecitationModal = (student, index) => {
    setSelStudent(student);
    setEditingRecord(null);
    setForm({});
    setModal('recitation');
  };

  const openAddAttendanceModal = (student, index) => {
    setSelStudent(student);
    setEditingRecord(null);
    setForm({});
    setModal('attendance');
  };

  const openAddProjectModal = (student, index) => {
    setSelStudent(student);
    setEditingRecord(null);
    setForm({});
    setModal('project');
  };

  const openAddRecordModal = (student) => {
    setSelStudent(student);
    setEditingRecord(null);
    setForm({});
    setModal('addRecord');
  };

  const openQuizModal = (student, quiz, index) => {
    setSelStudent(student);
    setQuizEditIndex(index);
    if (quiz) {
      setEditingRecord(quiz);
      setForm({
        number: quiz.number || index + 1,
        pts: quiz.pts ?? '',
        items: quiz.items ?? '',
      });
    } else {
      setEditingRecord(null);
      setForm({
        number: index + 1,
        pts: '',
        items: '',
      });
    }
    setModal('quizEdit');
  };

  const openMajorExamModal = (student, data) => {
    setSelStudent(student);
    setEditingRecord(null);
    const existingScore = data?.major_exam_score;
    setForm({
      pts: '',
      items: '',
    });
    setModal('majorExam');
  };

  const handleQuizSave = async () => {
    if (!selStudent || !form.pts || !form.items) return;
    
    setSubmitting(true);
    try {
      const quizNumber = parseInt(form.number) || quizEditIndex + 1;
      const payload = {
        type: 'quiz',
        section_subject_id: selectedSsId,
        grading_period: selectedPeriod,
        student_id: selStudent.student_id,
        quiz_number: quizNumber,
        pts: parseFloat(form.pts),
        items: parseFloat(form.items),
      };

      if (editingRecord?.id) {
        // Update existing record
        await axios.put(`/quiz-records/${editingRecord.id}`, payload);
      } else {
        // Create new record
        await axios.post('/quiz-records', payload);
      }

      await fetchData();
      setModal(null);
    } catch (err) {
      console.error('Failed to save quiz', err);
      alert(err.response?.data?.message || 'Failed to save quiz');
    } finally {
      setSubmitting(false);
    }
  };

  const handleMajorExamSave = async () => {
    if (!selStudent || !form.pts || !form.items) return;
    
    const studentId = selStudent.id || selStudent.student_id;
    const data = spreadsheetData[studentId];
    if (!data?.id) return;
    
    setSubmitting(true);
    try {
      await axios.put('/class-standings', {
        type: 'class_standing',
        grades: [{
          class_standing_id: data.id,
          major_exam_pts: parseFloat(form.pts),
          major_exam_items: parseFloat(form.items)
        }]
      });
      await fetchData();
      setModal(null);
      setForm({});
    } catch (err) {
      console.error('Failed to save major exam', err);
      alert(err.response?.data?.message || 'Failed to save');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRecitationSave = async () => {
    if (!selStudent || !form.rating) return;
    
    setSubmitting(true);
    try {
      const payload = {
        type: 'recitation',
        section_subject_id: selectedSsId,
        grading_period: selectedPeriod,
        student_id: selStudent.student_id,
        rating: parseFloat(form.rating),
        remarks: form.remarks || null,
      };

      await axios.post('/recitation-records', payload);

      await fetchData();
      setModal(null);
      setForm({});
    } catch (err) {
      console.error('Failed to save recitation', err);
      alert(err.response?.data?.message || 'Failed to save recitation');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAttendanceSave = async () => {
    if (!selStudent || !form.date || !form.rating) return;
    
    setSubmitting(true);
    try {
      const rating = parseFloat(form.rating);
      const payload = {
        type: 'attendance',
        section_subject_id: selectedSsId,
        grading_period: selectedPeriod,
        student_id: selStudent.student_id,
        attendance_date: form.date,
        rating: rating,
        status: rating >= 70 ? 'present' : rating >= 1 && rating < 70 ? 'late' : 'absent',
      };

      await axios.post('/attendance-records', payload);

      await fetchData();
      setModal(null);
      setForm({});
    } catch (err) {
      console.error('Failed to save attendance', err);
      alert(err.response?.data?.message || 'Failed to save attendance');
    } finally {
      setSubmitting(false);
    }
  };

  const handleProjectSave = async () => {
    if (!selStudent || !form.number || !form.rating) return;
    
    setSubmitting(true);
    try {
      const payload = {
        type: 'project',
        section_subject_id: selectedSsId,
        grading_period: selectedPeriod,
        student_id: selStudent.student_id,
        project_number: parseInt(form.number),
        rating: parseFloat(form.rating),
      };

      await axios.post('/project-records', payload);

      await fetchData();
      setModal(null);
      setForm({});
    } catch (err) {
      console.error('Failed to save project', err);
      alert(err.response?.data?.message || 'Failed to save project');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddColumn = async (type) => {
    const maxCols = calcMaxColumns();
    const nextNum = type === 'quiz' ? maxCols.quizzes + 1 :
                    type === 'recitation' ? maxCols.recitations + 1 :
                    type === 'project' ? maxCols.projects + 1 :
                    maxCols.attendances + 1;

    setSubmitting(true);
    try {
      if (type === 'quiz') {
        await axios.post('/quiz-records', {
          type: 'quiz',
          section_subject_id: selectedSsId,
          grading_period: selectedPeriod,
          quiz_number: nextNum,
          grades: students.map(s => ({ student_id: s.student_id, pts: 0, items: 1 }))
        });
      } else if (type === 'recitation') {
        await axios.post('/recitation-records', {
          type: 'recitation',
          section_subject_id: selectedSsId,
          grading_period: selectedPeriod,
          grades: students.map(s => ({ student_id: s.student_id, rating: 0 }))
        });
      } else if (type === 'attendance') {
        const baseDate = new Date();
        baseDate.setDate(baseDate.getDate() + maxCols.attendances);
        await axios.post('/attendance-records', {
          type: 'attendance',
          section_subject_id: selectedSsId,
          grading_period: selectedPeriod,
          attendance_date: baseDate.toISOString().split('T')[0],
          grades: students.map(s => ({ student_id: s.student_id, rating: 0, status: 'absent' }))
        });
      } else if (type === 'project') {
        await axios.post('/project-records', {
          type: 'project',
          section_subject_id: selectedSsId,
          grading_period: selectedPeriod,
          project_number: nextNum,
          grades: students.map(s => ({ student_id: s.student_id, rating: 0 }))
        });
      }
      await fetchData();
    } catch (err) {
      console.error('Failed to add column', err);
      alert(err.response?.data?.message || 'Failed to add column');
    } finally {
      setSubmitting(false);
    }
  };

  const renderRecordsList = (studentRecords, student) => {
    if (studentRecords.length === 0) return null;

    return (
      <div className="mt-2 space-y-1">
        {studentRecords.map((r, idx) => (
          <div key={r.id || idx} className="flex items-center justify-between bg-gray-50 px-2 py-1.5 rounded text-[11px]">
            <div className="flex items-center gap-2">
              {activeComp === 'quiz' && (
                <span className="font-medium">Q{r.quiz_number}: {r.quiz_title || 'Quiz'}</span>
              )}
              {activeComp === 'project' && (
                <span className="font-medium">P{r.project_number}: {r.project_title || 'Project'}</span>
              )}
              {activeComp === 'recitation' && (
                <span className="font-medium">{r.remarks || 'Recitation'}</span>
              )}
              {activeComp === 'attendance' && (
                <span className="font-medium">{new Date(r.attendance_date).toLocaleDateString()}</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold" style={{ color: barHue(r.rating) }}>
                {r.rating?.toFixed(1)}%
              </span>
              {!isLocked && (
                <>
                  <button 
                    onClick={(e) => { e.stopPropagation(); openEditModal(student, r); }}
                    className="text-blue-600 hover:underline text-[10px]"
                  >
                    Edit
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleDelete(r); }}
                    className="text-red-600 hover:underline text-[10px]"
                  >
                    ×
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderTable = () => {
    if (loading) {
      return <div className="p-8 text-center text-gray-400">Loading...</div>;
    }

    if (students.length === 0) {
      return <EmptyState text="No students in this section" />;
    }

    return (
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-[12px]">
          <thead>
            <tr className="border-b-2 border-gray-200">
              <th className="px-[14px] py-[10px] text-left font-semibold text-gray-500 text-[11px] uppercase tracking-[0.6px] bg-gray-50 min-w-[160px]">
                Student
              </th>
              <th className="px-3 py-[10px] text-center font-semibold text-gray-500 text-[11px] uppercase tracking-[0.6px] bg-gray-50">
                {currentComp.label} Average
              </th>
              <th className="px-3 py-[10px] text-left font-semibold text-gray-500 text-[11px] uppercase tracking-[0.6px] bg-gray-50">
                Records
              </th>
              <th className="px-3 py-[10px] text-center font-semibold text-gray-500 text-[11px] uppercase tracking-[0.6px] bg-gray-50">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {students.map((st) => {
              const studentId = st.id || st.student_id;
              const studentRecords = getRecordsForStudent(studentId);
              const compRecords = studentRecords[activeComp] || [];
              const avg = calcAverage(compRecords);
              
              return (
                <tr key={studentId} className="table-row border-b border-gray-100">
                  <td className="px-[14px] py-[10px]">
                    <div className="font-bold text-navy-900 text-[13px]">
                      {st.user?.first_name} {st.user?.last_name}
                    </div>
                    <div className="text-[10px] text-gray-400 font-mono mt-px">{st.student_id}</div>
                  </td>
                  <td className="px-3 py-[10px] text-center">
                    {avg !== null ? (
                      <span className="font-mono font-bold" style={{ color: barHue(avg) }}>
                        {avg.toFixed(1)}%
                      </span>
                    ) : (
                      <span className="text-gray-300">—</span>
                    )}
                  </td>
                  <td className="px-3 py-[10px]">
                    {compRecords.length > 0 && renderRecordsList(compRecords.slice(0, 2), st)}
                    {compRecords.length > 2 && (
                      <div className="text-[10px] text-gray-400 mt-1">+{compRecords.length - 2} more</div>
                    )}
                  </td>
                  <td className="px-3 py-[10px] text-center">
                    {!isLocked && (
                      <button
                        className="btn-default !px-2.5 !py-1 !text-[11px]"
                        onClick={() => openAddModal(st)}
                      >
                        Add
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  const renderFormFields = () => {
    let fieldsToRender = currentComp.fields;

    if (activeComp === 'quiz') {
      if (editingRecord) {
        fieldsToRender = currentComp.fields.filter(f => f.name === 'number' || f.name === 'title' || f.name === 'rating');
      } else {
        fieldsToRender = currentComp.fields.filter(f => f.name !== 'rating');
      }
    }

    return fieldsToRender.map(field => (
      <Field key={field.name} label={field.label}>
        {field.type === 'select' ? (
          <select
            className="input-field"
            value={form[field.name] || ''}
            onChange={e => setForm(f => ({ ...f, [field.name]: e.target.value }))}
          >
            <option value="">Select...</option>
            {field.options.map(opt => (
              <option key={opt} value={opt}>{opt.charAt(0).toUpperCase() + opt.slice(1)}</option>
            ))}
          </select>
        ) : (
          <input
            className="input-field"
            type={field.type}
            min={field.type === 'number' ? '0' : undefined}
            value={form[field.name] || ''}
            onChange={e => setForm(f => ({ ...f, [field.name]: e.target.value }))}
            readOnly={field.readonly && !editingRecord}
          />
        )}
      </Field>
    ));
  };

  return (
    <div>
      <PageHeader title="Class Standing" sub="Manage grades for your students" />

      <div className="animate-fade-up mb-3 flex gap-3 flex-wrap">
        <select 
          className="input-field max-w-[300px]" 
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

        <select 
          className="input-field w-[140px]" 
          value={selectedPeriod} 
          onChange={e => setSelectedPeriod(parseInt(e.target.value))}
        >
          {GRADING_PERIODS.map(p => (
            <option key={p.value} value={p.value}>{p.label}</option>
          ))}
        </select>

        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          {COMPONENTS.map(comp => (
            <button
              key={comp.key}
              className={`px-3 py-1.5 rounded-md text-[11px] font-medium transition-colors ${
                activeComp === comp.key 
                  ? 'bg-white text-navy-700 shadow-sm' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveComp(comp.key)}
            >
              {comp.label}
            </button>
          ))}
        </div>

        {overallStatus && (
          <span className={`px-3 py-2 rounded-full text-[11px] font-medium ${
            overallStatus === 'finalized' ? 'bg-green-100 text-green-700' :
            overallStatus === 'submitted' ? 'bg-yellow-100 text-yellow-700' :
            overallStatus === 'draft' ? 'bg-gray-100 text-gray-600' :
            'bg-orange-100 text-orange-700'
          }`}>
            {overallStatus === 'finalized' ? '✓ Finalized' :
             overallStatus === 'submitted' ? '● Submitted' :
             overallStatus === 'draft' ? '○ Draft' :
             '◐ Mixed'}
          </span>
        )}

        {!isLocked && Object.keys(spreadsheetData).length > 0 && overallStatus !== 'finalized' && (
          <div className="flex gap-2">
            {overallStatus !== 'submitted' && (
              <button
                className="btn-secondary !py-2 !text-[11px]"
                onClick={handleSubmitGrades}
                disabled={submittingGrades}
              >
                {submittingGrades ? 'Submitting...' : 'Submit Grades'}
              </button>
            )}
            <button
              className="btn-primary !py-2 !text-[11px]"
              onClick={handleSaveSpreadsheet}
              disabled={savingSpreadsheet}
            >
              {savingSpreadsheet ? 'Saving...' : 'Save Grades'}
            </button>
          </div>
        )}
      </div>

      {/* Submit Final Grades Button */}
      {selectedSsId && (
        <div className="mt-3">
          <button
            className="btn-secondary !py-2 !text-[11px]"
            onClick={handleSubmitFinalGrades}
            disabled={submittingFinalGrades || !periodsFinalized[1] || !periodsFinalized[2] || !periodsFinalized[3]}
            title={!periodsFinalized[1] || !periodsFinalized[2] || !periodsFinalized[3] ? 'Complete all 3 grading periods to enable' : 'Submit Final Grades to Admin'}
          >
            {submittingFinalGrades ? 'Submitting...' : 'Submit Final Grades'}
          </button>
        </div>
      )}

      <div className="animate-fade-up-1 bg-white border border-gray-200 rounded-[12px] shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-[12px]">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="px-3 py-3 text-left font-semibold text-gray-500 text-[11px] uppercase tracking-[0.6px] bg-gray-50 min-w-[180px] sticky left-0 bg-gray-50">
                    Student
                  </th>
                  {renderSpreadsheetHeaders()}
                </tr>
              </thead>
              <tbody>
                {students.map(st => {
                  const studentId = st.id || st.student_id;
                  const data = spreadsheetData[studentId] || {};
                  return (
                    <tr key={studentId} className="border-b border-gray-100">
                      <td className="px-3 py-2 sticky left-0 bg-white">
                        <div className="font-bold text-navy-900 text-[13px]">
                          {st.user?.first_name} {st.user?.last_name}
                        </div>
                        <div className="text-[10px] text-gray-400 font-mono">{st.student_id}</div>
                      </td>
                      {renderSpreadsheetRow(studentId, data)}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

      {(modal === 'addRecord' || modal === 'editRecord') && selStudent && (
        <Modal 
          title={modal === 'addRecord' ? `Add ${currentComp.label}` : `Edit ${currentComp.label}`}
          subtitle={`${selStudent.user?.first_name} ${selStudent.user?.last_name}`}
          onClose={() => setModal(null)} 
          maxWidth="380px"
        >
          {renderFormFields()}
          <div className="flex gap-2 justify-end pt-4">
            <button className="btn-default" onClick={() => setModal(null)}>Cancel</button>
            <button className="btn-primary" onClick={handleSave} disabled={submitting}>
              {submitting ? 'Saving...' : (modal === 'addRecord' ? 'Add Record' : 'Save Changes')}
            </button>
          </div>
        </Modal>
      )}

      {modal === 'quizEdit' && selStudent && (
        <Modal
          title={editingRecord ? `Edit Quiz ${form.number}` : `Add Quiz ${form.number}`}
          subtitle={`${selStudent.user?.first_name} ${selStudent.user?.last_name}`}
          onClose={() => setModal(null)}
          maxWidth="320px"
        >
          <div className="space-y-3">
            <Field label="Quiz #">
              <input
                type="number"
                className="input-field"
                value={form.number || ''}
                onChange={e => setForm(f => ({ ...f, number: e.target.value }))}
                min="1"
              />
            </Field>
            <Field label="Points Earned">
              <input
                type="number"
                className="input-field"
                value={form.pts || ''}
                onChange={e => setForm(f => ({ ...f, pts: e.target.value }))}
                placeholder="e.g., 85"
                min="0"
              />
            </Field>
            <Field label="Total Items">
              <input
                type="number"
                className="input-field"
                value={form.items || ''}
                onChange={e => setForm(f => ({ ...f, items: e.target.value }))}
                placeholder="e.g., 100"
                min="1"
              />
            </Field>
            {form.pts && form.items && (
              <div className="text-center text-[11px] text-gray-500 bg-gray-50 py-2 rounded">
                Score Preview: <span className="font-bold text-navy-600">
                  {((parseFloat(form.pts) / parseFloat(form.items)) * 50 + 50).toFixed(2)}%
                </span>
              </div>
            )}
          </div>
          <div className="flex gap-2 justify-end pt-4">
            <button className="btn-default" onClick={() => setModal(null)}>Cancel</button>
            <button className="btn-primary" onClick={handleQuizSave} disabled={submitting || !form.pts || !form.items}>
              {submitting ? 'Saving...' : 'Save Quiz'}
            </button>
          </div>
        </Modal>
      )}

      {modal === 'majorExam' && selStudent && (
        <Modal
          title="Major Exam"
          subtitle={`${selStudent.user?.first_name} ${selStudent.user?.last_name}`}
          onClose={() => setModal(null)}
          maxWidth="320px"
        >
          <div className="space-y-3">
            <Field label="Points Earned">
              <input
                type="number"
                className="input-field"
                value={form.pts || ''}
                onChange={e => setForm(f => ({ ...f, pts: e.target.value }))}
                placeholder="e.g., 85"
                min="0"
              />
            </Field>
            <Field label="Total Items">
              <input
                type="number"
                className="input-field"
                value={form.items || ''}
                onChange={e => setForm(f => ({ ...f, items: e.target.value }))}
                placeholder="e.g., 100"
                min="1"
              />
            </Field>
            {form.pts && form.items && (
              <div className="text-center text-[11px] text-gray-500 bg-gray-50 py-2 rounded">
                Score: {((parseFloat(form.pts) / parseFloat(form.items)) * 50 + 50).toFixed(1)}%
              </div>
            )}
          </div>
          <div className="flex gap-2 justify-end pt-4">
            <button className="btn-default" onClick={() => setModal(null)}>Cancel</button>
            <button 
              className="btn-primary" 
              onClick={handleMajorExamSave}
              disabled={submitting || !form.pts || !form.items}
            >
              {submitting ? 'Saving...' : 'Save'}
            </button>
          </div>
        </Modal>
      )}

      {modal === 'recitation' && selStudent && (
        <Modal
          title="Add Recitation"
          subtitle={`${selStudent.user?.first_name} ${selStudent.user?.last_name}`}
          onClose={() => setModal(null)}
          maxWidth="320px"
        >
          <div className="space-y-3">
            <Field label="Score (0-100)">
              <input
                type="number"
                className="input-field"
                value={form.rating || ''}
                onChange={e => setForm(f => ({ ...f, rating: e.target.value }))}
                placeholder="e.g., 85"
                min="0"
                max="100"
              />
            </Field>
            <Field label="Remarks (optional)">
              <input
                type="text"
                className="input-field"
                value={form.remarks || ''}
                onChange={e => setForm(f => ({ ...f, remarks: e.target.value }))}
                placeholder="Optional remarks"
              />
            </Field>
          </div>
          <div className="flex gap-2 justify-end pt-4">
            <button className="btn-default" onClick={() => setModal(null)}>Cancel</button>
            <button className="btn-primary" onClick={handleRecitationSave} disabled={submitting || !form.rating}>
              {submitting ? 'Saving...' : 'Save Recitation'}
            </button>
          </div>
        </Modal>
      )}

      {modal === 'attendance' && selStudent && (
        <Modal
          title="Add Attendance"
          subtitle={`${selStudent.user?.first_name} ${selStudent.user?.last_name}`}
          onClose={() => setModal(null)}
          maxWidth="320px"
        >
          <div className="space-y-3">
            <Field label="Date">
              <input
                type="date"
                className="input-field"
                value={form.date || new Date().toISOString().split('T')[0]}
                onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
              />
            </Field>
            <Field label="Score (0-100)">
              <input
                type="number"
                className="input-field"
                value={form.rating || ''}
                onChange={e => setForm(f => ({ ...f, rating: e.target.value }))}
                placeholder="e.g., 100"
                min="0"
                max="100"
              />
            </Field>
          </div>
          <div className="flex gap-2 justify-end pt-4">
            <button className="btn-default" onClick={() => setModal(null)}>Cancel</button>
            <button className="btn-primary" onClick={handleAttendanceSave} disabled={submitting || !form.date || !form.rating}>
              {submitting ? 'Saving...' : 'Save Attendance'}
            </button>
          </div>
        </Modal>
      )}

      {modal === 'project' && selStudent && (
        <Modal
          title="Add Project"
          subtitle={`${selStudent.user?.first_name} ${selStudent.user?.last_name}`}
          onClose={() => setModal(null)}
          maxWidth="320px"
        >
          <div className="space-y-3">
            <Field label="Project #">
              <input
                type="number"
                className="input-field"
                value={form.number || ''}
                onChange={e => setForm(f => ({ ...f, number: e.target.value }))}
                min="1"
              />
            </Field>
            <Field label="Score (0-100)">
              <input
                type="number"
                className="input-field"
                value={form.rating || ''}
                onChange={e => setForm(f => ({ ...f, rating: e.target.value }))}
                placeholder="e.g., 85"
                min="0"
                max="100"
              />
            </Field>
          </div>
          <div className="flex gap-2 justify-end pt-4">
            <button className="btn-default" onClick={() => setModal(null)}>Cancel</button>
            <button className="btn-primary" onClick={handleProjectSave} disabled={submitting || !form.number || !form.rating}>
              {submitting ? 'Saving...' : 'Save Project'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
