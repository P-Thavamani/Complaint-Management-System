import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import axios from '../services/axios';

const FeedbackPage = () => {
    const { ticketId } = useParams();
    const navigate = useNavigate();
    const [complaint, setComplaint] = useState(null);
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState({
        rating: 5,
        comment: '',
        resolved: true
    });

    useEffect(() => {
        fetchComplaintDetails();
    }, []);

    const fetchComplaintDetails = async () => {
        try {
            const response = await axios.get(`/api/complaints/${ticketId}`);
            setComplaint(response.data);
        } catch (error) {
            console.error('Error fetching complaint:', error);
            toast.error('Failed to fetch complaint details');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.post(`/api/feedback/${ticketId}`, formData);
            toast.success('Thank you for your feedback!');
            navigate('/dashboard');
        } catch (error) {
            console.error('Error submitting feedback:', error);
            toast.error('Failed to submit feedback');
        }
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    if (!complaint) {
        return (
            <div className="text-center py-12">
                <h2 className="text-2xl font-bold text-gray-900">Complaint Not Found</h2>
                <p className="mt-2 text-gray-600">The complaint you're looking for doesn't exist or you don't have permission to view it.</p>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto py-8 px-4">
            <div className="bg-white shadow rounded-lg overflow-hidden">
                <div className="px-6 py-4 bg-primary-600">
                    <h2 className="text-xl font-bold text-white">Provide Your Feedback</h2>
                </div>

                <div className="p-6">
                    <div className="mb-6">
                        <h3 className="text-lg font-medium text-gray-900">Complaint Details</h3>
                        <p className="mt-2 text-gray-600">{complaint.title}</p>
                        <p className="mt-1 text-sm text-gray-500">ID: {complaint._id}</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Rating</label>
                            <div className="mt-2 flex items-center space-x-2">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                        key={star}
                                        type="button"
                                        onClick={() => setFormData(prev => ({ ...prev, rating: star }))}
                                        className={`text-2xl ${formData.rating >= star ? 'text-yellow-400' : 'text-gray-300'}`}
                                    >
                                        ★
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">Comments</label>
                            <textarea
                                name="comment"
                                rows="4"
                                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                                placeholder="Please share your experience..."
                                value={formData.comment}
                                onChange={handleInputChange}
                            />
                        </div>

                        <div className="flex items-center">
                            <input
                                type="checkbox"
                                name="resolved"
                                id="resolved"
                                checked={formData.resolved}
                                onChange={handleInputChange}
                                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                            />
                            <label htmlFor="resolved" className="ml-2 block text-sm text-gray-900">
                                My issue has been completely resolved
                            </label>
                        </div>

                        <div className="flex justify-end space-x-3">
                            <button
                                type="button"
                                onClick={() => navigate('/dashboard')}
                                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
                            >
                                Submit Feedback
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default FeedbackPage;