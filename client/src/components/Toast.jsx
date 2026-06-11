import { useState, useEffect } from 'react';

const typeStyles = {
  success: 'border-l-green-500 bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300',
  error: 'border-l-error bg-error-container dark:bg-error/10 text-error dark:text-red-300',
  info: 'border-l-primary-container bg-amber-50 dark:bg-amber-900/20 text-primary dark:text-amber-300',
};

const typeIcons = {
  success: (
    <svg className="h-5 w-5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  ),
  error: (
    <svg className="h-5 w-5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
    </svg>
  ),
  info: (
    <svg className="h-5 w-5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  ),
};

export default function Toast({ message, type = 'info', onClose }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Slide in
    requestAnimationFrame(() => setVisible(true));

    // Auto dismiss after 3 seconds
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(() => onClose?.(), 300);
    }, 3000);

    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div
      className={`fixed bottom-6 left-6 z-[100] flex items-center gap-3 rounded-xl border-l-4 px-5 py-4 shadow-2xl backdrop-blur-sm transition-all duration-300 max-w-sm ${
        typeStyles[type] || typeStyles.info
      } ${visible ? 'translate-x-0 opacity-100' : '-translate-x-full opacity-0'}`}
    >
      {typeIcons[type] || typeIcons.info}
      <p className="text-sm font-medium leading-snug">{message}</p>
      <button
        onClick={() => {
          setVisible(false);
          setTimeout(() => onClose?.(), 300);
        }}
        className="ml-auto text-current opacity-50 hover:opacity-100 transition-opacity"
      >
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>
  );
}
