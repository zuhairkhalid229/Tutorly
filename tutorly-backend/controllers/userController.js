import db from '../config/db.js';

export const getUserDetails = (req, res) => {
  const { id } = req.user;

  db.query(
    'SELECT user_id, name, email, role FROM users WHERE user_id = ?',
    [id],
    (err, results) => {
      if (err) return res.status(500).json({ message: 'Error fetching user' });
      if (results.length === 0) return res.status(404).json({ message: 'User not found' });

      res.json(results[0]);
    }
  );
};
export const getSubjects = (req, res) => {
  db.query('SELECT * FROM subjects', (err, results) => {
    if (err) {
      return res.status(500).json({ message: 'Error fetching subjects', error: err });
    }
    res.json(results);
  });
};

export const getTutorsGroupedBySubject = (req, res) => {
  const sql = `
    SELECT 
      s.id AS subjectId, 
      s.name AS subjectName,
      u.user_id AS tutorId, 
      u.name AS tutorName, 
      u.qualification
    FROM users u
    JOIN tutor_subjects ts ON u.user_id = ts.tutor_id
    JOIN subjects s ON ts.subject_id = s.id
    WHERE u.role = 'tutor'
    ORDER BY s.name;
  `;

  db.query(sql, (err, results) => {
    if (err) {
      return res.status(500).json({ message: 'Error fetching tutors', error: err });
    }

    // Group tutors by subject
    const groupedSubjects = {};
    results.forEach((row) => {
      const { subjectId, subjectName, tutorId, tutorName, qualification } = row;

      if (!groupedSubjects[subjectId]) {
        groupedSubjects[subjectId] = {
          subjectId,
          subjectName,
          tutors: []
        };
      }

      groupedSubjects[subjectId].tutors.push({
        tutorId,
        tutorName,
        qualification
      });
    });

    // Convert the grouped object into an array
    const response = Object.values(groupedSubjects);
    res.json(response);
  });
};