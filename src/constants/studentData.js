export const STUDENT_DATA = {
  student: {
    name: 'James Sevilla',
    studentId: '241125',
    program: 'BS Mathematics',
    year: '2nd Year',
    semester: '2nd Semester, A.Y. 2025–2026',
    section: 'BS4MA',
    cumulativeGPA: 1.75,
  },
  subjects: [
    {
      id: 1, code: 'MATH 201', title: 'Calculus II', units: 3,
      instructor: { name: 'Sir Gil', dept: 'Mathematics Dept.' },
      schedule: 'MWF 7:30–8:30 AM', room: 'MATH 101',
      components: {
        quiz:       { weight: 0.25, items: [{ label: 'Quiz 1', score: 40, total: 50 }, { label: 'Quiz 2', score: 43, total: 50 }] },
        recitation: { weight: 0.15, items: [{ label: 'Recitation 1', score: 9, total: 10 }, { label: 'Recitation 2', score: 8, total: 10 }] },
        attendance: { weight: 0.10, items: [{ label: 'Week 1–4', score: 12, total: 12 }, { label: 'Week 5–8', score: 11, total: 12 }] },
        project:    { weight: 0.50, items: [{ label: 'Project 1', score: 86, total: 100 }, { label: 'Project 2', score: 90, total: 100 }] },
      },
      periodicRating: 85.2, finalRating: 86.0, grade: '1.75',
    },
    {
      id: 2, code: 'MATH 211', title: 'Linear Algebra', units: 3,
      instructor: { name: 'Sir Gil', dept: 'Mathematics Dept.' },
      schedule: 'TTh 9:00–10:30 AM', room: 'MATH 102',
      components: {
        quiz:       { weight: 0.25, items: [{ label: 'Quiz 1', score: 38, total: 50 }, { label: 'Quiz 2', score: 41, total: 50 }] },
        recitation: { weight: 0.15, items: [{ label: 'Recitation 1', score: 8, total: 10 }, { label: 'Recitation 2', score: 9, total: 10 }] },
        attendance: { weight: 0.10, items: [{ label: 'Week 1–4', score: 11, total: 12 }, { label: 'Week 5–8', score: 12, total: 12 }] },
        project:    { weight: 0.50, items: [{ label: 'Project 1', score: 82, total: 100 }, { label: 'Project 2', score: 85, total: 100 }] },
      },
      periodicRating: 82.4, finalRating: 83.0, grade: '2.00',
    },
    {
      id: 3, code: 'CS 101', title: 'Introduction to Programming', units: 3,
      instructor: { name: 'Sir Gil', dept: 'Mathematics Dept.' },
      schedule: 'MWF 10:00–11:00 AM', room: 'LAB 201',
      components: {
        quiz:       { weight: 0.25, items: [{ label: 'Quiz 1', score: 44, total: 50 }, { label: 'Quiz 2', score: 46, total: 50 }] },
        recitation: { weight: 0.15, items: [{ label: 'Recitation 1', score: 9, total: 10 }, { label: 'Recitation 2', score: 10, total: 10 }] },
        attendance: { weight: 0.10, items: [{ label: 'Week 1–4', score: 12, total: 12 }, { label: 'Week 5–8', score: 12, total: 12 }] },
        project:    { weight: 0.50, items: [{ label: 'Project 1', score: 91, total: 100 }, { label: 'Project 2', score: 93, total: 100 }] },
      },
      periodicRating: 91.0, finalRating: 91.5, grade: '1.25',
    },
    {
      id: 4, code: 'GE 101', title: 'Purposive Communication', units: 3,
      instructor: { name: 'Sir Gil', dept: 'Mathematics Dept.' },
      schedule: 'TTh 1:00–2:30 PM', room: 'GEN 301',
      components: {
        quiz:       { weight: 0.20, items: [{ label: 'Quiz 1', score: 18, total: 25 }, { label: 'Quiz 2', score: 20, total: 25 }] },
        recitation: { weight: 0.20, items: [{ label: 'Recitation 1', score: 8, total: 10 }, { label: 'Recitation 2', score: 9, total: 10 }] },
        attendance: { weight: 0.10, items: [{ label: 'Week 1–4', score: 11, total: 12 }, { label: 'Week 5–8', score: 12, total: 12 }] },
        project:    { weight: 0.50, items: [{ label: 'Project 1', score: 87, total: 100 }, { label: 'Project 2', score: 89, total: 100 }] },
      },
      periodicRating: 86.0, finalRating: 87.0, grade: '1.75',
    },
    {
      id: 5, code: 'PE 2', title: 'Physical Education 2', units: 2,
      instructor: { name: 'Sir Gil', dept: 'Mathematics Dept.' },
      schedule: 'F 1:00–3:00 PM', room: 'Gymnasium',
      components: {
        quiz:       { weight: 0.10, items: [{ label: 'Theory Test 1', score: 9, total: 10 }] },
        recitation: { weight: 0.10, items: [{ label: 'Participation 1', score: 10, total: 10 }, { label: 'Participation 2', score: 10, total: 10 }] },
        attendance: { weight: 0.30, items: [{ label: 'Week 1–4', score: 8, total: 8 }, { label: 'Week 5–8', score: 8, total: 8 }] },
        project:    { weight: 0.50, items: [{ label: 'Performance Task 1', score: 93, total: 100 }, { label: 'Performance Task 2', score: 95, total: 100 }] },
      },
      periodicRating: 94.0, finalRating: 94.0, grade: '1.25',
    },
  ],
};
