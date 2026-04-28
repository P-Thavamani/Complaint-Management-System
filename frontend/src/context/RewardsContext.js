import { createContext, useContext, useState, useEffect } from 'react';
import axios from '../services/axios';
import { toast } from 'react-toastify';
import { AuthContext } from './AuthContext';

const RewardsContext = createContext({
  rewardData: null,
  leaderboard: null,
  loading: true,
  error: null,
  refetchRewards: () => {},
  refetchLeaderboard: () => {}
});

export const RewardsProvider = ({ children }) => {
  const [rewardData, setRewardData] = useState(null);
  const [leaderboard, setLeaderboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useContext(AuthContext);

  const fetchRewards = async () => {
    if (!user) return;
    
    try {
      const response = await axios.get('/api/rewards/user');
      setRewardData(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching reward data:', err);
      setError('Failed to load reward data');
      toast.error('Failed to load reward data');
    }
  };

  const fetchLeaderboard = async () => {
    if (!user) return;
    
    try {
      const response = await axios.get('/api/rewards/leaderboard');
      setLeaderboard(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching leaderboard:', err);
      setError('Failed to load leaderboard');
      toast.error('Failed to load leaderboard');
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      setLoading(true);
      await Promise.all([fetchRewards(), fetchLeaderboard()]);
      setLoading(false);
    };

    fetchData();
  }, [user]);

  const refetchRewards = () => {
    fetchRewards();
  };

  const refetchLeaderboard = () => {
    fetchLeaderboard();
  };

  return (
    <RewardsContext.Provider value={{
      rewardData,
      leaderboard,
      loading,
      error,
      refetchRewards,
      refetchLeaderboard
    }}>
      {children}
    </RewardsContext.Provider>
  );
};

export const useRewards = () => {
  const context = useContext(RewardsContext);
  if (!context) {
    throw new Error('useRewards must be used within a RewardsProvider');
  }
  return context;
};

export default RewardsContext;