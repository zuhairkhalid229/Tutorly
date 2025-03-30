import React from 'react';
import { NavLink } from 'react-router-dom';
import { FaTachometerAlt, FaBook, FaCalendarAlt, FaEnvelope, FaCog } from 'react-icons/fa';
import '../styles/Sidebar.css';

const Sidebar = () => {
  return (
    <div className="sidebar">
      <div className="sidebar-header">Menu</div>
      <nav className="sidebar-nav">
        <NavLink to="/dashboard/student" className={({ isActive }) => isActive ? "active" : ""}>
          <FaTachometerAlt className="icon" />
          <span>Dashboard</span>
        </NavLink>
        <NavLink to="/courses" className={({ isActive }) => isActive ? "active" : ""}>
          <FaBook className="icon" />
          <span>Courses</span>
        </NavLink>
        <NavLink to="/bookings" className={({ isActive }) => isActive ? "active" : ""}>
          <FaCalendarAlt className="icon" />
          <span>Bookings</span>
        </NavLink>
        <NavLink to="/messages" className={({ isActive }) => isActive ? "active" : ""}>
          <FaEnvelope className="icon" />
          <span>Messages</span>
        </NavLink>
        <NavLink to="/settings" className={({ isActive }) => isActive ? "active" : ""}>
          <FaCog className="icon" />
          <span>Settings</span>
        </NavLink>
      </nav>
    </div>
  );
};

export default Sidebar;
