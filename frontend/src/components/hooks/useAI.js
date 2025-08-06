import { useState } from 'react';
import axios from '../../services/axios';

export const useAI = () => {
  const [isProcessing, setIsProcessing] = useState(false);

  // Function to handle automatic ticket creation
  const createTicket = async (message, category, priority) => {
    setIsProcessing(true);
    try {
      const response = await axios.post('/api/complaints', {
        subject: message.substring(0, 50) + (message.length > 50 ? '...' : ''),
        description: message,
        category: category || 'other',
        priority: priority || 'medium'
      });
      
      setIsProcessing(false);
      return {
        success: true,
        ticketId: response.data.id,
        message: `Ticket #${response.data.id} has been created successfully.`
      };
    } catch (error) {
      console.error('Error creating ticket:', error);
      setIsProcessing(false);
      return {
        success: false,
        message: 'Failed to create ticket. Please try again.'
      };
    }
  };

  // Function to categorize complaint based on content
  const categorizeComplaint = (message) => {
    // Categories with their related keywords
    const categories = {
      hardware: ['computer', 'laptop', 'printer', 'device', 'hardware', 'monitor', 'keyboard', 'mouse', 'broken', 'damaged'],
      software: ['software', 'program', 'application', 'app', 'system', 'bug', 'error', 'crash', 'freezing', 'slow'],
      network: ['network', 'internet', 'wifi', 'connection', 'server', 'down', 'slow', 'access', 'connectivity'],
      service: ['service', 'support', 'help', 'assistance', 'response', 'delay', 'waiting', 'customer service'],
      billing: ['bill', 'invoice', 'payment', 'charge', 'subscription', 'pricing', 'cost', 'fee', 'overcharge']
    };
    
    // Convert message to lowercase for case-insensitive matching
    const lowerMessage = message.toLowerCase();
    
    // Check each category for keyword matches
    for (const [category, keywords] of Object.entries(categories)) {
      if (keywords.some(keyword => lowerMessage.includes(keyword))) {
        return category;
      }
    }
    
    // Default category if no matches found
    return 'other';
  };

  // Function to determine priority based on message content
  const determinePriority = (message) => {
    // Priority keywords
    const priorities = {
      urgent: ['urgent', 'emergency', 'immediate', 'critical', 'asap', 'serious', 'severe', 'outage'],
      high: ['high', 'important', 'priority', 'significant', 'major', 'crucial'],
      medium: ['medium', 'moderate', 'average', 'standard', 'normal'],
      low: ['low', 'minor', 'trivial', 'small', 'not urgent', 'when possible']
    };
    
    // Convert message to lowercase for case-insensitive matching
    const lowerMessage = message.toLowerCase();
    
    // Check for priority keywords
    if (priorities.urgent.some(keyword => lowerMessage.includes(keyword))) {
      return 'urgent';
    } else if (priorities.high.some(keyword => lowerMessage.includes(keyword))) {
      return 'high';
    } else if (priorities.low.some(keyword => lowerMessage.includes(keyword))) {
      return 'low';
    }
    
    // Default priority
    return 'medium';
  };

  // Function to determine the best team/agent for assignment
  const determineAssignment = async (category, priority) => {
    try {
      // Get available agents/teams
      const response = await axios.get('/api/admin/agents');
      const agents = response.data;
      
      // Filter agents by expertise in the category
      const qualifiedAgents = agents.filter(agent => 
        agent.expertise.includes(category) || agent.expertise.includes('all')
      );
      
      if (qualifiedAgents.length === 0) {
        // If no qualified agents, assign to default team
        return 'support-team';
      }
      
      // Sort by workload (ascending) and availability
      const sortedAgents = qualifiedAgents.sort((a, b) => {
        // Prioritize available agents
        if (a.available && !b.available) return -1;
        if (!a.available && b.available) return 1;
        
        // Then sort by workload
        return a.currentWorkload - b.currentWorkload;
      });
      
      // For urgent tickets, assign to agent with highest expertise level
      if (priority === 'urgent') {
        const expertAgents = sortedAgents.filter(agent => agent.expertiseLevel >= 4);
        if (expertAgents.length > 0) {
          return expertAgents[0].id;
        }
      }
      
      // Otherwise assign to first available agent with lowest workload
      return sortedAgents[0]?.id || 'support-team';
    } catch (error) {
      console.error('Error determining assignment:', error);
      return 'support-team'; // Default fallback
    }
  };

  return {
    isProcessing,
    createTicket,
    categorizeComplaint,
    determinePriority,
    determineAssignment
  };
};