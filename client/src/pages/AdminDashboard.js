import React, { useState, useEffect } from 'react';
import { getAllProfiles } from '../services/authService';

const AdminDashboard = () => {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchProfiles = async () => {
      try {
        const data = await getAllProfiles();
        setProfiles(data.profiles || []);
      } catch (err) {
        setError('Failed to load profiles. Please try again later.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfiles();
  }, []);

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-danger" role="alert">
        {error}
      </div>
    );
  }

  return (
    <div>
      <h2>Admin Dashboard</h2>
      <div className="card mt-3">
        <div className="card-header bg-dark text-white">
          <h4 className="mb-0">User Profile Management</h4>
        </div>
        <div className="card-body">
          <div className="table-responsive">
            <table className="table table-striped">
              <thead>
                <tr>
                  <th>Username</th>
                  <th>Email</th>
                  <th>First Name</th>
                  <th>Last Name</th>
                  <th>Admin</th>
                  <th>Created At</th>
                </tr>
              </thead>
              <tbody>
                {profiles.map(profile => (
                  <tr key={profile.username}>
                    <td>{profile.username}</td>
                    <td>{profile.email}</td>
                    <td>{profile.first_name || '-'}</td>
                    <td>{profile.last_name || '-'}</td>
                    <td>{profile.is_admin ? 'Yes' : 'No'}</td>
                    <td>{new Date(profile.created_at).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;