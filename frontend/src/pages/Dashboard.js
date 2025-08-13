import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
<<<<<<< HEAD
import axios from '../services/axios';
import { toast } from 'react-toastify';
import { AuthContext } from '../context/AuthContext';
import RewardsDisplay from '../components/rewards/RewardsDisplay';
import RewardHistory from '../components/rewards/RewardHistory';
import RewardsLeaderboard from '../components/rewards/RewardsLeaderboard';
import FeedbackForm from '../components/feedback/FeedbackForm';
=======
import axios from 'axios';
import { toast } from 'react-toastify';
import { AuthContext } from '../context/AuthContext';
>>>>>>> ff5d7d2ee5773ae90cf8a051ccc6605ddc57581a

// Components
import Chatbot from '../components/chatbot/Chatbot';
import ComplaintList from '../components/complaints/ComplaintList';
import ComplaintStats from '../components/complaints/ComplaintStats';

const Dashboard = () => {
  const { user } = useContext(AuthContext);
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    inProgress: 0,
    resolved: 0
  });
  const [chatbotOpen, setChatbotOpen] = useState(false);
<<<<<<< HEAD
  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);
=======
>>>>>>> ff5d7d2ee5773ae90cf8a051ccc6605ddc57581a

  // Fetch user complaints
  useEffect(() => {
    const fetchComplaints = async () => {
      try {
        const response = await axios.get('/api/complaints/user');
        setComplaints(response.data);
        
        // Calculate stats
        const total = response.data.length;
        const pending = response.data.filter(c => c.status === 'pending').length;
        const inProgress = response.data.filter(c => c.status === 'in-progress').length;
        const resolved = response.data.filter(c => c.status === 'resolved').length;
        
        setStats({ total, pending, inProgress, resolved });
      } catch (error) {
        console.error('Error fetching complaints:', error);
        toast.error('Failed to load complaints. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchComplaints();
  }, []);

  const toggleChatbot = () => {
    setChatbotOpen(!chatbotOpen);
  };

<<<<<<< HEAD
  const handleFeedbackSubmitted = () => {
    // Refresh rewards display after feedback submission
    // This will be handled by the RewardsDisplay component's useEffect
  };

=======
>>>>>>> ff5d7d2ee5773ae90cf8a051ccc6605ddc57581a
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
<<<<<<< HEAD
        <div className="flex space-x-3">
          <button 
            onClick={() => setFeedbackModalOpen(true)}
            className="btn-outline flex items-center"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            Feedback
          </button>
          <button 
            onClick={toggleChatbot}
            className="btn-primary flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
            </svg>
            {chatbotOpen ? 'Close Chatbot' : 'Open Chatbot'}
          </button>
        </div>
=======
        <button 
          onClick={toggleChatbot}
          className="btn-primary flex items-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
          </svg>
          {chatbotOpen ? 'Close Chatbot' : 'Open Chatbot'}
        </button>
>>>>>>> ff5d7d2ee5773ae90cf8a051ccc6605ddc57581a
      </div>

      {/* Stats Cards */}
      <ComplaintStats stats={stats} />

<<<<<<< HEAD
      {/* Rewards Section */}
      <div className="mb-8">
        <RewardsDisplay />
      </div>

=======
>>>>>>> ff5d7d2ee5773ae90cf8a051ccc6605ddc57581a
      {/* Complaints List */}
      <div className="mt-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Your Complaints</h2>
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
          </div>
        ) : complaints.length > 0 ? (
          <ComplaintList complaints={complaints} />
        ) : (
          <div className="card text-center py-8">
            <p className="text-gray-500 mb-4">You haven't submitted any complaints yet.</p>
            <button 
              onClick={toggleChatbot}
              className="btn-primary inline-flex items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
              </svg>
              Submit a Complaint
            </button>
          </div>
        )}
      </div>

<<<<<<< HEAD
      {/* Reward History and Leaderboard */}
      <div className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <RewardHistory />
        </div>
        <div>
          <RewardsLeaderboard />
        </div>
      </div>

      {/* Feedback Modal */}
      {feedbackModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <FeedbackForm 
            onClose={() => setFeedbackModalOpen(false)}
            onFeedbackSubmitted={handleFeedbackSubmitted}
          />
        </div>
      )}

=======
>>>>>>> ff5d7d2ee5773ae90cf8a051ccc6605ddc57581a
      {/* Chatbot */}
      {chatbotOpen && (
        <div className="fixed bottom-4 right-4 z-50">
          <Chatbot onClose={toggleChatbot} />
        </div>
      )}

      {/* Floating Chatbot Button (when closed) */}
      {!chatbotOpen && (
        <button 
          onClick={toggleChatbot}
          className="fixed bottom-4 right-4 bg-primary-600 text-white rounded-full p-4 shadow-lg hover:bg-primary-700 transition-colors duration-200 z-50"
          aria-label="Open Chatbot"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
        </button>
      )}
    </div>
  );
};

export default Dashboard;