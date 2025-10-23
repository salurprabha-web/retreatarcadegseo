
import React from 'react';

interface CardProps {
  title: string;
  children: React.ReactNode;
}

const Card: React.FC<CardProps> = ({ title, children }) => {
  return (
    <div className="bg-brand-secondary rounded-lg shadow-lg">
      <div className="px-6 py-4 border-b border-gray-700">
        <h2 className="text-xl font-semibold text-brand-light font-poppins">{title}</h2>
      </div>
      <div className="p-6">
        {children}
      </div>
    </div>
  );
};

export default Card;
