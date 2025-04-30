const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticateToken, isAdmin } = require('../middleware/auth');
const multer = require('multer');

const upload = multer({ storage: multer.memoryStorage() });

router.use(authenticateToken, isAdmin);

router.get('/users', adminController.getAllUsers);

router.delete('/users/:username', adminController.deleteUser);

router.post('/questions/upload-csv', upload.single('csvFile'), adminController.importQuestionsFromCSV);

module.exports = router;