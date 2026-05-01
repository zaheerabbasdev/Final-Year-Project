const express = require('express');
const router = express.Router();
const { 
    registerAdmin, loginAdmin, getStats, getAllUsers, deleteUser, 
    getAllJobs, deleteJob, getAllBids, getAllCategories, createCategory, deleteCategory 
} = require('../controllers/adminController');
const adminAuth = require('../middleware/adminAuth');

// Public Auth Routes
router.post('/auth/register', registerAdmin);
router.post('/auth/login', loginAdmin);

// Protected Admin Routes
router.get('/stats', adminAuth, getStats);
router.get('/users', adminAuth, getAllUsers);
router.delete('/users/:id', adminAuth, deleteUser);
router.get('/jobs', adminAuth, getAllJobs);
router.delete('/jobs/:id', adminAuth, deleteJob);
router.get('/bids', adminAuth, getAllBids);
router.get('/categories', adminAuth, getAllCategories);
router.post('/categories', adminAuth, createCategory);
router.delete('/categories/:id', adminAuth, deleteCategory);

module.exports = router;
