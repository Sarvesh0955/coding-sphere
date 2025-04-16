import React, { useState, useEffect } from 'react';
import { getUserProfile } from '../services/authService';

const Profile = ({ user }) => {
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await getUserProfile();
        setProfileData(data);
      } catch (err) {
        setError('Failed to load profile data. Please try again later.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
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
    <div className="row">
      <div className="col-md-8 offset-md-2">
        <div className="card">
          <div className="card-header bg-info text-white">
            <h4 className="mb-0">User Profile</h4>
          </div>
          <div className="card-body">
            {profileData && (
              <div>
                <div className="mb-3">
                  <strong>Name:</strong> {profileData.name}
                </div>
                <div className="mb-3">
                  <strong>Email:</strong> {profileData.email}
                </div>
                <div className="mb-3">
                  <strong>Account Type:</strong> {profileData.isadmin ? 'Administrator' : 'Regular User'}
                </div>
                <div className="mb-3">
                  <strong>Created At:</strong> {new Date(profileData.created_at).toLocaleString()}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;