import React, { useState, useEffect } from 'react';
import { registerUser, getSubjects } from '../api'; // Import necessary API functions
import '../styles/Register.css';

const Register = () => {
  const [role, setRole] = useState('student');
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    grade: '', // for students
    qualification: '', // for tutors
    subjects: [] // for tutors; stored as an array
  });
  const [subjectsOptions, setSubjectsOptions] = useState([]);
  const [message, setMessage] = useState('');

  // When role changes to tutor, fetch available subjects from the API
  useEffect(() => {
    if (role === 'tutor') {
      getSubjects()
        .then((data) => setSubjectsOptions(data))
        .catch((err) => console.error('Error fetching subjects:', err));
    }
  }, [role]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // For the multi-select subjects field
  const handleSubjectsChange = (e) => {
    const options = e.target.options;
    const selectedSubjects = [];
    for (let i = 0; i < options.length; i++) {
      if (options[i].selected) {
        selectedSubjects.push(options[i].value);
      }
    }
    setFormData((prev) => ({ ...prev, subjects: selectedSubjects }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      alert('Passwords do not match!');
      return;
    }

    // Prepare the payload for the API
    const payload = {
      name: formData.fullName,
      email: formData.email,
      password: formData.password,
      role,
    };
    if (role === 'student') {
      payload.grade = formData.grade;
    }
    if (role === 'tutor') {
      payload.qualification = formData.qualification;
      payload.subjects = formData.subjects; // expect an array of subject names
    }

    try {
      const response = await registerUser(payload);
      setMessage(response.message || 'Registration successful');
    } catch (error) {
      setMessage(error.message || 'Registration failed');
    }
  };

  return (
    <div className="register-wrapper">
      <div className="register-container">
        <div className="form-header">
          <h2>Register as {role === 'student' ? 'Student' : 'Tutor'}</h2>
          <div className="toggle-buttons">
            <button
              className={role === 'student' ? 'active' : ''}
              onClick={() => setRole('student')}
            >
              Student
            </button>
            <button
              className={role === 'tutor' ? 'active' : ''}
              onClick={() => setRole('tutor')}
            >
              Tutor
            </button>
          </div>
        </div>
        {message && <p className="message">{message}</p>}
        <form onSubmit={handleSubmit} className="register-form">
          <div className="form-grid">
            <div className="form-group full-width">
              <label htmlFor="fullName">Full Name</label>
              <input
                type="text"
                id="fullName"
                name="fullName"
                placeholder="Enter your full name"
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                placeholder="Enter your email"
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                name="password"
                placeholder="Enter your password"
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                placeholder="Confirm your password"
                onChange={handleChange}
                required
              />
            </div>
            {role === 'student' && (
              <div className="form-group">
                <label htmlFor="grade">Grade</label>
                <input
                  type="text"
                  id="grade"
                  name="grade"
                  placeholder="Enter your grade"
                  onChange={handleChange}
                  required
                />
              </div>
            )}
            {role === 'tutor' && (
              <>
                <div className="form-group">
                  <label htmlFor="qualification">Qualification</label>
                  <input
                    type="text"
                    id="qualification"
                    name="qualification"
                    placeholder="Enter your qualification"
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="subjects">Subjects</label>
                  <select
                    id="subjects"
                    name="subjects"
                    multiple
                    onChange={handleSubjectsChange}
                    required
                  >
                    {subjectsOptions.map((subject) => (
                      <option key={subject.id} value={subject.name}>
                        {subject.name}
                      </option>
                    ))}
                  </select>
                </div>
              </>
            )}
            <div className="form-group full-width">
              <button type="submit" className="register-button">
                Register
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register;
