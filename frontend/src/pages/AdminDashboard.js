import React, { useState, useEffect } from 'react';
import axios from '../services/axios';
import { toast } from 'react-toastify';
import { Link } from 'react-router-dom';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(ArcElement, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

// Feedback Management Component
const FeedbackManagement = () => {
	const [feedback, setFeedback] = useState([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const fetchFeedback = async () => {
			try {
				const response = await axios.get('/api/feedback/admin');
				setFeedback(response.data);
			} catch (error) {
				console.error('Error fetching feedback:', error);
				toast.error('Failed to load feedback');
			} finally {
				setLoading(false);
			}
		};
		fetchFeedback();
	}, []);

	const formatDate = dateString => {
		const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
		return new Date(dateString).toLocaleDateString(undefined, options);
	};

	const getTypeBadgeClass = type => {
		switch (type) {
			case 'bug':
				return 'bg-red-100 text-red-800';
			case 'feature':
				return 'bg-blue-100 text-blue-800';
			case 'complaint':
				return 'bg-orange-100 text-orange-800';
			default:
				return 'bg-gray-100 text-gray-800';
		}
	};

	if (loading) {
		return (
			<div className="bg-white rounded-lg shadow-md p-6">
				<h2 className="text-lg font-semibold mb-4">Recent Feedback</h2>
				<div className="animate-pulse space-y-4">
					{[...Array(3)].map((_, i) => (
						<div key={i} className="border rounded-lg p-4">
							<div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
							<div className="h-3 bg-gray-200 rounded w-3/4 mb-2"></div>
							<div className="h-3 bg-gray-200 rounded w-1/2"></div>
						</div>
					))}
				</div>
			</div>
		);
	}

	return (
		<div className="bg-white rounded-lg shadow-md p-6">
			<h2 className="text-lg font-semibold mb-4">Recent Feedback</h2>
			{feedback.length === 0 ? (
				<p className="text-gray-500 text-center py-4">No feedback submitted yet.</p>
			) : (
				<div className="space-y-4">
					{feedback.slice(0, 5).map(item => (
						<div key={item.id} className="border rounded-lg p-4 hover:bg-gray-50">
							<div className="flex justify-between items-start mb-2">
								<div className="flex items-center space-x-2">
									<span className={`px-2 py-1 text-xs font-semibold rounded-full ${getTypeBadgeClass(item.type)}`}>
										{item.type ? item.type.charAt(0).toUpperCase() + item.type.slice(1) : 'General'}
									</span>
									{item.rating && (
										<div className="flex items-center">
											{[...Array(5)].map((_, i) => (
												<svg key={i} className={`w-4 h-4 ${i < item.rating ? 'text-yellow-400' : 'text-gray-300'}`} fill="currentColor" viewBox="0 0 20 20">
													<path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
												</svg>
											))}
										</div>
									)}
								</div>
								<span className="text-sm text-gray-500">{formatDate(item.createdAt)}</span>
							</div>
							<p className="text-sm text-gray-700 mb-2">{item.comment || 'No comment provided'}</p>
							<div className="text-xs text-gray-500">From: {item.user_name || 'Unknown'} {item.user_email ? `(${item.user_email})` : ''}</div>
						</div>
					))}
				</div>
			)}
		</div>
	);
};

const AdminDashboard = () => {
	// Delete complaint
	const handleDeleteComplaint = async complaintId => {
		if (window.confirm('Are you sure you want to delete this complaint?')) {
			try {
				await axios.delete(`/api/admin/complaints/${complaintId}`);
				toast.success('Complaint deleted successfully!');
				const complaintsResponse = await axios.get('/api/admin/complaints');
				setComplaints(complaintsResponse.data);
			} catch (error) {
				console.error('Error deleting complaint:', error);
				toast.error('Failed to delete complaint');
			}
		}
	};

	const [complaints, setComplaints] = useState([]);
	const [stats, setStats] = useState({ total: 0, pending: 0, inProgress: 0, resolved: 0, escalated: 0, userCount: 0, avgResolutionTime: 0 });
	const [categoryStats, setCategoryStats] = useState({});
	// const [timelineStats, setTimelineStats] = useState([]);
	const [loading, setLoading] = useState(true);
	const [escalationLoading, setEscalationLoading] = useState(false);
	// const [showEscalationModal, setShowEscalationModal] = useState(false);
	// const [escalatedComplaints, setEscalatedComplaints] = useState([]);
	const [searchTerm, setSearchTerm] = useState('');
	const [filterStatus, setFilterStatus] = useState('all');
	const [filterPriority, setFilterPriority] = useState('all');
	const [sortBy, setSortBy] = useState('createdAt');
	const [sortOrder, setSortOrder] = useState('desc');

	useEffect(() => {
		const fetchData = async () => {
			try {
				const complaintsResponse = await axios.get('/api/admin/complaints');
				setComplaints(complaintsResponse.data);
				const statsResponse = await axios.get('/api/admin/stats');
				setStats({ ...statsResponse.data.statusCounts, userCount: statsResponse.data.userCount, avgResolutionTime: statsResponse.data.avgResolutionTime });
				setCategoryStats(statsResponse.data.categoryCounts);
				// setTimelineStats(statsResponse.data.timeline);
			} catch (error) {
				console.error('Error fetching admin data:', error);
				toast.error('Failed to load admin dashboard data');
			} finally {
				setLoading(false);
			}
		};
		fetchData();
	}, []);

	// Manual escalation check
	const handleEscalationCheck = async () => {
		setEscalationLoading(true);
		try {
			// Use the correct endpoint from the backend
			const response = await axios.get('/api/complaint_updates/check-escalations');
			toast.success(response.data.message || 'Escalation check completed');
			const complaintsResponse = await axios.get('/api/admin/complaints');
			setComplaints(complaintsResponse.data);
			const statsResponse = await axios.get('/api/admin/stats');
			setStats({ ...statsResponse.data.statusCounts, userCount: statsResponse.data.userCount, avgResolutionTime: statsResponse.data.avgResolutionTime });
			setCategoryStats(statsResponse.data.categoryCounts);
			// setTimelineStats(statsResponse.data.timeline);
			// if (response.data.escalated_complaints && response.data.escalated_complaints.length > 0) {
			// 	setEscalatedComplaints(response.data.escalated_complaints);
			// 	setShowEscalationModal(true);
			// }
		} catch (error) {
			console.error('Error during escalation check:', error);
			if (error.response) {
				// Server responded with error status
				toast.error(`Server error: ${error.response.data?.message || error.response.statusText}`);
			} else if (error.request) {
				// Request was made but no response received
				toast.error('No response from server. Please check if the backend is running.');
			} else {
				// Something else happened
				toast.error(`Request error: ${error.message}`);
			}
		} finally {
			setEscalationLoading(false);
		}
	};

	// const closeEscalationModal = () => setShowEscalationModal(false);

	// Filter/sort
	const filteredComplaints = complaints
		.filter(complaint => {
			const matchesSearch =
				searchTerm === '' ||
				complaint._id.toLowerCase().includes(searchTerm.toLowerCase()) ||
				complaint.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
				complaint.user?.name.toLowerCase().includes(searchTerm.toLowerCase());
			const matchesStatus = filterStatus === 'all' || complaint.status === filterStatus;
			const matchesPriority = filterPriority === 'all' || complaint.priority === filterPriority;
			return matchesSearch && matchesStatus && matchesPriority;
		})
		.sort((a, b) => {
			if (sortBy === 'createdAt') {
				return sortOrder === 'desc' ? new Date(b.createdAt) - new Date(a.createdAt) : new Date(a.createdAt) - new Date(b.createdAt);
			} else if (sortBy === 'priority') {
				const priorityOrder = { high: 3, medium: 2, low: 1 };
				return sortOrder === 'desc' ? priorityOrder[b.priority] - priorityOrder[a.priority] : priorityOrder[a.priority] - priorityOrder[b.priority];
			}
			return 0;
		});

	const formatDate = dateString => new Date(dateString).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
	const getStatusBadgeClass = status => (status === 'pending' ? 'bg-yellow-100 text-yellow-800' : status === 'in-progress' ? 'bg-blue-100 text-blue-800' : status === 'resolved' ? 'bg-green-100 text-green-800' : status === 'escalated' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800');
	const getPriorityBadgeClass = priority => (priority === 'high' ? 'bg-red-100 text-red-800' : priority === 'medium' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800');

	const statusChartData = {
		labels: ['Pending', 'In Progress', 'Resolved', 'Escalated'],
		datasets: [
			{
				data: [stats.pending, stats.inProgress, stats.resolved, stats.escalated],
				backgroundColor: ['rgba(255, 206, 86, 0.6)', 'rgba(54, 162, 235, 0.6)', 'rgba(75, 192, 192, 0.6)', 'rgba(255, 99, 132, 0.6)'],
				borderColor: ['rgba(255, 206, 86, 1)', 'rgba(54, 162, 235, 1)', 'rgba(75, 192, 192, 1)', 'rgba(255, 99, 132, 1)'],
				borderWidth: 1
			}
		]
	};

	const categoryChartData = {
		labels: Object.keys(categoryStats),
		datasets: [
			{ label: 'Complaints by Category', data: Object.values(categoryStats), backgroundColor: 'rgba(153, 102, 255, 0.6)', borderColor: 'rgba(153, 102, 255, 1)', borderWidth: 1 }
		]
	};

	// const timelineChartData = {
	// 	labels: timelineStats.map(item => item.date),
	// 	datasets: [
	// 		{ label: 'New Complaints', data: timelineStats.map(item => item.count), backgroundColor: 'rgba(75, 192, 192, 0.6)', borderColor: 'rgba(75, 192, 192, 1)', borderWidth: 1 }
	// 	]
	// };

	// const timelineOptions = { responsive: true, plugins: { legend: { position: 'top' }, title: { display: true, text: 'Complaints Over Time' } } };

	if (loading) {
		return (
			<div className="flex justify-center py-12">
				<div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
			</div>
		);
	}

	return (
		<div className="py-6">
			<div className="flex justify-between items-center mb-6">
				<h1 className="text-3xl font-bold text-gray-800">Admin Dashboard</h1>
				<div className="flex space-x-4">
					<Link to="/admin/rewards" className="btn-primary flex items-center">
						<svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
						</svg>
						Manage Rewards
					</Link>
				</div>
			</div>

			{/* Stats Cards */}
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-4 mb-8">
				<div className="bg-white rounded-lg shadow-md p-4"><h2 className="text-sm font-medium text-gray-500">Total Complaints</h2><p className="text-3xl font-bold text-gray-800 mt-2">{stats.total}</p></div>
				<div className="bg-white rounded-lg shadow-md p-4"><h2 className="text-sm font-medium text-gray-500">Pending</h2><p className="text-3xl font-bold text-yellow-500 mt-2">{stats.pending}</p></div>
				<div className="bg-white rounded-lg shadow-md p-4"><h2 className="text-sm font-medium text-gray-500">In Progress</h2><p className="text-3xl font-bold text-blue-500 mt-2">{stats.inProgress}</p></div>
				<div className="bg-white rounded-lg shadow-md p-4"><h2 className="text-sm font-medium text-gray-500">Resolved</h2><p className="text-3xl font-bold text-green-500 mt-2">{stats.resolved}</p></div>
				<div className="bg-white rounded-lg shadow-md p-4"><h2 className="text-sm font-medium text-gray-500">Escalated</h2><p className="text-3xl font-bold text-red-500 mt-2">{stats.escalated}</p></div>
				<div className="bg-white rounded-lg shadow-md p-4"><h2 className="text-sm font-medium text-gray-500">Total Users</h2><p className="text-3xl font-bold text-purple-500 mt-2">{stats.userCount}</p></div>
				<div className="bg-white rounded-lg shadow-md p-4"><h2 className="text-sm font-medium text-gray-500">Avg Resolution (hrs)</h2><p className="text-3xl font-bold text-indigo-500 mt-2">{stats.avgResolutionTime}</p></div>
			</div>

			{/* Auto-escalation Control */}
			<div className="bg-white rounded-lg shadow-md p-4 mb-8">
				<div className="flex justify-between items-center">
					<div>
						<h2 className="text-lg font-semibold">Automatic Escalation</h2>
						<p className="text-sm text-gray-600 mt-1">Check for complaints that exceed time thresholds based on priority: <span className="font-medium"> High (24h)</span>, <span className="font-medium"> Medium (72h)</span>, <span className="font-medium"> Low (120h)</span></p>
					</div>
					<button onClick={handleEscalationCheck} disabled={escalationLoading} className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 flex items-center">
						{escalationLoading ? (
							<>
								<svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
									<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
									<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
								</svg>
								Processing...
							</>
						) : (
							'Start Escalation Check'
						)}
					</button>
				</div>
			</div>

			{/* Charts and Feedback */}
			<div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
				<div className="bg-white rounded-lg shadow-md p-4"><h2 className="text-lg font-semibold mb-4">Status Distribution</h2><div className="h-64"><Pie data={statusChartData} /></div></div>
				<div className="bg-white rounded-lg shadow-md p-4"><h2 className="text-lg font-semibold mb-4">Category Distribution</h2><div className="h-64"><Bar data={categoryChartData} options={{ responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true, ticks: { precision: 0 } } } }} /></div></div>
				<div className="bg-white rounded-lg shadow-md p-4 lg:col-span-1"><FeedbackManagement /></div>
			</div>

			{/* Complaints Table */}
			<div className="bg-white rounded-lg shadow-md overflow-hidden">
				<div className="p-4 border-b border-gray-200">
					<h2 className="text-lg font-semibold">All Complaints</h2>
					<div className="mt-4 flex flex-col md:flex-row gap-4">
						<div className="flex-1">
							<input type="text" placeholder="Search by ID, subject, or user..." className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
						</div>
						<div className="flex gap-2">
							<select className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
								<option value="all">All Status</option>
								<option value="pending">Pending</option>
								<option value="in-progress">In Progress</option>
								<option value="resolved">Resolved</option>
								<option value="escalated">Escalated</option>
							</select>
							<select className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500" value={filterPriority} onChange={e => setFilterPriority(e.target.value)}>
								<option value="all">All Priorities</option>
								<option value="urgent">Urgent</option>
								<option value="high">High</option>
								<option value="medium">Medium</option>
								<option value="low">Low</option>
							</select>
							<select className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500" value={`${sortBy}-${sortOrder}`} onChange={e => { const [newSortBy, newSortOrder] = e.target.value.split('-'); setSortBy(newSortBy); setSortOrder(newSortOrder); }}>
								<option value="createdAt-desc">Newest First</option>
								<option value="createdAt-asc">Oldest First</option>
								<option value="priority-desc">Highest Priority</option>
								<option value="priority-asc">Lowest Priority</option>
							</select>
						</div>
					</div>
				</div>
				<div className="overflow-x-auto">
					<table className="min-w-full divide-y divide-gray-200">
						<thead className="bg-gray-50">
							<tr>
								<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
								<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject</th>
								<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
								<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
								<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
								<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
								<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
								<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assigned To</th>
								<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
							</tr>
						</thead>
						<tbody className="bg-white divide-y divide-gray-200">
							{filteredComplaints.length > 0 ? (
								filteredComplaints.map(complaint => (
									<tr key={complaint._id} className="hover:bg-gray-50">
										<td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">#{complaint._id.substring(0, 8)}</td>
										<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
											<Link to={`/complaint/${complaint._id}`} className="text-primary-600 hover:text-primary-800">{complaint.subject}</Link>
										</td>
										<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{complaint.user?.name || 'Unknown'}</td>
										<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{complaint.category}</td>
										<td className="px-6 py-4 whitespace-nowrap"><span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(complaint.status)}`}>{complaint.status.charAt(0).toUpperCase() + complaint.status.slice(1)}</span></td>
										<td className="px-6 py-4 whitespace-nowrap"><span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getPriorityBadgeClass(complaint.priority)}`}>{complaint.priority.charAt(0).toUpperCase() + complaint.priority.slice(1)}</span></td>
										<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(complaint.createdAt)}</td>
										<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{complaint.assignedTo?.name || 'Unassigned'}</td>
										<td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
											<Link to={`/admin/complaints/${complaint._id}/manage`} className="text-primary-600 hover:text-primary-900 mr-3">Manage</Link>
											<button onClick={() => handleDeleteComplaint(complaint._id)} className="text-red-600 hover:text-red-900">Delete</button>
										</td>
									</tr>
								))
							) : (
								<tr>
									<td colSpan="9" className="px-6 py-4 text-center text-sm text-gray-500">No complaints found matching your filters.</td>
								</tr>
							)}
						</tbody>
					</table>
				</div>
			</div>
		</div>
	);
};

export default AdminDashboard;