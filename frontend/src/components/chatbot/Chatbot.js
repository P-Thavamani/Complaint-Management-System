import React, { useState, useRef, useEffect } from 'react';
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
			content: "Hello! I'm Griev AI, your grievance management assistant. How can I help you today?",
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
	}, [notifications]); // eslint-disable-line react-hooks/exhaustive-deps

	// Input state and refs
	const [input, setInput] = useState('');
	const [isLoading, setIsLoading] = useState(false);
	const [isVoiceInputActive, setIsVoiceInputActive] = useState(false);
	const [isImageUploadActive, setIsImageUploadActive] = useState(false);
	const [complaintCategories, setComplaintCategories] = useState({});
	// Track pending complaint description for ticket creation
	const [pendingComplaint, setPendingComplaint] = useState(null);

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
			}
		};
		fetchCategories();
	}, []);

	// AI helpers
	const { categorizeComplaint, determinePriority } = useAI();

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
			content: optionText,
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
					const response = await axios.get(`/api/complaint_updates/status/${complaintId}`);
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
					if (statusData.status === 'in-progress' && statusData.inProgressAt) {
						statusMessage += `\nYour complaint is being processed since ${new Date(statusData.inProgressAt).toLocaleString()}.`;
					} else if (statusData.status === 'resolved' && statusData.resolvedAt) {
						statusMessage += `\nYour complaint was resolved on ${new Date(statusData.resolvedAt).toLocaleString()}.`;
					} else if (statusData.status === 'escalated' && statusData.escalatedAt) {
						statusMessage += `\nYour complaint was escalated on ${new Date(statusData.escalatedAt).toLocaleString()}.`;
					}
					setMessages(prev => [...prev, {
						type: 'bot',
						content: statusMessage,
						timestamp: new Date(),
						isStatus: true,
						complaintId,
						options: [
							{ id: `mark_as_resolved_${complaintId}`, text: 'Mark as Resolved' },
							{ id: 'open_ticket', text: 'Open New Ticket' }
						]
					}]);
				} catch (error) {
					console.error('Error fetching complaint status:', error);
					setMessages(prev => [...prev, {
						type: 'bot',
						content: "Sorry, I couldn't retrieve the status of your complaint. Please try again later.",
						timestamp: new Date(),
						isError: true
					}]);
				}
				setIsLoading(false);
				return;
			}

			// Special option: issue solved
			if (optionId === 'solved') {
				try {
					const response = await axios.post('/api/chatbot/issue-solved', {});
					if (response.data.showThankYouPopup) {
						toast.success('Thank you for using our service! A confirmation has been sent to your email.', { position: 'top-center', autoClose: 5000 });
					}
					setMessages(prev => [...prev, {
						type: 'bot',
						content: 'Thank you! We\'re glad we could help resolve your issue. Is there anything else I can assist you with?',
						timestamp: new Date(),
						options: Object.entries(complaintCategories).map(([id, category]) => ({ id, text: category.name }))
					}]);
					return;
				} catch (error) {
					console.error('Error processing solved status:', error);
					setMessages(prev => [...prev, {
						type: 'bot',
						content: 'Sorry, there was an error processing your response. Please try again later.',
						timestamp: new Date(),
						isError: true
					}]);
					return;
				}
			}

			// Special option: mark complaint as resolved
			if (optionId.startsWith('mark_as_resolved_')) {
				const complaintId = optionId.replace('mark_as_resolved_', '');
				try {
					await axios.post(`/api/complaint_updates/resolve/${complaintId}`, {});
					toast.success('Complaint marked as resolved successfully!');
					setMessages(prev => [...prev, {
						type: 'bot',
						content: 'Your complaint has been marked as resolved. Thank you for using our service!',
						timestamp: new Date(),
						options: Object.entries(complaintCategories).map(([id, category]) => ({ id, text: category.name }))
					}]);
				} catch (error) {
					console.error('Error marking complaint as resolved:', error);
					setMessages(prev => [...prev, {
						type: 'bot',
						content: "Sorry, I couldn't mark your complaint as resolved. Please try again later.",
						timestamp: new Date(),
						isError: true
					}]);
					toast.error('Failed to mark complaint as resolved');
				}
				setIsLoading(false);
				return;
			}

			// Open ticket flow
			if (optionId === 'open_ticket') {
				// Preserve imageUrl if one was uploaded before clicking this button
				setPendingComplaint(prev => ({ category: 'general', imageUrl: prev?.imageUrl || null }));
				setMessages(prev => [...prev, {
					type: 'bot',
					content: "Please describe your issue in detail below, then click **Submit Ticket**:",
					timestamp: new Date(),
					isTicketForm: true,
					showDescriptionField: true,
					options: []
				}]);
				setIsLoading(false);
				return;
			}

			if (optionId === 'confirm_ticket' && pendingComplaint) {
				const { subject, description, category, priority, imageUrl } = pendingComplaint;
				try {
					const response = await axios.post('/api/chatbot/create-ticket', {
						subject: subject || `${category} issue`,
						description,
						category: category || 'other',
						priority: priority || determinePriority(description),
						imageUrl: imageUrl || null,
					});
					setPendingComplaint(null);
					setMessages(prev => [...prev, {
						type: 'bot',
						content: `✅ Your ticket **#${response.data.ticketNumber}** has been created successfully! Our team will get back to you shortly.`,
						timestamp: new Date(),
						ticketCreated: true,
						ticketId: response.data.ticketNumber,
						options: []
					}]);
					toast.success(`Ticket #${response.data.ticketNumber} created!`);
				} catch (error) {
					console.error('Error creating ticket:', error);
					setMessages(prev => [...prev, {
						type: 'bot',
						content: 'Sorry, there was an error creating your ticket. Please try again.',
						timestamp: new Date(),
						isError: true
					}]);
				}
				setIsLoading(false);
				return;
			}

			// Cancel pending ticket
			if (optionId === 'cancel_ticket') {
				setPendingComplaint(null);
				setMessages(prev => [...prev, {
					type: 'bot',
					content: 'No problem! How else can I help you?',
					timestamp: new Date(),
					options: Object.entries(complaintCategories).map(([id, category]) => ({ id, text: category.name }))
				}]);
				setIsLoading(false);
				return;
			}

			// Category selection handling
			const isMainCategory = Object.keys(complaintCategories).includes(optionId);
			const [mainCategory, subCategory] = isMainCategory ? [optionId, null] : optionId.split('.');

			if (isMainCategory && complaintCategories[mainCategory]) {
				const categoryData = complaintCategories[mainCategory];
				const subcategories = categoryData.subcategories;
				const subcategoryOptions = Object.entries(subcategories).map(([id, data]) => ({ id: `${mainCategory}.${id}`, text: data.name }));
				setMessages(prev => [...prev, {
					type: 'bot',
					content: `Please select a specific issue related to **${categoryData.name}**:`,
					timestamp: new Date(),
					options: subcategoryOptions,
					category: mainCategory
				}]);
			} else if (!isMainCategory && complaintCategories[mainCategory] && complaintCategories[mainCategory].subcategories && complaintCategories[mainCategory].subcategories[subCategory]) {
				const categoryData = complaintCategories[mainCategory];
				const subcategoryData = categoryData.subcategories[subCategory];
				const problemSolutionContent = `**Problem:** ${subcategoryData.problem}\n\n**Solution:**\n${subcategoryData.solution.map(step => `• ${step}`).join('\n')}\n\nIf the provided solution does not work, click "Open Ticket" to get help from our support team.`;
				setMessages(prev => [...prev, {
					type: 'bot',
					content: problemSolutionContent,
					timestamp: new Date(),
					category: mainCategory,
					subcategory: subCategory,
					options: [
						{ id: 'open_ticket', text: '📋 Open Ticket' },
						{ id: 'solved', text: '✅ Issue Solved' }
					]
				}]);
			}

		} catch (error) {
			console.error('Error processing option:', error);
			setMessages(prev => [...prev, {
				type: 'bot',
				content: 'Sorry, I encountered an error processing your selection. Please try again or type your issue directly.',
				timestamp: new Date(),
				isError: true
			}]);
		} finally {
			setIsLoading(false);
		}
	};

	const handleSubmit = async e => {
		e.preventDefault();
		if (!input.trim()) return;
		
		const userInput = input.trim();
		const userMessage = { type: 'user', content: userInput, timestamp: new Date() };
		setMessages(prev => [...prev, userMessage]);
		setInput('');
		setIsLoading(true);

		// Check if there's a pending ticket form — this is the description
		const lastMsg = messages[messages.length - 1];
		if (lastMsg && lastMsg.isTicketForm) {
			// User is providing complaint description
			const category = pendingComplaint?.category || categorizeComplaint(userInput);
			const priority = determinePriority(userInput);
			const subject = userInput.length > 60 ? userInput.substring(0, 60) + '...' : userInput;
			
			setPendingComplaint(prev => ({ subject, description: userInput, category, priority, imageUrl: prev?.imageUrl || null }));
			setMessages(prev => [...prev, {
				type: 'bot',
				content: `I'll create a ticket with the following details:\n\n**Subject:** ${subject}\n**Category:** ${category}\n**Priority:** ${priority}\n\nShall I proceed?`,
				timestamp: new Date(),
				options: [
					{ id: 'confirm_ticket', text: '✅ Yes, Create Ticket' },
					{ id: 'cancel_ticket', text: '❌ Cancel' }
				]
			}]);
			setIsLoading(false);
			return;
		}

		try {
			const response = await axios.post('/api/chatbot/message', { message: userInput, messageType: 'text' });
			const data = response.data;

			// Show the main bot response
			setMessages(prev => [...prev, {
				type: 'bot',
				content: data.message,
				timestamp: new Date(),
				options: []
			}]);

			// If bot suggests creating a ticket
			if (data.suggestTicket && data.ticketData) {
				const { subject, description, category, priority } = data.ticketData;
				setPendingComplaint(prev => ({ subject, description, category, priority, imageUrl: prev?.imageUrl || null }));
				setTimeout(() => {
					setMessages(prev => [...prev, {
						type: 'bot',
						content: `I've analyzed your message and prepared a ticket:\n\n**Subject:** ${subject}\n**Category:** ${category}\n**Priority:** ${priority}\n\nShall I create this ticket for you?`,
						timestamp: new Date(),
						options: [
							{ id: 'confirm_ticket', text: '✅ Yes, Create Ticket' },
							{ id: 'open_ticket', text: '✏️ Edit Description' },
							{ id: 'cancel_ticket', text: '❌ Cancel' }
						]
					}]);
				}, 300);
			} else if (data.intent === 'complaint' && !data.suggestTicket) {
				// Complaint detected but no ticket data — show options
				setTimeout(() => {
					setMessages(prev => [...prev, {
						type: 'bot',
						content: 'Would you like to raise a formal complaint ticket?',
						timestamp: new Date(),
						options: [
							{ id: 'open_ticket', text: '📋 Open Ticket' },
							...Object.entries(complaintCategories).slice(0, 3).map(([id, cat]) => ({ id, text: cat.name }))
						]
					}]);
				}, 300);
			}

		} catch (error) {
			console.error('Error sending message:', error);
			setMessages(prev => [...prev, {
				type: 'bot',
				content: 'Sorry, I encountered an error processing your request. Please try again later.',
				timestamp: new Date(),
				isError: true
			}]);
			toast.error('Failed to process your message. Please try again.');
		} finally {
			setIsLoading(false);
		}
	};

	const handleVoiceInput = transcript => {
		setInput(transcript);
		setIsVoiceInputActive(false);
		// Focus input so user can review/edit before sending
		if (inputRef.current) {
			inputRef.current.focus();
		}
		toast.info(`Voice captured: "${transcript}"`, { autoClose: 2000 });
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
				content: response.data.message || "I've received your image. Please describe the issue you're experiencing.",
				timestamp: new Date(),
				detectedObjects: response.data.detectedObjects,
				imageUrl: response.data.imageUrl,
				options: [
					{ id: 'open_ticket', text: '📋 Create Ticket with Image' }
				]
			};
			setMessages(prev => [...prev, botResponse]);
			if (response.data.imageUrl) {
				setPendingComplaint(prev => ({ ...prev, imageUrl: response.data.imageUrl }));
			}
		} catch (error) {
			console.error('Error processing image:', error);
			setMessages(prev => [...prev, { type: 'bot', content: 'Sorry, I encountered an error processing your image. Please try again later.', timestamp: new Date(), isError: true }]);
			toast.error('Failed to process your image. Please try again.');
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className="bg-white rounded-lg w-full flex flex-col" style={{ height: '100%' }}>
			{/* Messages Container */}
			<div className="flex-1 p-4 overflow-y-auto">
				{messages.map((message, index) => (
					<ChatMessage key={index} message={message} onOptionSelect={handleOptionSelect} />
				))}
				{isLoading && (
					<div className="flex items-center mt-2">
						<div className="bg-gray-100 rounded-full px-3 py-2">
							<div className="flex space-x-1.5">
								<div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"></div>
								<div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
								<div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
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
			<form onSubmit={handleSubmit} className="p-3 border-t border-gray-200 flex items-center gap-2">
				<button
					type="button"
					onClick={() => { setIsVoiceInputActive(!isVoiceInputActive); setIsImageUploadActive(false); }}
					className={`p-2 rounded-full flex-shrink-0 focus:outline-none transition-colors ${isVoiceInputActive ? 'bg-red-100 text-red-600' : 'text-gray-400 hover:text-indigo-600 hover:bg-indigo-50'}`}
					aria-label="Voice input"
					title="Voice input"
				>
					<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
					</svg>
				</button>
				<button
					type="button"
					onClick={() => { setIsImageUploadActive(!isImageUploadActive); setIsVoiceInputActive(false); }}
					className={`p-2 rounded-full flex-shrink-0 focus:outline-none transition-colors ${isImageUploadActive ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-indigo-600 hover:bg-indigo-50'}`}
					aria-label="Image upload"
					title="Upload image"
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
					className="flex-1 border border-gray-300 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
					disabled={isLoading || isVoiceInputActive || isImageUploadActive}
					ref={inputRef}
				/>
				<button
					type="submit"
					className="bg-indigo-600 text-white rounded-full p-2 flex-shrink-0 hover:bg-indigo-700 focus:outline-none disabled:opacity-50 transition-colors"
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