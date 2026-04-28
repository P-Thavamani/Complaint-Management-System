import React, { useContext, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Chatbot Interface
import ChatbotInterface from './components/chatbot/ChatbotInterface';

// Layout Components
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import AdminDashboard from './pages/AdminDashboard';
import AdminRewardsPage from './pages/AdminRewardsPage';
import WorkerDashboard from './pages/WorkerDashboard';
import ComplaintDetail from './pages/ComplaintDetail';
import ManageComplaint from './pages/ManageComplaint';
import Profile from './pages/Profile';
import NotFound from './pages/NotFound';
import FeedbackPage from './pages/FeedbackPage';

// Protected Route Components
import ProtectedRoute from './components/auth/ProtectedRoute';
import AdminRoute from './components/auth/AdminRoute';
import WorkerRoute from './components/auth/WorkerRoute';
import { AuthContext } from './context/AuthContext';
import { RewardsProvider } from './context/RewardsContext';

function App() {
	const { user, loading, isAdmin, isWorker } = useContext(AuthContext);

	const navigate = useNavigate();
	const location = useLocation();

	const handleReload = () => {
		if (isAdmin()) {
			navigate('/admin');
		} else {
			navigate('/dashboard');
		}
	};

	useEffect(() => {
		const checkAuth = () => {
			if (loading) return;

			// No user, go to the home page
			if (!user && location.pathname !== '/' && location.pathname !== '/login' && location.pathname !== '/register') {
				navigate('/');
				return;
			}

			if (user) {
				const adminUser = isAdmin();
				const workerUser = isWorker ? isWorker() : (user.is_worker || user.worker);

				// Prevent non-admins from admin routes
				if (location.pathname.startsWith('/admin') && !adminUser) {
					navigate(workerUser ? '/worker' : '/dashboard');
					return;
				}

				// Prevent non-workers (and non-admins) from worker routes
				if (location.pathname.startsWith('/worker') && !workerUser && !adminUser) {
					navigate('/dashboard');
					return;
				}

				// Redirect admins away from user/worker-only areas to their dashboard
				if (adminUser && (location.pathname === '/dashboard')) {
					navigate('/admin');
					return;
				}

				// Redirect workers away from user dashboard to worker dashboard
				if (workerUser && !adminUser && location.pathname === '/dashboard') {
					navigate('/worker');
					return;
				}

				// Redirect from home/login/register to appropriate dashboard
				if (location.pathname === '/' || location.pathname === '/login' || location.pathname === '/register') {
					if (adminUser) {
						navigate('/admin');
					} else if (workerUser) {
						navigate('/worker');
					} else {
						navigate('/dashboard');
					}
					return;
				}
			}
		};

		checkAuth();
	}, [user, loading, isAdmin, isWorker, navigate, location.pathname]);


	return (
		<RewardsProvider>
			<div className="flex flex-col min-h-screen bg-gray-50">
				<ToastContainer position="top-right" autoClose={3000} />
				<Navbar onReload={handleReload} />
				<main className="flex-grow container mx-auto px-4 py-8">
				<Routes>
					<Route path="/" element={<Home />} />
					<Route path="/login" element={<Login />} />
					<Route path="/register" element={<Register />} />
					{/* Protected Routes */}
					<Route
						path="/dashboard"
						element={
							<ProtectedRoute>
								<Dashboard />
							</ProtectedRoute>
						}
					/>
					<Route
						path="/complaint/:id"
						element={
							<ProtectedRoute>
								<ComplaintDetail />
							</ProtectedRoute>
						}
					/>
					<Route
						path="/profile"
						element={
							<ProtectedRoute>
								<Profile />
							</ProtectedRoute>
						}
					/>
					{/* Admin Routes */}
					<Route
						path="/admin"
						element={
							<AdminRoute>
								<AdminDashboard />
							</AdminRoute>
						}
					/>
					<Route
						path="/admin/rewards"
						element={
							<AdminRoute>
								<AdminRewardsPage />
							</AdminRoute>
						}
					/>
					<Route
						path="/admin/complaints/:id/manage"
						element={
							<AdminRoute>
								<ManageComplaint />
							</AdminRoute>
						}
					/>
					{/* Worker Routes */}
					<Route
						path="/worker"
						element={
							<WorkerRoute>
								<WorkerDashboard />
							</WorkerRoute>
						}
					/>
					<Route
						path="/worker/complaints/:id"
						element={
							<WorkerRoute>
								<ComplaintDetail />
							</WorkerRoute>
						}
					/>
					{/* 404 Route */}
					<Route
						path="/feedback/:ticketId"
						element={
							<ProtectedRoute>
								<FeedbackPage />
							</ProtectedRoute>
						}
					/>
					<Route path="*" element={<NotFound />} />
				</Routes>
			</main>
			<Footer />

			{/* Chatbot Interface - available on all pages */}
			<ChatbotInterface />
			</div>
		</RewardsProvider>
	);
}

export default App;