import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { logout } from '../services/authService';

const Navbar = ({ user, setUser }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    setUser(null);
    navigate('/login');
  };

  const handleDuelRedirect = () => {
    window.location.href = 'http://localhost:4000/play';
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark">
      <div className="container">
        <Link className="navbar-brand" to="/">Postgres App</Link>
        <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav me-auto">
            <li className="nav-item">
              <Link className="nav-link" to="/">Home</Link>
            </li>
            
            <li className="nav-item">
              <Link className="nav-link" to="/questions">
                <i className="fas fa-question-circle me-1"></i> Questions
              </Link>
            </li>
            
            {user && (
              <>
                <li className="nav-item">
                  <Link className="nav-link" to="/dynamic-problemset">
                    <i className="fas fa-list-alt me-1"></i> Dynamic Problemset
                  </Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link" to="/profile">Profile</Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link" to="/friends">
                    <i className="fas fa-user-friends me-1"></i> Friends
                  </Link>
                </li>
                <li className="nav-item">
                  <button 
                    className="nav-link btn btn-link" 
                    onClick={handleDuelRedirect}
                    style={{ background: 'none', border: 'none' }}
                  >
                    <i className="fas fa-gamepad me-1"></i> Duel
                  </button>
                </li>
                <li className="nav-item dropdown">
                  <a className="nav-link dropdown-toggle" href="#" id="navbarDropdown" role="button" data-bs-toggle="dropdown" aria-expanded="false">
                    <i className="fas fa-chart-line me-1"></i> Coding Dashboards
                  </a>
                  <ul className="dropdown-menu" aria-labelledby="navbarDropdown">
                    <li><Link className="dropdown-item" to="/dashboard">General Dashboard</Link></li>
                    <li><Link className="dropdown-item" to="/codeforces">Codeforces Dashboard</Link></li>
                    <li><Link className="dropdown-item" to="/leetcode">LeetCode Dashboard</Link></li>
                  </ul>
                </li>
              </>
            )}
            {user && user.is_admin && (
              <li className="nav-item">
                <Link className="nav-link" to="/admin">Admin Dashboard</Link>
              </li>
            )}
          </ul>
          <ul className="navbar-nav">
            {user ? (
              <li className="nav-item">
                <button onClick={handleLogout} className="btn btn-outline-light">Logout</button>
              </li>
            ) : (
              <>
                <li className="nav-item">
                  <Link className="nav-link" to="/login">Login</Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link" to="/signup">Sign Up</Link>
                </li>
              </>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;