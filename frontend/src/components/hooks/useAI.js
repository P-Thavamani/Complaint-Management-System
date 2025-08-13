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

<<<<<<< HEAD
  // Function to categorize complaint based on content with enhanced keyword matching
  const categorizeComplaint = (message) => {
    // Categories with their related keywords - expanded for better matching
    const categories = {
      hardware: ['computer', 'laptop', 'printer', 'device', 'hardware', 'monitor', 'keyboard', 'mouse', 'broken', 'damaged', 'physical', 'equipment', 'peripheral', 'screen', 'display', 'power', 'battery', 'charger', 'adapter', 'port', 'usb', 'hdmi'],
      software: ['software', 'program', 'application', 'app', 'system', 'bug', 'error', 'crash', 'freezing', 'slow', 'update', 'upgrade', 'install', 'uninstall', 'version', 'compatibility', 'windows', 'mac', 'linux', 'operating system', 'driver', 'antivirus', 'malware', 'virus', 'login', 'password', 'account'],
      network: ['network', 'internet', 'wifi', 'connection', 'server', 'down', 'slow', 'access', 'connectivity', 'router', 'modem', 'ethernet', 'wireless', 'signal', 'strength', 'speed', 'bandwidth', 'latency', 'ping', 'dns', 'ip address', 'vpn', 'proxy', 'firewall', 'security'],
      service: ['service', 'support', 'help', 'assistance', 'response', 'delay', 'waiting', 'customer service', 'representative', 'agent', 'staff', 'employee', 'manager', 'supervisor', 'escalation', 'resolution', 'solution', 'follow-up', 'callback', 'appointment', 'schedule', 'booking', 'reservation', 'cancellation'],
      billing: ['bill', 'invoice', 'payment', 'charge', 'subscription', 'pricing', 'cost', 'fee', 'overcharge', 'refund', 'credit', 'debit', 'transaction', 'receipt', 'statement', 'account', 'balance', 'due date', 'late fee', 'discount', 'promotion', 'coupon', 'plan', 'package', 'upgrade', 'downgrade', 'cancel']
=======
  // Function to categorize complaint based on content
  const categorizeComplaint = (message) => {
    // Categories with their related keywords
    const categories = {
      hardware: ['computer', 'laptop', 'printer', 'device', 'hardware', 'monitor', 'keyboard', 'mouse', 'broken', 'damaged'],
      software: ['software', 'program', 'application', 'app', 'system', 'bug', 'error', 'crash', 'freezing', 'slow'],
      network: ['network', 'internet', 'wifi', 'connection', 'server', 'down', 'slow', 'access', 'connectivity'],
      service: ['service', 'support', 'help', 'assistance', 'response', 'delay', 'waiting', 'customer service'],
      billing: ['bill', 'invoice', 'payment', 'charge', 'subscription', 'pricing', 'cost', 'fee', 'overcharge']
>>>>>>> ff5d7d2ee5773ae90cf8a051ccc6605ddc57581a
    };
    
    // Convert message to lowercase for case-insensitive matching
    const lowerMessage = message.toLowerCase();
    
<<<<<<< HEAD
    // Count matches for each category to find the best match
    let bestCategory = 'other';
    let highestMatchCount = 0;
    
    for (const [category, keywords] of Object.entries(categories)) {
      const matchCount = keywords.filter(keyword => lowerMessage.includes(keyword)).length;
      
      if (matchCount > highestMatchCount) {
        highestMatchCount = matchCount;
        bestCategory = category;
      }
    }
    
    // Only return a category if we have at least one match, otherwise return 'other'
    return highestMatchCount > 0 ? bestCategory : 'other';
  };

  // Function to determine priority based on message content with enhanced analysis
  const determinePriority = (message) => {
    // Priority keywords - expanded for better matching
    const priorities = {
      urgent: ['urgent', 'emergency', 'immediate', 'critical', 'asap', 'serious', 'severe', 'outage', 'danger', 'safety', 'life-threatening', 'security breach', 'hacked', 'compromised', 'data loss', 'complete failure', 'system down', 'production stopped', 'business impact', 'revenue loss', 'deadline', 'today', 'now', 'immediately', 'right away', 'cannot work', 'blocked', 'stranded'],
      high: ['high', 'important', 'priority', 'significant', 'major', 'crucial', 'essential', 'necessary', 'required', 'vital', 'key', 'primary', 'main', 'central', 'core', 'fundamental', 'pressing', 'urgent but not emergency', 'as soon as possible', 'affecting work', 'productivity impact', 'customer facing', 'client', 'deadline approaching', 'tomorrow', 'this week'],
      medium: ['medium', 'moderate', 'average', 'standard', 'normal', 'regular', 'common', 'typical', 'usual', 'ordinary', 'conventional', 'routine', 'everyday', 'general', 'soon', 'when convenient', 'next few days', 'this month', 'partial functionality', 'workaround available', 'alternative solution'],
      low: ['low', 'minor', 'trivial', 'small', 'not urgent', 'when possible', 'minimal', 'insignificant', 'negligible', 'slight', 'little', 'marginal', 'secondary', 'auxiliary', 'supplementary', 'whenever', 'no rush', 'no hurry', 'take your time', 'eventually', 'someday', 'cosmetic issue', 'enhancement', 'nice to have', 'improvement suggestion']
=======
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
>>>>>>> ff5d7d2ee5773ae90cf8a051ccc6605ddc57581a
    };
    
    // Convert message to lowercase for case-insensitive matching
    const lowerMessage = message.toLowerCase();
    
<<<<<<< HEAD
    // Count matches for each priority level to determine the best match
    let priorityScores = {
      urgent: 0,
      high: 0,
      medium: 0,
      low: 0
    };
    
    // Calculate scores for each priority level
    for (const [priority, keywords] of Object.entries(priorities)) {
      priorityScores[priority] = keywords.filter(keyword => lowerMessage.includes(keyword)).length;
    }
    
    // Apply weighting to certain categories based on their importance
    priorityScores.urgent *= 2; // Double the weight of urgent keywords
    priorityScores.high *= 1.5; // 1.5x weight for high priority keywords
    
    // Find the priority with the highest score
    let highestPriority = 'medium'; // Default to medium
    let highestScore = 0;
    
    for (const [priority, score] of Object.entries(priorityScores)) {
      if (score > highestScore) {
        highestScore = score;
        highestPriority = priority;
      }
    }
    
    // If no keywords matched or all scores are 0, return medium as default
    return highestScore > 0 ? highestPriority : 'medium';
=======
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
>>>>>>> ff5d7d2ee5773ae90cf8a051ccc6605ddc57581a
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