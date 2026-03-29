import { useEffect, useState } from "react";
import axios from '../../api/axios';
import PageHeader from "../../components/ui/PageHeader";

export default function AdminDashboard() {
  // State for storing counts
  const [counts, setCounts] = useState({
    students: 0,
    professors: 0,
    sections: 0,
    subjects: 0,
    courses: 0,
  });

  // Loading state
  const [loading, setLoading] = useState(true);

  // Fetch all counts on mount
  useEffect(() => {
    const fetchCounts = async () => {
      try {
        setLoading(true);

        // Fetch all data in parallel
        const [studentsRes, professorsRes, sectionsRes, subjectsRes, coursesRes] = await Promise.all([
          axios.get('/students'),
          axios.get('/professors'),
          axios.get('/sections'),
          axios.get('/subjects'),
          axios.get('/courses'),
        ]);

        // Extract counts from paginated responses
        // Laravel returns: { data: [...], total: 1000, per_page: 15, ... }
        setCounts({
          students: studentsRes.data.total || 0,
          professors: professorsRes.data.total || 0,
          sections: sectionsRes.data.total || 0,
          subjects: subjectsRes.data.total || 0,
          courses: coursesRes.data.total || 0,
        });
      } catch (err) {
        console.error('Failed to fetch dashboard counts', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCounts();
  }, []);

  // Dashboard stat card component
  const StatCard = ({ label, value }) => {
    return (
      <div className="bg-white border border-gray-200 rounded-[12px] p-5 shadow-card">
        <div className="text-[12px] text-gray-400 font-medium uppercase tracking-wide">{label}</div>
        <div className="text-[28px] font-bold text-navy-900 mt-1">
          {loading ? "—" : value.toLocaleString()}
        </div>
      </div>
    );
  };

  return (
    <div>
      <PageHeader title="Dashboard" sub="Admin overview" />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        <StatCard label="Total Students" value={counts.students} />
        <StatCard label="Total Professors" value={counts.professors} />
        <StatCard label="Total Sections" value={counts.sections} />
        <StatCard label="Total Subjects" value={counts.subjects} />
        <StatCard label="Total Courses" value={counts.courses} />
      </div>
    </div>
  );
}
