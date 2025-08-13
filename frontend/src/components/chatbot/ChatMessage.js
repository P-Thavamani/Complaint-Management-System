import React from 'react';
import ReactMarkdown from 'react-markdown';

const ChatMessage = ({ message, onOptionSelect }) => {
  // Function to handle option selection
  const handleOptionSelect = (optionId, optionText) => {
    console.log(`Selected option: ${optionText} (ID: ${optionId})`);
    // Call the parent component function
    if (onOptionSelect) {
      onOptionSelect(optionId, optionText);
    }
  };
  // Format timestamp
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Render different message types
  const renderMessageContent = () => {
    // For image messages
    if (message.isImage && message.imageUrl) {
      return (
        <div>
          <p className="mb-2">I've uploaded an image of the issue:</p>
          <img 
            src={message.imageUrl} 
            alt="Uploaded issue" 
            className="max-w-[200px] rounded-md"
          />
        </div>
      );
    }

    // For voice messages
    if (message.isVoice) {
      return (
        <div>
          <div className="flex items-center mb-1">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
            </svg>
            <span className="text-xs text-gray-500">Voice message</span>
          </div>
          <p>{message.content}</p>
        </div>
      );
    }

    // For AI features list
    if (message.aiFeatures && message.aiFeatures.length > 0) {
      return (
        <div>
          <p className="mb-2">{message.content}</p>
          <div className="mt-2 space-y-2">
            {message.aiFeatures.map((feature, index) => (
              <div key={index} className="p-2 bg-primary-50 border border-primary-100 rounded-md">
                <h4 className="text-sm font-semibold text-primary-700">{feature.title}</h4>
                <p className="text-xs text-gray-600 mt-1">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      );
    }
    
    // For messages with options
     if (message.options && message.options.length > 0) {
       return (
         <div>
           <div className="mb-2">
             <ReactMarkdown>{message.content}</ReactMarkdown>
           </div>
<<<<<<< HEAD
           
           {/* Description field for ticket creation */}
           {message.showDescriptionField && (
             <div className="mb-3">
               <label htmlFor="issueDescription" className="block text-sm font-medium text-gray-700 mb-1">
                 Issue Description <span className="text-red-500">*</span>
               </label>
               <textarea
                 id="issueDescription"
                 className="w-full p-3 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500 shadow-sm"
                 rows="4"
                 placeholder="Please describe your issue in detail. Include any error messages, when the issue started, and steps to reproduce it..."
                 onChange={(e) => {
                   // Store the description in a global variable or state that can be accessed when submitting the ticket
                   window.issueDescription = e.target.value;
                 }}
                 defaultValue={window.issueDescription || ''}
               ></textarea>
               <p className="text-xs text-gray-500 mt-1">Your detailed description helps us categorize and prioritize your issue appropriately.</p>
             </div>
           )}
           
=======
>>>>>>> ff5d7d2ee5773ae90cf8a051ccc6605ddc57581a
           <div className="mt-3 grid grid-cols-2 gap-2">
             {message.options.map((option, index) => (
               <button 
                 key={index} 
                 className="p-2 text-left border border-primary-200 rounded-md hover:bg-primary-50 transition-colors"
                 onClick={() => handleOptionSelect(option.id, option.text)}
               >
                 <div className="font-medium text-primary-700">{option.text}</div>
               </button>
             ))}
           </div>
         </div>
       );
     }
     
     // For problem and solution content
     if (message.problem || message.solution) {
       return (
         <div>
           {message.content && (
             <div className="mb-2">
               <ReactMarkdown>{message.content}</ReactMarkdown>
             </div>
           )}
           
           {message.problem && (
             <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-md">
               <h4 className="text-sm font-semibold text-red-700 mb-1">Problem:</h4>
               <div className="text-sm text-red-600">
                 <ReactMarkdown>{message.problem}</ReactMarkdown>
               </div>
             </div>
           )}
           
           {message.solution && (
             <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-md">
               <h4 className="text-sm font-semibold text-green-700 mb-1">Solution:</h4>
               <div className="text-sm text-green-600">
                 <ReactMarkdown>
                   {Array.isArray(message.solution) ? message.solution.join('\n- ') : message.solution}
                 </ReactMarkdown>
               </div>
             </div>
           )}
           
           {message.options && message.options.length > 0 && (
             <div className="mt-3 grid grid-cols-2 gap-2">
               {message.options.map((option, index) => (
                 <button 
                   key={index} 
                   className="p-2 text-left border border-primary-200 rounded-md hover:bg-primary-50 transition-colors"
                   onClick={() => handleOptionSelect(option.id, option.text)}
                 >
                   <div className="font-medium text-primary-700">{option.text}</div>
                 </button>
               ))}
             </div>
           )}
         </div>
       );
     }

    // For ticket creation messages
    if (message.ticketCreated && message.ticketId) {
      return (
        <div>
          <p>{message.content}</p>
          <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-md">
            <div className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <span className="font-medium text-blue-700">Ticket Created</span>
            </div>
            <p className="text-sm text-blue-600 mt-1">
              Ticket #{message.ticketId} has been created for your complaint. You can track its status in your dashboard.
            </p>
          </div>
        </div>
      );
    }

    // For detected objects in images
    if (message.detectedObjects && message.detectedObjects.length > 0) {
      return (
        <div>
          <p>{message.content}</p>
          <div className="mt-2">
            <p className="text-sm font-medium text-gray-700">Detected in your image:</p>
            <div className="flex flex-wrap gap-2 mt-1">
              {message.detectedObjects.map((object, index) => (
                <span 
                  key={index} 
                  className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full"
                >
                  {object.name} ({Math.round(object.confidence * 100)}%)
                </span>
              ))}
            </div>
          </div>
        </div>
      );
    }

<<<<<<< HEAD
    // For notification messages
    if (message.isNotification) {
      return (
        <div>
          <div className="p-2 bg-indigo-50 border border-indigo-200 rounded-md">
            <div className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-500 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
              </svg>
              <span className="font-medium text-indigo-700">Status Update</span>
            </div>
            <div className="mt-1">
              <ReactMarkdown>{message.content}</ReactMarkdown>
            </div>
          </div>
          
          {message.options && message.options.length > 0 && (
            <div className="mt-3 grid grid-cols-2 gap-2">
              {message.options.map((option, index) => (
                <button 
                  key={index} 
                  className="p-2 text-left border border-primary-200 rounded-md hover:bg-primary-50 transition-colors"
                  onClick={() => handleOptionSelect(option.id, option.text)}
                >
                  <div className="font-medium text-primary-700">{option.text}</div>
                </button>
              ))}
            </div>
          )}
        </div>
      );
    }
    
    // For status detail messages
    if (message.isStatus) {
      return (
        <div>
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
            <div className="flex items-center mb-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <span className="font-medium text-blue-700">Ticket Status</span>
            </div>
            <div className="text-sm text-blue-800">
              <ReactMarkdown>{message.content}</ReactMarkdown>
            </div>
          </div>
          
          {message.options && message.options.length > 0 && (
            <div className="mt-3 grid grid-cols-2 gap-2">
              {message.options.map((option, index) => (
                <button 
                  key={index} 
                  className="p-2 text-left border border-primary-200 rounded-md hover:bg-primary-50 transition-colors"
                  onClick={() => handleOptionSelect(option.id, option.text)}
                >
                  <div className="font-medium text-primary-700">{option.text}</div>
                </button>
              ))}
            </div>
          )}
        </div>
      );
    }
    
=======
>>>>>>> ff5d7d2ee5773ae90cf8a051ccc6605ddc57581a
    // For error messages
    if (message.isError) {
      return (
        <div className="text-red-600">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 inline-block mr-1" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {message.content}
        </div>
      );
    }

    // Default text message - use ReactMarkdown for formatting
    return <ReactMarkdown>{message.content}</ReactMarkdown>;
  };

  return (
    <div className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'} mb-4`}>
      {message.type === 'bot' && (
        <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center mr-2 flex-shrink-0">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary-600" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9.504 1.132a1 1 0 01.992 0l1.75 1a1 1 0 11-.992 1.736L10 3.152l-1.254.716a1 1 0 11-.992-1.736l1.75-1zM5.618 4.504a1 1 0 01-.372 1.364L5.016 6l.23.132a1 1 0 11-.992 1.736L4 7.723V8a1 1 0 01-2 0V6a.996.996 0 01.52-.878l1.734-.99a1 1 0 011.364.372zm8.764 0a1 1 0 011.364-.372l1.733.99A1.002 1.002 0 0118 6v2a1 1 0 11-2 0v-.277l-.254.145a1 1 0 11-.992-1.736l.23-.132-.23-.132a1 1 0 01-.372-1.364zm-7 4a1 1 0 011.364-.372L10 8.848l1.254-.716a1 1 0 11.992 1.736L11 10.58V12a1 1 0 11-2 0v-1.42l-1.246-.712a1 1 0 01-.372-1.364zM3 11a1 1 0 011 1v1.42l1.246.712a1 1 0 11-.992 1.736l-1.75-1A1 1 0 012 14v-2a1 1 0 011-1zm14 0a1 1 0 011 1v2a1 1 0 01-.504.868l-1.75 1a1 1 0 11-.992-1.736L16 13.42V12a1 1 0 011-1zm-9.618 5.504a1 1 0 011.364-.372l.254.145V16a1 1 0 112 0v.277l.254-.145a1 1 0 11.992 1.736l-1.735.992a.995.995 0 01-1.022 0l-1.735-.992a1 1 0 01-.372-1.364z" clipRule="evenodd" />
          </svg>
        </div>
      )}
      <div 
        className={`max-w-[75%] p-3 rounded-lg ${message.type === 'user' 
          ? 'bg-primary-600 text-white rounded-br-none' 
          : 'bg-gray-200 text-gray-800 rounded-bl-none'}`}
      >
        {renderMessageContent()}
        <div className={`text-xs mt-1 ${message.type === 'user' ? 'text-primary-100' : 'text-gray-500'}`}>
          {formatTime(message.timestamp)}
        </div>
      </div>
      {message.type === 'user' && (
        <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center ml-2 flex-shrink-0">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
          </svg>
        </div>
      )}
    </div>
  );
};

export default ChatMessage;