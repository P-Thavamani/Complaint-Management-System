import React, { useState, useRef, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import axios from '../../services/axios';
import { toast } from 'react-toastify';
import ChatMessage from './ChatMessage';
import VoiceInput from './VoiceInput';
import ImageUpload from './ImageUpload';
import { useAI } from '../hooks/useAI';

const Chatbot = ({ onClose, notifications = [] }) => {
	// Initialize with default welcome message
	const [messages, setMessages] = useState([
		{
			type: 'bot',
			content:
				"Hello! I'm your AI assistant. How can I help you today? You can type your complaint, use voice input, or upload an image of the issue.",
			timestamp: new Date(),
			options: []
		}
	]);

	// Process notifications and add them to messages
	useEffect(() => {
		if (notifications && notifications.length > 0) {
			const existingNotificationIds = messages.filter(msg => msg.isNotification).map(msg => msg.complaintId);
			const newNotifications = notifications.filter(notif => !existingNotificationIds.includes(notif.complaintId));
			if (newNotifications.length > 0) {
				const notificationMessages = newNotifications.map(notification => ({
					type: 'bot',
					content: `**Update on Ticket #${notification.ticketNumber}**: ${notification.message}`,
					timestamp: new Date(notification.updatedAt),
					isNotification: true,
					complaintId: notification.complaintId,
					ticketNumber: notification.ticketNumber,
					status: notification.status,
					options: [
						{ id: `view_status_${notification.complaintId}`, text: 'View Status' },
						{ id: 'solved', text: 'Mark as Resolved' }
					]
				}));
				setMessages(prev => [...prev, ...notificationMessages]);
			}
		}
	}, [notifications]);

	// Input state and refs
	const [input, setInput] = useState('');
	const [isLoading, setIsLoading] = useState(false);
	const [isVoiceInputActive, setIsVoiceInputActive] = useState(false);
	const [isImageUploadActive, setIsImageUploadActive] = useState(false);
	const [complaintCategories, setComplaintCategories] = useState({});

	// Update initial message with categories from state
	useEffect(() => {
		if (Object.keys(complaintCategories).length > 0) {
			setMessages(prev => {
				const updated = [...prev];
				if (updated.length > 0) {
					updated[0] = {
						...updated[0],
						options: Object.entries(complaintCategories).map(([id, category]) => ({ id, text: category.name }))
					};
				}
				return updated;
			});
		}
	}, [complaintCategories]);

	// Fetch categories from API
	useEffect(() => {
		const fetchCategories = async () => {
			try {
				const response = await axios.get('/api/categories/');
				setComplaintCategories(response.data);
			} catch (error) {
				console.error('Error fetching categories:', error);
				toast.error('Failed to load categories. Using default categories.');
			}
		};
		fetchCategories();
	}, []);

	// AI helpers
	const { createTicket, categorizeComplaint, determinePriority } = useAI();

	const messagesEndRef = useRef(null);
	const inputRef = useRef(null);

	useEffect(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
	}, [messages]);

	useEffect(() => {
		if (inputRef.current) inputRef.current.focus();
	}, []);

	const handleInputChange = e => setInput(e.target.value);

	// Handle option selection from the chatbot options
	const handleOptionSelect = async (optionId, optionText) => {
		const userMessage = {
			type: 'user',
			content: `I need help with: ${optionText}`,
			timestamp: new Date(),
			isOption: true
		};
		setMessages(prev => [...prev, userMessage]);
		setIsLoading(true);
		try {
			// Special option: view status
			if (optionId.startsWith('view_status_')) {
				const complaintId = optionId.replace('view_status_', '');
				try {
					const response = await axios.get(`/api/complaint-updates/status/${complaintId}`);
					const statusData = response.data;
					let statusMessage = `**Ticket #${statusData.ticketNumber} Status**\n\n`;
					statusMessage += `**Subject:** ${statusData.subject}\n`;
					statusMessage += `**Status:** ${statusData.status}\n`;
					statusMessage += `**Priority:** ${statusData.priority}\n`;
					statusMessage += `**Category:** ${statusData.category}\n`;
					statusMessage += `**Created:** ${new Date(statusData.createdAt).toLocaleString()}\n`;
					if (statusData.assignedTo) {
						statusMessage += `**Assigned To:** ${statusData.assignedTo.name}\n`;
					}
					if (statusData.estimatedResolutionTime) {
						statusMessage += `**Estimated Resolution:** ${new Date(statusData.estimatedResolutionTime).toLocaleString()}\n`;
					}
					if (statusData.status === 'in-progress' && statusData.inProgressAt) {
						statusMessage += `\nYour complaint is being processed since ${new Date(statusData.inProgressAt).toLocaleString()}.`;
					} else if (statusData.status === 'resolved' && statusData.resolvedAt) {
						statusMessage += `\nYour complaint was resolved on ${new Date(statusData.resolvedAt).toLocaleString()}.`;
					} else if (statusData.status === 'escalated' && statusData.escalatedAt) {
						statusMessage += `\nYour complaint was escalated on ${new Date(statusData.escalatedAt).toLocaleString()}.`;
					}
					const statusResponseMessage = {
						type: 'bot',
						content: statusMessage,
						timestamp: new Date(),
						isStatus: true,
						complaintId: complaintId,
						options: [
							{ id: `mark_as_resolved_${complaintId}`, text: 'Mark as Resolved' },
							{ id: 'open_ticket', text: 'Open New Ticket' }
						]
					};
					setMessages(prev => [...prev, statusResponseMessage]);
				} catch (error) {
					console.error('Error fetching complaint status:', error);
					setMessages(prev => [
						...prev,
						{
							type: 'bot',
							content: "Sorry, I couldn't retrieve the status of your complaint. Please try again later.",
							timestamp: new Date(),
							isError: true
						}
					]);
				}
				setIsLoading(false);
				return;
			}

			// Special option: issue solved
			if (optionId === 'solved') {
				try {
					const response = await axios.post('/api/chatbot/issue-solved', {}, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
					if (response.data.showThankYouPopup) {
						toast.success('Thank you for using our service! A confirmation has been sent to your email.', { position: 'top-center', autoClose: 5000 });
					}
					const thankYouMessage = {
						type: 'bot',
						content:
							'Thank you for using our service! We appreciate your feedback and are glad the solution helped resolve your issue. Your satisfaction is our priority. Is there anything else I can assist you with today?',
						timestamp: new Date(),
						options: Object.entries(complaintCategories).map(([id, category]) => ({ id, text: category.name }))
					};
					setMessages(prev => [...prev, thankYouMessage]);
					return;
				} catch (error) {
					console.error('Error processing solved status:', error);
					setMessages(prev => [
						...prev,
						{ type: 'bot', content: 'Sorry, there was an error processing your response. Please try again later.', timestamp: new Date(), isError: true }
					]);
					return;
				} finally {
					// handled
				}
			}

			// Special option: mark complaint as resolved
			if (optionId.startsWith('mark_as_resolved_')) {
				const complaintId = optionId.replace('mark_as_resolved_', '');
				setIsLoading(true);
				try {
					await axios.post(`/api/complaint-updates/resolve/${complaintId}`, {}, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
					toast.success('Complaint marked as resolved successfully!');
					const confirmationMessage = {
						id: uuidv4(),
						text: 'Thank you! Your complaint has been marked as resolved. We appreciate your feedback and are glad we could help resolve your issue.',
						sender: 'bot',
						timestamp: new Date().toISOString(),
						options: Object.entries(complaintCategories).map(([id, category]) => ({ id, text: category.name }))
					};
					setMessages(prev => [...prev, confirmationMessage]);
				} catch (error) {
					console.error('Error marking complaint as resolved:', error);
					setMessages(prev => [
						...prev,
						{ id: uuidv4(), text: "Sorry, I couldn't mark your complaint as resolved. Please try again later.", sender: 'bot', timestamp: new Date().toISOString(), isError: true }
					]);
					toast.error('Failed to mark complaint as resolved');
				} finally {
					setIsLoading(false);
				}
				return;
			}

			// Open ticket flow
			if (optionId === 'open_ticket') {
				const ticketFormMessage = {
					type: 'bot',
					content:
						"Please provide additional details about your issue in the text box below. Be specific about what you're experiencing to help us resolve your issue faster:",
					timestamp: new Date(),
					isTicketForm: true,
					showDescriptionField: true,
					options: [{ id: 'submit-ticket', text: 'Submit Ticket' }]
				};
				window.issueDescription = null;
				setMessages(prev => [...prev, ticketFormMessage]);
				return;
			}

			// Category selection handling
			const isMainCategory = Object.keys(complaintCategories).includes(optionId);
			const [mainCategory, subCategory] = isMainCategory ? [optionId, null] : optionId.split('.');

			if (isMainCategory && complaintCategories[mainCategory]) {
				const categoryData = complaintCategories[mainCategory];
				const subcategories = categoryData.subcategories;
				const subcategoryOptions = Object.entries(subcategories).map(([id, data]) => ({ id: `${mainCategory}.${id}`, text: data.name }));
				const botResponse = {
					type: 'bot',
					content: `Please select a specific issue related to ${categoryData.name}:`,
					timestamp: new Date(),
					options: subcategoryOptions,
					category: mainCategory
				};
				setMessages(prev => [...prev, botResponse]);
			} else if (!isMainCategory && complaintCategories[mainCategory] && complaintCategories[mainCategory].subcategories && complaintCategories[mainCategory].subcategories[subCategory]) {
				const categoryData = complaintCategories[mainCategory];
				const subcategoryData = categoryData.subcategories[subCategory];
				const problemSolutionContent = `
**Problem:** ${subcategoryData.problem}

**Solution:**
${subcategoryData.solution.map(step => `• ${step}`).join('\n')}

If the provided solution does not work, you can click "Open Ticket" to get help from our support team.`;
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
			}

			// Submit ticket flow
			if (optionId === 'submit-ticket') {
				try {
					const lastMessage = messages[messages.length - 2];
					const category = lastMessage.category || lastMessage.selectedCategory || 'general';
					const description = window.issueDescription || '';
					if (!description || description.trim() === '') {
						setMessages(prev => [
							...prev,
							{
								type: 'bot',
								content: 'Please provide a description of your issue before submitting the ticket.',
								timestamp: new Date(),
								isError: true,
								showDescriptionField: true,
								options: [{ id: 'submit-ticket', text: 'Submit Ticket' }]
							}
						]);
						return;
					}
					const priority = determinePriority(description);
					const response = await axios.post('/api/chatbot/create-ticket', {
						subject: `${category} issue`,
						description,
						category,
						priority,
						imageUrl: lastMessage.imageUrl,
						detectedObjects: lastMessage.detectedObjects
					});
					window.issueDescription = null;
					setMessages(prev => [
						...prev,
						{ type: 'bot', content: 'Your ticket has been created successfully!', timestamp: new Date(), ticketCreated: true, ticketId: response.data.ticketNumber }
					]);
					toast.success('Ticket created successfully!', { position: 'top-right', autoClose: 3000 });
				} catch (error) {
					console.error('Error creating ticket:', error);
					setMessages(prev => [
						...prev,
						{ type: 'bot', content: 'Sorry, there was an error creating your ticket. Please try again later.', timestamp: new Date(), isError: true }
					]);
				}
			}
		} catch (error) {
			console.error('Error processing option:', error);
			setMessages(prev => [
				...prev,
				{ type: 'bot', content: 'Sorry, I encountered an error processing your selection. Please try again or type your issue directly.', timestamp: new Date(), isError: true }
			]);
		} finally {
			setIsLoading(false);
		}
	};

	const handleSubmit = async e => {
		e.preventDefault();
		if (!input.trim() && !isVoiceInputActive && !isImageUploadActive) return;
		const userMessage = { type: 'user', content: input, timestamp: new Date() };
		setMessages(prev => [...prev, userMessage]);
		setInput('');
		setIsLoading(true);
		try {
			const response = await axios.post('/api/chatbot/message', { message: input, messageType: 'text' });
			const category = categorizeComplaint(input);
			const priority = determinePriority(input);
			const initialResponse = { type: 'bot', content: response.data.message, timestamp: new Date(), suggestTicket: response.data.suggestTicket || false };
			setMessages(prev => [...prev, initialResponse]);
			if (response.data.suggestTicket || input.toLowerCase().includes('complaint') || input.toLowerCase().includes('issue') || input.toLowerCase().includes('problem')) {
				const aiFeatureMessage = {
					type: 'bot',
					content: 'I can help you with your complaint using these AI features:',
					timestamp: new Date(),
					aiFeatures: [
						{ title: 'Automatic Ticket Creation', description: 'Upon registering a complaint, the system automatically generates a ticket with all relevant details.' },
						{ title: 'Intelligent Categorization', description: 'AI will categorize tickets based on predefined categories (e.g., billing, technical, service) using machine learning models.' },
						{ title: 'Prioritization System', description: "AI will assign priority levels (urgent, high, medium, low) based on the complaint's nature and keywords." },
						{ title: 'Dynamic Assignment', description: 'The system will use AI to intelligently assign tickets to the relevant teams or agents based on expertise, workload, and availability.' }
					]
				};
				setMessages(prev => [...prev, aiFeatureMessage]);
				const ticketResult = await createTicket(input, category, priority);
				if (ticketResult.success) {
					const ticketMessage = { type: 'bot', content: `I've analyzed your complaint and created a ticket for you. Category: ${category}, Priority: ${priority}`, timestamp: new Date(), ticketCreated: true, ticketId: ticketResult.ticketId };
					setMessages(prev => [...prev, ticketMessage]);
					toast.success(`Ticket #${ticketResult.ticketId} has been created for your complaint.`);
				}
			}
		} catch (error) {
			console.error('Error sending message:', error);
			setMessages(prev => [...prev, { type: 'bot', content: 'Sorry, I encountered an error processing your request. Please try again later.', timestamp: new Date(), isError: true }]);
			toast.error('Failed to process your message. Please try again.');
		} finally {
			setIsLoading(false);
		}
	};

	const handleVoiceInput = transcript => {
		const userMessage = { type: 'user', content: transcript, timestamp: new Date(), isVoice: true };
		setMessages(prev => [...prev, userMessage]);
		setIsLoading(true);
		setIsVoiceInputActive(false);
		processMessage(transcript, 'voice');
	};

	const handleImageUpload = async imageFile => {
		const userMessage = { type: 'user', content: 'Image uploaded', timestamp: new Date(), isImage: true, imageUrl: URL.createObjectURL(imageFile) };
		setMessages(prev => [...prev, userMessage]);
		setIsLoading(true);
		setIsImageUploadActive(false);
		try {
			const formData = new FormData();
			formData.append('image', imageFile);
			const response = await axios.post('/api/chatbot/process-image', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
			const botResponse = {
				type: 'bot',
				content: response.data.message,
				timestamp: new Date(),
				detectedObjects: response.data.detectedObjects,
				ticketCreated: response.data.ticketCreated,
				ticketId: response.data.ticketId,
				imageUrl: response.data.imageUrl
			};
			setMessages(prev => [...prev, botResponse]);
			if (response.data.ticketCreated) toast.success(`Ticket #${response.data.ticketId} has been created for your complaint.`);
		} catch (error) {
			console.error('Error processing image:', error);
			setMessages(prev => [...prev, { type: 'bot', content: 'Sorry, I encountered an error processing your image. Please try again later.', timestamp: new Date(), isError: true }]);
			toast.error('Failed to process your image. Please try again.');
		} finally {
			setIsLoading(false);
		}
	};

	const processMessage = async (message, type) => {
		try {
			const response = await axios.post('/api/chatbot/message', { message, messageType: type });
			const botResponse = { type: 'bot', content: response.data.message, timestamp: new Date(), ticketCreated: response.data.ticketCreated, ticketId: response.data.ticketId };
			setMessages(prev => [...prev, botResponse]);
			if (response.data.ticketCreated) toast.success(`Ticket #${response.data.ticketId} has been created for your complaint.`);
		} catch (error) {
			console.error('Error processing message:', error);
			setMessages(prev => [...prev, { type: 'bot', content: 'Sorry, I encountered an error processing your request. Please try again later.', timestamp: new Date(), isError: true }]);
			toast.error('Failed to process your message. Please try again.');
		} finally {
			setIsLoading(false);
		}
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
				<button onClick={onClose} className="text-white hover:text-gray-200 focus:outline-none" aria-label="Close chatbot">
					<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
						<path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
					</svg>
				</button>
			</div>

			{/* Messages Container */}
			<div className="flex-1 p-4 overflow-y-auto">
				{messages.map((message, index) => (
					<ChatMessage key={index} message={message} onOptionSelect={handleOptionSelect} />
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
				<button type="button" onClick={() => { setIsVoiceInputActive(!isVoiceInputActive); setIsImageUploadActive(false); }} className={`p-2 rounded-full mr-2 focus:outline-none ${isVoiceInputActive ? 'bg-red-100 text-red-600' : 'text-gray-500 hover:text-primary-600'}`} aria-label="Voice input">
					<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
					</svg>
				</button>
				<button type="button" onClick={() => { setIsImageUploadActive(!isImageUploadActive); setIsVoiceInputActive(false); }} className={`p-2 rounded-full mr-2 focus:outline-none ${isImageUploadActive ? 'bg-blue-100 text-blue-600' : 'text-gray-500 hover:text-primary-600'}`} aria-label="Image upload">
					<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
					</svg>
				</button>
				<input type="text" value={input} onChange={handleInputChange} placeholder="Type your message..." className="flex-1 border border-gray-300 rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent" disabled={isLoading || isVoiceInputActive || isImageUploadActive} ref={inputRef} />
				<button type="submit" className="ml-2 bg-primary-600 text-white rounded-full p-2 hover:bg-primary-700 focus:outline-none disabled:opacity-50" disabled={!input.trim() || isLoading || isVoiceInputActive || isImageUploadActive} aria-label="Send message">
					<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
						<path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clipRule="evenodd" />
					</svg>
				</button>
			</form>
		</div>
	);
};

export default Chatbot;