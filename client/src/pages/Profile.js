import React, { useState, useEffect } from 'react';
import { getUserProfile } from '../services/authService';
import profileService from '../services/profileService';

const Profile = ({ user }) => {
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [accounts, setAccounts] = useState([]);
  const [platforms, setPlatforms] = useState([]);
  const [formData, setFormData] = useState({
    platformId: '',
    platformUsername: '',
    profileUrl: ''
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editingAccountId, setEditingAccountId] = useState(null);
  const [accountActionLoading, setAccountActionLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Fetch profile data, user's accounts, and available platforms
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [profileData, accountsData, platformsData] = await Promise.all([
          getUserProfile(),
          profileService.getUserAccounts(),
          profileService.getAllPlatforms()
        ]);
        
        setProfileData(profileData);
        setAccounts(accountsData);
        setPlatforms(platformsData);
        setError('');
      } catch (err) {
        setError('Failed to load data. Please try again later.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Handle form input changes
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  // Reset form after submission or cancel
  const resetForm = () => {
    setFormData({
      platformId: '',
      platformUsername: '',
      profileUrl: ''
    });
    setIsEditing(false);
    setEditingAccountId(null);
  };

  // Set up edit mode for an account
  const handleEditClick = (account) => {
    setFormData({
      platformId: account.platform_id,
      platformUsername: account.platform_username,
      profileUrl: account.profile_url || ''
    });
    setIsEditing(true);
    setEditingAccountId(account.platform_id);
  };

  // Handle form submission for adding or updating an account
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setAccountActionLoading(true);

    try {
      if (isEditing) {
        // Update existing account
        await profileService.updateUserAccount(
          editingAccountId,
          formData.platformUsername,
          formData.profileUrl
        );
        setSuccessMessage('Account updated successfully');
      } else {
        // Add new account
        if (!formData.platformId) {
          setError('Please select a platform');
          setAccountActionLoading(false);
          return;
        }

        await profileService.addUserAccount(
          formData.platformId,
          formData.platformUsername,
          formData.profileUrl
        );
        setSuccessMessage('Account added successfully');
      }

      // Refresh accounts list
      const updatedAccounts = await profileService.getUserAccounts();
      setAccounts(updatedAccounts);

      // Reset form
      resetForm();
    } catch (err) {
      setError(err.message || 'An error occurred. Please try again.');
    } finally {
      setAccountActionLoading(false);
      // Clear success message after 3 seconds
      if (successMessage) {
        setTimeout(() => setSuccessMessage(''), 3000);
      }
    }
  };

  // Handle account deletion
  const handleDelete = async (platformId) => {
    if (window.confirm('Are you sure you want to delete this account?')) {
      setError('');
      setSuccessMessage('');
      setAccountActionLoading(true);

      try {
        await profileService.deleteUserAccount(platformId);
        
        // Refresh accounts list
        const updatedAccounts = await profileService.getUserAccounts();
        setAccounts(updatedAccounts);
        
        setSuccessMessage('Account deleted successfully');
      } catch (err) {
        setError(err.message || 'Failed to delete account. Please try again.');
      } finally {
        setAccountActionLoading(false);
        // Clear success message after 3 seconds
        if (successMessage) {
          setTimeout(() => setSuccessMessage(''), 3000);
        }
      }
    }
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  // Get available platforms (exclude ones the user already has)
  const availablePlatforms = platforms.filter(platform => 
    !accounts.some(account => account.platform_id === platform.platform_id) || 
    (isEditing && platform.platform_id === Number(editingAccountId))
  );

  return (
    <div className="row">
      <div className="col-md-8 offset-md-2">
        {/* User Profile Card */}
        <div className="card mb-4">
          <div className="card-header bg-info text-white">
            <h4 className="mb-0">User Profile</h4>
          </div>
          <div className="card-body">
            {error && <div className="alert alert-danger" role="alert">{error}</div>}
            {successMessage && <div className="alert alert-success" role="alert">{successMessage}</div>}
            
            {profileData && (
              <div>
                <div className="mb-3">
                  <strong>Username:</strong> {profileData.username}
                </div>
                {profileData.firstName && (
                  <div className="mb-3">
                    <strong>First Name:</strong> {profileData.firstName}
                  </div>
                )}
                {profileData.lastName && (
                  <div className="mb-3">
                    <strong>Last Name:</strong> {profileData.lastName}
                  </div>
                )}
                <div className="mb-3">
                  <strong>Email:</strong> {profileData.email}
                </div>
                <div className="mb-3">
                  <strong>Account Type:</strong> {profileData.is_admin ? 'Administrator' : 'Regular User'}
                </div>
                <div className="mb-3">
                  <strong>Created At:</strong> {new Date(profileData.created_at).toLocaleString()}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Platform Accounts Card */}
        <div className="card mb-4">
          <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center">
            <h4 className="mb-0">Platform Accounts</h4>
          </div>
          <div className="card-body">
            {/* Account Form */}
            <form onSubmit={handleSubmit} className="mb-4">
              <div className="row mb-3">
                <div className="col-md-4">
                  <label htmlFor="platformId" className="form-label">Platform</label>
                  <select 
                    className="form-select"
                    id="platformId"
                    name="platformId"
                    value={formData.platformId}
                    onChange={handleChange}
                    disabled={isEditing || accountActionLoading || availablePlatforms.length === 0}
                    required
                  >
                    <option value="">Select Platform</option>
                    {availablePlatforms.map(platform => (
                      <option key={platform.platform_id} value={platform.platform_id}>
                        {platform.platform_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-md-4">
                  <label htmlFor="platformUsername" className="form-label">Username</label>
                  <input
                    type="text"
                    className="form-control"
                    id="platformUsername"
                    name="platformUsername"
                    value={formData.platformUsername}
                    onChange={handleChange}
                    disabled={accountActionLoading}
                    required
                  />
                </div>

                <div className="col-md-4">
                  <label htmlFor="profileUrl" className="form-label">Profile URL (Optional)</label>
                  <input
                    type="text"
                    className="form-control"
                    id="profileUrl"
                    name="profileUrl"
                    value={formData.profileUrl}
                    onChange={handleChange}
                    disabled={accountActionLoading}
                  />
                </div>
              </div>

              <div className="d-flex">
                <button 
                  type="submit" 
                  className={`btn ${isEditing ? 'btn-warning' : 'btn-success'} me-2`}
                  disabled={accountActionLoading || (availablePlatforms.length === 0 && !isEditing)}
                >
                  {accountActionLoading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      {isEditing ? 'Updating...' : 'Adding...'}
                    </>
                  ) : (
                    isEditing ? 'Update Account' : 'Add Account'
                  )}
                </button>
                
                {isEditing && (
                  <button 
                    type="button" 
                    className="btn btn-secondary" 
                    onClick={resetForm}
                    disabled={accountActionLoading}
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>

            {/* Accounts List */}
            <h5 className="mb-3">Your Accounts</h5>
            {accounts.length === 0 ? (
              <div className="alert alert-light">
                You haven't added any platform accounts yet.
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-striped table-hover">
                  <thead>
                    <tr>
                      <th>Platform</th>
                      <th>Username</th>
                      <th>Profile URL</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {accounts.map(account => (
                      <tr key={account.platform_id}>
                        <td>{account.platform_name}</td>
                        <td>{account.platform_username}</td>
                        <td>
                          {account.profile_url ? (
                            <a href={account.profile_url} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-link">
                              Visit Profile
                            </a>
                          ) : (
                            <span className="text-muted">None</span>
                          )}
                        </td>
                        <td>
                          <button
                            className="btn btn-sm btn-warning me-2"
                            onClick={() => handleEditClick(account)}
                            disabled={accountActionLoading || isEditing}
                          >
                            Edit
                          </button>
                          <button
                            className="btn btn-sm btn-danger"
                            onClick={() => handleDelete(account.platform_id)}
                            disabled={accountActionLoading || isEditing}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;