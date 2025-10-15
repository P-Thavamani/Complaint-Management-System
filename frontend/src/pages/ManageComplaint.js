import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from '../services/axios';
import { toast } from 'react-toastify';
import { useAI } from '../components/hooks/useAI';

const ManageComplaint = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [users, setUsers] = useState([]);
  const [agents, setAgents] = useState([]);
  const [suggestingAgent, setSuggestingAgent] = useState(false);
  const { determineAssignment } = useAI();
  const [formData, setFormData] = useState({
    status: '',
    priority: '',
    assigned_to: '',
    resolution: ''
  });

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch complaint details
        const complaintResponse = await axios.get(`/api/complaints/${id}`);
        setComplaint(complaintResponse.data);
        
        // Initialize form data with current values
        setFormData({
          status: complaintResponse.data.status || '',
          priority: complaintResponse.data.priority || '',
          assigned_to: complaintResponse.data.assignedTo?._id || '',
          resolution: complaintResponse.data.resolution || ''
        });

        // Fetch users for assignment dropdown
        const usersResponse = await axios.get('/api/admin/users');
        setUsers(usersResponse.data);
        
        // Fetch agents for AI-assisted assignment
        const agentsResponse = await axios.get('/api/admin/agents');
        setAgents(agentsResponse.data);
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Failed to load complaint data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleAIAssignment = async () => {
    setSuggestingAgent(true);
    try {
      // Use the AI hook to determine the best agent based on category and priority
      const agentId = await determineAssignment(complaint.category, formData.priority);
      
      // Find the agent in our agents list
      const agent = agents.find(a => a.id === agentId);
      
      if (agent) {
        // Find the corresponding user in our users list (matching by email)
        const matchedUser = users.find(user => user.email === agent.email);
        
        if (matchedUser) {
          // Update the form data with the suggested agent
          setFormData(prev => ({
            ...prev,
            assigned_to: matchedUser._id
          }));
          toast.success(`AI suggested agent: ${agent.name} (${agent.department})`);
        } else {
          // If no matching user is found, just show the suggestion
          toast.info(`AI suggests assigning to ${agent.name} (${agent.department}), but this agent is not in the user list.`);
        }
      } else {
        toast.info('AI suggests assigning to the support team.');
      }
    } catch (error) {
      console.error('Error in AI assignment:', error);
      toast.error('Failed to get AI assignment suggestion.');
    } finally {
      setSuggestingAgent(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      await axios.put(`/api/admin/complaints/${id}/manage`, formData);
      toast.success('Complaint updated successfully');
      navigate('/admin'); // Redirect back to admin dashboard
    } catch (error) {
      console.error('Error updating complaint:', error);
      toast.error('Failed to update complaint. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Helper function to format date
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Function to get status badge color
  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'in-progress':
        return 'bg-blue-100 text-blue-800';
      case 'resolved':
        return 'bg-green-100 text-green-800';
      case 'escalated':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Function to get priority badge color
  // const getPriorityBadgeClass = (priority) => {
  //   switch (priority) {
  //     case 'high':
  //       return 'bg-red-100 text-red-800';
  //     case 'medium':
  //       return 'bg-yellow-100 text-yellow-800';
  //     case 'low':
  //       return 'bg-green-100 text-green-800';
  //     default:
  //       return 'bg-gray-100 text-gray-800';
  //   }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!complaint) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-700 mb-4">Complaint Not Found</h2>
        <p className="text-gray-600 mb-6">The complaint you're looking for doesn't exist or you don't have permission to view it.</p>
        <Link to="/admin" className="btn-primary">
          Back to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <Link to="/admin" className="text-primary-600 hover:text-primary-700 flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
          Back to Admin Dashboard
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Complaint Details Panel */}
        <div className="md:col-span-2 bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-800 mb-2">{complaint.subject}</h1>
            <div className="flex items-center text-gray-600 text-sm">
              <span className="mr-4">ID: #{complaint._id.substring(0, 8)}</span>
              <span className="mr-4">Created: {formatDate(complaint.createdAt)}</span>
              <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusBadgeClass(complaint.status)}`}>
                {complaint.status.charAt(0).toUpperCase() + complaint.status.slice(1)}
              </span>
            </div>
          </div>

          <div className="p-6">
            <h2 className="text-lg font-semibold mb-3">Description</h2>
            <p className="text-gray-700 whitespace-pre-line mb-6">{complaint.description}</p>
            
            {complaint.imageUrl && (
              <div className="mt-4 mb-6">
                <h3 className="text-md font-semibold mb-2">Attached Image</h3>
                <img 
                  src={complaint.imageUrl} 
                  alt="Complaint attachment" 
                  className="max-w-full h-auto rounded-lg border border-gray-200 max-h-64"
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <h3 className="text-md font-semibold mb-2">Category</h3>
                <p className="text-gray-700">{complaint.category}</p>
              </div>
              {complaint.subcategoryName && (
                <div>
                  <h3 className="text-md font-semibold mb-2">Subcategory</h3>
                  <p className="text-gray-700">{complaint.subcategoryName}</p>
                </div>
              )}
              {complaint.problem && (
                <div>
                  <h3 className="text-md font-semibold mb-2">Problem</h3>
                  <p className="text-gray-700">{complaint.problem}</p>
                </div>
              )}
              <div>
                <h3 className="text-md font-semibold mb-2">Submitted By</h3>
                <p className="text-gray-700">{complaint.user?.name || 'Unknown'}</p>
              </div>
            </div>

            {complaint.comments && complaint.comments.length > 0 && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-3">Comments</h3>
                <div className="space-y-4">
                  {complaint.comments.map((comment, index) => (
                    <div key={index} className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center">
                          <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center mr-2">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-600" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <span className="font-medium">{comment.user.name}</span>
                        </div>
                        <span className="text-xs text-gray-500">{formatDate(comment.createdAt)}</span>
                      </div>
                      <p className="text-gray-700">{comment.content}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Management Form Panel */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800">Manage Complaint</h2>
          </div>
          <div className="p-6">
            <form onSubmit={handleSubmit}>
              {/* Status */}
              <div className="mb-4">
                <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  required
                >
                  <option value="">Select Status</option>
                  <option value="pending">Pending</option>
                  <option value="in-progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                  <option value="escalated">Escalated</option>
                </select>
              </div>
              
              {/* Priority */}
              <div className="mb-4">
                <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-1">
                  Priority
                </label>
                <select
                  id="priority"
                  name="priority"
                  value={formData.priority}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  required
                >
                  <option value="">Select Priority</option>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              
              {/* Assign To */}
              <div className="mb-4">
                <div className="flex justify-between items-center mb-1">
                  <label htmlFor="assigned_to" className="block text-sm font-medium text-gray-700">
                    Assign To
                  </label>
                  <button
                    type="button"
                    onClick={handleAIAssignment}
                    disabled={suggestingAgent}
                    className="text-xs bg-primary-100 text-primary-700 hover:bg-primary-200 px-2 py-1 rounded-md flex items-center"
                  >
                    {suggestingAgent ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-primary-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Suggesting...
                      </>
                    ) : (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                        </svg>
                        AI Suggest
                      </>
                    )}
                  </button>
                </div>
                <select
                  id="assigned_to"
                  name="assigned_to"
                  value={formData.assigned_to}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">Unassigned</option>
                  {users.map(user => (
                    <option key={user._id} value={user._id}>{user.name}</option>
                  ))}
                </select>
              </div>
              
              {/* Resolution (only if status is resolved) */}
              {formData.status === 'resolved' && (
                <div className="mb-4">
                  <label htmlFor="resolution" className="block text-sm font-medium text-gray-700 mb-1">
                    Resolution
                  </label>
                  <textarea
                    id="resolution"
                    name="resolution"
                    value={formData.resolution}
                    onChange={handleInputChange}
                    rows="4"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Describe how the complaint was resolved..."
                    required={formData.status === 'resolved'}
                  ></textarea>
                </div>
              )}
              
              {/* Submit Button */}
              <div className="mt-6">
                <button
                  type="submit"
                  className="w-full btn-primary"
                  disabled={submitting}
                >
                  {submitting ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Updating...
                    </span>
                  ) : 'Update Complaint'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManageComplaint;