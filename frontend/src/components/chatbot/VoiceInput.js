import React, { useState, useEffect } from 'react';
<<<<<<< HEAD
import axios from '../../services/axios';
=======
import axios from 'axios';
>>>>>>> ff5d7d2ee5773ae90cf8a051ccc6605ddc57581a

const VoiceInput = ({ onTranscript, onCancel }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [audioChunks, setAudioChunks] = useState([]);

  // Start recording when component mounts
  useEffect(() => {
    startRecording();
    
    // Clean up when component unmounts
    return () => {
      if (mediaRecorder && mediaRecorder.state === 'recording') {
        mediaRecorder.stop();
      }
    };
  }, []);

  // Update recording time
  useEffect(() => {
    let interval;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingTime(prevTime => prevTime + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  // Format recording time
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      setMediaRecorder(recorder);
      
      const chunks = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };
      
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        setAudioBlob(blob);
        setAudioChunks(chunks);
      };
      
      recorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      onCancel();
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      mediaRecorder.stop();
      setIsRecording(false);
      
      // Stop all audio tracks
      mediaRecorder.stream.getTracks().forEach(track => track.stop());
    }
  };

  const processAudio = async () => {
    if (!audioBlob) return;
    
    setIsProcessing(true);
    
    try {
      // Create form data with audio blob
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');
      
      // Send to backend for processing with Google STT
      const response = await axios.post('/api/chatbot/voice', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      // Pass transcript to parent component
      if (response.data.transcript) {
        onTranscript(response.data.transcript);
      } else {
        throw new Error('No transcript received');
      }
    } catch (error) {
      console.error('Error processing audio:', error);
      onCancel();
    }
  };

  const handleSubmit = () => {
    stopRecording();
    processAudio();
  };

  return (
    <div className="p-2 bg-gray-100 rounded-lg">
      <div className="text-center mb-2">
        <p className="font-medium text-gray-700">
          {isRecording ? 'Recording...' : 'Recording complete'}
        </p>
        <p className="text-sm text-gray-500">
          {isRecording ? 'Speak your complaint clearly' : 'Ready to submit'}
        </p>
      </div>
      
      <div className="flex items-center justify-center mb-2">
        <div className={`w-16 h-16 rounded-full flex items-center justify-center ${isRecording ? 'bg-red-100 animate-pulse' : 'bg-gray-200'}`}>
          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${isRecording ? 'bg-red-500' : 'bg-gray-400'}`}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
          </div>
        </div>
      </div>
      
      <div className="text-center mb-4">
        <span className="text-lg font-mono">{formatTime(recordingTime)}</span>
      </div>
      
      <div className="flex justify-center space-x-4">
        {isRecording ? (
          <button
            type="button"
            onClick={stopRecording}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none"
            disabled={isProcessing}
          >
            Stop Recording
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSubmit}
            className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 focus:outline-none"
            disabled={isProcessing}
          >
            {isProcessing ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </span>
            ) : 'Submit Recording'}
          </button>
        )}
        
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 focus:outline-none"
          disabled={isProcessing}
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export default VoiceInput;