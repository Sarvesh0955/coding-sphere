const nodemailer = require('nodemailer');
const crypto = require('crypto');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'your-email@gmail.com', 
    pass: process.env.EMAIL_PASSWORD || 'your-app-password' 
  }
});

const otpStore = new Map();

const getStoredOTPInfo = (email) => {
  const data = otpStore.get(email);
  if (!data) {
    return { exists: false, message: 'No OTP found for this email' };
  }
  
  return {
    exists: true,
    purpose: data.purpose,
    createdAt: data.createdAt,
    expiresAt: data.expiresAt,
    isExpired: new Date() > data.expiresAt
  };
};

const generateOTP = () => {
  return crypto.randomInt(100000, 999999).toString();
};

const sendOTP = async (email, purpose = 'verification') => {
  try {
    const otp = generateOTP();
    
    otpStore.set(email, {
      otp,
      purpose,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 15 * 60 * 1000)
    });
    
    console.log(`OTP generated for ${email}: ${otp} (purpose: ${purpose})`);
    
    const mailOptions = {
      from: process.env.EMAIL_USER || 'your-email@gmail.com',
      to: email,
      subject: 'Your Verification Code',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <h2 style="color: #333;">Verification Code</h2>
          <p>Your OTP for ${purpose} is:</p>
          <h1 style="color: #4a90e2; font-size: 32px; letter-spacing: 2px;">${otp}</h1>
          <p>This code will expire in 15 minutes.</p>
          <p>If you didn't request this code, please ignore this email.</p>
        </div>
      `
    };
    
    await transporter.sendMail(mailOptions);
    
    return { success: true };
  } catch (error) {
    console.error('Error sending OTP:', error);
    return { success: false, error: error.message };
  }
};

const verifyOTP = (email, otp, purpose = 'verification') => {
  console.log(`Verifying OTP for ${email}: ${otp} (purpose: ${purpose})`);
  
  const storedData = otpStore.get(email);
  
  if (!storedData) {
    console.log(`No OTP found for ${email}`);
    return { valid: false, message: 'No OTP found for this email' };
  }
  
  console.log(`Found stored OTP data for ${email}:`, {
    storedOtp: storedData.otp,
    purpose: storedData.purpose,
    expiresAt: storedData.expiresAt,
    now: new Date(),
    isExpired: new Date() > storedData.expiresAt
  });
  
  if (storedData.purpose !== purpose) {
    console.log(`OTP purpose mismatch for ${email}: ${storedData.purpose} vs ${purpose}`);
    return { valid: false, message: 'OTP purpose mismatch' };
  }
  
  if (new Date() > storedData.expiresAt) {
    console.log(`OTP expired for ${email}`);
    otpStore.delete(email);
    return { valid: false, message: 'OTP has expired' };
  }
  
  if (storedData.otp !== otp) {
    console.log(`Invalid OTP for ${email}: ${otp} vs ${storedData.otp}`);
    return { valid: false, message: 'Invalid OTP' };
  }
  
  console.log(`OTP verified successfully for ${email}`);
  
  otpStore.delete(email);
  
  return { valid: true };
};

module.exports = {
  sendOTP,
  verifyOTP,
  getStoredOTPInfo
};