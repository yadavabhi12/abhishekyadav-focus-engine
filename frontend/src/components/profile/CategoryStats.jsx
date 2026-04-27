// CategoryStats.jsx
import React from 'react';
import { Tag, PieChart } from 'lucide-react';

const CategoryStats = ({ stats }) => {
  const totalHours = stats.reduce((sum, cat) => sum + cat.hours, 0);
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow">
      <h2 className="text-lg font-semibold mb-4 flex items-center">
        <PieChart className="h-5 w-5 mr-2" />
        Work by Category
      </h2>
      
      {stats.length === 0 ? (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <Tag className="h-12 w-12 mx-auto text-gray-300 dark:text-gray-600 mb-2" />
          <p>No category data available yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {stats.map((category, index) => {
            const percentage = totalHours > 0 ? (category.hours / totalHours) * 100 : 0;
            
            return (
              <div key={index} className="space-y-2">
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <div 
                      className="w-3 h-3 rounded-full mr-2" 
                      style={{ backgroundColor: category.color }}
                    ></div>
                    <span className="text-sm font-medium">{category.category}</span>
                  </div>
                  <span className="text-sm text-gray-500">{category.hours.toFixed(1)}h</span>
                </div>
                
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div 
                    className="h-2 rounded-full" 
                    style={{ 
                      width: `${percentage}%`,
                      backgroundColor: category.color
                    }}
                  ></div>
                </div>
                
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                  <span>{category.tasks} tasks ({category.completed} completed)</span>
                  <span>{percentage.toFixed(1)}% of total</span>
                </div>
              </div>
            );
          })}
          
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-center">
              <span className="font-medium">Total</span>
              <span className="font-medium">{totalHours.toFixed(1)} hours</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoryStats;




// // CategoryStats.jsx
// import React from 'react';
// import { Tag, PieChart } from 'lucide-react';

// const CategoryStats = ({ stats }) => {
//   const totalTasks = stats.reduce((sum, category) => sum + category.tasks, 0);
  
//   return (
//     <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow">
//       <h2 className="text-lg font-semibold mb-4 flex items-center">
//         <PieChart className="h-5 w-5 mr-2" />
//         Work by Category
//       </h2>
      
//       {stats.length > 0 ? (
//         <div className="space-y-4">
//           {stats.map((category, index) => (
//             <div key={index} className="space-y-2">
//               <div className="flex justify-between items-center">
//                 <div className="flex items-center">
//                   <div 
//                     className="w-3 h-3 rounded-full mr-2" 
//                     style={{ backgroundColor: category.color }}
//                   ></div>
//                   <span className="text-sm font-medium dark:text-gray-300">{category.category}</span>
//                 </div>
//                 <span className="text-sm text-gray-500 dark:text-gray-400">
//                   {category.tasks} task{category.tasks !== 1 ? 's' : ''}
//                 </span>
//               </div>
//               <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
//                 <div 
//                   className="h-2 rounded-full" 
//                   style={{ 
//                     width: `${(category.tasks / totalTasks) * 100}%`,
//                     backgroundColor: category.color
//                   }}
//                 ></div>
//               </div>
//               <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
//                 <span>{category.completed} completed</span>
//                 <span>{Math.round((category.tasks / totalTasks) * 100)}% of total</span>
//               </div>
//             </div>
//           ))}
//         </div>
//       ) : (
//         <div className="text-center py-8 text-gray-500 dark:text-gray-400">
//           <Tag className="h-12 w-12 mx-auto text-gray-300 dark:text-gray-600 mb-2" />
//           <p>No category data available. Start creating tasks to see statistics.</p>
//         </div>
//       )}
//     </div>
//   );
// };

// export default CategoryStats;