import { useEffect, useMemo, useState } from "react";
import axios from '../../api/axios';
import DataTable from '../../components/ui/DataTable';
import EmptyState from '../../components/ui/EmptyState';
import Field from '../../components/ui/Field';
import Modal from '../../components/ui/Modal';
import PageHeader from '../../components/ui/PageHeader';
import Pagination from '../../components/ui/Pagination';

// Hardcoded year levels
const YEAR_LEVELS = [
  { value: 1, label: '1st Year' },
  { value: 2, label: '2nd Year' },
  { value: 3, label: '3rd Year' },
  { value: 4, label: '4th Year' },
];

// School years
const SCHOOL_YEARS = ['2024-2025', '2025-2026', '2026-2027'];

const ITEMS_PER_PAGE = 15;

const AdminSectionsPage = () => {
  // State for storing fetched data
  const [sections, setSections] = useState([]);
  const [courses, setCourses] = useState([]);

  // UI state
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [courseFilter, setCourseFilter] = useState('all');
  const [yearFilter, setYearFilter] = useState('all');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);

  // Modal state
  const [modal, setModal] = useState(null); // null | 'add' | 'edit'
  const [editingSection, setEditingSection] = useState(null);
  const [formData, setFormData] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Fetch sections on mount
  useEffect(() => {
    fetchSections();
  }, []);

  // Reset to page 1 when search or filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [search, courseFilter, yearFilter]);

  // Fetch sections from API
  const fetchSections = async () => {
    try {
      setLoading(true);
      const [sectionsRes, coursesRes] = await Promise.all([
        axios.get('/sections?per_page=1000'),
        axios.get('/courses?per_page=1000')
      ]);
      setSections(sectionsRes.data.data || sectionsRes.data);
      setCourses(coursesRes.data.data || coursesRes.data);
    } catch (err) {
      console.error('Failed to fetch sections or courses', err);
      setError('Failed to load sections and courses');
    } finally {
      setLoading(false);
    }
  };

  // Filter sections
  const filteredSections = useMemo(() => {
    return sections.filter(s => {
      if (courseFilter !== 'all' && s.course_id !== parseInt(courseFilter)) return false;
      if (yearFilter !== 'all' && s.year_level !== parseInt(yearFilter)) return false;
      if (search) {
        const searchLower = search.toLowerCase();
        return s.section_name?.toLowerCase().includes(searchLower);
      }
      return true;
    });
  }, [sections, courseFilter, yearFilter, search]);

  // Paginate filtered results
  const paginatedSections = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredSections.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredSections, currentPage]);

  const totalPages = Math.ceil(filteredSections.length / ITEMS_PER_PAGE);

  // Table columns
  const columns = [
    { key: 'section_name', label: 'Section Name' },
    {
      key: 'year_level',
      label: 'Year Level',
      render: (row) => YEAR_LEVELS.find(y => y.value === row.year_level)?.label || row.year_level
    },
    {
      key: 'course',
      label: 'Course',
      render: (row) => row.course?.course_name || courses.find(c => c.id === row.course_id)?.course_name || '-'
    },
    { key: 'school_year', label: 'School Year' },
  ];

  // Handle add section
  const handleAddSection = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      await axios.post('/sections', {
        section_name: formData.section_name,
        year_level: parseInt(formData.year_level),
        course_id: parseInt(formData.course_id),
        school_year: formData.school_year,
      });

      await fetchSections();
      setModal(null);
      setFormData({});
    } catch (err) {
      console.error('Failed to add section', err);
      setError(err.response?.data?.message || 'Failed to add section');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle edit section
  const handleEditSection = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      await axios.put(`/sections/${editingSection.id}`, {
        section_name: formData.section_name,
        year_level: parseInt(formData.year_level),
        course_id: parseInt(formData.course_id),
        school_year: formData.school_year,
      });

      await fetchSections();
      setModal(null);
      setEditingSection(null);
      setFormData({});
    } catch (err) {
      console.error('Failed to update section', err);
      setError(err.response?.data?.message || 'Failed to update section');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle delete section
  const handleDeleteSection = async (section) => {
    if (!window.confirm(`Are you sure you want to delete ${section.section_name}?`)) {
      return;
    }

    try {
      await axios.delete(`/sections/${section.id}`);
      await fetchSections();
    } catch (err) {
      console.error('Failed to delete section', err);
      alert(err.response?.data?.message || 'Failed to delete section');
    }
  };

  // Open add modal
  const openAddModal = () => {
    setFormData({
      section_name: '',
      year_level: '1',
      course_id: '1',
      school_year: '2025-2026',
    });
    setError(null);
    setModal('add');
  };

  // Open edit modal
  const openEditModal = (section) => {
    setEditingSection(section);
    setFormData({
      section_name: section.section_name,
      year_level: String(section.year_level),
      course_id: String(section.course_id),
      school_year: section.school_year,
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
        title="Sections"
        sub="Manage class sections"
        action={
          <button className="btn-primary" onClick={openAddModal}>
            + Add Section
          </button>
        }
      />

      {/* Search and Filter Bar */}
      <div className="flex gap-3 mb-4 flex-wrap">
        {/* Search Input */}
        <input
          type="text"
          placeholder="Search sections..."
          className="input-field flex-1 max-w-[250px]"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        {/* Course Filter */}
        <select
          className="input-field w-[180px]"
          value={courseFilter}
          onChange={(e) => setCourseFilter(e.target.value)}
        >
          <option value="all">All Courses</option>
          {courses.map(c => (
            <option key={c.id} value={c.id}>{c.course_name}</option>
          ))}
        </select>

        {/* Year Level Filter */}
        <select
          className="input-field w-[140px]"
          value={yearFilter}
          onChange={(e) => setYearFilter(e.target.value)}
        >
          <option value="all">All Years</option>
          {YEAR_LEVELS.map(y => (
            <option key={y.value} value={y.value}>{y.label}</option>
          ))}
        </select>
      </div>

      {/* Sections Table */}
      <div className="bg-white border border-gray-200 rounded-[12px] shadow-card overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400">Loading...</div>
        ) : filteredSections.length === 0 ? (
          <EmptyState text="No sections found" />
        ) : (
          <>
            <DataTable
              columns={columns}
              rows={paginatedSections}
              onEdit={openEditModal}
              onDelete={handleDeleteSection}
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
          title={modal === 'add' ? 'Add Section' : 'Edit Section'}
          onClose={() => { setModal(null); setEditingSection(null); }}
          maxWidth="420px"
        >
          <form onSubmit={modal === 'add' ? handleAddSection : handleEditSection}>
            {/* Error Message */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-[12px]">
                {error}
              </div>
            )}

            {/* Section Name */}
            <Field label="Section Name">
              <input
                type="text"
                name="section_name"
                className="input-field"
                value={formData.section_name || ''}
                onChange={handleInputChange}
                placeholder="e.g. BSIT-1A"
                required
              />
            </Field>

            {/* Year Level */}
            <Field label="Year Level">
              <select
                name="year_level"
                className="input-field"
                value={formData.year_level || ''}
                onChange={handleInputChange}
                required
              >
                {YEAR_LEVELS.map(y => (
                  <option key={y.value} value={y.value}>{y.label}</option>
                ))}
              </select>
            </Field>

            {/* Course */}
            <Field label="Course">
              <select
                name="course_id"
                className="input-field"
                value={formData.course_id || ''}
                onChange={handleInputChange}
                required
              >
                <option value="">Select Course</option>
                {courses.map(c => (
                  <option key={c.id} value={c.id}>{c.course_name}</option>
                ))}
              </select>
            </Field>

            {/* School Year */}
            <Field label="School Year">
              <select
                name="school_year"
                className="input-field"
                value={formData.school_year || ''}
                onChange={handleInputChange}
                required
              >
                {SCHOOL_YEARS.map(sy => (
                  <option key={sy} value={sy}>{sy}</option>
                ))}
              </select>
            </Field>

            {/* Form Actions */}
            <div className="flex gap-2 justify-end pt-4">
              <button
                type="button"
                className="btn-default"
                onClick={() => { setModal(null); setEditingSection(null); }}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary"
                disabled={submitting}
              >
                {submitting ? 'Saving...' : modal === 'add' ? 'Add Section' : 'Save Changes'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default AdminSectionsPage;
