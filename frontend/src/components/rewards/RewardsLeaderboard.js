import React, { useState, useEffect } from 'react';
import axios from '../../services/axios';
import { toast } from 'react-toastify';

const RewardsLeaderboard = () => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        setLoading(true);
        const response = await axios.get('/api/rewards/leaderboard');
        setLeaderboard(response.data);
        setError(null);
      } catch (err) {
        console.error('Error fetching leaderboard:', err);
        setError('Failed to load leaderboard. Please try again.');
        toast.error('Failed to load leaderboard');
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, []);

  // Function to get badge color based on rank
  const getRankBadgeColor = (rank) => {
    switch (rank) {
      case 1:
        return 'bg-yellow-500'; // Gold
      case 2:
        return 'bg-gray-300'; // Silver
      case 3:
        return 'bg-amber-600'; // Bronze
      default:
        return 'bg-gray-200'; // Default
    }
  };

  // Function to get level badge color
  const getLevelBadgeColor = (level) => {
    switch (level) {
      case 'Platinum':
        return 'bg-purple-600 text-white';
      case 'Gold':
        return 'bg-yellow-500 text-white';
      case 'Silver':
        return 'bg-gray-400 text-white';
      case 'Bronze':
        return 'bg-amber-600 text-white';
      default:
        return 'bg-gray-200 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="card p-4 animate-pulse">
        <h2 className="text-xl font-semibold mb-4">Rewards Leaderboard</h2>
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center p-2 rounded-lg bg-gray-100">
              <div className="w-8 h-8 rounded-full bg-gray-300 mr-3"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-300 rounded w-1/3 mb-2"></div>
                <div className="h-3 bg-gray-300 rounded w-1/4"></div>
              </div>
              <div className="h-6 bg-gray-300 rounded w-16"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card p-4">
        <h2 className="text-xl font-semibold mb-4">Rewards Leaderboard</h2>
        <div className="text-center py-4 text-red-500">{error}</div>
      </div>
    );
  }

  return (
    <div className="card p-4">
      <h2 className="text-xl font-semibold mb-4">Rewards Leaderboard</h2>
      
      {leaderboard.length === 0 ? (
        <div className="text-center py-4 text-gray-500">No users on the leaderboard yet.</div>
      ) : (
        <div className="space-y-2">
          {leaderboard.map((user) => (
            <div key={user.id} className="flex items-center p-3 rounded-lg hover:bg-gray-50 transition-colors duration-150">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${getRankBadgeColor(user.rank)} mr-3`}>
                {user.rank}
              </div>
              <div className="flex-1">
                <div className="font-medium">{user.name}</div>
                <div className="text-sm text-gray-500">{user.email}</div>
              </div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-primary-600">{user.points} pts</span>
                <span className={`text-xs px-2 py-1 rounded-full ${getLevelBadgeColor(user.level)}`}>
                  {user.level}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RewardsLeaderboard;