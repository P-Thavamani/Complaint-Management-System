import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from '../services/axios';
import { toast } from 'react-toastify';
// import { AuthContext } from '../context/AuthContext';
import RewardsDisplay from '../components/rewards/RewardsDisplay';
import RewardsLeaderboard from '../components/rewards/RewardsLeaderboard';
import ComplaintList from '../components/complaints/ComplaintList';
import ComplaintStats from '../components/complaints/ComplaintStats';

const WorkerDashboard = () => {
    const [complaints, setComplaints] = useState([]);
    const [stats, setStats] = useState({});
    const [loading, setLoading] = useState(true);
    // const { user } = useContext(AuthContext);

    useEffect(() => {
        fetchComplaints();
        fetchStats();
    }, []);

    const fetchComplaints = async () => {
        try {
            const response = await axios.get('/api/complaints/worker');
            setComplaints(response.data);
        } catch (error) {
            console.error('Error fetching complaints:', error);
            toast.error('Failed to fetch complaints');
        }
    };

    const fetchStats = async () => {
        try {
            const response = await axios.get('/api/complaints/worker/stats');
            setStats(response.data);
        } catch (error) {
            console.error('Error fetching stats:', error);
            toast.error('Failed to fetch statistics');
        } finally {
            setLoading(false);
        }
    };

    const handleClaimTicket = async (complaintId) => {
        try {
            await axios.post(`/api/complaints/${complaintId}/claim`);
            toast.success('Ticket claimed successfully');
            fetchComplaints();
            fetchStats();
        } catch (error) {
            console.error('Error claiming ticket:', error);
            toast.error('Failed to claim ticket');
        }
    };

    const handleEscalateTicket = async (complaintId, reason) => {
        try {
            await axios.post(`/api/complaints/${complaintId}/escalate`, { reason });
            toast.success('Ticket escalated successfully');
            fetchComplaints();
            fetchStats();
        } catch (error) {
            console.error('Error escalating ticket:', error);
            toast.error('Failed to escalate ticket');
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-900">Worker Dashboard</h1>
                <Link
                    to="/complaint/new"
                    className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 transition-colors"
                >
                    New Complaint
                </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <ComplaintStats stats={stats} />
                <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-xl font-semibold mb-4">Your Performance</h2>
                    <RewardsDisplay />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <div className="bg-white rounded-lg shadow">
                        <div className="p-6">
                            <h2 className="text-xl font-semibold mb-4">Available Tickets</h2>
                            <ComplaintList
                                complaints={complaints}
                                onClaimTicket={handleClaimTicket}
                                onEscalateTicket={handleEscalateTicket}
                                showActions={true}
                            />
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-xl font-semibold mb-4">Worker Leaderboard</h2>
                    <RewardsLeaderboard workerOnly={true} />
                </div>
            </div>
        </div>
    );
};

export default WorkerDashboard;