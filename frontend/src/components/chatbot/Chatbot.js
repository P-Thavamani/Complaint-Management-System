import React, { useState, useRef, useEffect } from 'react';
import axios from '../../services/axios';
import { toast } from 'react-toastify';
import ChatMessage from './ChatMessage';
import VoiceInput from './VoiceInput';
import ImageUpload from './ImageUpload';
import { useAI } from '../hooks/useAI';

const Chatbot = ({ onClose }) => {
  // Initialize with default welcome message
  const [messages, setMessages] = useState([{
    type: 'bot',
    content: 'Hello! I\'m your AI assistant. How can I help you today? You can type your complaint, use voice input, or upload an image of the issue.',
    timestamp: new Date(),
    options: []
  }]);
  
  // Input state and refs
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isVoiceInputActive, setIsVoiceInputActive] = useState(false);
  const [isImageUploadActive, setIsImageUploadActive] = useState(false);
  const [showAIFeatures, setShowAIFeatures] = useState(false);
  
  // Initialize complaint categories state
  const [loading, setLoading] = useState(false);
  const [complaintCategories, setComplaintCategories] = useState({});
  
  // Update initial message with categories from state
  useEffect(() => {
    // Only update if we have categories
    if (Object.keys(complaintCategories).length > 0) {
      // Update initial message with categories
      setMessages(prev => {
        const updatedMessages = [...prev];
        if (updatedMessages.length > 0) {
          updatedMessages[0] = {
            ...updatedMessages[0],
            options: Object.entries(complaintCategories).map(([id, category]) => ({
              id: id,
              text: category.name
            }))
          };
        }
        return updatedMessages;
      });
    }
  }, [complaintCategories]);
  
  // Fetch categories from API
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        const response = await axios.get('/api/categories/');
        console.log('Categories API response:', response.data);
        setComplaintCategories(response.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching categories:', error);
        toast.error('Failed to load categories. Using default categories.');
        setLoading(false);
      }
    };
    
    fetchCategories();
  }, []);
  
  // Use the AI hook for ticket processing
  const { isProcessing, createTicket, categorizeComplaint, determinePriority, determineAssignment } = useAI();
  
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Scroll to bottom of messages
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Focus input field when component mounts
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleInputChange = (e) => {
    setInput(e.target.value);
  };
  
  // Handle option selection from the chatbot options
  const handleOptionSelect = async (optionId, optionText) => {
    // Add user message showing their selection
    const userMessage = {
      type: 'user',
      content: `I need help with: ${optionText}`,
      timestamp: new Date(),
      isOption: true
    };
    
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    
    try {
      console.log('Selected option:', optionId, optionText);
      console.log('Available categories:', complaintCategories);
      
      // Check if this is a main category or subcategory
      const isMainCategory = Object.keys(complaintCategories).includes(optionId);
      const [mainCategory, subCategory] = isMainCategory ? [optionId, null] : optionId.split('.');
      
      console.log('Is main category:', isMainCategory);
      console.log('Main category:', mainCategory);
      console.log('Subcategory:', subCategory);
      
      // Process the selected option
      const category = mainCategory; // Use the main category ID
      const priority = category === 'technical' || category === 'service' ? 'high' : 'medium';
      
      // If this is a main category, show subcategories
      if (isMainCategory) {
        const categoryData = complaintCategories[mainCategory];
        const subcategories = categoryData.subcategories;
        
        // Create options for subcategories
        const subcategoryOptions = Object.entries(subcategories).map(([id, data]) => ({
          id: `${mainCategory}.${id}`,
          text: data.name
        }));
        
        // Add bot response with subcategories
        const botResponse = {
          type: 'bot',
          content: `Please select a specific issue related to ${categoryData.name}:`,
          timestamp: new Date(),
          options: subcategoryOptions,
          category: mainCategory
        };
        
        setMessages(prev => [...prev, botResponse]);
      } else {
        // This is a subcategory selection
        const categoryData = complaintCategories[mainCategory];
        const subcategoryData = categoryData.subcategories[subCategory];
        
        // Create the problem and solution message
        const problemSolutionContent = `
**Problem:** ${subcategoryData.problem}

**Solution:**
${subcategoryData.solution.map(step => `• ${step}`).join('\n')}

If the provided solution does not work, you can click "Open Ticket" to get help from our support team.`;
        
        // Add bot response with problem and solution
        const botResponse = {
          type: 'bot',
          content: problemSolutionContent,
          timestamp: new Date(),
          category: mainCategory,
          subcategory: subCategory,
          problem: subcategoryData.problem,
          solution: subcategoryData.solution,
          options: [
            { id: 'open_ticket', text: 'Open Ticket' },
            { id: 'solved', text: 'Issue Solved' }
          ]
        };
        
        setMessages(prev => [...prev, botResponse]);
        
        // If it's a serious issue, create a ticket automatically
        if (['technical.crash', 'billing.duplicate_charges', 'service.unavailable'].includes(`${mainCategory}.${subCategory}`)) {
          // Create ticket with AI-determined category and priority
          const ticketResult = await createTicket(subcategoryData.name, category, priority);
          
          if (ticketResult && ticketResult.success) {
            // Add ticket creation confirmation
            const ticketMessage = {
              type: 'bot',
              content: `I've automatically created a ticket for this issue. Category: ${categoryData.name}, Subcategory: ${subcategoryData.name}, Priority: ${priority}`,
              timestamp: new Date(),
              ticketCreated: true,
              ticketId: ticketResult.ticketId
            };
            
            setMessages(prev => [...prev, ticketMessage]);
            toast.success(`Ticket #${ticketResult.ticketId} has been created for your complaint.`);
          }
        }
      }
      
      // Handle special options
      if (optionId === 'open_ticket') {
        // Show ticket form
        const ticketFormMessage = {
          type: 'bot',
          content: 'Please provide additional details about your issue:',
          timestamp: new Date(),
          isTicketForm: true
        };
        
        setMessages(prev => [...prev, ticketFormMessage]);
      } else if (optionId === 'solved') {
        // Thank the user
        const thankYouMessage = {
          type: 'bot',
          content: 'Great! I\'m glad the solution helped. Is there anything else I can assist you with?',
          timestamp: new Date(),
          options: Object.entries(complaintCategories).map(([id, category]) => ({
            id: id,
            text: category.name
          }))
        };
        
        setMessages(prev => [...prev, thankYouMessage]);
      }
    } catch (error) {
      console.error('Error processing option:', error);
      
      // Add error message to chat
      const errorMessage = {
        type: 'bot',
        content: 'Sorry, I encountered an error processing your selection. Please try again or type your issue directly.',
        timestamp: new Date(),
        isError: true
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Legacy handleOptionSelect for backward compatibility
  const handleLegacyOptionSelect = async (optionId, optionText) => {
    // Add user message showing their selection
    const userMessage = {
      type: 'user',
      content: `I need help with: ${optionText}`,
      timestamp: new Date(),
      isOption: true
    };
    
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    
    try {
      // Process the selected option
      const category = optionId; // Use the option ID as the category
      const priority = optionId === 'technical' || optionId === 'service' ? 'high' : 'medium';
      
      // Add bot response based on the selected option
      let responseContent = '';
      
      switch(optionId) {
        case 'billing':
          responseContent = 'I understand you\'re having a billing issue. Could you please provide more details about the problem?';
          break;
        case 'technical':
          responseContent = 'I see you\'re experiencing a technical problem. Could you describe the issue you\'re facing in detail?';
          break;
        case 'service':
          responseContent = 'I\'m sorry to hear you have a service complaint. Please tell me more about the service issue you encountered.';
          break;
        case 'feedback':
          responseContent = 'Thank you for wanting to provide feedback. I\'d love to hear your thoughts on our service.';
          break;
        case 'inquiry':
          responseContent = 'I\'d be happy to help with your account inquiry. What specific information are you looking for?';
          break;
        case 'other':
          responseContent = 'I understand you have another type of issue. Please describe your concern, and I\'ll do my best to assist you.';
          break;
        default:
          responseContent = 'Thank you for selecting an option. How can I assist you further with this?';
      }
      
      const botResponse = {
        type: 'bot',
        content: responseContent,
        timestamp: new Date(),
        category: category
      };
      
      setMessages(prev => [...prev, botResponse]);
      
      // Create a ticket if it's a complaint category
      if (['billing', 'technical', 'service'].includes(optionId)) {
        // Create ticket with AI-determined category and priority
        const ticketResult = await createTicket(optionText, category, priority);
        
        if (ticketResult && ticketResult.success) {
          // Add ticket creation confirmation
          const ticketMessage = {
            type: 'bot',
            content: `I've created a ticket for your ${optionText.toLowerCase()}. Category: ${category}, Priority: ${priority}`,
            timestamp: new Date(),
            ticketCreated: true,
            ticketId: ticketResult.ticketId
          };
          
          setMessages(prev => [...prev, ticketMessage]);
          toast.success(`Ticket #${ticketResult.ticketId} has been created for your complaint.`);
        }
      }
    } catch (error) {
      console.error('Error processing option:', error);
      
      // Add error message to chat
      const errorMessage = {
        type: 'bot',
        content: 'Sorry, I encountered an error processing your selection. Please try again or type your issue directly.',
        timestamp: new Date(),
        isError: true
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() && !isVoiceInputActive && !isImageUploadActive) return;

    // Add user message to chat
    const userMessage = {
      type: 'user',
      content: input,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Send message to backend
      const response = await axios.post('/api/chatbot/message', {
        message: input,
        messageType: 'text'
      });

      // Process with AI features
      const category = categorizeComplaint(input);
      const priority = determinePriority(input);
      
      // Add initial bot response to chat
      const initialResponse = {
        type: 'bot',
        content: response.data.message,
        timestamp: new Date(),
        suggestTicket: response.data.suggestTicket || false
      };
      
      setMessages(prev => [...prev, initialResponse]);
      
      // If the message suggests creating a ticket, show AI features
      if (response.data.suggestTicket || input.toLowerCase().includes('complaint') || 
          input.toLowerCase().includes('issue') || input.toLowerCase().includes('problem')) {
        
        // Add AI features message
        const aiFeatureMessage = {
          type: 'bot',
          content: 'I can help you with your complaint using these AI features:',
          timestamp: new Date(),
          aiFeatures: [
            { title: 'Automatic Ticket Creation', description: 'Upon registering a complaint, the system automatically generates a ticket with all relevant details.' },
            { title: 'Intelligent Categorization', description: 'AI will categorize tickets based on predefined categories (e.g., billing, technical, service) using machine learning models.' },
            { title: 'Prioritization System', description: 'AI will assign priority levels (urgent, high, medium, low) based on the complaint\'s nature and keywords.' },
            { title: 'Dynamic Assignment', description: 'The system will use AI to intelligently assign tickets to the relevant teams or agents based on expertise, workload, and availability.' }
          ]
        };
        
        setMessages(prev => [...prev, aiFeatureMessage]);
        
        // Create ticket with AI-determined category and priority
        const ticketResult = await createTicket(input, category, priority);
        
        if (ticketResult.success) {
          // Add ticket creation confirmation
          const ticketMessage = {
            type: 'bot',
            content: `I've analyzed your complaint and created a ticket for you. Category: ${category}, Priority: ${priority}`,
            timestamp: new Date(),
            ticketCreated: true,
            ticketId: ticketResult.ticketId
          };
          
          setMessages(prev => [...prev, ticketMessage]);
          toast.success(`Ticket #${ticketResult.ticketId} has been created for your complaint.`);
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
      
      // Add error message to chat
      const errorMessage = {
        type: 'bot',
        content: 'Sorry, I encountered an error processing your request. Please try again later.',
        timestamp: new Date(),
        isError: true
      };
      
      setMessages(prev => [...prev, errorMessage]);
      toast.error('Failed to process your message. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVoiceInput = (transcript) => {
    // Add user voice message to chat
    const userMessage = {
      type: 'user',
      content: transcript,
      timestamp: new Date(),
      isVoice: true
    };
    
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setIsVoiceInputActive(false);

    // Process voice input
    processMessage(transcript, 'voice');
  };

  const handleImageUpload = async (imageFile) => {
    // Add user image message to chat
    const userMessage = {
      type: 'user',
      content: 'Image uploaded',
      timestamp: new Date(),
      isImage: true,
      imageUrl: URL.createObjectURL(imageFile)
    };
    
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setIsImageUploadActive(false);

    try {
      // Create form data for image upload
      const formData = new FormData();
      formData.append('image', imageFile);

      // Send image to backend for processing
      const response = await axios.post('/api/chatbot/image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      // Add bot response to chat
      const botResponse = {
        type: 'bot',
        content: response.data.message,
        timestamp: new Date(),
        detectedObjects: response.data.detectedObjects,
        ticketCreated: response.data.ticketCreated,
        ticketId: response.data.ticketId
      };

      setMessages(prev => [...prev, botResponse]);

      // Show toast if ticket was created
      if (response.data.ticketCreated) {
        toast.success(`Ticket #${response.data.ticketId} has been created for your complaint.`);
      }
    } catch (error) {
      console.error('Error processing image:', error);
      
      // Add error message to chat
      const errorMessage = {
        type: 'bot',
        content: 'Sorry, I encountered an error processing your image. Please try again later.',
        timestamp: new Date(),
        isError: true
      };
      
      setMessages(prev => [...prev, errorMessage]);
      toast.error('Failed to process your image. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const processMessage = async (message, type) => {
    try {
      // Send message to backend
      const response = await axios.post('/api/chatbot/message', {
        message,
        messageType: type
      });

      // Add bot response to chat
      const botResponse = {
        type: 'bot',
        content: response.data.message,
        timestamp: new Date(),
        ticketCreated: response.data.ticketCreated,
        ticketId: response.data.ticketId
      };

      setMessages(prev => [...prev, botResponse]);

      // Show toast if ticket was created
      if (response.data.ticketCreated) {
        toast.success(`Ticket #${response.data.ticketId} has been created for your complaint.`);
      }
    } catch (error) {
      console.error('Error processing message:', error);
      
      // Add error message to chat
      const errorMessage = {
        type: 'bot',
        content: 'Sorry, I encountered an error processing your request. Please try again later.',
        timestamp: new Date(),
        isError: true
      };
      
      setMessages(prev => [...prev, errorMessage]);
      toast.error('Failed to process your message. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleVoiceInput = () => {
    setIsVoiceInputActive(!isVoiceInputActive);
    setIsImageUploadActive(false);
  };

  const toggleImageUpload = () => {
    setIsImageUploadActive(!isImageUploadActive);
    setIsVoiceInputActive(false);
  };

  return (
    <div className="bg-white rounded-lg shadow-xl w-full max-w-md h-[500px] flex flex-col">
      {/* Chatbot Header */}
      <div className="bg-primary-600 text-white px-4 py-3 rounded-t-lg flex justify-between items-center">
        <div className="flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
          <h3 className="font-semibold">AI Assistant</h3>
        </div>
        <button 
          onClick={onClose}
          className="text-white hover:text-gray-200 focus:outline-none"
          aria-label="Close chatbot"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      </div>

      {/* Messages Container */}
      <div className="flex-1 p-4 overflow-y-auto">
        {messages.map((message, index) => (
          <ChatMessage 
            key={index} 
            message={message} 
            onOptionSelect={handleOptionSelect}
          />
        ))}
        {isLoading && (
          <div className="flex items-center mt-2">
            <div className="bg-gray-200 rounded-full p-2 max-w-[80%]">
              <div className="flex space-x-2">
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Voice Input Component */}
      {isVoiceInputActive && (
        <div className="px-4 py-2 bg-gray-50 border-t border-gray-200">
          <VoiceInput onTranscript={handleVoiceInput} onCancel={() => setIsVoiceInputActive(false)} />
        </div>
      )}

      {/* Image Upload Component */}
      {isImageUploadActive && (
        <div className="px-4 py-2 bg-gray-50 border-t border-gray-200">
          <ImageUpload onImageUpload={handleImageUpload} onCancel={() => setIsImageUploadActive(false)} />
        </div>
      )}

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-gray-200 flex items-center">
        <button 
          type="button" 
          onClick={toggleVoiceInput}
          className={`p-2 rounded-full mr-2 focus:outline-none ${isVoiceInputActive ? 'bg-red-100 text-red-600' : 'text-gray-500 hover:text-primary-600'}`}
          aria-label="Voice input"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
          </svg>
        </button>
        <button 
          type="button" 
          onClick={toggleImageUpload}
          className={`p-2 rounded-full mr-2 focus:outline-none ${isImageUploadActive ? 'bg-blue-100 text-blue-600' : 'text-gray-500 hover:text-primary-600'}`}
          aria-label="Image upload"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </button>
        <input
          type="text"
          value={input}
          onChange={handleInputChange}
          placeholder="Type your message..."
          className="flex-1 border border-gray-300 rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          disabled={isLoading || isVoiceInputActive || isImageUploadActive}
          ref={inputRef}
        />
        <button 
          type="submit" 
          className="ml-2 bg-primary-600 text-white rounded-full p-2 hover:bg-primary-700 focus:outline-none disabled:opacity-50"
          disabled={!input.trim() || isLoading || isVoiceInputActive || isImageUploadActive}
          aria-label="Send message"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      </form>
    </div>
  );
};

export default Chatbot;