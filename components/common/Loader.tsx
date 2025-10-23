
import React from 'react';

interface LoaderProps {
  size?: 'sm' | 'md';
}

const Loader: React.FC<LoaderProps> = ({ size = 'md' }) => {
  const sizeClasses = size === 'sm' ? 'h-5 w-5 border-2' : 'h-8 w-8 border-4';
  return (
    <div
      className={`animate-spin rounded-full border-brand-light border-t-transparent ${sizeClasses}`}
      style={{ borderTopColor: 'transparent' }}
    ></div>
  );
};

export default Loader;
