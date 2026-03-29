import { useEffect, useMemo, useState } from "react";
import axios from '../../api/axios';
import DataTable from '../../components/ui/DataTable';
import EmptyState from '../../components/ui/EmptyState';
import Field from '../../components/ui/Field';
import Modal from '../../components/ui/Modal';
import PageHeader from '../../components/ui/PageHeader';
import Pagination from '../../components/ui/Pagination';

const ITEMS_PER_PAGE = 15;

const AdminCoursesPage = () => {
  // State for storing fetched data
  const [courses, setCourses] = useState([]);

  // UI state
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);

  // Modal state
  const [modal, setModal] = useState(null); // null | 'add' | 'edit'
  const [editingCourse, setEditingCourse] = useState(null);
  const [formData, setFormData] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Fetch courses on mount
  useEffect(() => {
    fetchCourses();
  }, []);

  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  // Fetch courses from API
  const fetchCourses = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/courses');
      setCourses(res.data.data || res.data);
    } catch (err) {
      console.error('Failed to fetch courses', err);
      setError('Failed to load courses');
    } finally {
      setLoading(false);
    }
  };

  // Filter courses by name
  const filteredCourses = useMemo(() => {
    const seen = new Set();
    return courses.filter(c => {
      if (seen.has(c.id)) return false;

      seen.add(c.id);
      if (search) {
        const searchLower = search.toLowerCase();
        return c.course_name?.toLowerCase().includes(
          searchLower
        );
      }
      return true;
    });
  }, [courses, search]);

  // Paginate filtered results
  const paginatedCourses = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredCourses.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredCourses, currentPage]);

  const totalPages = Math.ceil(filteredCourses.length / ITEMS_PER_PAGE);

  // Table columns
  const columns = [
    { key: 'course_name', label: 'Course Name' },
    {
      key: 'sections_count',
      label: 'Sections',
      render: (row) => row.sections_count || 0
    },
    {
      key: 'created_at',
      label: 'Created',
      render: (row) => row.created_at ? new Date(row.created_at).toLocaleDateString() : '-'
    },
  ];

  // Handle add course
  const handleAddCourse = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      await axios.post('/courses', {
        course_name: formData.course_name,
      });

      await fetchCourses();
      setModal(null);
      setFormData({});
    } catch (err) {
      console.error('Failed to add course', err);
      setError(err.response?.data?.message || 'Failed to add course');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle edit course
  const handleEditCourse = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      await axios.put(`/courses/${editingCourse.id}`, {
        course_name: formData.course_name,
      });

      await fetchCourses();
      setModal(null);
      setEditingCourse(null);
      setFormData({});
    } catch (err) {
      console.error('Failed to update course', err);
      setError(err.response?.data?.message || 'Failed to update course');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle delete course
  const handleDeleteCourse = async (course) => {
    if (!window.confirm(`Are you sure you want to delete ${course.course_name}?`)) {
      return;
    }

    try {
      await axios.delete(`/courses/${course.id}`);
      await fetchCourses();
    } catch (err) {
      console.error('Failed to delete course', err);
      alert(err.response?.data?.message || 'Failed to delete course');
    }
  };

  // Open add modal
  const openAddModal = () => {
    setFormData({
      course_name: '',
    });
    setError(null);
    setModal('add');
  };

  // Open edit modal
  const openEditModal = (course) => {
    setEditingCourse(course);
    setFormData({
      course_name: course.course_name,
    });
    setError(null);
    setModal('edit');
  };

  // Handle input change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handle page change
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  return (
    <div>
      {/* Page Header */}
      <PageHeader
        title="Courses"
        sub="Manage academic programs"
        action={
          <button className="btn-primary" onClick={openAddModal}>
            + Add Course
          </button>
        }
      />

      {/* Search Bar */}
      <div className="flex gap-3 mb-4">
        <input
          type="text"
          placeholder="Search courses..."
          className="input-field flex-1 max-w-[300px]"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Courses Table */}
      <div className="bg-white border border-gray-200 rounded-[12px] shadow-card overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400">Loading...</div>
        ) : filteredCourses.length === 0 ? (
          <EmptyState text="No courses found" />
        ) : (
          <>
            <DataTable
              columns={columns}
              rows={paginatedCourses}
              onEdit={openEditModal}
              onDelete={handleDeleteCourse}
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
          title={modal === 'add' ? 'Add Course' : 'Edit Course'}
          onClose={() => { setModal(null); setEditingCourse(null); }}
          maxWidth="400px"
        >
          <form onSubmit={modal === 'add' ? handleAddCourse : handleEditCourse}>
            {/* Error Message */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-[12px]">
                {error}
              </div>
            )}

            {/* Course Name */}
            <Field label="Course Name">
              <input
                type="text"
                name="course_name"
                className="input-field"
                value={formData.course_name || ''}
                onChange={handleInputChange}
                placeholder="e.g. BS Computer Science"
                required
              />
            </Field>

            {/* Form Actions */}
            <div className="flex gap-2 justify-end pt-4">
              <button
                type="button"
                className="btn-default"
                onClick={() => { setModal(null); setEditingCourse(null); }}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary"
                disabled={submitting}
              >
                {submitting ? 'Saving...' : modal === 'add' ? 'Add Course' : 'Save Changes'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default AdminCoursesPage;
