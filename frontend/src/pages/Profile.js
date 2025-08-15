import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import axios from '../services/axios';
import { toast } from 'react-toastify';

const Profile = () => {
    const { user, updateUser, fetchUserProfile } = useContext(AuthContext);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        department: '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [changePassword, setChangePassword] = useState(false);
    const [initialized, setInitialized] = useState(false); // Prevent re-initializing form while typing

    // Fetch profile data only once on mount
    useEffect(() => {
        const loadProfileData = async () => {
            try {
                setLoading(true);
                await fetchUserProfile(); // Load into context
            } catch (error) {
                console.error('Error in profile loading:', error);
                toast.error('Unable to load profile. Please try again later.');
            } finally {
                setLoading(false);
            }
        };
        loadProfileData();
    }, []); // No dependencies → runs once

    // Initialize form only once after user is loaded
    useEffect(() => {
        if (user && !initialized) {
            setFormData({
                name: user.name || '',
                email: user.email || '',
                phone: user.phone || '',
                department: user.department || '',
                currentPassword: '',
                newPassword: '',
                confirmPassword: ''
            });
            setInitialized(true);
        }
    }, [user, initialized]);

    const handleChange = e => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async e => {
        e.preventDefault();
        setUpdating(true);

        try {
            if (changePassword) {
                if (!formData.currentPassword) {
                    toast.error('Current password is required');
                    return;
                }
                if (formData.newPassword !== formData.confirmPassword) {
                    toast.error('New passwords do not match');
                    return;
                }
                if (formData.newPassword.length < 6) {
                    toast.error('New password must be at least 6 characters');
                    return;
                }
            }

            const updateData = {
                name: formData.name,
                phone: formData.phone,
                department: formData.department
            };

            if (changePassword) {
                updateData.currentPassword = formData.currentPassword;
                updateData.newPassword = formData.newPassword;
            }

            const response = await axios.put('/api/users/profile', updateData);
            updateUser(response.data); // Update context
            toast.success('Profile updated successfully');

            if (changePassword) {
                setFormData(prev => ({
                    ...prev,
                    currentPassword: '',
                    newPassword: '',
                    confirmPassword: ''
                }));
                setChangePassword(false);
            }
        } catch (error) {
            console.error('Error updating profile:', error);
            const errorMessage = error.response?.data?.error ||
                error.response?.data?.message ||
                'Failed to update profile';
            toast.error(errorMessage);
        } finally {
            setUpdating(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto py-8 px-4">
            <h1 className="text-3xl font-bold text-gray-800 mb-6">Your Profile</h1>
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="p-6">
                    <form onSubmit={handleSubmit}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                            <div>
                                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                                <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500" required />
                            </div>
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                                <input type="email" id="email" name="email" value={formData.email} className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 cursor-not-allowed" disabled />
                                <p className="mt-1 text-xs text-gray-500">Email cannot be changed</p>
                            </div>
                            <div>
                                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                                <input type="tel" id="phone" name="phone" value={formData.phone} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500" />
                            </div>
                            <div>
                                <label htmlFor="department" className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                                <input type="text" id="department" name="department" value={formData.department} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500" />
                            </div>
                        </div>

                        <div className="mb-6">
                            <div className="flex items-center">
                                <input type="checkbox" id="changePassword" checked={changePassword} onChange={() => setChangePassword(!changePassword)} className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded" />
                                <label htmlFor="changePassword" className="ml-2 block text-sm text-gray-700">Change Password</label>
                            </div>
                        </div>

                        {changePassword && (
                            <div className="space-y-4 mb-6 border-t border-gray-200 pt-4">
                                <div>
                                    <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                                    <input type="password" id="currentPassword" name="currentPassword" value={formData.currentPassword} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500" required />
                                </div>
                                <div>
                                    <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                                    <input type="password" id="newPassword" name="newPassword" value={formData.newPassword} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500" required minLength="6" />
                                    <p className="mt-1 text-xs text-gray-500">Password must be at least 6 characters</p>
                                </div>
                                <div>
                                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                                    <input type="password" id="confirmPassword" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500" required />
                                </div>
                            </div>
                        )}

                        <div className="flex justify-end">
                            <button type="submit" className="btn-primary" disabled={updating}>
                                {updating ? 'Updating...' : 'Save Changes'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {/* Account Statistics */}
            <div className="mt-8 bg-white rounded-lg shadow-md overflow-hidden">
                <div className="p-6">
                    <h2 className="text-xl font-semibold text-gray-800 mb-4">Account Statistics</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-gray-50 p-4 rounded-lg">
                            <h3 className="text-sm font-medium text-gray-500">Account Created</h3>
                            <p className="text-lg font-semibold mt-1">{user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}</p>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg">
                            <h3 className="text-sm font-medium text-gray-500">Total Complaints</h3>
                            <p className="text-lg font-semibold mt-1">{user?.complaintCount || 0}</p>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg">
                            <h3 className="text-sm font-medium text-gray-500">Last Login</h3>
                            <p className="text-lg font-semibold mt-1">{user?.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'N/A'}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Profile;
