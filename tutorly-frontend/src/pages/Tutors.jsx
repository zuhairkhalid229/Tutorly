import React, { useEffect, useState } from 'react';
import Navbar from '../components/Navbar'; // Use the new Navbar component
import { getTutors } from '../api';
import '../styles/Tutors.css';
import imagePlaceholder from '../assets/image1.jpg'; // Replace with actual tutor images or placeholders

const Tutors = () => {
  const [groupedTutors, setGroupedTutors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    getTutors()
      .then((res) => {
        setGroupedTutors(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching tutors:', err);
        setError('Error fetching tutors');
        setLoading(false);
      });
  }, []);

  if (loading) return <div>Loading tutors...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div className="tutors-page">
      {/* New Navbar Component */}
      <Navbar />

      {/* Header / Hero Section */}
      <header className="header">
        <div className="hero-section">
          <div className="hero-text">
            <h1>Meet Our Popular Tutors</h1>
            <p>Browse experts by subject, rating, and more.</p>
          </div>
          <form className="search-bar">
            <input type="text" placeholder="Search for tutors..." />
            <button type="submit">Search</button>
          </form>
        </div>
      </header>

      {/* Main Content: Tutors by Subject */}
      <main className="tutors-content">
        {groupedTutors.length === 0 && (
          <p className="no-tutors">No tutors available at the moment.</p>
        )}
        {groupedTutors.map((subjectGroup) => (
          <section key={subjectGroup.subjectId} className="subject-section">
            <h2 className="subject-title">{subjectGroup.subjectName}</h2>
            <div className="tutors-list">
              {subjectGroup.tutors.map((tutor) => (
                <div key={tutor.tutorId} className="tutor-card">
                  <img
                    src={imagePlaceholder}
                    alt={tutor.tutorName}
                    className="tutor-photo"
                  />
                  <h3 className="tutor-name">{tutor.tutorName}</h3>
                  <p className="tutor-qualification">{tutor.qualification}</p>
                  <div className="tutor-rating">
                    <span className="star">★</span>
                    <span className="star">★</span>
                    <span className="star">★</span>
                    <span className="star">★</span>
                    <span className="star">☆</span>
                    <span className="rating-text">4.0</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}
      </main>

      {/* Footer */}
      <footer className="footer">
        <p>&copy; {new Date().getFullYear()} Tutorly. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default Tutors;
