import { useEffect, useState } from 'react';
import axios from '../../api/axios';
import PageHeader from '../../components/ui/PageHeader';
import DataTable from '../../components/ui/DataTable';
import Modal from '../../components/ui/Modal';
import Field from '../../components/ui/Field';
import EmptyState from '../../components/ui/EmptyState';

export default function AdminSubjectLoadsPage() {
  const [sectionSubjects, setSectionSubjects] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [sections, setSections] = useState([]);
  const [professors, setProfessors] = useState([]);
  
  const [loading, setLoading] = useState(true);
  
  const [modal, setModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ subjectId: '', sectionId: '', professorId: '', semester: 2 });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [ssRes, subRes, secRes, profRes] = await Promise.all([
        axios.get('/section-subjects?per_page=1000'),
        axios.get('/subjects?per_page=500'),
        axios.get('/sections?per_page=500'),
        axios.get('/professors?per_page=500'),
      ]);

      setSectionSubjects(ssRes.data.data || ssRes.data);
      setSubjects(subRes.data.data || subRes.data);
      setSections(secRes.data.data || secRes.data);
      setProfessors(profRes.data.data || profRes.data);
    } catch (err) {
      console.error('Failed to fetch data', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!form.subjectId || !form.sectionId || !form.professorId) return;
    
    setSubmitting(true);
    setError(null);

    try {
      const payload = {
        subject_id: parseInt(form.subjectId),
        section_id: form.sectionId,
        professor_id: form.professorId,
        semester: parseInt(form.semester),
      };

      if (editId) {
        await axios.put(`/section-subjects/${editId}`, payload);
      } else {
        await axios.post('/section-subjects', payload);
      }

      await fetchData();
      setModal(false);
      setForm({ subjectId: '', sectionId: '', professorId: '', semester: 2 });
      setEditId(null);
    } catch (err) {
      console.error('Failed to save', err);
      setError(err.response?.data?.message || 'Failed to save');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (row) => {
    if (!window.confirm('Remove this subject assignment?')) return;

    try {
      await axios.delete(`/section-subjects/${row.id}`);
      await fetchData();
    } catch (err) {
      console.error('Failed to delete', err);
      alert(err.response?.data?.message || 'Failed to delete');
    }
  };

  const openAddModal = () => {
    setForm({ subjectId: '', sectionId: '', professorId: '', semester: 2 });
    setEditId(null);
    setError(null);
    setModal(true);
  };

  const openEditModal = (row) => {
    setForm({
      subjectId: String(row.subject_id),
      sectionId: row.section_id,
      professorId: row.professor_id,
      semester: String(row.semester),
    });
    setEditId(row.id);
    setError(null);
    setModal(true);
  };

  const cols = [
    { 
      key: 'professor', 
      label: 'Professor',
      render: r => (
        <div>
          <div className="text-[13px] font-bold text-navy-900">
            {r.professor?.user ? `${r.professor.user.first_name} ${r.professor.user.last_name}` : '-'}
          </div>
          <div className="text-[10px] text-gray-400">{r.professor?.user?.email}</div>
        </div>
      ),
    },
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
        title="Subject Loads"
        sub="Assign subjects to professors"
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
          maxWidth="500px"
        >
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-[12px]">
              {error}
            </div>
          )}
          
          <Field label="Professor">
            <select
              className="input-field"
              value={form.professorId}
              onChange={e => setForm({ ...form, professorId: e.target.value })}
            >
              <option value="">Select Professor</option>
              {professors.map(p => (
                <option key={p.professor_id} value={p.professor_id}>
                  {p.user ? `${p.user.first_name} ${p.user.last_name}` : p.professor_id}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Subject">
            <select
              className="input-field"
              value={form.subjectId}
              onChange={e => setForm({ ...form, subjectId: e.target.value })}
            >
              <option value="">Select Subject</option>
              {subjects.map(s => (
                <option key={s.id} value={s.id}>
                  {s.subject_code} - {s.subject_name}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Section">
            <select
              className="input-field"
              value={form.sectionId}
              onChange={e => setForm({ ...form, sectionId: e.target.value })}
            >
              <option value="">Select Section</option>
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
              onChange={e => setForm({ ...form, semester: e.target.value })}
            >
              <option value="1">1st Semester</option>
              <option value="2">2nd Semester</option>
            </select>
          </Field>

          <div className="flex gap-2 justify-end pt-4">
            <button className="btn-default" onClick={() => setModal(false)}>
              Cancel
            </button>
            <button className="btn-primary" onClick={handleSave} disabled={submitting}>
              {submitting ? 'Saving...' : (editId ? 'Save Changes' : 'Add Subject Load')}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}