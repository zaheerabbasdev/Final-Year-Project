const express = require('express');
const router = express.Router();
const { createJob, getJobs, getJobById, updateJob, deleteJob, getMyJobs } = require('../controllers/jobController');
const { authMiddleware, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.get('/', getJobs);

function handleUpload(req, res, next) {
    upload.array('images', 6)(req, res, (err) => {
        if (err) {
            console.error('Multer upload error:', err.message || err);
            return next(err);
        }
        next();
    });
}

router.post('/', authMiddleware, authorize('customer'), handleUpload, createJob);
router.get('/my/jobs', authMiddleware, getMyJobs);
router.get('/:id', getJobById);
router.put('/:id', authMiddleware, authorize('customer'), updateJob);
router.delete('/:id', authMiddleware, authorize('customer'), deleteJob);

module.exports = router;
