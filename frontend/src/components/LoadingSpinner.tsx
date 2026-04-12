import React from 'react';

const LoadingSpinner: React.FC<{ size?: 'sm' | 'md' | 'lg' }> = ({ size = 'md' }) => {
  const sizes = { sm: 20, md: 36, lg: 52 };
  const px = sizes[size];
  return (
    <div
      role="status"
      aria-label="Loading"
      style={{
        display: 'inline-block',
        width: px,
        height: px,
        border: `${px / 6}px solid #e5e7eb`,
        borderTop: `${px / 6}px solid #6366f1`,
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
      }}
    />
  );
};

export default LoadingSpinner;
