// src/pages/FocusMode.jsx
import React from 'react';
import FocusTimer from '../components/focus/FocusTimer'; // ✅ Fixed import
import { Target, Zap, TrendingUp, Award } from 'lucide-react';

const FocusMode = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
          Deep Focus Zone
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          Enter a state of flow with our enhanced focus timer. Track your productivity, minimize distractions, and achieve more.
        </p>
      </div>

      {/* Main Timer */}
      <div className="bg-gradient-to-br from-white to-blue-50 dark:from-gray-800 dark:to-gray-900 rounded-3xl p-8 shadow-2xl border border-blue-100 dark:border-gray-700">
        <FocusTimer /> {/* ✅ Using default export */}
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-6 rounded-2xl border border-blue-100 dark:border-blue-800/30">
          <div className="flex items-center justify-center w-12 h-12 bg-blue-100 dark:bg-blue-900/40 rounded-lg mb-4">
            <Target className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Smart Task Integration
          </h3>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            Connect focus sessions to specific tasks. Time spent is automatically tracked and added to your task analytics.
          </p>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 p-6 rounded-2xl border border-green-100 dark:border-green-800/30">
          <div className="flex items-center justify-center w-12 h-12 bg-green-100 dark:bg-green-900/40 rounded-lg mb-4">
            <TrendingUp className="h-6 w-6 text-green-600 dark:text-green-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Progress Tracking
          </h3>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            Monitor your focus patterns with detailed statistics. See daily and weekly progress toward your goals.
          </p>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 p-6 rounded-2xl border border-purple-100 dark:border-purple-800/30">
          <div className="flex items-center justify-center w-12 h-12 bg-purple-100 dark:bg-purple-900/40 rounded-lg mb-4">
            <Award className="h-6 w-6 text-purple-600 dark:text-purple-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Achievement System
          </h3>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            Earn badges and achievements for consistent focus sessions and reaching your productivity goals.
          </p>
        </div>
      </div>

      {/* Pomodoro Guide */}
      <div className="bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 p-8 rounded-2xl border border-orange-100 dark:border-orange-800/30">
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
          <Zap className="h-6 w-6 mr-3 text-orange-600 dark:text-orange-400" />
          Mastering the Pomodoro Technique
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            {/* Step 1 */}
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-8 h-8 bg-orange-100 dark:bg-orange-900/40 rounded-full flex items-center justify-center">
                <span className="text-orange-600 dark:text-orange-400 font-bold">1</span>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white">Choose a Task</h4>
                <p className="text-gray-600 dark:text-gray-400 text-sm">Select one specific task to focus on</p>
              </div>
            </div>
            {/* Step 2 */}
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-8 h-8 bg-orange-100 dark:bg-orange-900/40 rounded-full flex items-center justify-center">
                <span className="text-orange-600 dark:text-orange-400 font-bold">2</span>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white">Set Timer</h4>
                <p className="text-gray-600 dark:text-gray-400 text-sm">25 minutes for work, 5 minutes for breaks</p>
              </div>
            </div>
            {/* Step 3 */}
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-8 h-8 bg-orange-100 dark:bg-orange-900/40 rounded-full flex items-center justify-center">
                <span className="text-orange-600 dark:text-orange-400 font-bold">3</span>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white">Work Intently</h4>
                <p className="text-gray-600 dark:text-gray-400 text-sm">Focus solely on your task until the timer rings</p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {/* Step 4 */}
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-8 h-8 bg-orange-100 dark:bg-orange-900/40 rounded-full flex items-center justify-center">
                <span className="text-orange-600 dark:text-orange-400 font-bold">4</span>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white">Take a Break</h4>
                <p className="text-gray-600 dark:text-gray-400 text-sm">Step away completely for 5 minutes</p>
              </div>
            </div>
            {/* Step 5 */}
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-8 h-8 bg-orange-100 dark:bg-orange-900/40 rounded-full flex items-center justify-center">
                <span className="text-orange-600 dark:text-orange-400 font-bold">5</span>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white">Repeat</h4>
                <p className="text-gray-600 dark:text-gray-400 text-sm">After 4 sessions, take a longer 15-30 minute break</p>
              </div>
            </div>
            {/* Step 6 */}
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-8 h-8 bg-orange-100 dark:bg-orange-900/40 rounded-full flex items-center justify-center">
                <span className="text-orange-600 dark:text-orange-400 font-bold">6</span>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white">Track Progress</h4>
                <p className="text-gray-600 dark:text-gray-400 text-sm">Monitor your focus time and improvements</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FocusMode;









