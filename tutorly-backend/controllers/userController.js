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