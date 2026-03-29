import { useEffect, useState } from 'react';
import axios from '../../api/axios';
import PageHeader from '../../components/ui/PageHeader';
import DataTable from '../../components/ui/DataTable';
import Modal from '../../components/ui/Modal';
import Field from '../../components/ui/Field';
import EmptyState from '../../components/ui/EmptyState';

export default function SubjectLoadPage() {
  // State for storing fetched data
  const [sectionSubjects, setSectionSubjects] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [sections, setSections] = useState([]);
  
  // UI state
  const [loading, setLoading] = useState(true);
  
  // Modal state
  const [modal, setModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ subjectId: '', sectionId: '', semester: 2 });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Get current user
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const professorId = user?.professor?.professor_id;

  // Fetch data on mount
  useEffect(() => {
    fetchData();
  }, []);

  // Fetch section-subjects, subjects, and sections
  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch all data in parallel
      const [ssRes, subRes, secRes] = await Promise.all([
        axios.get(`/section-subjects?professor_id=${professorId}&per_page=500`),
        axios.get('/subjects?per_page=500'),
        axios.get('/sections?per_page=500'),
      ]);

      setSectionSubjects(ssRes.data.data || ssRes.data);
      setSubjects(subRes.data.data || subRes.data);
      setSections(secRes.data.data || secRes.data);
    } catch (err) {
      console.error('Failed to fetch data', err);
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  // Table columns
  const cols = [
    {
      key: 'code', 
      label: 'Code',
      render: r => (
        <span className="font-bold text-navy-600 font-mono">
          {r.subject?.subject_code || '-'}
        </span>
      ),
    },
    { 
      key: 'title',   
      label: 'Subject',  
      render: r => r.subject?.subject_name || '-', 
      wrap: true 
    },
    { 
      key: 'units',   
      label: 'Units',    
      render: r => `${r.subject?.units || '—'} units` 
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

  // Handle add/edit
  const handleSave = async () => {
    if (!form.subjectId || !form.sectionId) return;
    
    setSubmitting(true);
    setError(null);

    try {
      const payload = {
        subject_id: parseInt(form.subjectId),
        section_id: form.sectionId,
        professor_id: professorId,
        semester: parseInt(form.semester),
      };

      if (editId) {
        await axios.put(`/section-subjects/${editId}`, payload);
      } else {
        await axios.post('/section-subjects', payload);
      }

      await fetchData();
      setModal(false);
      setForm({ subjectId: '', sectionId: '', semester: 2 });
      setEditId(null);
    } catch (err) {
      console.error('Failed to save', err);
      setError(err.response?.data?.message || 'Failed to save');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle delete
  const handleDelete = async (row) => {
    if (!window.confirm('Remove this subject load?')) return;

    try {
      await axios.delete(`/section-subjects/${row.id}`);
      await fetchData();
    } catch (err) {
      console.error('Failed to delete', err);
      alert(err.response?.data?.message || 'Failed to delete');
    }
  };

  // Open add modal
  const openAddModal = () => {
    setForm({ subjectId: '', sectionId: '', semester: 2 });
    setEditId(null);
    setError(null);
    setModal(true);
  };

  // Open edit modal
  const openEditModal = (row) => {
    setForm({
      subjectId: String(row.subject_id),
      sectionId: row.section_id,
      semester: String(row.semester),
    });
    setEditId(row.id);
    setError(null);
    setModal(true);
  };

  return (
    <div>
      <PageHeader
        title="Subject Load"
        sub="Subjects currently assigned to you"
        action={
          <button className="btn-primary" onClick={openAddModal}>
            + Add Subject Load
          </button>
        }
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
            onEdit={openEditModal}
            onDelete={handleDelete}
          />
        )}
      </div>

      {modal && (
        <Modal 
          title={editId ? 'Edit Subject Load' : 'Add Subject Load'} 
          onClose={() => setModal(false)}
        >
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-[12px]">
              {error}
            </div>
          )}
          
          <Field label="Subject">
            <select 
              className="input-field" 
              value={form.subjectId} 
              onChange={e => setForm(f => ({ ...f, subjectId: e.target.value }))}
            >
              <option value="">Select subject...</option>
              {subjects.map(s => (
                <option key={s.id} value={s.id}>
                  {s.subject_code} — {s.subject_name}
                </option>
              ))}
            </select>
          </Field>
          
          <Field label="Section">
            <select 
              className="input-field" 
              value={form.sectionId} 
              onChange={e => setForm(f => ({ ...f, sectionId: e.target.value }))}
            >
              <option value="">Select section...</option>
              {sections.map(s => (
                <option key={s.section_id} value={s.section_id}>
                  {s.section_name}
                </option>
              ))}
            </select>
          </Field>
          
          <Field label="Semester">
            <select 
              className="input-field" 
              value={form.semester} 
              onChange={e => setForm(f => ({ ...f, semester: e.target.value }))}
            >
              <option value="1">1st Semester</option>
              <option value="2">2nd Semester</option>
            </select>
          </Field>
          
          <div className="flex gap-2 justify-end pt-2">
            <button className="btn-default" onClick={() => setModal(false)}>Cancel</button>
            <button className="btn-primary" onClick={handleSave} disabled={submitting}>
              {submitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
