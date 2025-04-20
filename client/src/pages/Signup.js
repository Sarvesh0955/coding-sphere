import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { register, sendVerificationOTP, verifyOTP, verifiedRegister } from '../services/authService';

const Signup = ({ setUser }) => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    firstName: '',
    lastName: '',
    password: '',
    confirmPassword: '',
    otp: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSendOTP = async () => {
    if (!formData.email) {
      setError('Email is required to send verification code');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await sendVerificationOTP(formData.email, 'signup');
      setOtpSent(true);
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to send verification code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!formData.otp) {
      setError('Please enter the verification code');
      return;
    }

    setVerifying(true);
    setError('');

    try {
      // Use the verifiedRegister function with all parameters including OTP
      const data = await verifiedRegister(
        formData.username,
        formData.email,
        formData.password,
        formData.firstName,
        formData.lastName,
        formData.otp
      );
      setUser(data.profile);
      navigate('/profile');
    } catch (err) {
      setError(err.message || 'Invalid verification code or registration failed. Please try again.');
      setVerifying(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    // Validate username
    if (!formData.username) {
      setError('Username is required');
      return;
    }

    setError('');
    
    if (otpSent) {
      await handleVerifyOTP();
    } else {
      await handleSendOTP();
    }
  };

  return (
    <div className="row justify-content-center">
      <div className="col-md-6">
        <div className="card">
          <div className="card-header bg-success text-white">
            <h4 className="mb-0">Sign Up</h4>
          </div>
          <div className="card-body">
            {error && <div className="alert alert-danger">{error}</div>}
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label htmlFor="username" className="form-label">Username</label>
                <input 
                  type="text" 
                  className="form-control" 
                  id="username" 
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  required
                />
                <small className="text-muted">This will be your unique identifier for login</small>
              </div>

              <div className="mb-3">
                <label htmlFor="email" className="form-label">Email</label>
                <input 
                  type="email" 
                  className="form-control" 
                  id="email" 
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="row mb-3">
                <div className="col">
                  <label htmlFor="firstName" className="form-label">First Name</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    id="firstName" 
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                  />
                </div>
                <div className="col">
                  <label htmlFor="lastName" className="form-label">Last Name</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    id="lastName" 
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="mb-3">
                <label htmlFor="password" className="form-label">Password</label>
                <input 
                  type="password" 
                  className="form-control" 
                  id="password" 
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  minLength="6"
                />
              </div>
              <div className="mb-3">
                <label htmlFor="confirmPassword" className="form-label">Confirm Password</label>
                <input 
                  type="password" 
                  className="form-control" 
                  id="confirmPassword" 
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  minLength="6"
                />
              </div>
              {otpSent && (
                <div className="mb-3">
                  <label htmlFor="otp" className="form-label">Verification Code</label>
                  <div className="input-group">
                    <input 
                      type="text" 
                      className="form-control" 
                      id="otp" 
                      name="otp"
                      value={formData.otp}
                      onChange={handleChange}
                      required
                      placeholder="Enter the 6-digit code"
                    />
                    <button 
                      type="button" 
                      className="btn btn-outline-secondary" 
                      onClick={handleSendOTP}
                      disabled={loading}
                    >
                      Resend
                    </button>
                  </div>
                  <small className="form-text text-muted">
                    We've sent a verification code to your email. Please check your inbox (including spam folder).
                  </small>
                </div>
              )}
              <button 
                type="submit" 
                className="btn btn-success w-100"
                disabled={loading || verifying}
              >
                {loading ? 'Sending verification code...' : 
                 verifying ? 'Verifying...' : 
                 otpSent ? 'Verify & Complete Signup' : 'Send Verification Code'}
              </button>
            </form>
            <p className="mt-3">
              Already have an account? <Link to="/login">Login here</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;