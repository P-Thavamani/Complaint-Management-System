import React from 'react';

const OptionButton = ({ option, onClick }) => {
  return (
    <button 
      className="p-2 text-left border border-primary-200 rounded-md hover:bg-primary-50 transition-colors"
      onClick={() => onClick(option.id, option.text)}
    >
      <div className="font-medium text-primary-700">{option.text}</div>
    </button>
  );
};

export default OptionButton;