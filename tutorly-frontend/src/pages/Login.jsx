import React, { useState } from 'react';
import { loginUser } from '../api';
import { useNavigate } from 'react-router-dom';

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
      navigate('/dashboard'); // Single dashboard route
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
      setSuccess('');
    }
  };

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-8 py-4 border-b">
        <h1 className="text-2xl font-bold text-blue-600">Tutorly</h1>
        <a href="/register" className="text-blue-600 hover:underline">
          Create an account
        </a>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="w-full max-w-sm px-4">
          <h2 className="text-xl font-semibold mb-6 text-center">Login</h2>

          {/* Error / Success Messages */}
          {error && <p className="text-red-500 text-center mb-4">{error}</p>}
          {success && <p className="text-green-500 text-center mb-4">{success}</p>}

          {/* <button className="flex items-center justify-center w-full py-2 border border-gray-300 rounded hover:bg-gray-100 transition">
            <img
              src="/google-icon.svg"
              alt="Google"
              className="w-5 h-5 mr-2"
            />
            Sign in with Google
          </button>

          <div className="flex items-center my-6">
            <div className="flex-1 h-px bg-gray-300"></div>
            <p className="mx-2 text-gray-500">OR</p>
            <div className="flex-1 h-px bg-gray-300"></div>
          </div> */}

          {/* Email / Password Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block mb-1 text-gray-700 font-medium">
                Email
              </label>
              <input
                name="email"
                type="email"
                placeholder="Enter your email"
                onChange={handleChange}
                required
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block mb-1 text-gray-700 font-medium">
                Password
              </label>
              <input
                name="password"
                type="password"
                placeholder="Enter your password"
                onChange={handleChange}
                required
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 text-white rounded-md py-2 font-semibold hover:bg-blue-700 transition"
            >
              Log in with email
            </button>
          </form>

          {/* Forgot Password Link */}
          <div className="text-center mt-4">
            <a href="/forgot-password" className="text-blue-600 hover:underline">
              I forgot my password
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
