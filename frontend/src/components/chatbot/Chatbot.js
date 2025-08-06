import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import ChatMessage from './ChatMessage';
import VoiceInput from './VoiceInput';
import ImageUpload from './ImageUpload';

const Chatbot = ({ onClose }) => {
  const [messages, setMessages] = useState([{
    type: 'bot',
    content: 'Hello! I\'m your AI assistant. How can I help you today? You can type your complaint, use voice input, or upload an image of the issue.',
    timestamp: new Date()
  }]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isVoiceInputActive, setIsVoiceInputActive] = useState(false);
  const [isImageUploadActive, setIsImageUploadActive] = useState(false);
  
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
          <ChatMessage key={index} message={message} />
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