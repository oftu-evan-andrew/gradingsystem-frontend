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

const ITEMS_PER_PAGE = 15;

const AdminUserPage = () => {
  // State for storing fetched data
  const [students, setStudents] = useState([]);
  const [professors, setProfessors] = useState([]);
  const [sections, setSections] = useState([]);

  // UI state
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState('all'); // 'all' | 'student' | 'professor'

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);

  // Modal state
  const [modal, setModal] = useState(null); // null | 'add' | 'edit'
  const [formData, setFormData] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Fetch students, professors, and sections on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [studRes, profRes, secRes] = await Promise.all([
          axios.get('/students?per_page=1000'),
          axios.get('/professors?per_page=1000'),
          axios.get('/sections'),
        ]);
        // Handle paginated response (Laravel returns data.data for paginated)
        setStudents(studRes.data.data || studRes.data);
        setProfessors(profRes.data.data || profRes.data);
        setSections(secRes.data.data || secRes.data);
      } catch (err) {
        console.error('Failed to fetch users', err);
        setError('Failed to load users');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Reset to page 1 when search or filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [search, roleFilter]);

  // Normalize data for table display - combine students and professors into single list
  const normalizedUsers = useMemo(() => [
    ...students.map(s => ({
      id: s.id,
      userId: s.user_id,
      name: s.user?.first_name + ' ' + s.user?.last_name || 'Unknown',
      email: s.user?.email || '-',
      role: 'student',
      section: s.section?.section_name || s.section?.name || '-',
      sectionId: s.section_id,
    })),
    ...professors.map(p => ({
      id: p.id,
      userId: p.user_id,
      name: p.user?.first_name + ' ' + p.user?.last_name || 'Unknown',
      email: p.user?.email || '-',
      role: 'professor',
      section: '-',
      sectionId: null,
    })),
  ], [students, professors]);

  // Filter by role and search
  const filteredUsers = useMemo(() => {
    return normalizedUsers.filter(u => {
      if (roleFilter !== 'all' && u.role !== roleFilter) return false;
      if (search) {
        const searchLower = search.toLowerCase();
        return u.name.toLowerCase().includes(searchLower) ||
          u.email.toLowerCase().includes(searchLower);
      }
      return true;
    });
  }, [normalizedUsers, roleFilter, search]);

  // Paginate filtered results
  const paginatedUsers = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredUsers.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredUsers, currentPage]);

  const totalPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE);

  // Table columns configuration
  const columns = [
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email' },
    {
      key: 'role',
      label: 'Role',
      render: (row) => (
        <span className={`px-2 py-0.5 rounded text-[11px] font-medium ${row.role === 'student' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
          }`}>
          {row.role === 'student' ? 'Student' : 'Instructor'}
        </span>
      )
    },
    { key: 'section', label: 'Section' },
  ];

  // Handle add user submit
  const handleAddUser = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      // Map UI role to API role (instructor -> professor)
      const payload = {
        ...formData,
        role: formData.role === 'instructor' ? 'professor' : 'student',
      };

      await axios.post('/auth/register', payload);

      // Refresh data
      const [studRes, profRes] = await Promise.all([
        axios.get('/students?per_page=15'),
        axios.get('/professors?per_page=15'),
      ]);

      setStudents(studRes.data.data || studRes.data);
      setProfessors(profRes.data.data || profRes.data);

      // Reset to page 1 to see newly added user
      setCurrentPage(1);

      setModal(null);
      setFormData({});
    } catch (err) {
      console.error('Failed to add user', err);
      setError(err.response?.data?.message || 'Failed to add user');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle delete user
  const handleDeleteUser = async (user) => {
    if (!window.confirm(`Are you sure you want to delete ${user.name}?`)) {
      return;
    }

    try {
      if (user.role === 'student') {
        await axios.delete(`/students/${user.id}`);
      } else {
        await axios.delete(`/professors/${user.id}`);
      }

      // Refresh data
      const [studRes, profRes] = await Promise.all([
        axios.get('/students?per_page=100'),
        axios.get('/professors?per_page=100'),
      ]);
      setStudents(studRes.data.data || studRes.data);
      setProfessors(profRes.data.data || profRes.data);
      setCurrentPage(1);
    } catch (err) {
      console.error('Failed to delete user', err);
      alert(err.response?.data?.message || 'Failed to delete user');
    }
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Open add modal
  const openAddModal = () => {
    setFormData({
      first_name: '',
      last_name: '',
      email: '',
      password: '',
      password_confirmation: '',
      role: 'student',
      section_id: '',
    });
    setError(null);
    setModal('add');
  };

  // Handle page change
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  return (
    <div>
      {/* Page Header */}
      <PageHeader
        title="Users"
        sub="Manage students and instructors"
        action={
          <button className="btn-primary" onClick={openAddModal}>
            + Add User
          </button>
        }
      />

      {/* Search and Filter Bar */}
      <div className="flex gap-3 mb-4">
        {/* Search Input */}
        <input
          type="text"
          placeholder="Search by name or email..."
          className="input-field flex-1 max-w-[300px]"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        {/* Role Filter Dropdown */}
        <select
          className="input-field w-[150px]"
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
        >
          <option value="all">All Roles</option>
          <option value="student">Students</option>
          <option value="professor">Instructors</option>
        </select>
      </div>

      {/* Users Table */}
      <div className="bg-white border border-gray-200 rounded-[12px] shadow-card overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400">Loading...</div>
        ) : filteredUsers.length === 0 ? (
          <EmptyState text="No users found" />
        ) : (
          <>
            <DataTable
              columns={columns}
              rows={paginatedUsers}
              onDelete={handleDeleteUser}
            />
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          </>
        )}
      </div>

      {/* Add User Modal */}
      {modal === 'add' && (
        <Modal
          title="Add User"
          subtitle="Create a new student or instructor account"
          onClose={() => setModal(null)}
          maxWidth="450px"
        >
          <form onSubmit={handleAddUser}>
            {/* Error Message */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-[12px]">
                {error}
              </div>
            )}

            {/* First Name */}
            <Field label="First Name">
              <input
                type="text"
                name="first_name"
                className="input-field"
                value={formData.first_name || ''}
                onChange={handleInputChange}
                required
              />
            </Field>

            {/* Last Name */}
            <Field label="Last Name">
              <input
                type="text"
                name="last_name"
                className="input-field"
                value={formData.last_name || ''}
                onChange={handleInputChange}
                required
              />
            </Field>

            {/* Email */}
            <Field label="Email">
              <input
                type="email"
                name="email"
                className="input-field"
                value={formData.email || ''}
                onChange={handleInputChange}
                required
              />
            </Field>

            {/* Password */}
            <Field label="Password">
              <input
                type="password"
                name="password"
                className="input-field"
                value={formData.password || ''}
                onChange={handleInputChange}
                required
                minLength={8}
              />
            </Field>

            {/* Confirm Password */}
            <Field label="Confirm Password">
              <input
                type="password"
                name="password_confirmation"
                className="input-field"
                value={formData.password_confirmation || ''}
                onChange={handleInputChange}
                required
              />
            </Field>

            {/* Role Dropdown */}
            <Field label="Role">
              <select
                name="role"
                className="input-field"
                value={formData.role || ''}
                onChange={handleInputChange}
                required
              >
                <option value="student">Student</option>
                <option value="instructor">Instructor</option>
              </select>
            </Field>

            {/* Section Dropdown (only for students) */}
            {formData.role === 'student' && (
              <Field label="Section">
                <select
                  name="section_id"
                  className="input-field"
                  value={formData.section_id || ''}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select Section</option>
                  {sections.map(sec => (
                    <option key={sec.section_id} value={sec.section_id}>{sec.section_name}</option>
                  ))}
                </select>
              </Field>
            )}

            {/* Form Actions */}
            <div className="flex gap-2 justify-end pt-4">
              <button
                type="button"
                className="btn-default"
                onClick={() => setModal(null)}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary"
                disabled={submitting}
              >
                {submitting ? 'Adding...' : 'Add User'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default AdminUserPage;
