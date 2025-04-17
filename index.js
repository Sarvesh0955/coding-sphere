const express = require('express');
const dotenv = require('dotenv');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const db = require('./database');
const emailService = require('./emailService');

dotenv.config();

const app = express();

// Configure CORS
app.use(cors({
  origin: 'http://localhost:3001', // Your React frontend URL
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key';

db.initDatabase();

db.testConnection();

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ message: 'Access token required' });
    }
    
    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ message: 'Invalid or expired token' });
        }
        req.user = user;
        next();
    });
};

const isAdmin = (req, res, next) => {
    if (!req.user.isadmin) {
        return res.status(403).json({ message: 'Admin privileges required' });
    }
    next();
};

app.get('/', (req, res) => {
    res.send('Hello, World!');
});

// Add a debugging endpoint to check OTP status
app.get('/api/check-otp/:email', (req, res) => {
    try {
        const email = req.params.email;
        const info = emailService.getStoredOTPInfo(email);
        res.status(200).json(info);
    } catch (err) {
        console.error('Error checking OTP:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

app.post('/api/signup', async (req, res) => {
    try {
        const { name, email, password, otp } = req.body;
        
        if (!name || !email || !password) {
            return res.status(400).json({ message: 'Name, email and password are required' });
        }
        
        const existingUser = await db.userQueries.getUserByEmail(email);
        if (existingUser) {
            return res.status(409).json({ message: 'User with this email already exists' });
        }

        // Check if OTP is provided and verify it
        if (otp) {
            console.log(`Verifying OTP for signup: ${email}, ${otp}`);
            const otpResult = emailService.verifyOTP(email, otp, 'signup');
            if (!otpResult.valid) {
                return res.status(400).json({ message: otpResult.message });
            }
            console.log(`OTP verification successful for ${email}`);
        } else {
            console.log(`No OTP provided for signup: ${email}`);
            // Make OTP required
            return res.status(400).json({ message: 'Verification code is required' });
        }
        
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        
        console.log(`Creating user: ${name}, ${email}`);
        const user = await db.userQueries.createUser(name, email, hashedPassword, false);
        
        const token = jwt.sign(
            { id: user.id, email: user.email, isadmin: user.isadmin },
            JWT_SECRET,
            { expiresIn: '24h' }
        );
        
        res.status(201).json({
            message: 'User registered successfully',
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                isadmin: user.isadmin
            },
            token
        });
    } catch (err) {
        console.error('Error in signup:', err);
        res.status(500).json({ message: 'Server error during registration', error: err.message });
    }
});

app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }
        
        const user = await db.userQueries.getUserByEmail(email);
        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        
        const token = jwt.sign(
            { id: user.id, email: user.email, isadmin: user.isadmin },
            JWT_SECRET,
            { expiresIn: '24h' }
        );
        
        res.status(200).json({
            message: 'Login successful',
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                isadmin: user.isadmin
            },
            token
        });
    } catch (err) {
        console.error('Error in login:', err);
        res.status(500).json({ message: 'Server error during login' });
    }
});

app.get('/api/profile', authenticateToken, async (req, res) => {
    try {
        const user = await db.userQueries.getUserById(req.user.id);
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        res.status(200).json(user);
    } catch (err) {
        console.error('Error fetching profile:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

app.get('/api/admin/users', authenticateToken, isAdmin, async (req, res) => {
    try {
        const users = await db.userQueries.getAllUsers();
        res.status(200).json({ users });
    } catch (err) {
        console.error('Error fetching users:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Send OTP for email verification
app.post('/api/send-verification-otp', async (req, res) => {
    try {
        const { email, purpose = 'verification' } = req.body;
        
        if (!email) {
            return res.status(400).json({ message: 'Email is required' });
        }
        
        const result = await emailService.sendOTP(email, purpose);
        
        if (!result.success) {
            return res.status(500).json({ message: 'Failed to send OTP', error: result.error });
        }
        
        res.status(200).json({ message: 'OTP sent successfully' });
    } catch (err) {
        console.error('Error sending OTP:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Verify OTP
app.post('/api/verify-otp', async (req, res) => {
    try {
        const { email, otp, purpose = 'verification' } = req.body;
        
        if (!email || !otp) {
            return res.status(400).json({ message: 'Email and OTP are required' });
        }
        
        const result = emailService.verifyOTP(email, otp, purpose);
        
        if (!result.valid) {
            return res.status(400).json({ message: result.message });
        }
        
        // Handle different verification purposes
        if (purpose === 'signup') {
            // Set user as verified in the database
            const updatedUser = await db.userQueries.verifyUserEmail(email);
            if (!updatedUser) {
                return res.status(400).json({ message: 'User not found' });
            }
        }
        
        res.status(200).json({ message: 'OTP verified successfully' });
    } catch (err) {
        console.error('Error verifying OTP:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});