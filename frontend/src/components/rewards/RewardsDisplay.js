import React, { useState, useEffect } from 'react';
import axios from '../../services/axios';
import { toast } from 'react-toastify';

const RewardsDisplay = () => {
  const [rewardInfo, setRewardInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRewardInfo = async () => {
      try {
        const response = await axios.get('/api/rewards/user');
        setRewardInfo(response.data);
      } catch (error) {
        console.error('Error fetching reward information:', error);
        toast.error('Failed to load reward information');
      } finally {
        setLoading(false);
      }
    };

    fetchRewardInfo();
  }, []);

  if (loading) {
    return (
      <div className="animate-pulse bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
        <div className="h-8 bg-gray-200 rounded w-1/2 mb-4"></div>
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
      </div>
    );
  }

  if (!rewardInfo) {
    return null;
  }

  const { total_points, current_level, next_level, points_to_next_level } = rewardInfo;

  // Calculate progress percentage
  const calculateProgress = () => {
    if (!next_level) return 100; // Already at max level
    
    const levelRange = next_level.min_points - current_level.min_points;
    const userProgress = total_points - current_level.min_points;
    return Math.min(Math.round((userProgress / levelRange) * 100), 100);
  };

  const progressPercentage = calculateProgress();

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-800">Your Rewards</h2>
        <div className="flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-500 mr-1" viewBox="0 0 20 20" fill="currentColor">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
          <span className="text-2xl font-bold text-yellow-500">{total_points}</span>
        </div>
      </div>

      <div className="mb-4">
        <div className="flex justify-between mb-1">
          <span className="text-sm font-medium text-gray-700">Level: {current_level?.level}</span>
          {next_level && (
            <span className="text-sm font-medium text-gray-500">{points_to_next_level} points to {next_level.level}</span>
          )}
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div 
            className="bg-primary-600 h-2.5 rounded-full" 
            style={{ width: `${progressPercentage}%` }}
          ></div>
        </div>
      </div>

      <div className="mt-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-2">Current Benefits:</h3>
        <ul className="list-disc list-inside text-sm text-gray-600">
          {current_level?.benefits.map((benefit, index) => (
            <li key={index}>{benefit}</li>
          ))}
        </ul>
      </div>

      {next_level && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Next Level Benefits:</h3>
          <ul className="list-disc list-inside text-sm text-gray-600">
            {next_level.benefits.map((benefit, index) => (
              <li key={index} className={current_level.benefits.includes(benefit) ? '' : 'text-primary-600 font-medium'}>
                {benefit} {!current_level.benefits.includes(benefit) && '(New)'}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default RewardsDisplay;