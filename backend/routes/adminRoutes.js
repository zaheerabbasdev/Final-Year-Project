const express = require('express');
const router = express.Router();
const { 
    registerAdmin, loginAdmin, getStats, getAllUsers, deleteUser, getUserDetails, updateUserStatus, autoVerifyProvider,
    getAllJobs, deleteJob, summarizeJobDispute, getAllBids, getAllCategories, createCategory, deleteCategory 
} = require('../controllers/adminController');
const adminAuth = require('../middleware/adminAuth');
const { loginLimiter } = require('../middleware/rateLimiter');

// Public Auth Routes
router.post('/auth/register', registerAdmin);
router.post('/auth/login', loginLimiter, loginAdmin);

// Protected Admin Routes
router.get('/stats', adminAuth, getStats);
router.get('/users', adminAuth, getAllUsers);
router.get('/users/:id', adminAuth, getUserDetails);
router.put('/users/:id/status', adminAuth, updateUserStatus);
router.post('/providers/:id/auto-verify', adminAuth, autoVerifyProvider);
router.delete('/users/:id', adminAuth, deleteUser);
router.get('/jobs', adminAuth, getAllJobs);
router.delete('/jobs/:id', adminAuth, deleteJob);
router.post('/jobs/:id/summarize-dispute', adminAuth, summarizeJobDispute);
router.get('/bids', adminAuth, getAllBids);
router.get('/categories', adminAuth, getAllCategories);
router.post('/categories', adminAuth, createCategory);
router.delete('/categories/:id', adminAuth, deleteCategory);

module.exports = router;
