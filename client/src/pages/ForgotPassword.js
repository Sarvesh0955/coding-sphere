import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { sendVerificationOTP, resetPassword } from '../services/authService';

const ForgotPassword = () => {
  const [step, setStep] = useState(1); // 1: Email entry, 2: OTP verification, 3: New password
  const [formData, setFormData] = useState({
    email: '',
    otp: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleSendOTP = async (e) => {
    e.preventDefault();
    
    if (!formData.email) {
      return setError('Email is required');
    }

    setLoading(true);
    setError('');

    try {
      await sendVerificationOTP(formData.email, 'reset-password');
      setStep(2);
      setSuccess('Verification code sent to your email. Please check your inbox.');
    } catch (err) {
      setError(err.message || 'Failed to send verification code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyAndReset = async (e) => {
    e.preventDefault();

    if (step === 2) {
      if (!formData.otp) {
        return setError('Verification code is required');
      }
      setStep(3);
      return;
    }

    // Step 3: Reset password
    if (formData.newPassword !== formData.confirmPassword) {
      return setError('Passwords do not match');
    }

    if (formData.newPassword.length < 6) {
      return setError('Password must be at least 6 characters');
    }

    setLoading(true);
    setError('');

    try {
      await resetPassword(formData.email, formData.otp, formData.newPassword);
      setSuccess('Password reset successfully. You can now login with your new password.');
      setStep(4); // Success state
    } catch (err) {
      setError(err.message || 'Failed to reset password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="row justify-content-center">
      <div className="col-md-6">
        <div className="card">
          <div className="card-header bg-warning text-white">
            <h4 className="mb-0">Reset Your Password</h4>
          </div>
          <div className="card-body">
            {error && <div className="alert alert-danger">{error}</div>}
            {success && <div className="alert alert-success">{success}</div>}
            
            {step === 1 && (
              <form onSubmit={handleSendOTP}>
                <div className="mb-3">
                  <label htmlFor="email" className="form-label">Email Address</label>
                  <input 
                    type="email" 
                    className="form-control" 
                    id="email" 
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                  <small className="form-text text-muted">
                    Enter the email address associated with your account.
                  </small>
                </div>
                <button 
                  type="submit" 
                  className="btn btn-warning w-100"
                  disabled={loading}
                >
                  {loading ? 'Sending...' : 'Send Reset Code'}
                </button>
              </form>
            )}

            {step === 2 && (
              <form onSubmit={handleVerifyAndReset}>
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
                      onClick={() => handleSendOTP({ preventDefault: () => {} })}
                      disabled={loading}
                    >
                      Resend
                    </button>
                  </div>
                  <small className="form-text text-muted">
                    Enter the verification code sent to your email.
                  </small>
                </div>
                <button 
                  type="submit" 
                  className="btn btn-warning w-100"
                  disabled={loading}
                >
                  {loading ? 'Verifying...' : 'Verify Code'}
                </button>
              </form>
            )}

            {step === 3 && (
              <form onSubmit={handleVerifyAndReset}>
                <div className="mb-3">
                  <label htmlFor="newPassword" className="form-label">New Password</label>
                  <input 
                    type="password" 
                    className="form-control" 
                    id="newPassword" 
                    name="newPassword"
                    value={formData.newPassword}
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
                <button 
                  type="submit" 
                  className="btn btn-warning w-100"
                  disabled={loading}
                >
                  {loading ? 'Updating Password...' : 'Update Password'}
                </button>
              </form>
            )}

            {step === 4 && (
              <div className="text-center">
                <p>Your password has been successfully reset!</p>
                <Link to="/login" className="btn btn-primary">
                  Go to Login
                </Link>
              </div>
            )}
            
            <p className="mt-3">
              <Link to="/login">Back to Login</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;