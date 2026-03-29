import { useEffect, useMemo, useState } from "react";
import axios from '../../api/axios';
import DataTable from '../../components/ui/DataTable';
import EmptyState from '../../components/ui/EmptyState';
import Field from '../../components/ui/Field';
import Modal from '../../components/ui/Modal';
import PageHeader from '../../components/ui/PageHeader';
import Pagination from '../../components/ui/Pagination';

// Hardcoded unit options
const UNIT_OPTIONS = [1, 2, 3, 4, 5, 6];

const ITEMS_PER_PAGE = 15;

const AdminSubjectsPage = () => {
  // State for storing fetched data
  const [subjects, setSubjects] = useState([]);

  // UI state
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);

  // Modal state
  const [modal, setModal] = useState(null); // null | 'add' | 'edit'
  const [editingSubject, setEditingSubject] = useState(null);
  const [formData, setFormData] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Fetch subjects on mount
  useEffect(() => {
    fetchSubjects();
  }, []);

  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  // Fetch subjects from API
  const fetchSubjects = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/subjects?per_page=1000');
      setSubjects(res.data.data || res.data);
    } catch (err) {
      console.error('Failed to fetch subjects', err);
      setError('Failed to load subjects');
    } finally {
      setLoading(false);
    }
  };

  // Filter subjects
  const filteredSubjects = useMemo(() => {
    return subjects.filter(s => {
      if (search) {
        const searchLower = search.toLowerCase();
        return s.subject_name?.toLowerCase().includes(searchLower) ||
          s.subject_code?.toLowerCase().includes(searchLower);
      }
      return true;
    });
  }, [subjects, search]);

  // Paginate filtered results
  const paginatedSubjects = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredSubjects.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredSubjects, currentPage]);

  const totalPages = Math.ceil(filteredSubjects.length / ITEMS_PER_PAGE);

  // Table columns
  const columns = [
    { key: 'subject_code', label: 'Code' },
    { key: 'subject_name', label: 'Subject Name' },
    {
      key: 'units',
      label: 'Units',
      render: (row) => `${row.units} unit${row.units !== 1 ? 's' : ''}`
    },
    // {
    //   key: 'is_minor',
    //   label: 'Type',
    //   render: (row) => (
    //     <span className={`px-2 py-0.5 rounded text-[11px] font-medium ${row.is_minor ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'
    //       }`}>
    //       {row.is_minor ? 'Minor' : 'Major'}
    //     </span>
    //   )
    // },
  ];

  // Handle add subject
  const handleAddSubject = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      await axios.post('/subjects', {
        subject_name: formData.subject_name,
        subject_code: formData.subject_code,
        units: parseInt(formData.units),
        is_minor: formData.is_minor === 'true' || formData.is_minor === true,
      });

      await fetchSubjects();
      setModal(null);
      setFormData({});
    } catch (err) {
      console.error('Failed to add subject', err);
      setError(err.response?.data?.message || 'Failed to add subject');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle edit subject
  const handleEditSubject = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      await axios.put(`/subjects/${editingSubject.id}`, {
        subject_name: formData.subject_name,
        subject_code: formData.subject_code,
        units: parseInt(formData.units),
        is_minor: formData.is_minor === 'true' || formData.is_minor === true,
      });

      await fetchSubjects();
      setModal(null);
      setEditingSubject(null);
      setFormData({});
    } catch (err) {
      console.error('Failed to update subject', err);
      setError(err.response?.data?.message || 'Failed to update subject');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle delete subject
  const handleDeleteSubject = async (subject) => {
    if (!window.confirm(`Are you sure you want to delete ${subject.subject_name}?`)) {
      return;
    }

    try {
      await axios.delete(`/subjects/${subject.id}`);
      await fetchSubjects();
    } catch (err) {
      console.error('Failed to delete subject', err);
      alert(err.response?.data?.message || 'Failed to delete subject');
    }
  };

  // Open add modal
  const openAddModal = () => {
    setFormData({
      subject_code: '',
      subject_name: '',
      units: '3',
      is_minor: false,
    });
    setError(null);
    setModal('add');
  };

  // Open edit modal
  const openEditModal = (subject) => {
    setEditingSubject(subject);
    setFormData({
      subject_code: subject.subject_code,
      subject_name: subject.subject_name,
      units: String(subject.units),
      is_minor: subject.is_minor,
    });
    setError(null);
    setModal('edit');
  };

  // Handle input change
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Handle page change
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  return (
    <div>
      {/* Page Header */}
      <PageHeader
        title="Subjects"
        sub="Manage academic subjects"
        action={
          <button className="btn-primary" onClick={openAddModal}>
            + Add Subject
          </button>
        }
      />

      {/* Search Bar */}
      <div className="flex gap-3 mb-4">
        <input
          type="text"
          placeholder="Search by code or name..."
          className="input-field flex-1 max-w-[300px]"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Subjects Table */}
      <div className="bg-white border border-gray-200 rounded-[12px] shadow-card overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400">Loading...</div>
        ) : filteredSubjects.length === 0 ? (
          <EmptyState text="No subjects found" />
        ) : (
          <>
            <DataTable
              columns={columns}
              rows={paginatedSubjects}
              onEdit={openEditModal}
              onDelete={handleDeleteSubject}
            />
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          </>
        )}
      </div>

      {/* Add/Edit Modal */}
      {modal && (
        <Modal
          title={modal === 'add' ? 'Add Subject' : 'Edit Subject'}
          onClose={() => { setModal(null); setEditingSubject(null); }}
          maxWidth="420px"
        >
          <form onSubmit={modal === 'add' ? handleAddSubject : handleEditSubject}>
            {/* Error Message */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-[12px]">
                {error}
              </div>
            )}

            {/* Subject Code */}
            <Field label="Subject Code">
              <input
                type="text"
                name="subject_code"
                className="input-field"
                value={formData.subject_code || ''}
                onChange={handleInputChange}
                placeholder="e.g. CS101"
                required
              />
            </Field>

            {/* Subject Name */}
            <Field label="Subject Name">
              <input
                type="text"
                name="subject_name"
                className="input-field"
                value={formData.subject_name || ''}
                onChange={handleInputChange}
                placeholder="e.g. Introduction to Computer Science"
                required
              />
            </Field>

            {/* Units */}
            <Field label="Units">
              <select
                name="units"
                className="input-field"
                value={formData.units || ''}
                onChange={handleInputChange}
                required
              >
                {UNIT_OPTIONS.map(u => (
                  <option key={u} value={u}>{u} unit{u !== 1 ? 's' : ''}</option>
                ))}
              </select>
            </Field>

            {/* Is Minor Checkbox */}
            <div className="mb-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="is_minor"
                  className="w-4 h-4 text-navy-600 rounded border-gray-300 focus:ring-navy-500"
                  checked={!!formData.is_minor}
                  onChange={handleInputChange}
                />
                <span className="text-[13px] text-gray-700">Minor Subject</span>
              </label>
              <p className="text-[11px] text-gray-400 mt-1">
                Minor subjects are elective courses that don't count toward the major
              </p>
            </div>

            {/* Form Actions */}
            <div className="flex gap-2 justify-end pt-2">
              <button
                type="button"
                className="btn-default"
                onClick={() => { setModal(null); setEditingSubject(null); }}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary"
                disabled={submitting}
              >
                {submitting ? 'Saving...' : modal === 'add' ? 'Add Subject' : 'Save Changes'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default AdminSubjectsPage;
