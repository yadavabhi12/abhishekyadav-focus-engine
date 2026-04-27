// AchievementCard.jsx (Fixed key prop issue)
import React from 'react';
import { Award, Star, Calendar } from 'lucide-react';

const AchievementCard = ({ achievement }) => {
  return (
    <div className="border rounded-lg p-4 hover:shadow-md transition-shadow dark:border-gray-700 dark:bg-gray-800">
      <div className="flex items-start mb-3">
        <div className="bg-yellow-100 dark:bg-yellow-900/20 p-2 rounded-full mr-3">
          <Award className="h-6 w-6 text-yellow-600 dark:text-yellow-500" />
        </div>
        <div>
          <h3 className="font-semibold dark:text-gray-300">{achievement.name}</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">{achievement.description}</p>
        </div>
      </div>
      <div className="flex justify-between items-center text-sm">
        {achievement.unlockedAt && (
          <span className="flex items-center text-gray-500 dark:text-gray-400">
            <Calendar className="h-4 w-4 mr-1" />
            {new Date(achievement.unlockedAt).toLocaleDateString()}
          </span>
        )}
        {achievement.points && (
          <span className="flex items-center text-yellow-600 dark:text-yellow-500">
            <Star className="h-4 w-4 mr-1 fill-current" />
            {achievement.points}
          </span>
        )}
      </div>
    </div>
  );
};

export default AchievementCard;