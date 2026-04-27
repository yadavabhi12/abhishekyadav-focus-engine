// FocusStats.jsx
import React from 'react';
import { BarChart3, Clock, Target, TrendingUp } from 'lucide-react';

const FocusStats = ({ user }) => {
  // Mock weekly focus data (would come from backend in real app)
  const weeklyData = [
    { day: 'Mon', hours: 3.5 },
    { day: 'Tue', hours: 4.2 },
    { day: 'Wed', hours: 2.8 },
    { day: 'Thu', hours: 5.1 },
    { day: 'Fri', hours: 3.7 },
    { day: 'Sat', hours: 1.5 },
    { day: 'Sun', hours: 2.0 },
  ];

  const maxHours = Math.max(...weeklyData.map(d => d.hours));

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow">
      <h2 className="text-lg font-semibold mb-4 flex items-center">
        <BarChart3 className="h-5 w-5 mr-2" />
        Focus Statistics
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
          <div className="flex items-center mb-2">
            <Clock className="h-5 w-5 text-blue-500 mr-2" />
            <span className="text-sm font-medium dark:text-gray-300">Total Focus Hours</span>
          </div>
          <div className="text-2xl font-bold dark:text-gray-300">{user.stats?.totalFocusHours || 0}</div>
        </div>
        
        <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
          <div className="flex items-center mb-2">
            <Target className="h-5 w-5 text-green-500 mr-2" />
            <span className="text-sm font-medium dark:text-gray-300">Weekly Goal</span>
          </div>
          <div className="text-2xl font-bold dark:text-gray-300">{user.stats?.weeklyGoal || 20} hrs</div>
        </div>
        
        <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
          <div className="flex items-center mb-2">
            <TrendingUp className="h-5 w-5 text-purple-500 mr-2" />
            <span className="text-sm font-medium dark:text-gray-300">Productivity Score</span>
          </div>
          <div className="text-2xl font-bold dark:text-gray-300">{user.stats?.productivityScore || 0}%</div>
        </div>
      </div>
      
      <h3 className="text-md font-medium mb-4 dark:text-gray-300">Weekly Focus Hours</h3>
      <div className="flex items-end justify-between h-40">
        {weeklyData.map((day, index) => (
          <div key={index} className="flex flex-col items-center">
            <div 
              className="w-8 bg-indigo-500 rounded-t transition-all duration-300 hover:bg-indigo-600"
              style={{ height: `${(day.hours / maxHours) * 100}%` }}
            ></div>
            <span className="text-xs mt-2 dark:text-gray-300">{day.day}</span>
            <span className="text-xs text-gray-500 dark:text-gray-400">{day.hours}h</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FocusStats;