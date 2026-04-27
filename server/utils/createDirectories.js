const fs = require('fs');
const path = require('path');

const createDirectories = () => {
  const directories = [
    'uploads',
    'uploads/avatars',
    'logs'
  ];

  directories.forEach(dir => {
    const fullPath = path.join(__dirname, '..', dir);
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
      console.log(`Created directory: ${fullPath}`);
    }
  });

  console.log('All directories created successfully');
};

module.exports = createDirectories;



// const fs = require('fs');
// const path = require('path');

// const createDirectories = () => {
//   const directories = [
//     'uploads',
//     'uploads/avatars',
//     'logs'
//   ];

//   directories.forEach(dir => {
//     const fullPath = path.join(__dirname, '..', dir);
//     if (!fs.existsSync(fullPath)) {
//       fs.mkdirSync(fullPath, { recursive: true });
//       console.log(`Created directory: ${fullPath}`);
//     }
//   });

//   console.log('All directories created successfully');
// };

// module.exports = createDirectories;