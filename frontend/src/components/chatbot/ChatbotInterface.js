import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from '../../services/axios';
import { toast } from 'react-toastify';
import Chatbot from './Chatbot';
import { FaRobot, FaTimes, FaCommentDots } from 'react-icons/fa';

const ChatbotInterface = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [isMinimized, setIsMinimized] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const chatbotRef = useRef(null);

  // Check for complaint status updates periodically
  useEffect(() => {
    // Only check for updates if user is logged in
    const token = localStorage.getItem('token');
    if (!token) return;

    const checkForUpdates = async () => {
      try {
        const response = await axios.get('/api/complaint-updates/updates');
        const updates = response.data;
        
        if (updates && updates.length > 0) {
          // Add new notifications
          setNotifications(prev => {
            // Filter out duplicates based on complaintId
            const existingIds = prev.map(n => n.complaintId);
            const newUpdates = updates.filter(update => !existingIds.includes(update.complaintId));
            return [...newUpdates, ...prev].slice(0, 10); // Keep only the 10 most recent notifications
          });
          
          // Increment unread count if chatbot is closed
          if (!isOpen) {
            setUnreadMessages(prev => prev + updates.length);
          }
          
          // Show toast for each update
          updates.forEach(update => {
            toast.info(`Complaint #${update.ticketNumber}: ${update.message}`, {
              position: "bottom-right",
              autoClose: 5000
            });
          });
        }
      } catch (error) {
        console.error('Error checking for updates:', error);
      }
    };

    // Check immediately and then every 30 seconds
    checkForUpdates();
    const interval = setInterval(checkForUpdates, 30000);
    
    return () => clearInterval(interval);
  }, [isOpen]);

  // Reset unread count when opening chatbot
  useEffect(() => {
    if (isOpen) {
      setUnreadMessages(0);
    }
  }, [isOpen]);

  // Handle clicks outside the chatbot to close it
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (chatbotRef.current && !chatbotRef.current.contains(event.target) && isOpen && !isMinimized) {
        setIsMinimized(true);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, isMinimized]);

  const toggleChatbot = () => {
    if (!isOpen) {
      setIsOpen(true);
      setIsMinimized(false);
    } else {
      setIsMinimized(!isMinimized);
    }
  };

  const closeChatbot = () => {
    setIsOpen(false);
  };

  return (
    <div className="fixed bottom-4 right-4 z-50" ref={chatbotRef}>
      {/* Chatbot Button */}
      <motion.button
        className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full p-4 shadow-lg flex items-center justify-center relative"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={toggleChatbot}
        aria-label="Open AI Assistant"
      >
        {isOpen ? <FaCommentDots size={24} /> : <FaRobot size={24} />}
        
        {/* Unread messages badge */}
        {unreadMessages > 0 && !isOpen && (
          <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center">
            {unreadMessages}
          </span>
        )}
      </motion.button>

      {/* Chatbot Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className={`absolute bottom-16 right-0 bg-white rounded-lg shadow-xl overflow-hidden ${isMinimized ? 'w-72' : 'w-96'}`}
            initial={{ opacity: 0, y: 20, height: 0 }}
            animate={{
              opacity: 1,
              y: 0,
              height: isMinimized ? 'auto' : 500
            }}
            exit={{ opacity: 0, y: 20, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            {/* Chatbot Header */}
            <div className="bg-indigo-600 text-white p-3 flex justify-between items-center">
              <div className="flex items-center">
                <FaRobot className="mr-2" />
                <h3 className="font-medium">AI Assistant</h3>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={toggleChatbot}
                  className="text-white hover:text-gray-200 focus:outline-none"
                  aria-label={isMinimized ? "Expand" : "Minimize"}
                >
                  {isMinimized ? 
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5 10a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1z" clipRule="evenodd" />
                    </svg> : 
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                    </svg>
                  }
                </button>
                <button
                  onClick={closeChatbot}
                  className="text-white hover:text-gray-200 focus:outline-none"
                  aria-label="Close"
                >
                  <FaTimes />
                </button>
              </div>
            </div>

            {/* Chatbot Content */}
            {!isMinimized && (
              <div className="h-full">
                <Chatbot onClose={closeChatbot} notifications={notifications} />
              </div>
            )}

            {/* Minimized View */}
            {isMinimized && (
              <div className="p-3 text-center">
                <p className="text-sm text-gray-600">AI Assistant is minimized. Click to expand.</p>
                {notifications.length > 0 && (
                  <div className="mt-2 text-xs text-indigo-600">
                    {notifications.length} new notification{notifications.length !== 1 ? 's' : ''}
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ChatbotInterface;