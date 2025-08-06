import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';

const ComplaintDetail = () => {
  const { id } = useParams();
  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  useEffect(() => {
    const fetchComplaintDetails = async () => {
      try {
        const response = await axios.get(`/api/complaints/${id}`);
        setComplaint(response.data);
      } catch (error) {
        console.error('Error fetching complaint details:', error);
        toast.error('Failed to load complaint details. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchComplaintDetails();
  }, [id]);

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return;

    setSubmittingComment(true);
    try {
      const response = await axios.post(`/api/complaints/${id}/comments`, { content: comment });
      
      // Update complaint with new comment
      setComplaint(prev => ({
        ...prev,
        comments: [...prev.comments, response.data]
      }));
      
      setComment('');
      toast.success('Comment added successfully');
    } catch (error) {
      console.error('Error adding comment:', error);
      toast.error('Failed to add comment. Please try again.');
    } finally {
      setSubmittingComment(false);
    }
  };

  // Function to format date
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
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
        <Link to="/dashboard" className="btn-primary">
          Back to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <Link to="/dashboard" className="text-primary-600 hover:text-primary-700 flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
          Back to Dashboard
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {/* Complaint Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-gray-800 mb-2">{complaint.subject}</h1>
              <div className="flex items-center text-gray-600 text-sm">
                <span className="mr-4">ID: #{complaint._id.substring(0, 8)}</span>
                <span className="mr-4">Created: {formatDate(complaint.createdAt)}</span>
                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusBadgeClass(complaint.status)}`}>
                  {complaint.status.charAt(0).toUpperCase() + complaint.status.slice(1)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Complaint Details */}
        <div className="p-6 border-b border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <h2 className="text-lg font-semibold mb-3">Description</h2>
              <p className="text-gray-700 whitespace-pre-line">{complaint.description}</p>
              
              {complaint.imageUrl && (
                <div className="mt-4">
                  <h3 className="text-md font-semibold mb-2">Attached Image</h3>
                  <img 
                    src={complaint.imageUrl} 
                    alt="Complaint attachment" 
                    className="max-w-full h-auto rounded-lg border border-gray-200 max-h-64"
                  />
                </div>
              )}

              {complaint.detectedObjects && complaint.detectedObjects.length > 0 && (
                <div className="mt-4">
                  <h3 className="text-md font-semibold mb-2">AI-Detected Issues</h3>
                  <div className="flex flex-wrap gap-2">
                    {complaint.detectedObjects.map((object, index) => (
                      <span 
                        key={index} 
                        className="px-3 py-1 bg-purple-100 text-purple-800 text-sm rounded-full"
                      >
                        {object.name} ({Math.round(object.confidence * 100)}%)
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h2 className="text-lg font-semibold mb-3">Details</h2>
              <ul className="space-y-3">
                <li className="flex justify-between">
                  <span className="text-gray-600">Category:</span>
                  <span className="font-medium">{complaint.category}</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-gray-600">Priority:</span>
                  <span className="font-medium">
                    {complaint.priority === 'high' && (
                      <span className="text-red-600">High</span>
                    )}
                    {complaint.priority === 'medium' && (
                      <span className="text-yellow-600">Medium</span>
                    )}
                    {complaint.priority === 'low' && (
                      <span className="text-green-600">Low</span>
                    )}
                  </span>
                </li>
                {complaint.assignedTo && (
                  <li className="flex justify-between">
                    <span className="text-gray-600">Assigned To:</span>
                    <span className="font-medium">{complaint.assignedTo.name}</span>
                  </li>
                )}
                {complaint.resolvedAt && (
                  <li className="flex justify-between">
                    <span className="text-gray-600">Resolved:</span>
                    <span className="font-medium">{formatDate(complaint.resolvedAt)}</span>
                  </li>
                )}
              </ul>
            </div>
          </div>
        </div>

        {/* Status Timeline */}
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold mb-4">Status Timeline</h2>
          <div className="relative">
            {/* Timeline Line */}
            <div className="absolute left-4 top-0 h-full w-0.5 bg-gray-200"></div>

            {/* Timeline Items */}
            <div className="space-y-6 relative">
              {/* Created */}
              <div className="flex">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-500 flex items-center justify-center z-10 mr-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-medium">Complaint Registered</h3>
                  <p className="text-sm text-gray-500">{formatDate(complaint.createdAt)}</p>
                </div>
              </div>

              {/* Assigned */}
              {complaint.assignedAt && (
                <div className="flex">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center z-10 mr-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-medium">Assigned to {complaint.assignedTo?.name || 'Agent'}</h3>
                    <p className="text-sm text-gray-500">{formatDate(complaint.assignedAt)}</p>
                  </div>
                </div>
              )}

              {/* In Progress */}
              {complaint.inProgressAt && (
                <div className="flex">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-yellow-500 flex items-center justify-center z-10 mr-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-medium">In Progress</h3>
                    <p className="text-sm text-gray-500">{formatDate(complaint.inProgressAt)}</p>
                  </div>
                </div>
              )}

              {/* Escalated */}
              {complaint.escalatedAt && (
                <div className="flex">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-red-500 flex items-center justify-center z-10 mr-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-medium">Escalated</h3>
                    <p className="text-sm text-gray-500">{formatDate(complaint.escalatedAt)}</p>
                  </div>
                </div>
              )}

              {/* Resolved */}
              {complaint.resolvedAt && (
                <div className="flex">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-500 flex items-center justify-center z-10 mr-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-medium">Resolved</h3>
                    <p className="text-sm text-gray-500">{formatDate(complaint.resolvedAt)}</p>
                    {complaint.resolution && (
                      <p className="mt-1 text-gray-700">{complaint.resolution}</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Comments Section */}
        <div className="p-6">
          <h2 className="text-lg font-semibold mb-4">Comments</h2>
          
          {complaint.comments && complaint.comments.length > 0 ? (
            <div className="space-y-4 mb-6">
              {complaint.comments.map((comment) => (
                <div key={comment._id} className="bg-gray-50 p-4 rounded-lg">
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
          ) : (
            <p className="text-gray-500 mb-6">No comments yet.</p>
          )}

          {/* Add Comment Form */}
          {complaint.status !== 'resolved' && (
            <form onSubmit={handleCommentSubmit}>
              <div className="mb-4">
                <label htmlFor="comment" className="block text-gray-700 font-medium mb-2">Add a Comment</label>
                <textarea
                  id="comment"
                  rows="3"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Type your comment here..."
                  disabled={submittingComment}
                ></textarea>
              </div>
              <button
                type="submit"
                className="btn-primary"
                disabled={!comment.trim() || submittingComment}
              >
                {submittingComment ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Submitting...
                  </span>
                ) : 'Add Comment'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ComplaintDetail;