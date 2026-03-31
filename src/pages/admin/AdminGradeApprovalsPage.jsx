import { useEffect, useMemo, useState } from "react";
import axios from '../../api/axios';
import DataTable from '../../components/ui/DataTable';
import EmptyState from '../../components/ui/EmptyState';
import Modal from '../../components/ui/Modal';
import PageHeader from '../../components/ui/PageHeader';
import Pagination from '../../components/ui/Pagination';

const ITEMS_PER_PAGE = 15;

// Grading period options
const GRADING_PERIODS = [
  { value: 1, label: 'Prelims' },
  { value: 2, label: 'Midterms' },
  { value: 3, label: 'Finals' },
];

const AdminGradeApprovalsPage = () => {
  // State for storing fetched data
  const [sectionSubjects, setSectionSubjects] = useState([]);
  const [classStandings, setClassStandings] = useState([]);
  const [studentFinalGrades, setStudentFinalGrades] = useState([]);

  // UI state
  const [loading, setLoading] = useState(true);
  const [selectedSectionSubject, setSelectedSectionSubject] = useState(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);

  // Modal state
  const [modal, setModal] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);

  // Fetch data on mount
  useEffect(() => {
    fetchData();
  }, []);

  // Reset to page 1 when data changes
  useEffect(() => {
    setCurrentPage(1);
  }, [sectionSubjects.length]);

  // Fetch all necessary data
  const fetchData = async () => {
    try {
      setLoading(true);

      const [ssRes, csRes, sfgRes] = await Promise.all([
        axios.get('/section-subjects?per_page=1000'),
        axios.get('/class-standings?per_page=1000'),
        axios.get('/student-final-grades?per_page=1000'),
      ]);

      const ssData = ssRes.data.data || ssRes.data;
      const csData = csRes.data.data || csRes.data;
      const sfgData = sfgRes.data.data || sfgRes.data;

      setSectionSubjects(ssData);
      setClassStandings(csData);
      setStudentFinalGrades(sfgData);
    } catch (err) {
      console.error('Failed to fetch data', err);
    } finally {
      setLoading(false);
    }
  };

  // Group class standings by section_subject and grading period
  const getSectionSubjectStats = (ssId) => {
    const relevantStandings = classStandings.filter(cs => cs.section_subject_id === ssId);

    const stats = {
      pending: 0,
      submitted: 0,
      finalized: 0,
      byPeriod: { 1: { pending: 0, submitted: 0, finalized: 0 }, 2: { pending: 0, submitted: 0, finalized: 0 }, 3: { pending: 0, submitted: 0, finalized: 0 } },
    };

    relevantStandings.forEach(cs => {
      const period = cs.grading_period || 1;
      if (cs.status === 'draft' || cs.status === 'pending') {
        stats.pending++;
        if (stats.byPeriod[period]) stats.byPeriod[period].pending++;
      } else if (cs.status === 'submitted') {
        stats.submitted++;
        if (stats.byPeriod[period]) stats.byPeriod[period].submitted++;
      } else if (cs.status === 'finalized') {
        stats.finalized++;
        if (stats.byPeriod[period]) stats.byPeriod[period].finalized++;
      }
    });

    return stats;
  };

  // Get final grade status for a section_subject
  const getFinalGradeStatus = (ssId) => {
    const relevantGrades = studentFinalGrades.filter(sfg => sfg.section_subject_id === ssId);
    if (relevantGrades.length === 0) return 'none';

    const allFinalized = relevantGrades.every(sfg => sfg.status === 'finalized');
    const anySubmitted = relevantGrades.some(sfg => sfg.status === 'submitted');

    if (allFinalized) return 'finalized';
    if (anySubmitted) return 'submitted';
    return 'pending';
  };

  // Prepare table data
  const tableData = useMemo(() => {
    return sectionSubjects.map(ss => {
      const stats = getSectionSubjectStats(ss.id);
      const finalStatus = getFinalGradeStatus(ss.id);

      // Handle different professor data structures from API
      const professorName = (() => {
        if (ss.professor?.user) {
          return `${ss.professor.user.first_name || ''} ${ss.professor.user.last_name || ''}`.trim();
        }
        if (ss.professor?.first_name) {
          return `${ss.professor.first_name} ${ss.professor.last_name || ''}`.trim();
        }
        return '-';
      })();

      return {
        id: ss.id,
        section: ss.section?.section_name || '-',
        subject: ss.subject?.subject_name || '-',
        subjectCode: ss.subject?.subject_code || '-',
        professor: professorName,
        semester: ss.semester === 1 ? '1st' : '2nd',
        gradingPeriod: stats.byPeriod,
        classStandingStatus: stats,
        finalGradeStatus: finalStatus,
      };
    }).filter(row => row.classStandingStatus.submitted > 0 || row.finalGradeStatus === 'submitted');
  }, [sectionSubjects, classStandings, studentFinalGrades]);

  // Paginate table data
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return tableData.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [tableData, currentPage]);

  const totalPages = Math.ceil(tableData.length / ITEMS_PER_PAGE);

  // Table columns
  const columns = [
    { key: 'section', label: 'Section' },
    { key: 'subjectCode', label: 'Subject Code' },
    { key: 'subject', label: 'Subject' },
    { key: 'professor', label: 'Professor' },
    {
      key: 'gradingPeriod',
      label: 'Grading Period',
      render: (row) => {
        const periods = [];
        if (row.gradingPeriod?.[1]?.submitted > 0) periods.push('Prelims');
        if (row.gradingPeriod?.[2]?.submitted > 0) periods.push('Midterms');
        if (row.gradingPeriod?.[3]?.submitted > 0) periods.push('Finals');
        if (periods.length === 0) return <span className="text-gray-400">—</span>;
        return (
          <div className="flex gap-1 flex-wrap">
            {periods.map(p => (
              <span key={p} className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-[10px] font-medium">{p}</span>
            ))}
          </div>
        );
      }
    },
    {
      key: 'classStandingStatus',
      label: 'Class Standing',
      render: (row) => (
        <div className="flex gap-2 text-[11px]">
          <span className="px-2 py-0.5 bg-gray-100 rounded">{row.classStandingStatus.pending} pending</span>
          <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded">{row.classStandingStatus.submitted} submitted</span>
          <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded">{row.classStandingStatus.finalized} finalized</span>
        </div>
      )
    },
    {
      key: 'finalGradeStatus',
      label: 'Final Grade',
      render: (row) => {
        const colors = {
          none: 'bg-gray-100 text-gray-500',
          pending: 'bg-yellow-100 text-yellow-700',
          submitted: 'bg-blue-100 text-blue-700',
          finalized: 'bg-green-100 text-green-700',
        };
        const labels = {
          none: 'No Grades',
          pending: 'Pending',
          submitted: 'Submitted',
          finalized: 'Finalized',
        };
        return (
          <span className={`px-2 py-0.5 rounded text-[11px] font-medium ${colors[row.finalGradeStatus]}`}>
            {labels[row.finalGradeStatus]}
          </span>
        );
      }
    },
  ];

  // Open modal to finalize class standings
  const openFinalizeModal = (row) => {
    setSelectedSectionSubject(row);
    setMessage(null);

    // Auto-select the first grading period that has submitted grades
    const stats = row.classStandingStatus;
    let defaultPeriod = 1;
    for (let p = 1; p <= 3; p++) {
      if (stats.byPeriod && stats.byPeriod[p] && stats.byPeriod[p].submitted > 0) {
        defaultPeriod = p;
        break;
      }
    }
    setSelectedPeriod(defaultPeriod);
    setModal('finalize');
  };

  // Open modal to approve final grades
  const openApproveModal = (row) => {
    setSelectedSectionSubject(row);
    setMessage(null);
    setModal('approve');
  };

  // Handle bulk reject class standings
  const handleReject = async () => {
    if (!selectedSectionSubject) return;
    if (!window.confirm('Reject these grades? They will be returned to draft status.')) return;

    setSubmitting(true);
    setMessage(null);

    try {
      const res = await axios.post('/class-standings/bulk/reject', {
        section_subject_id: selectedSectionSubject.id,
        grading_period: selectedPeriod,
      });

      setMessage({ type: 'success', text: res.data.message });
      await fetchData();
    } catch (err) {
      console.error('Failed to reject', err);
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to reject grades' });
    } finally {
      setSubmitting(false);
    }
  };

  // Handle bulk finalize class standings
  const handleFinalize = async () => {
    if (!selectedSectionSubject) return;

    setSubmitting(true);
    setMessage(null);

    try {
      const res = await axios.post('/class-standings/bulk/finalize', {
        section_subject_id: selectedSectionSubject.id,
        grading_period: selectedPeriod,
      });

      setMessage({ type: 'success', text: res.data.message });
      await fetchData();
    } catch (err) {
      console.error('Failed to finalize', err);
      const errorMsg = err.response?.data?.message || 'Failed to finalize grades';
      const pendingList = err.response?.data?.pending_students;

      if (pendingList && pendingList.length > 0) {
        const names = pendingList.map(p => p.student_name).join(', ');
        setMessage({ type: 'error', text: `${errorMsg}: ${names}` });
      } else {
        setMessage({ type: 'error', text: errorMsg });
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Handle bulk approve final grades
  const handleApprove = async () => {
    if (!selectedSectionSubject) return;

    setSubmitting(true);
    setMessage(null);

    try {
      const res = await axios.post('/student-final-grades/bulk/approve', {
        section_subject_id: selectedSectionSubject.id,
      });

      setMessage({ type: 'success', text: res.data.message });
      await fetchData();
    } catch (err) {
      console.error('Failed to approve', err);
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to approve grades' });
    } finally {
      setSubmitting(false);
    }
  };

  // Check if can finalize/approve
  const canFinalize = selectedSectionSubject?.classStandingStatus.submitted > 0;
  const canApprove = selectedSectionSubject?.finalGradeStatus === 'submitted';

  return (
    <div>
      {/* Page Header */}
      <PageHeader
        title="Grade Approvals"
        sub="Finalize and approve student grades"
      />

      {/* Info Banner */}
      <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="text-[12px] text-blue-800">
          <strong>How it works:</strong> Professors submit grades after recording.
          Finalize class standings per grading period (Prelims, Midterms, Finals).
          Once all periods are finalized, you can approve the final grades.
        </div>
      </div>

      {/* Grades Table */}
      <div className="bg-white border border-gray-200 rounded-[12px] shadow-card overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400">Loading...</div>
        ) : tableData.length === 0 ? (
          <EmptyState text="No section-subjects found" />
        ) : (
          <>
            <DataTable
              columns={columns}
              rows={paginatedData}
            />
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </>
        )}
      </div>

      {/* Action Buttons (shown when row selected - for simplicity, showing buttons below table) */}
      <div className="mt-4 flex gap-3">
        <button
          className="btn-primary"
          onClick={() => {
            const row = tableData.find(t => t.classStandingStatus.submitted > 0);
            if (row) openFinalizeModal(row);
          }}
        >
          Finalize Class Standing
        </button>
        <button
          className="btn-primary"
          onClick={() => {
            const row = tableData.find(t => t.finalGradeStatus === 'submitted');
            if (row) openApproveModal(row);
          }}
        >
          Approve Final Grades
        </button>

        {/* This is a mess. */}
        {/* <button
          className="btn-secondary"
          onClick={handleReject}
          disabled={submitting || !selectedSectionSubject || selectedSectionSubject.classStandingStatus.submitted === 0}
        >
          Reject Class Standing
        </button> */}
      </div>

      {/* Finalize Modal */}
      {modal === 'finalize' && selectedSectionSubject && (
        <Modal
          title="Finalize Class Standing"
          subtitle={`${selectedSectionSubject.subject} - ${selectedSectionSubject.section}`}
          onClose={() => setModal(null)}
          maxWidth="400px"
        >
          {message && (
            <div className={`mb-4 p-3 rounded-lg text-[12px] ${message.type === 'success' ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-700'
              }`}>
              {message.text}
            </div>
          )}

          <div className="mb-4">
            <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-[0.6px] mb-[6px]">
              Grading Period
            </label>
            <select
              className="input-field"
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(parseInt(e.target.value))}
            >
              {GRADING_PERIODS.map(p => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
          </div>

          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="text-[12px] text-yellow-800">
              This will finalize <strong>{selectedSectionSubject.classStandingStatus.byPeriod?.[selectedPeriod]?.submitted || 0}</strong> submitted grades for {GRADING_PERIODS.find(p => p.value === selectedPeriod)?.label}.
              Students will be able to view their grades after finalization.
            </div>
          </div>

          <div className="flex gap-2 justify-end">
            <button className="btn-default" onClick={() => setModal(null)}>Cancel</button>
            <button
              className="btn-primary"
              onClick={handleFinalize}
              disabled={submitting || !canFinalize}
            >
              {submitting ? 'Finalizing...' : 'Finalize'}
            </button>
          </div>
        </Modal>
      )}

      {/* Approve Modal */}
      {modal === 'approve' && selectedSectionSubject && (
        <Modal
          title="Approve Final Grades"
          subtitle={`${selectedSectionSubject.subject} - ${selectedSectionSubject.section}`}
          onClose={() => setModal(null)}
          maxWidth="400px"
        >
          {message && (
            <div className={`mb-4 p-3 rounded-lg text-[12px] ${message.type === 'success' ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-700'
              }`}>
              {message.text}
            </div>
          )}

          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="text-[12px] text-blue-800">
              This will approve and finalize the final grades for all students in this section-subject.
              This action cannot be undone.
            </div>
          </div>

          <div className="flex gap-2 justify-end">
            <button className="btn-default" onClick={() => setModal(null)}>Cancel</button>
            <button
              className="btn-primary"
              onClick={handleApprove}
              disabled={submitting || !canApprove}
            >
              {submitting ? 'Approving...' : 'Approve'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default AdminGradeApprovalsPage;
