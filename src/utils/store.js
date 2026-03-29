import { genId } from '../utils/gradeEngine';

export const mkComps = (seed = 1) => ({
  quiz:       { weight: 0.25, items: [{ id: genId(), label: 'Quiz 1', score: 36 + seed * 2, total: 50 }, { id: genId(), label: 'Quiz 2', score: 39 + seed, total: 50 }] },
  recitation: { weight: 0.15, items: [{ id: genId(), label: 'Recitation 1', score: 7 + (seed % 4), total: 10 }, { id: genId(), label: 'Recitation 2', score: 8, total: 10 }] },
  attendance: { weight: 0.10, items: [{ id: genId(), label: 'Week 1–4', score: 10 + (seed % 3), total: 12 }, { id: genId(), label: 'Week 5–8', score: 11, total: 12 }] },
  project:    { weight: 0.50, items: [{ id: genId(), label: 'Project 1', score: 78 + seed * 3, total: 100 }] },
});

export const initStore = () => {
  const sections = [
    { id: 's1', name: 'BS4MA',   program: 'BS Mathematics',      year: '2nd Year' },
    { id: 's2', name: 'BSCS 3-B', program: 'BS Computer Science', year: '3rd Year' },
  ];
  const allSubjects = [
    { id: 'sub1', code: 'MATH 201', title: 'Calculus II',                    units: 3 },
    { id: 'sub2', code: 'MATH 211', title: 'Linear Algebra',                 units: 3 },
    { id: 'sub3', code: 'CS 101',   title: 'Introduction to Programming',    units: 3 },
    { id: 'sub4', code: 'GE 101',   title: 'Purposive Communication',        units: 3 },
    { id: 'sub5', code: 'PE 2',     title: 'Physical Education 2',           units: 2 },
  ];
  const facultyLoad = [
    { id: 'fl1', subjectId: 'sub1', sectionId: 's1', semester: '2nd Sem A.Y. 2025-2026' },
    { id: 'fl2', subjectId: 'sub2', sectionId: 's1', semester: '2nd Sem A.Y. 2025-2026' },
    { id: 'fl3', subjectId: 'sub3', sectionId: 's1', semester: '2nd Sem A.Y. 2025-2026' },
    { id: 'fl4', subjectId: 'sub4', sectionId: 's1', semester: '2nd Sem A.Y. 2025-2026' },
    { id: 'fl5', subjectId: 'sub5', sectionId: 's1', semester: '2nd Sem A.Y. 2025-2026' },
  ];
  const students = [
    { id: 'st1', name: 'James Sevilla',       studentId: '241125', sectionId: 's1', program: 'BS Mathematics', year: '2nd Year' },
    { id: 'st2', name: 'Ishmael Flora',       studentId: '241157', sectionId: 's1', program: 'BS Mathematics', year: '2nd Year' },
    { id: 'st3', name: 'Lhars Lumasag',       studentId: '241101', sectionId: 's1', program: 'BS Mathematics', year: '2nd Year' },
    { id: 'st4', name: 'Andrew Evan Tilaon',  studentId: '251130', sectionId: 's1', program: 'BS Mathematics', year: '2nd Year' },
    { id: 'st5', name: 'May Arnuncio',        studentId: '180228', sectionId: 's1', program: 'BS Mathematics', year: '2nd Year' },
  ];
  const classRecords = {};
  students.forEach((st, si) => {
    facultyLoad.forEach((fl, fi) => {
      if (sections.find(s => s.id === fl.sectionId)?.id === st.sectionId) {
        const key = `${st.id}_${fl.id}`;
        classRecords[key] = { id: key, studentId: st.id, facultyLoadId: fl.id, components: mkComps(si + fi + 1) };
      }
    });
  });
  return { sections, allSubjects, facultyLoad, students, classRecords };
};
