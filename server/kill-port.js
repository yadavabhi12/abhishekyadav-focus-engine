const { exec } = require('child_process');
const os = require('os');

const killPortProcess = (port) => {
  return new Promise((resolve, reject) => {
    const platform = os.platform();
    
    if (platform === 'win32') {
      // Windows
      exec(`netstat -ano | findstr :${port}`, (error, stdout) => {
        if (error) {
          console.log(`No process found on port ${port}`);
          return resolve();
        }
        
        const lines = stdout.split('\n');
        const pids = [];
        
        lines.forEach(line => {
          const match = line.trim().split(/\s+/);
          if (match.length >= 5) {
            pids.push(match[4]);
          }
        });
        
        if (pids.length === 0) {
          console.log(`No process found on port ${port}`);
          return resolve();
        }
        
        // Kill all processes using the port
        const uniquePids = [...new Set(pids)];
        uniquePids.forEach(pid => {
          exec(`taskkill /PID ${pid} /F`, (error) => {
            if (error) {
              console.error(`Failed to kill process ${pid}:`, error.message);
            } else {
              console.log(`Killed process ${pid} using port ${port}`);
            }
          });
        });
        
        resolve();
      });
    } else {
      // Linux/Mac
      exec(`lsof -ti:${port}`, (error, stdout) => {
        if (error) {
          console.log(`No process found on port ${port}`);
          return resolve();
        }
        
        const pids = stdout.trim().split('\n');
        if (pids.length === 0 || (pids.length === 1 && pids[0] === '')) {
          console.log(`No process found on port ${port}`);
          return resolve();
        }
        
        // Kill all processes using the port
        pids.forEach(pid => {
          if (pid) {
            exec(`kill -9 ${pid}`, (error) => {
              if (error) {
                console.error(`Failed to kill process ${pid}:`, error.message);
              } else {
                console.log(`Killed process ${pid} using port ${port}`);
              }
            });
          }
        });
        
        resolve();
      });
    }
  });
};

// If run directly, kill port 5000
if (require.main === module) {
  const port = process.argv[2] || 5000;
  killPortProcess(port)
    .then(() => console.log('Port cleanup completed'))
    .catch(err => console.error('Error cleaning up port:', err));
}

module.exports = killPortProcess;