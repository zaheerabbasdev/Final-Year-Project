const multer = require('multer');
const path = require('path');

// Set Storage Engine
const storage = multer.diskStorage({
    destination: './uploads/',
    filename: function (req, file, cb) {
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
});

// Init Upload
const upload = multer({
    storage: storage,
    limits: { fileSize: 5000000 }, // 5MB limit
    fileFilter: function (req, file, cb) {
        checkFileType(file, cb);
    }
});

// Check File Type
function checkFileType(file, cb) {
    // Allowed extensions
    const filetypes = /jpeg|jpg|png|gif|tmp|webp|heic/;
    // Check extension
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    // Check mime (Dio might send application/octet-stream)
    const mimetype = filetypes.test(file.mimetype) || file.mimetype === 'application/octet-stream' || file.mimetype.startsWith('image/');

    // Accept if it has a valid image minetype or if it's sent from flutter generically
    if (mimetype) {
        return cb(null, true);
    } else {
        cb(new Error(`File upload rejected: ${file.originalname} - ${file.mimetype}`));
    }
}

module.exports = upload;
