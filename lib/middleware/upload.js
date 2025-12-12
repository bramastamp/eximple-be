const multer = require('multer');
const StorageService = require('../services/storageService');

// Configure multer untuk memory storage
const storage = multer.memoryStorage();

// File filter untuk image only
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('File type not allowed. Allowed types: JPEG, PNG, GIF, WebP'), false);
  }
};

// Multer configuration
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB max
  }
});

// Middleware untuk upload single file
const uploadAvatar = upload.single('avatar');

// Middleware wrapper dengan error handling
const handleUpload = (req, res, next) => {
  uploadAvatar(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({
            success: false,
            errors: [{
              field: 'avatar',
              message: 'File size exceeds 5MB limit',
              code: 'FILE_TOO_LARGE'
            }]
          });
        }
      }
      return res.status(400).json({
        success: false,
        errors: [{
          field: 'avatar',
          message: err.message || 'File upload error',
          code: 'UPLOAD_ERROR'
        }]
      });
    }
    next();
  });
};

module.exports = { handleUpload };

