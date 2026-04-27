const express = require('express');
const puppeteer = require('puppeteer');
const Task = require('../models/Task');
const Category = require('../models/Category');
const auth = require('../middleware/auth');

const router = express.Router();

router.get('/export.csv', auth, async (req, res) => {
  try {
    const { range = '30' } = req.query;
    const days = parseInt(range);
    
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];

    const tasks = await Task.find({
      ownerId: req.user._id,
      date: { $gte: startDateStr, $lte: endDateStr }
    }).sort({ date: 1 });

    const csvHeader = 'Date,Title,Category,Priority,Estimated Hours,Actual Hours,Completed,Tags\n';
    const csvRows = tasks.map(task => {
      const estimatedHours = task.estimatedMinutes ? (task.estimatedMinutes / 60).toFixed(2) : '0';
      const actualHours = task.actualMinutes ? (task.actualMinutes / 60).toFixed(2) : '0';
      const tags = task.tags.join(';');
      
      return `${task.date},"${task.title}","${task.category}",${task.priority},${estimatedHours},${actualHours},${task.completed},${tags}`;
    }).join('\n');

    const csvContent = csvHeader + csvRows;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=tasks-export-${endDateStr}.csv`);
    res.send(csvContent);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/export.json', auth, async (req, res) => {
  try {
    const { range = '30' } = req.query;
    const days = parseInt(range);
    
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];

    const tasks = await Task.find({
      ownerId: req.user._id,
      date: { $gte: startDateStr, $lte: endDateStr }
    }).sort({ date: 1 });

    const exportData = {
      exportDate: new Date().toISOString(),
      dateRange: { start: startDateStr, end: endDateStr },
      totalTasks: tasks.length,
      completedTasks: tasks.filter(t => t.completed).length,
      tasks: tasks.map(task => ({
        id: task._id,
        title: task.title,
        description: task.description,
        category: task.category,
        date: task.date,
        startTime: task.startTime,
        endTime: task.endTime,
        priority: task.priority,
        estimatedMinutes: task.estimatedMinutes,
        actualMinutes: task.actualMinutes,
        completed: task.completed,
        completedAt: task.completedAt,
        tags: task.tags,
        subtasks: task.subtasks,
        pomodoroSessions: task.pomodoroSessions,
        createdAt: task.createdAt,
        updatedAt: task.updatedAt
      }))
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=tasks-export-${endDateStr}.json`);
    res.json(exportData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/export.pdf', auth, async (req, res) => {
  try {
    const { range = '30' } = req.query;
    const days = parseInt(range);
    
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];

    const tasks = await Task.find({
      ownerId: req.user._id,
      date: { $gte: startDateStr, $lte: endDateStr }
    });

    const completedTasks = tasks.filter(t => t.completed);
    const totalTasks = tasks.length;
    const completionRate = totalTasks > 0 ? Math.round((completedTasks.length / totalTasks) * 100) : 0;

    const totalProductiveMinutes = completedTasks.reduce((sum, task) => {
      return sum + (task.actualMinutes || task.estimatedMinutes || 0);
    }, 0);

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Productivity Report</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; }
          h1 { color: #1f2937; border-bottom: 2px solid #3b82f6; padding-bottom: 10px; }
          h2 { color: #374151; margin-top: 30px; }
          .summary-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin: 20px 0; }
          .metric-card { background: #f9fafb; padding: 20px; border-radius: 8px; border: 1px solid #e5e7eb; }
          .metric-value { font-size: 2em; font-weight: bold; color: #3b82f6; }
          .metric-label { color: #6b7280; margin-top: 5px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { padding: 12px; text-align: left; border-bottom: 1px solid #e5e7eb; }
          th { background-color: #f9fafb; font-weight: 600; }
          .completed { color: #10b981; }
          .pending { color: #f59e0b; }
        </style>
      </head>
      <body>
        <h1>Productivity Report</h1>
        <p><strong>Period:</strong> ${startDateStr} to ${endDateStr}</p>
        <p><strong>Generated:</strong> ${new Date().toLocaleDateString()}</p>
        
        <div class="summary-grid">
          <div class="metric-card">
            <div class="metric-value">${completionRate}%</div>
            <div class="metric-label">Completion Rate</div>
          </div>
          <div class="metric-card">
            <div class="metric-value">${Math.round(totalProductiveMinutes / 60 * 10) / 10}</div>
            <div class="metric-label">Productive Hours</div>
          </div>
          <div class="metric-card">
            <div class="metric-value">${completedTasks.length}</div>
            <div class="metric-label">Completed Tasks</div>
          </div>
          <div class="metric-card">
            <div class="metric-value">${totalTasks}</div>
            <div class="metric-label">Total Tasks</div>
          </div>
        </div>

        <h2>Recent Tasks</h2>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Task</th>
              <th>Category</th>
              <th>Priority</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${tasks.slice(0, 20).map(task => `
              <tr>
                <td>${task.date}</td>
                <td>${task.title}</td>
                <td>${task.category}</td>
                <td>${task.priority}</td>
                <td class="${task.completed ? 'completed' : 'pending'}">
                  ${task.completed ? 'Completed' : 'Pending'}
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </body>
      </html>
    `;

    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();
    await page.setContent(htmlContent);
    
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '20mm', bottom: '20mm', left: '20mm', right: '20mm' }
    });
    
    await browser.close();

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=productivity-report-${endDateStr}.pdf`);
    res.send(pdf);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;



// const express = require('express');
// const puppeteer = require('puppeteer');
// const Task = require('../models/Task');
// const Category = require('../models/Category');
// const auth = require('../middleware/auth');

// const router = express.Router();

// router.get('/export.csv', auth, async (req, res) => {
//   try {
//     const { range = '30' } = req.query;
//     const days = parseInt(range);
    
//     const endDate = new Date();
//     const startDate = new Date();
//     startDate.setDate(startDate.getDate() - days);

//     const startDateStr = startDate.toISOString().split('T')[0];
//     const endDateStr = endDate.toISOString().split('T')[0];

//     const tasks = await Task.find({
//       ownerId: req.user._id,
//       date: { $gte: startDateStr, $lte: endDateStr }
//     }).sort({ date: 1 });

//     const csvHeader = 'Date,Title,Category,Priority,Estimated Hours,Actual Hours,Completed,Tags\n';
//     const csvRows = tasks.map(task => {
//       const estimatedHours = task.estimatedMinutes ? (task.estimatedMinutes / 60).toFixed(2) : '0';
//       const actualHours = task.actualMinutes ? (task.actualMinutes / 60).toFixed(2) : '0';
//       const tags = task.tags.join(';');
      
//       return `${task.date},"${task.title}","${task.category}",${task.priority},${estimatedHours},${actualHours},${task.completed},${tags}`;
//     }).join('\n');

//     const csvContent = csvHeader + csvRows;

//     res.setHeader('Content-Type', 'text/csv');
//     res.setHeader('Content-Disposition', `attachment; filename=tasks-export-${endDateStr}.csv`);
//     res.send(csvContent);
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// });

// router.get('/export.json', auth, async (req, res) => {
//   try {
//     const { range = '30' } = req.query;
//     const days = parseInt(range);
    
//     const endDate = new Date();
//     const startDate = new Date();
//     startDate.setDate(startDate.getDate() - days);

//     const startDateStr = startDate.toISOString().split('T')[0];
//     const endDateStr = endDate.toISOString().split('T')[0];

//     const tasks = await Task.find({
//       ownerId: req.user._id,
//       date: { $gte: startDateStr, $lte: endDateStr }
//     }).sort({ date: 1 });

//     const exportData = {
//       exportDate: new Date().toISOString(),
//       dateRange: { start: startDateStr, end: endDateStr },
//       totalTasks: tasks.length,
//       completedTasks: tasks.filter(t => t.completed).length,
//       tasks: tasks.map(task => ({
//         id: task._id,
//         title: task.title,
//         description: task.description,
//         category: task.category,
//         date: task.date,
//         startTime: task.startTime,
//         endTime: task.endTime,
//         priority: task.priority,
//         estimatedMinutes: task.estimatedMinutes,
//         actualMinutes: task.actualMinutes,
//         completed: task.completed,
//         completedAt: task.completedAt,
//         tags: task.tags,
//         subtasks: task.subtasks,
//         pomodoroSessions: task.pomodoroSessions,
//         createdAt: task.createdAt,
//         updatedAt: task.updatedAt
//       }))
//     };

//     res.setHeader('Content-Type', 'application/json');
//     res.setHeader('Content-Disposition', `attachment; filename=tasks-export-${endDateStr}.json`);
//     res.json(exportData);
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// });

// router.get('/export.pdf', auth, async (req, res) => {
//   try {
//     const { range = '30' } = req.query;
//     const days = parseInt(range);
    
//     const endDate = new Date();
//     const startDate = new Date();
//     startDate.setDate(startDate.getDate() - days);

//     const startDateStr = startDate.toISOString().split('T')[0];
//     const endDateStr = endDate.toISOString().split('T')[0];

//     const tasks = await Task.find({
//       ownerId: req.user._id,
//       date: { $gte: startDateStr, $lte: endDateStr }
//     });

//     const completedTasks = tasks.filter(t => t.completed);
//     const totalTasks = tasks.length;
//     const completionRate = totalTasks > 0 ? Math.round((completedTasks.length / totalTasks) * 100) : 0;

//     const totalProductiveMinutes = completedTasks.reduce((sum, task) => {
//       return sum + (task.actualMinutes || task.estimatedMinutes || 0);
//     }, 0);

//     const htmlContent = `
//       <!DOCTYPE html>
//       <html>
//       <head>
//         <meta charset="utf-8">
//         <title>Productivity Report</title>
//         <style>
//           body { font-family: Arial, sans-serif; margin: 40px; }
//           h1 { color: #1f2937; border-bottom: 2px solid #3b82f6; padding-bottom: 10px; }
//           h2 { color: #374151; margin-top: 30px; }
//           .summary-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin: 20px 0; }
//           .metric-card { background: #f9fafb; padding: 20px; border-radius: 8px; border: 1px solid #e5e7eb; }
//           .metric-value { font-size: 2em; font-weight: bold; color: #3b82f6; }
//           .metric-label { color: #6b7280; margin-top: 5px; }
//           table { width: 100%; border-collapse: collapse; margin-top: 20px; }
//           th, td { padding: 12px; text-align: left; border-bottom: 1px solid #e5e7eb; }
//           th { background-color: #f9fafb; font-weight: 600; }
//           .completed { color: #10b981; }
//           .pending { color: #f59e0b; }
//         </style>
//       </head>
//       <body>
//         <h1>Productivity Report</h1>
//         <p><strong>Period:</strong> ${startDateStr} to ${endDateStr}</p>
//         <p><strong>Generated:</strong> ${new Date().toLocaleDateString()}</p>
        
//         <div class="summary-grid">
//           <div class="metric-card">
//             <div class="metric-value">${completionRate}%</div>
//             <div class="metric-label">Completion Rate</div>
//           </div>
//           <div class="metric-card">
//             <div class="metric-value">${Math.round(totalProductiveMinutes / 60 * 10) / 10}</div>
//             <div class="metric-label">Productive Hours</div>
//           </div>
//           <div class="metric-card">
//             <div class="metric-value">${completedTasks.length}</div>
//             <div class="metric-label">Completed Tasks</div>
//           </div>
//           <div class="metric-card">
//             <div class="metric-value">${totalTasks}</div>
//             <div class="metric-label">Total Tasks</div>
//           </div>
//         </div>

//         <h2>Recent Tasks</h2>
//         <table>
//           <thead>
//             <tr>
//               <th>Date</th>
//               <th>Task</th>
//               <th>Category</th>
//               <th>Priority</th>
//               <th>Status</th>
//             </tr>
//           </thead>
//           <tbody>
//             ${tasks.slice(0, 20).map(task => `
//               <tr>
//                 <td>${task.date}</td>
//                 <td>${task.title}</td>
//                 <td>${task.category}</td>
//                 <td>${task.priority}</td>
//                 <td class="${task.completed ? 'completed' : 'pending'}">
//                   ${task.completed ? 'Completed' : 'Pending'}
//                 </td>
//               </tr>
//             `).join('')}
//           </tbody>
//         </table>
//       </body>
//       </html>
//     `;

//     const browser = await puppeteer.launch({ headless: 'new' });
//     const page = await browser.newPage();
//     await page.setContent(htmlContent);
    
//     const pdf = await page.pdf({
//       format: 'A4',
//       printBackground: true,
//       margin: { top: '20mm', bottom: '20mm', left: '20mm', right: '20mm' }
//     });
    
//     await browser.close();

//     res.setHeader('Content-Type', 'application/pdf');
//     res.setHeader('Content-Disposition', `attachment; filename=productivity-report-${endDateStr}.pdf`);
//     res.send(pdf);
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// });

// module.exports = router;