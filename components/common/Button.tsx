
import React from 'react';
import Loader from './Loader';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean;
}

const Button: React.FC<ButtonProps> = ({ children, className, isLoading, ...props }) => {
  return (
    <button
      className={`
        flex items-center justify-center w-full px-4 py-3 font-semibold text-brand-dark bg-brand-accent rounded-md 
        transition-colors duration-200 ease-in-out
        hover:bg-brand-accent-hover 
        focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-brand-dark focus:ring-brand-accent
        disabled:bg-gray-500 disabled:cursor-not-allowed
        ${className}
      `}
      disabled={isLoading}
      {...props}
    >
      {isLoading ? <Loader size="sm" /> : children}
    </button>
  );
};

export default Button;
