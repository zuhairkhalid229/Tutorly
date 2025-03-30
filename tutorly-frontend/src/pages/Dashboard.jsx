// Dashboard.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchUserDetails } from '../api';
import Navbar from '../components/navbar';
import Sidebar from '../components/sidebar';
import StudentDashboard from './Student/StudentDashboard';
import TutorDashboard from './Tutor/TutorDashboard';
import AdminDashboard from './Admin/AdminDashboard';
import '../styles/Dashboard.css';

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const getUserDetails = async () => {
      try {
        const response = await fetchUserDetails();
        setUser(response.data);
      } catch (error) {
        console.error(error);
        navigate('/');
      }
    };

    getUserDetails();
  }, [navigate]);

  if (!user) return <p className="loading">Loading...</p>;

  return (
    <div className="dashboard-container">
      <Navbar />
      <div className="dashboard-content">
        <Sidebar />
        <main className="main-content">
          <h1>Welcome, {user.name}!</h1>
          {user.role === 'student' && <StudentDashboard />}
          {user.role === 'tutor' && <TutorDashboard />}
          {user.role === 'admin' && <AdminDashboard />}
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
