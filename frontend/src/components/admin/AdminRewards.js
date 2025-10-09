import React, { useState, useEffect } from 'react';
import axios from '../../services/axios';
import { toast } from 'react-toastify';

const AdminRewards = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState('');
  const [points, setPoints] = useState(10);
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const response = await axios.get('/api/admin/users');
        setUsers(response.data);
      } catch (error) {
        console.error('Error fetching users:', error);
        toast.error('Failed to load users');
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedUser) {
      toast.error('Please select a user');
      return;
    }

    if (!points || points <= 0) {
      toast.error('Please enter a valid number of points');
      return;
    }

    if (!reason.trim()) {
      toast.error('Please provide a reason for awarding points');
      return;
    }

    try {
      setSubmitting(true);
      console.log('Sending reward points to:', selectedUser, points, reason.trim());
      const response = await axios.post('/api/rewards/award', {
        user_id: selectedUser,
        points: parseInt(points),
        reason: reason.trim()
      });

      console.log('Reward response:', response.data);
      toast.success(`Successfully awarded ${points} points`);
      setSelectedUser('');
      setPoints(10);
      setReason('');
    } catch (error) {
      console.error('Error awarding points:', error);
      toast.error(error.response?.data?.error || 'Failed to award points');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="card p-6">
      <h2 className="text-xl font-semibold mb-6">Award Reward Points</h2>

      {loading ? (
        <div className="flex justify-center py-4">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-600"></div>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="user" className="block text-sm font-medium text-gray-700 mb-1">
              Select User
            </label>
            <select
              id="user"
              className="form-select w-full"
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              required
            >
              <option value="" key="default-option">-- Select a user --</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name} ({user.email})
                </option>
              ))}
            </select>
          </div>

          <div className="mb-4">
            <label htmlFor="points" className="block text-sm font-medium text-gray-700 mb-1">
              Points to Award
            </label>
            <input
              type="number"
              id="points"
              className="form-input w-full"
              min="1"
              max="100"
              value={points}
              onChange={(e) => setPoints(e.target.value)}
              required
            />
          </div>

          <div className="mb-6">
            <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-1">
              Reason
            </label>
            <textarea
              id="reason"
              className="form-textarea w-full"
              rows="3"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Why are you awarding these points?"
              required
            ></textarea>
          </div>

          <button
            type="submit"
            className="btn-primary w-full"
            disabled={submitting}
          >
            {submitting ? (
              <>
                <span className="animate-spin inline-block h-4 w-4 mr-2 border-t-2 border-b-2 border-white rounded-full"></span>
                Awarding Points...
              </>
            ) : (
              'Award Points'
            )}
          </button>
        </form>
      )}
    </div>
  );
};

export default AdminRewards;