const multer = require('multer');
const path = require('path');

// Files are held in memory and streamed to S3 in each controller.
// No local disk writes — safe for ephemeral ECS Fargate containers.
const storage = multer.memoryStorage();

const upload = multer({
    storage,
    limits: { fileSize: 5000000 }, // 5 MB
    fileFilter: function (req, file, cb) {
        checkFileType(file, cb);
    }
});

function checkFileType(file, cb) {
    const filetypes = /jpeg|jpg|png|gif|webp|heic/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    // Dio (Flutter) sometimes sends application/octet-stream
    const mimetype =
        filetypes.test(file.mimetype) ||
        file.mimetype === 'application/octet-stream' ||
        file.mimetype.startsWith('image/');

    if (mimetype) {
        return cb(null, true);
    } else {
        cb(new Error(`File upload rejected: ${file.originalname} — ${file.mimetype}`));
    }
}

module.exports = upload;
