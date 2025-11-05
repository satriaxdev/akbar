import React from 'react';

const LoadingSpinner: React.FC<{ size?: string }> = ({ size = 'h-8 w-8' }) => {
  return (
    <div className={`animate-spin rounded-full ${size} border-t-2 border-b-2 border-blue-400`}></div>
  );
};

export default LoadingSpinner;
