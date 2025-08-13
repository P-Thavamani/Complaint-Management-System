import React, { useState, useEffect } from 'react';
import axios from '../../services/axios';
import { toast } from 'react-toastify';

const RewardHistory = () => {
  const [rewards, setRewards] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRewardHistory = async () => {
      try {
        const response = await axios.get('/api/rewards/user');
        setRewards(response.data.rewards || []);
      } catch (error) {
        console.error('Error fetching reward history:', error);
        toast.error('Failed to load reward history');
      } finally {
        setLoading(false);
      }
    };

    fetchRewardHistory();
  }, []);

  // Format date
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  if (loading) {
    return (
      <div className="animate-pulse bg-white rounded-lg shadow-md p-4">
        <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
        {[1, 2, 3].map((i) => (
          <div key={i} className="mb-3">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    );
  }

  if (rewards.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Reward History</h2>
        <p className="text-gray-500 text-center py-4">No reward history yet. Start earning points!</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Reward History</h2>
      
      <div className="space-y-4">
        {rewards.map((reward) => (
          <div key={reward.id} className="border-b border-gray-100 pb-3 last:border-0">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-medium text-gray-800">{reward.description}</h3>
                <p className="text-sm text-gray-500">{formatDate(reward.timestamp)}</p>
              </div>
              <div className="flex items-center text-yellow-500 font-bold">
                +{reward.points}
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              </div>
            </div>
            {reward.complaint_id && (
              <div className="mt-1">
                <a 
                  href={`/complaint/${reward.complaint_id}`} 
                  className="text-xs text-primary-600 hover:text-primary-700"
                >
                  View related complaint
                </a>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default RewardHistory;