const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Create required directories
const createDirectories = () => {
  const directories = [
    'uploads',
    'uploads/avatars', 
    'uploads/chat'
  ];

  directories.forEach(dir => {
    const dirPath = path.join(__dirname, '..', dir);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
      console.log(`✅ Created directory: ${dirPath}`);
    }
  });
};

// Initialize directories
createDirectories();

// Multer configuration for avatars
const avatarStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, '..', 'uploads', 'avatars');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    cb(null, 'avatar-' + uniqueSuffix + extension);
  }
});

// Multer configuration for chat images
const chatImageStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const chatPath = path.join(__dirname, '..', 'uploads', 'chat');
    if (!fs.existsSync(chatPath)) {
      fs.mkdirSync(chatPath, { recursive: true });
    }
    cb(null, chatPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    cb(null, 'chat-image-' + uniqueSuffix + extension);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'), false);
  }
};

const upload = multer({ 
  storage: avatarStorage,
  limits: { 
    fileSize: 5 * 1024 * 1024
  },
  fileFilter: fileFilter
});

const chatImageUpload = multer({
  storage: chatImageStorage,
  limits: {
    fileSize: 5 * 1024 * 1024
  },
  fileFilter: fileFilter
});

module.exports = { 
  upload, 
  chatImageUpload,
  createDirectories
};


// const multer = require('multer');
// const path = require('path');
// const fs = require('fs');

// // Create required directories
// const createDirectories = () => {
//   const directories = [
//     'uploads',
//     'uploads/avatars', 
//     'uploads/chat'
//   ];

//   directories.forEach(dir => {
//     const dirPath = path.join(__dirname, '..', dir);
//     if (!fs.existsSync(dirPath)) {
//       fs.mkdirSync(dirPath, { recursive: true });
//       console.log(`✅ Created directory: ${dirPath}`);
//     }
//   });
// };

// // Initialize directories
// createDirectories();

// // Multer configuration for avatars
// const avatarStorage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     const uploadPath = path.join(__dirname, '..', 'uploads', 'avatars');
//     if (!fs.existsSync(uploadPath)) {
//       fs.mkdirSync(uploadPath, { recursive: true });
//     }
//     cb(null, uploadPath);
//   },
//   filename: function (req, file, cb) {
//     const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
//     const extension = path.extname(file.originalname);
//     cb(null, 'avatar-' + uniqueSuffix + extension);
//   }
// });

// // Multer configuration for chat images
// const chatImageStorage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     const chatPath = path.join(__dirname, '..', 'uploads', 'chat');
//     if (!fs.existsSync(chatPath)) {
//       fs.mkdirSync(chatPath, { recursive: true });
//     }
//     cb(null, chatPath);
//   },
//   filename: function (req, file, cb) {
//     const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
//     const extension = path.extname(file.originalname);
//     cb(null, 'chat-image-' + uniqueSuffix + extension);
//   }
// });

// const fileFilter = (req, file, cb) => {
//   const allowedTypes = /jpeg|jpg|png|gif|webp/;
//   const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
//   const mimetype = allowedTypes.test(file.mimetype);

//   if (mimetype && extname) {
//     return cb(null, true);
//   } else {
//     cb(new Error('Only image files are allowed'), false);
//   }
// };

// const upload = multer({ 
//   storage: avatarStorage,
//   limits: { 
//     fileSize: 5 * 1024 * 1024
//   },
//   fileFilter: fileFilter
// });

// const chatImageUpload = multer({
//   storage: chatImageStorage,
//   limits: {
//     fileSize: 5 * 1024 * 1024
//   },
//   fileFilter: fileFilter
// });

// module.exports = { 
//   upload, 
//   chatImageUpload,
//   createDirectories
// };