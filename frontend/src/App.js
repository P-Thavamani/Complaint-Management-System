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
import ComplaintDetail from './pages/ComplaintDetail';
import ManageComplaint from './pages/ManageComplaint';
import Profile from './pages/Profile';
import NotFound from './pages/NotFound';

// Protected Route Component
import ProtectedRoute from './components/auth/ProtectedRoute';
import AdminRoute from './components/auth/AdminRoute';
import { AuthContext } from './context/AuthContext';

function App() {
	const { user, loading, isAdmin } = useContext(AuthContext);
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
				// Prevent access to the /admin route if not an admin
				if (location.pathname.startsWith('/admin') && !isAdmin()) {
					navigate('/dashboard');
					return;
				}

				// Only redirect from home/login/register to appropriate dashboard
				// Don't redirect from other pages like /profile, /complaint/:id, etc.
				if (location.pathname === '/' || location.pathname === '/login' || location.pathname === '/register') {
					const destination = isAdmin() ? '/admin' : '/dashboard';
					navigate(destination);
					return;
				}
			}
		};

		checkAuth();
	}, [user, loading, isAdmin, navigate, location.pathname]);

	return (
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
					{/* 404 Route */}
					<Route path="*" element={<NotFound />} />
				</Routes>
			</main>
			<Footer />

			{/* Chatbot Interface - available on all pages */}
			<ChatbotInterface />
		</div>
	);
}

export default App;