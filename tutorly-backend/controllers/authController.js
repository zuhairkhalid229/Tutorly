import db from '../config/db.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

// GET /me – returns details of the authenticated user
export const getUserDetails = (req, res) => {
  const { id } = req.user;

  db.query(
    'SELECT user_id, name, email, role FROM users WHERE user_id = ?',
    [id],
    (err, results) => {
      if (err) {
        return res.status(500).json({ message: 'Error fetching user', error: err });
      }
      if (!results || results.length === 0) {
        return res.status(404).json({ message: 'User not found' });
      }
      res.json(results[0]);
    }
  );
};

// POST /register – registers a new user (student or tutor)
// For tutors, expects extra fields: qualification and subjects (an array)
// For students, expects extra field: grade
export const register = (req, res) => {
  const { name, email, password, role, grade, qualification, subjects } = req.body;

  if (!['student', 'tutor', 'admin'].includes(role)) {
    return res.status(400).json({ message: 'Invalid role!' });
  }

  // Check if user already exists
  db.query('SELECT * FROM users WHERE email = ?', [email], (err, results) => {
    if (err) {
      return res.status(500).json({ message: 'Database error', error: err });
    }
    if (results && results.length > 0) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);
    let sql = '';
    let params = [];

    if (role === 'student') {
      sql = 'INSERT INTO users (name, email, password, role, grade) VALUES (?, ?, ?, ?, ?)';
      params = [name, email, hashedPassword, role, grade];
    } else if (role === 'tutor') {
      sql = 'INSERT INTO users (name, email, password, role, qualification) VALUES (?, ?, ?, ?, ?)';
      params = [name, email, hashedPassword, role, qualification];
    } else {
      sql = 'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)';
      params = [name, email, hashedPassword, role];
    }

    db.query(sql, params, (err, result) => {
      if (err) {
        return res.status(500).json({ message: 'Error registering user', error: err });
      }

      const userId = result.insertId;

      // If tutor, process tutor subjects (subjects should be an array)
      if (role === 'tutor' && Array.isArray(subjects) && subjects.length > 0) {
        let completed = 0;
        const total = subjects.length;

        subjects.forEach(subjectName => {
          // Check if the subject already exists
          db.query('SELECT id FROM subjects WHERE name = ?', [subjectName], (err, subjectResults) => {
            if (err) {
              return res.status(500).json({ message: 'Error processing subjects', error: err });
            }

            if (subjectResults && subjectResults.length > 0) {
              // Subject exists; link it to the tutor
              const subjectId = subjectResults[0].id;
              db.query(
                'INSERT INTO tutor_subjects (tutor_id, subject_id) VALUES (?, ?)',
                [userId, subjectId],
                (err) => {
                  if (err) {
                    return res.status(500).json({ message: 'Error linking subject', error: err });
                  }
                  completed++;
                  if (completed === total) {
                    return res.status(201).json({ message: 'Tutor registered successfully' });
                  }
                }
              );
            } else {
              // Subject does not exist; create it then link it
              db.query('INSERT INTO subjects (name) VALUES (?)', [subjectName], (err, insertResult) => {
                if (err) {
                  return res.status(500).json({ message: 'Error creating subject', error: err });
                }
                const subjectId = insertResult.insertId;
                db.query(
                  'INSERT INTO tutor_subjects (tutor_id, subject_id) VALUES (?, ?)',
                  [userId, subjectId],
                  (err) => {
                    if (err) {
                      return res.status(500).json({ message: 'Error linking subject', error: err });
                    }
                    completed++;
                    if (completed === total) {
                      return res.status(201).json({ message: 'Tutor registered successfully' });
                    }
                  }
                );
              });
            }
          });
        });
      } else {
        return res.status(201).json({ message: 'User registered successfully' });
      }
    });
  });
};

// POST /login – logs in a user and returns a JWT token
export const login = (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password required' });
  }

  db.query('SELECT * FROM users WHERE email = ?', [email], (err, results) => {
    if (err) {
      return res.status(500).json({ message: 'Database error', error: err });
    }
    if (!results || results.length === 0) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const user = results[0];
    const isPasswordValid = bcrypt.compareSync(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    
    const token = generateToken(user);
    res.json({ message: 'Login successful', token, role: user.role });
  });
};

// Helper function to generate JWT token
const generateToken = (user) => {
  const payload = {
    id: user.user_id || user.id,
    role: user.role,
    name: user.name,
    email: user.email
  };
  const secret = process.env.JWT_SECRET || 'defaultSecret';
  return jwt.sign(payload, secret, { expiresIn: '1d' });
};
