import React from 'react';
import AdminRewards from '../components/admin/AdminRewards';
import RewardsLeaderboard from '../components/rewards/RewardsLeaderboard';

const AdminRewardsPage = () => {
  return (
    <div className="py-6">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Rewards Management</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Award Points Form */}
        <div>
          <AdminRewards />
        </div>
        
        {/* Rewards Leaderboard */}
        <div>
          <RewardsLeaderboard />
        </div>
      </div>
    </div>
  );
};

export default AdminRewardsPage;