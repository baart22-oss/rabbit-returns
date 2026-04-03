import React from 'react';
import './WhatsAppButton.css';

type Props = {
  url?: string;       // link to open (defaults to provided group link)
  label?: string;     // accessible label
};

const DEFAULT_URL = 'https://chat.whatsapp.com/JqNgYs4N4fTEIyGiO9Tc6y?mode=gi_t;

export default function WhatsAppButton({ url = DEFAULT_URL, label = 'Contact support on WhatsApp' }: Props) {
  return (
    <a
      className="whatsapp-floating"
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      title="Contact support"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="whatsapp-icon"
        viewBox="0 0 24 24"
        fill="currentColor"
        aria-hidden="true"
      >
        <path d="M20.52 3.48A11.84 11.84 0 0012 .5C6.21.5 1.39 5.33 1.39 11.12c0 1.96.52 3.87 1.5 5.56L0.5 23.5l6.98-1.82A11.6 11.6 0 0012 22.12c5.79 0 10.61-4.83 10.61-10.61 0-2.84-1.08-5.51-3.09-7.99zM12 20.12c-1.07 0-2.12-.2-3.08-.6l-.22-.09-4.14 1.08 1.13-3.9-.07-.26A8.17 8.17 0 013.79 11.12c0-4.54 3.69-8.23 8.21-8.23 4.52 0 8.2 3.69 8.2 8.23 0 4.53-3.68 8.22-8.2 8.22z"/>
        <path d="M17.2 14.1c-.29-.15-1.71-.84-1.98-.94-.27-.1-.46-.15-.66.15-.2.29-.77.94-.94 1.14-.17.2-.34.22-.63.07-.29-.15-1.22-.45-2.32-1.44-.86-.77-1.44-1.72-1.61-2.01-.17-.29-.02-.45.13-.6.13-.13.29-.34.44-.51.15-.17.2-.29.3-.48.1-.2 0-.37-.05-.52-.05-.15-.66-1.6-.9-2.19-.24-.58-.48-.5-.66-.51l-.56-.01c-.2 0-.52.07-.79.37-.27.3-1.02.99-1.02 2.42 0 1.43 1.05 2.81 1.2 3.01.15.2 2.08 3.24 5.05 4.54 2.97 1.3 2.97.87 3.51.82.54-.06 1.71-.7 1.95-1.38.24-.68.24-1.26.17-1.38-.07-.12-.27-.2-.56-.35z"/>
      </svg>
      <span className="whatsapp-text">Support</span>
    </a>
  );
}
