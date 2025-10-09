import React, { useState } from 'react';
import { toast } from 'react-toastify';
import axios from '../services/axios';

const EscalationCheck = ({ complaintId, onEscalationComplete }) => {
    const [loading, setLoading] = useState(false);

    const handleEscalationCheck = async () => {
        setLoading(true);
        try {
            const response = await axios.post('/api/complaints/escalation-check', {
                complaint_id: complaintId
            });

            const { results } = response.data;
            
            // Process results
            results.forEach(result => {
                if (result.escalated) {
                    toast.warning(
                        <div>
                            <p className="font-bold">Complaint Escalated</p>
                            <p className="text-sm">Reasons:</p>
                            <ul className="list-disc pl-4 text-sm">
                                {result.reasons.map((reason, index) => (
                                    <li key={index}>{reason}</li>
                                ))}
                            </ul>
                        </div>,
                        { autoClose: 5000 }
                    );
                } else {
                    toast.success('No escalation needed');
                }
            });

            // Notify parent component if callback provided
            if (onEscalationComplete) {
                onEscalationComplete(results);
            }

        } catch (error) {
            console.error('Error checking escalation:', error);
            toast.error('Failed to check escalation: ' + 
                (error.response?.data?.error || 'Unknown error'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <button
            onClick={handleEscalationCheck}
            disabled={loading}
            className={`inline-flex items-center px-4 py-2 rounded-md text-sm font-medium text-white transition-colors duration-150 ${
                loading 
                    ? 'bg-yellow-400 cursor-not-allowed' 
                    : 'bg-yellow-500 hover:bg-yellow-600'
            }`}
        >
            {loading ? (
                <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Checking...
                </>
            ) : (
                <>
                    <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Run Escalation Check
                </>
            )}
        </button>
    );
};

export default EscalationCheck;