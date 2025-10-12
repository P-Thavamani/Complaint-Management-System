import React, { useState } from 'react';
import AdminRewards from '../components/admin/AdminRewards';
import RewardsLeaderboard from '../components/rewards/RewardsLeaderboard';
import RewardLevelManager from '../components/admin/RewardLevelManager';

const AdminRewardsPage = () => {
  const [activeTab, setActiveTab] = useState('award');

  const tabs = [
    { id: 'award', label: 'Award Points', icon: '🎁' },
    { id: 'levels', label: 'Manage Levels', icon: '🏆' },
    { id: 'leaderboard', label: 'Leaderboard', icon: '📊' }
  ];

  return (
    <div className="py-6">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Rewards Management</h1>
      
      {/* Tab Navigation */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {activeTab === 'award' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <AdminRewards />
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Quick Stats</h2>
              <RewardsLeaderboard />
            </div>
          </div>
        )}
        
        {activeTab === 'levels' && <RewardLevelManager />}
        
        {activeTab === 'leaderboard' && (
          <div className="bg-white rounded-lg shadow p-6">
            <RewardsLeaderboard showFullLeaderboard={true} />
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminRewardsPage;