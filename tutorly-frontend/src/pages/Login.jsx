import React, { useState } from 'react';
import { loginUser } from '../api';
import { useNavigate } from 'react-router-dom';
import '../styles/Login.css';

const Login = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await loginUser(formData);
      setSuccess(response.data.message);
      setError('');
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('role', response.data.role);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
      setSuccess('');
    }
  };

  return (
    <div className="login-wrapper">
      <div className="login-container">
        {/* Left Section: Welcome */}
        <div className="welcome-section">
          <h2>Welcome</h2>
          <p>Join Tutorly to explore new opportunities!</p>
          <a href="/register" className="register-btn">
            REGISTER
          </a>
        </div>

        {/* Right Section: Sign In */}
        <div className="signin-section">
          <h2>Sign In</h2>
          {error && <p className="error-message">{error}</p>}
          {success && <p className="success-message">{success}</p>}
          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group">
              <label htmlFor="email" className="input-label">Email</label>
              <input
                id="email"
                name="email"
                type="email"
                placeholder="Enter your email"
                onChange={handleChange}
                required
                className="login-input"
              />
            </div>

            <div className="form-group">
              <label htmlFor="password" className="input-label">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                placeholder="Enter your password"
                onChange={handleChange}
                required
                className="login-input"
              />
            </div>

            <div className="forgot-password">
              <a href="/forgot-password" className="forgot-password-link">
                I forgot my password
              </a>
            </div>

            <button type="submit" className="login-button">
              LOGIN
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
