import React from 'react';
import '../styles/HomePage.css';
import image1 from '../assets/image1.jpg'
import cloudacademy from '../assets/cloudacademy.png'
import khanacademy from '../assets/khanacademy.png'
import udemy from '../assets/udemy.png'
import coursera from '../assets/coursera.png'
const HomePage = () => {
  return (
    <div className="home-page">
      {/* Header / Hero Section */}
      <header className="header">
        <nav className="navbar">
          <div className="logo">Tutorly</div>
          <ul className="nav-menu">
            <li><a href="#">Home</a></li>
            <li><a href="#">Tutors</a></li>
            <li><a href="#">Community</a></li>
            <li><a href="#">Contact</a></li>
            <li><a href="/login" className="login-link">Login</a></li>
            <li><a href="/register" className="register-link">Register</a></li>
          </ul>
        </nav>

        <div className="hero-section">
          <div className="hero-text">
            <h1>Explore Expert Tutors for Your Learning Needs</h1>
            <p>Connect with top professionals who can help you excel in any subject.</p>
          </div>

          <form className="search-bar">
            <input type="text" placeholder="Search for tutors..." />
            <button type="submit">Search</button>
          </form>

          <button className="view-tutors-btn">
            View Tutors
          </button>
        </div>
      </header>

      {/* Trusted By Section */}
      <section className="trusted-by">
        <h2>Trusted by Leading Organizations</h2>
        <div className="org-logos">
          {/* Replace with real logos */}
          <img src={coursera} alt="Organization 1" />
          <img src={khanacademy} alt="Organization 2" />
          <img src={udemy} alt="Organization 3" />
          <img src={cloudacademy} alt="Organization 4" />
        </div>
      </section>

      {/* Popular Tutors Section */}
      <section className="popular-tutors">
        <h2>Popular Tutors</h2>
        <div className="tutor-cards">
          {/* Example cards; replace with dynamic data if needed */}
          <div className="tutor-card">
            <img src={image1} alt="Tutor 1" />
            <h3>John Doe</h3>
            <p>Mathematics Specialist</p>
          </div>
          <div className="tutor-card">
            <img src={image1} alt="Tutor 2" />
            <h3>Jane Smith</h3>
            <p>Science & Physics</p>
          </div>
          <div className="tutor-card">
            <img src={image1} alt="Tutor 3" />
            <h3>Alex Johnson</h3>
            <p>English Literature</p>
          </div>
        </div>
      </section>

      {/* Featured Tutors Section */}
      <section className="featured-tutors">
        <h2>Featured Tutors</h2>
        <div className="tutor-cards">
          {/* More example cards */}
          <div className="tutor-card">
            <img src={image1} alt="Tutor 4" />
            <h3>Sarah Williams</h3>
            <p>History & Geography</p>
          </div>
          <div className="tutor-card">
            <img src={image1} alt="Tutor 5" />
            <h3>Daniel Kim</h3>
            <p>Chemistry & Biology</p>
          </div>
          <div className="tutor-card">
            <img src={image1} alt="Tutor 6" />
            <h3>Emily Davis</h3>
            <p>Computer Science</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <p>
          &copy; {new Date().getFullYear()} Tutorly. All rights reserved.
        </p>
      </footer>
    </div>
  );
};

export default HomePage;
