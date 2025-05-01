import React, { useState } from 'react';
import { Link } from 'react-router-dom';

// Coding illustration for the hero section
const codingIllustrationUrl = "https://images.unsplash.com/photo-1555066931-4365d14bab8c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80";

// Programming illustration for the getting started section
const programmingIllustrationUrl = "https://images.unsplash.com/photo-1516116216624-53e697fedbea?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80";

const Home = () => {
  // State to track if images loaded successfully
  const [heroImageLoaded, setHeroImageLoaded] = useState(true);
  const [startedImageLoaded, setStartedImageLoaded] = useState(true);

  // Handle image load errors
  const handleImageError = (imageType) => {
    if (imageType === 'hero') {
      setHeroImageLoaded(false);
    } else if (imageType === 'started') {
      setStartedImageLoaded(false);
    }
  };

  return (
    <div className="home-container">
      {/* Hero Section with Gradient Background */}
      <div className="hero-section text-white py-5" 
           style={{ 
             background: 'linear-gradient(135deg, #4b6cb7 0%, #182848 100%)',
             borderRadius: '0 0 2rem 2rem',
             boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)'
           }}>
        <div className="container py-5">
          <div className="row align-items-center">
            <div className="col-lg-6 mb-4 mb-lg-0">
              <h1 className="display-3 fw-bold mb-3 animate__animated animate__fadeInUp">
                Master Competitive Programming
              </h1>
              <p className="lead fs-4 mb-4 animate__animated animate__fadeInUp animate__delay-1s">
                Your ultimate platform for coding practice, skill enhancement, and friendly competitions.
              </p>
              <div className="d-flex flex-wrap gap-3 animate__animated animate__fadeInUp animate__delay-2s">
                <Link to="/questions" className="btn btn-light btn-lg px-4 fw-bold text-primary">
                  <i className="fas fa-rocket me-2"></i>Get Started
                </Link>
                <Link to="/dynamic-problemset" className="btn btn-outline-light btn-lg px-4">
                  <i className="fas fa-tasks me-2"></i>Try Dynamic Problemset
                </Link>
              </div>
            </div>
            <div className="col-lg-6 d-flex justify-content-center animate__animated animate__fadeIn animate__delay-3s">
              <div className="position-relative">
                <div className="code-bubble"></div>
                {heroImageLoaded ? (
                  <img 
                    src={codingIllustrationUrl}
                    alt="Coding Illustration" 
                    className="img-fluid rounded shadow"
                    style={{ maxHeight: '350px', objectFit: 'cover' }}
                    onError={() => handleImageError('hero')}
                  />
                ) : (
                  <div className="image-placeholder d-flex flex-column align-items-center justify-content-center text-center p-4 rounded">
                    <i className="fas fa-code fa-4x mb-3"></i>
                    <h4>Code. Learn. Grow.</h4>
                    <p className="small text-white-50">Enhance your programming skills</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="container py-5">
        <div className="row justify-content-center text-center">
          <div className="col-12 mb-5">
            <h2 className="fw-bold text-center mb-4">Why CodePrep?</h2>
            <div className="divider mx-auto"></div>
          </div>
          <div className="col-md-4 mb-4 mb-md-0">
            <div className="stat-card">
              <div className="stat-circle">
                <i className="fas fa-code text-primary"></i>
              </div>
              <h3 className="display-4 fw-bold my-3 counter">5000+</h3>
              <p className="stat-title">Coding Problems</p>
            </div>
          </div>
          <div className="col-md-4 mb-4 mb-md-0">
            <div className="stat-card">
              <div className="stat-circle">
                <i className="fas fa-users text-success"></i>
              </div>
              <h3 className="display-4 fw-bold my-3 counter">50000+</h3>
              <p className="stat-title">Active Users</p>
            </div>
          </div>
          <div className="col-md-4">
            <div className="stat-card">
              <div className="stat-circle">
                <i className="fas fa-trophy text-warning"></i>
              </div>
              <h3 className="display-4 fw-bold my-3 counter">100+</h3>
              <p className="stat-title">Daily Contests</p>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="features-section py-5" style={{ background: '#f8f9fa' }}>
        <div className="container py-3">
          <div className="row justify-content-center">
            <div className="col-md-8 text-center mb-5">
              <h2 className="fw-bold">Supercharge Your Coding Skills</h2>
              <p className="lead text-muted">Everything you need to excel in competitive programming</p>
              <div className="divider mx-auto"></div>
            </div>
          </div>
          
          <div className="row g-4">
            <div className="col-md-4">
              <div className="feature-card h-100">
                <div className="feature-icon bg-primary-soft">
                  <i className="fas fa-code text-primary"></i>
                </div>
                <h4 className="feature-title">Curated Questions</h4>
                <p className="feature-text">Access a large collection of programming questions sorted by difficulty and topics, with detailed explanations and optimal solutions.</p>
              </div>
            </div>
            
            <div className="col-md-4">
              <div className="feature-card h-100">
                <div className="feature-icon bg-success-soft">
                  <i className="fas fa-chart-line text-success"></i>
                </div>
                <h4 className="feature-title">Track Progress</h4>
                <p className="feature-text">Monitor your coding journey with detailed analytics and performance metrics to see your improvement over time.</p>
              </div>
            </div>
            
            <div className="col-md-4">
              <div className="feature-card h-100">
                <div className="feature-icon bg-danger-soft">
                  <i className="fas fa-gamepad text-danger"></i>
                </div>
                <h4 className="feature-title">Compete with Friends</h4>
                <p className="feature-text">Challenge your friends to coding duels, create private contests, and climb the leaderboard together.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Getting Started Section */}
      <div className="container py-5">
        <div className="row justify-content-center">
          <div className="col-lg-10">
            <div className="getting-started-card">
              <div className="row align-items-center">
                <div className="col-md-6 mb-4 mb-md-0">
                  {startedImageLoaded ? (
                    <img 
                      src={programmingIllustrationUrl}
                      alt="Getting Started" 
                      className="img-fluid rounded shadow"
                      style={{ maxHeight: '300px', objectFit: 'cover' }}
                      onError={() => handleImageError('started')}
                    />
                  ) : (
                    <div className="image-placeholder bg-light d-flex flex-column align-items-center justify-content-center text-center p-4 rounded" style={{ height: '300px' }}>
                      <i className="fas fa-laptop-code fa-4x mb-3 text-primary"></i>
                      <h4 className="text-primary">Start Your Coding Journey</h4>
                      <p className="text-muted">Practice makes perfect</p>
                    </div>
                  )}
                </div>
                <div className="col-md-6">
                  <h2 className="fw-bold mb-3">Ready to Begin?</h2>
                  <p className="mb-4">
                    Explore our question bank, create your personalized learning path, and connect with other coders. 
                    Navigate to the Questions section to start solving problems or check out your Profile to customize your experience.
                  </p>
                  <div className="d-flex flex-wrap gap-2">
                    <Link to="/questions" className="btn btn-primary">
                      <i className="fas fa-question-circle me-2"></i>Explore Questions
                    </Link>
                    <Link to="/profile" className="btn btn-outline-primary">
                      <i className="fas fa-user me-2"></i>Setup Profile
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Latest Activity Section */}
      <div className="latest-activity py-5" style={{ background: '#f0f4f8' }}>
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-md-8 text-center mb-4">
              <h2 className="fw-bold">Latest Platform Activities</h2>
              <div className="divider mx-auto"></div>
            </div>
          </div>
          <div className="row g-4">
            <div className="col-md-6 col-lg-3">
              <div className="activity-card">
                <div className="activity-header">
                  <span className="activity-badge solved">Solved</span>
                </div>
                <p className="activity-user">Alex J. just solved</p>
                <h5 className="activity-title">Two Sum Problem</h5>
                <div className="activity-footer">
                  <span className="difficulty easy">Easy</span>
                  <span className="time">5 mins ago</span>
                </div>
              </div>
            </div>
            <div className="col-md-6 col-lg-3">
              <div className="activity-card">
                <div className="activity-header">
                  <span className="activity-badge contest">New Contest</span>
                </div>
                <p className="activity-user">Weekly Challenge</p>
                <h5 className="activity-title">Algorithm Marathon</h5>
                <div className="activity-footer">
                  <span className="participants">120 joined</span>
                  <span className="time">2 hrs ago</span>
                </div>
              </div>
            </div>
            <div className="col-md-6 col-lg-3">
              <div className="activity-card">
                <div className="activity-header">
                  <span className="activity-badge solved">Solved</span>
                </div>
                <p className="activity-user">Maria K. just solved</p>
                <h5 className="activity-title">Binary Tree Traversal</h5>
                <div className="activity-footer">
                  <span className="difficulty medium">Medium</span>
                  <span className="time">1 hr ago</span>
                </div>
              </div>
            </div>
            <div className="col-md-6 col-lg-3">
              <div className="activity-card">
                <div className="activity-header">
                  <span className="activity-badge new">New Question</span>
                </div>
                <p className="activity-user">Just Added</p>
                <h5 className="activity-title">Graph Coloring Problem</h5>
                <div className="activity-footer">
                  <span className="difficulty hard">Hard</span>
                  <span className="time">3 hrs ago</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CSS Styles */}
      <style jsx>{`
        .home-container {
          overflow-x: hidden;
        }
        .divider {
          height: 4px;
          width: 70px;
          background: linear-gradient(90deg, #4b6cb7, #182848);
          margin-bottom: 2rem;
          border-radius: 2px;
        }
        .stat-card {
          padding: 2rem;
          transition: all 0.3s ease;
        }
        .stat-card:hover {
          transform: translateY(-10px);
        }
        .stat-circle {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          background: #f0f4f8;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto;
        }
        .stat-circle i {
          font-size: 32px;
        }
        .stat-title {
          font-weight: 500;
          color: #6c757d;
        }
        .feature-card {
          background: white;
          border-radius: 16px;
          padding: 1.5rem;
          transition: all 0.3s ease;
          box-shadow: 0 5px 15px rgba(0,0,0,0.05);
        }
        .feature-card:hover {
          transform: translateY(-10px);
          box-shadow: 0 15px 30px rgba(0,0,0,0.1);
        }
        .feature-icon {
          width: 70px;
          height: 70px;
          border-radius: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 1.5rem;
        }
        .feature-icon i {
          font-size: 28px;
        }
        .bg-primary-soft {
          background-color: rgba(13, 110, 253, 0.1);
        }
        .bg-success-soft {
          background-color: rgba(25, 135, 84, 0.1);
        }
        .bg-danger-soft {
          background-color: rgba(220, 53, 69, 0.1);
        }
        .feature-title {
          font-weight: 600;
          margin-bottom: 1rem;
        }
        .getting-started-card {
          background: white;
          border-radius: 16px;
          padding: 2rem;
          box-shadow: 0 10px 30px rgba(0,0,0,0.08);
        }
        .activity-card {
          background: white;
          border-radius: 12px;
          padding: 1.25rem;
          box-shadow: 0 4px 15px rgba(0,0,0,0.05);
          transition: all 0.3s ease;
        }
        .activity-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 10px 25px rgba(0,0,0,0.1);
        }
        .activity-badge {
          padding: 0.35rem 0.75rem;
          border-radius: 50px;
          font-size: 0.75rem;
          font-weight: 600;
        }
        .activity-badge.solved {
          background-color: rgba(25, 135, 84, 0.1);
          color: #198754;
        }
        .activity-badge.contest {
          background-color: rgba(13, 110, 253, 0.1);
          color: #0d6efd;
        }
        .activity-badge.new {
          background-color: rgba(102, 16, 242, 0.1);
          color: #6610f2;
        }
        .activity-user {
          color: #6c757d;
          font-size: 0.875rem;
          margin-bottom: 0.5rem;
        }
        .activity-title {
          margin-bottom: 1rem;
          font-weight: 600;
        }
        .activity-footer {
          display: flex;
          justify-content: space-between;
          font-size: 0.75rem;
        }
        .difficulty {
          padding: 0.25rem 0.6rem;
          border-radius: 50px;
        }
        .difficulty.easy {
          background-color: rgba(25, 135, 84, 0.1);
          color: #198754;
        }
        .difficulty.medium {
          background-color: rgba(255, 193, 7, 0.1);
          color: #fd7e14;
        }
        .difficulty.hard {
          background-color: rgba(220, 53, 69, 0.1);
          color: #dc3545;
        }
        .time, .participants {
          color: #6c757d;
        }
        .code-bubble {
          position: absolute;
          width: 300px;
          height: 300px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 50%;
          bottom: 0;
          right: 0;
          z-index: 0;
        }
        .image-placeholder {
          background: rgba(255, 255, 255, 0.1);
          height: 350px;
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 8px;
          color: white;
        }
        @media (max-width: 768px) {
          .hero-section {
            text-align: center;
          }
        }
      `}</style>

      {/* Add Font Awesome for icons */}
      <link
        rel="stylesheet"
        href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
      />
      
      {/* Add animate.css for animations */}
      <link
        rel="stylesheet"
        href="https://cdnjs.cloudflare.com/ajax/libs/animate.css/4.1.1/animate.min.css"
      />
    </div>
  );
};

export default Home;