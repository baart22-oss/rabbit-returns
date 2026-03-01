import React from 'react';
import './Card.css'; // Import your CSS file for styles

interface CardProps {
    title: string;
    content: string;
    footer?: React.ReactNode;
}

const Card: React.FC<CardProps> = ({ title, content, footer }) => {
    return (
        <div className="card">
            <div className="card-header">
                <h3>{title}</h3>
            </div>
            <div className="card-content">
                <p>{content}</p>
            </div>
            {footer && <div className="card-footer">{footer}</div>}
        </div>
    );
};

export default Card;