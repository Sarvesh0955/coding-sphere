import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Profile from './pages/Profile';
import Dashboard from './pages/Dashboard';
import CodeforcesDashboard from './pages/CodeforcesDashboard';
import AdminDashboard from './pages/AdminDashboard';
import ForgotPassword from './pages/ForgotPassword';
import Home from './pages/Home';
import { getToken, getUserFromToken } from './services/authService';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in
    const token = getToken();
    if (token) {
      const userData = getUserFromToken();
      setUser(userData);
    }
    setLoading(false);
  }, []);

  // Protected route component
  const ProtectedRoute = ({ children, requireAdmin = false }) => {
    if (loading) return <div className="container mt-5"><p>Loading...</p></div>;
    
    if (!user) {
      return <Navigate to="/login" />;
    }
    
    if (requireAdmin && !user.is_admin) {
      return <Navigate to="/" />;
    }
    
    return children;
  };

  return (
    <div className="App">
      <Navbar user={user} setUser={setUser} />
      <div className="container mt-4">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login setUser={setUser} />} />
          <Route path="/signup" element={<Signup setUser={setUser} />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route 
            path="/profile" 
            element={
              <ProtectedRoute>
                <Profile user={user} />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <Dashboard user={user} />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/codeforces" 
            element={
              <ProtectedRoute>
                <CodeforcesDashboard user={user} />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin" 
            element={
              <ProtectedRoute requireAdmin={true}>
                <AdminDashboard />
              </ProtectedRoute>
            } 
          />
        </Routes>
      </div>
    </div>
  );
}

export default App;