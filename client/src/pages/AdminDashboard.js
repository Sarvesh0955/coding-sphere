import React, { useState, useEffect } from 'react';
import adminService from '../services/adminService';
import questionService from '../services/questionService';
import { useNavigate } from 'react-router-dom';

const AdminDashboard = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const navigate = useNavigate();
  
  // New states for CSV upload
  const [csvFile, setCsvFile] = useState(null);
  const [fileName, setFileName] = useState('');
  const [companies, setCompanies] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState('');
  const [newCompanyName, setNewCompanyName] = useState('');
  const [showAddCompany, setShowAddCompany] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await adminService.getAllUsers();
      setUsers(data.users || []);
      setError('');
    } catch (err) {
      setError('Failed to load users. Please try again later.');
      console.error(err);
      // If unauthorized or forbidden, redirect to login
      if (err.response && (err.response.status === 401 || err.response.status === 403)) {
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchCompanies = async () => {
    try {
      const companiesData = await questionService.getAllCompanies();
      // Make sure we're handling the response correctly - the API returns companies directly
      setCompanies(Array.isArray(companiesData) ? companiesData : []);
      console.log("Companies loaded:", companiesData); // Debug log to verify data
    } catch (err) {
      console.error('Error fetching companies:', err);
      setError('Failed to load companies. Please try again later.');
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchCompanies();
  }, [navigate]);
  
  const handleDeleteUser = async (username) => {
    if (window.confirm(`Are you sure you want to delete user ${username}?`)) {
      try {
        setLoading(true);
        await adminService.deleteUser(username);
        setSuccessMessage(`User ${username} deleted successfully`);
        fetchUsers(); // Refresh the user list
      } catch (err) {
        setError(`Failed to delete user: ${err.message}`);
        console.error(err);
      } finally {
        setLoading(false);
        // Clear success message after 3 seconds
        if (successMessage) {
          setTimeout(() => setSuccessMessage(''), 3000);
        }
      }
    }
  };

  // CSV file handling
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setCsvFile(file);
      setFileName(file.name);
    }
  };

  const handleCompanyChange = (e) => {
    setSelectedCompany(e.target.value);
  };

  const handleAddCompany = async () => {
    if (!newCompanyName.trim()) return;
    
    try {
      const response = await questionService.createCompany(newCompanyName);
      setSuccessMessage(`Company "${newCompanyName}" added successfully`);
      setNewCompanyName('');
      setShowAddCompany(false);
      await fetchCompanies();
    } catch (err) {
      setError(`Failed to add company: ${err.message}`);
      console.error(err);
    }
  };

  const handleCsvUpload = async (e) => {
    e.preventDefault();
    
    if (!csvFile) {
      setError('Please select a CSV file');
      return;
    }
    
    if (!selectedCompany) {
      setError('Please select a company');
      return;
    }
    
    setUploadLoading(true);
    setError('');
    setSuccessMessage('');
    
    try {
      const formData = new FormData();
      formData.append('csvFile', csvFile);
      formData.append('companyId', selectedCompany);
      
      const response = await adminService.uploadCSV(formData);
      
      setSuccessMessage(`Successfully uploaded ${response.successCount || 0} questions. ${response.failedCount ? `Failed: ${response.failedCount}` : ''}`);
      setCsvFile(null);
      setFileName('');
    } catch (err) {
      setError(`Failed to upload questions: ${err.message}`);
      console.error(err);
    } finally {
      setUploadLoading(false);
    }
  };

  if (loading && users.length === 0) {
    return (
      <div className="container mt-5">
        <div className="text-center">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mt-4">
      <h2>Admin Dashboard</h2>
      
      {successMessage && (
        <div className="alert alert-success alert-dismissible fade show" role="alert">
          {successMessage}
          <button type="button" className="btn-close" onClick={() => setSuccessMessage('')}></button>
        </div>
      )}
      
      {error && (
        <div className="alert alert-danger alert-dismissible fade show" role="alert">
          {error}
          <button type="button" className="btn-close" onClick={() => setError('')}></button>
        </div>
      )}
      
      <div className="row mb-4">
        <div className="col-12">
          <div className="card">
            <div className="card-header bg-dark text-white">
              <h4 className="mb-0">Admin Tools</h4>
            </div>
            <div className="card-body">
              <div className="d-flex flex-wrap gap-2">
                {/* CSV Upload Form */}
                <div className="card w-100">
                  <div className="card-header bg-primary text-white">
                    <h5 className="mb-0">Upload Questions (CSV)</h5>
                  </div>
                  <div className="card-body">
                    <form onSubmit={handleCsvUpload}>
                      <div className="mb-3">
                        <label htmlFor="csvFile" className="form-label">CSV File</label>
                        <input 
                          type="file" 
                          className="form-control" 
                          id="csvFile" 
                          accept=".csv" 
                          onChange={handleFileChange}
                          required 
                        />
                        {fileName && (
                          <div className="form-text">Selected file: {fileName}</div>
                        )}
                        <div className="form-text text-muted">
                          Required columns: Difficulty, Title, Link, Topics
                        </div>
                      </div>
                      
                      <div className="mb-3">
                        <label htmlFor="companySelect" className="form-label">Select Company</label>
                        <div className="input-group">
                          <select 
                            className="form-select" 
                            id="companySelect" 
                            value={selectedCompany}
                            onChange={handleCompanyChange}
                            disabled={showAddCompany}
                            required
                          >
                            <option value="">Choose company...</option>
                            {companies && companies.map(company => (
                              <option key={company.company_id} value={company.company_id}>
                                {company.company_name}
                              </option>
                            ))}
                          </select>
                          <button 
                            className="btn btn-outline-secondary" 
                            type="button"
                            onClick={() => setShowAddCompany(!showAddCompany)}
                          >
                            {showAddCompany ? 'Cancel' : 'Add New'}
                          </button>
                        </div>
                      </div>
                      
                      {showAddCompany && (
                        <div className="mb-3">
                          <label htmlFor="newCompany" className="form-label">New Company Name</label>
                          <div className="input-group">
                            <input 
                              type="text" 
                              className="form-control" 
                              id="newCompany" 
                              value={newCompanyName}
                              onChange={(e) => setNewCompanyName(e.target.value)}
                              placeholder="Enter company name"
                              required={showAddCompany}
                            />
                            <button 
                              className="btn btn-success" 
                              type="button"
                              onClick={handleAddCompany}
                              disabled={!newCompanyName.trim()}
                            >
                              Add Company
                            </button>
                          </div>
                        </div>
                      )}
                      
                      <button 
                        type="submit" 
                        className="btn btn-primary"
                        disabled={uploadLoading || !csvFile || (!selectedCompany && !showAddCompany)}
                      >
                        {uploadLoading ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                            Uploading...
                          </>
                        ) : 'Upload Questions'}
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="card mt-4">
        <div className="card-header bg-primary text-white">
          <h4 className="mb-0">User Management</h4>
        </div>
        <div className="card-body">
          <div className="table-responsive">
            <table className="table table-striped table-hover">
              <thead>
                <tr>
                  <th>Username</th>
                  <th>Email</th>
                  <th>Name</th>
                  <th>Admin</th>
                  <th>Created At</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.length > 0 ? (
                  users.map(user => (
                    <tr key={user.username}>
                      <td>{user.username}</td>
                      <td>{user.email}</td>
                      <td>
                        {user.first_name || ''} {user.last_name || ''}
                      </td>
                      <td>
                        {user.is_admin ? (
                          <span className="badge bg-warning">Admin</span>
                        ) : (
                          <span className="badge bg-secondary">User</span>
                        )}
                      </td>
                      <td>{new Date(user.created_at).toLocaleString()}</td>
                      <td>
                        <button
                          className="btn btn-sm btn-danger"
                          onClick={() => handleDeleteUser(user.username)}
                          disabled={user.is_admin}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="text-center">
                      No users found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;