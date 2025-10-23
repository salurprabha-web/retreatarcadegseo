import React from 'react';

interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  showCharCount?: boolean;
}

const TextArea: React.FC<TextAreaProps> = ({ label, showCharCount, maxLength, value, ...props }) => {
  return (
    <div>
       {(label || (showCharCount && maxLength)) && (
        <div className="flex justify-between items-center">
           {label ? 
            <label className="block text-sm font-medium text-gray-300 mb-1">{label}</label> :
            <span /> /* To maintain space-between */}
          {showCharCount && maxLength && (
            <span className="text-xs text-gray-400">
              {String(value).length} / {maxLength}
            </span>
          )}
        </div>
       )}
      <textarea
        className="w-full px-3 py-2 bg-brand-dark text-brand-light border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-accent focus:border-transparent"
        value={value}
        maxLength={maxLength}
        {...props}
      ></textarea>
    </div>
  );
};

export default TextArea;
