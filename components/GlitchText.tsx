import React, { useState, useEffect } from 'react';

interface GlitchTextProps {
  text: string;
  as?: 'h1' | 'h2' | 'h3' | 'p' | 'span';
  className?: string;
  intensity?: 'low' | 'medium' | 'high';
}

const GlitchText: React.FC<GlitchTextProps> = ({ text, as = 'span', className = '', intensity = 'low' }) => {
  const [displayText, setDisplayText] = useState(text);
  
  // Random characters for glitch effect
  const chars = '!<>-_\\/[]{}—=+*^?#';
  
  useEffect(() => {
    let interval: number;
    
    if (intensity !== 'low') {
        const updateText = () => {
            const splitText = text.split('');
            const glitchIndex = Math.floor(Math.random() * splitText.length);
            // Only glitch occasionally
            if (Math.random() > 0.8) {
                splitText[glitchIndex] = chars[Math.floor(Math.random() * chars.length)];
                setDisplayText(splitText.join(''));
                
                // Reset quickly
                setTimeout(() => {
                    setDisplayText(text);
                }, 100);
            }
        };

        const speed = intensity === 'high' ? 500 : 2000;
        interval = window.setInterval(updateText, speed);
    }

    return () => clearInterval(interval);
  }, [text, intensity, chars]);

  const Tag = as as any;

  return (
    <Tag className={`relative inline-block ${className}`}>
      <span className="relative z-10">{displayText}</span>
      {intensity === 'high' && (
        <>
            <span className="absolute top-0 left-0 -ml-[2px] text-red-500 opacity-70 animate-pulse mix-blend-screen">{text}</span>
            <span className="absolute top-0 left-0 ml-[2px] text-cyan-500 opacity-70 animate-pulse mix-blend-screen delay-75">{text}</span>
        </>
      )}
    </Tag>
  );
};

export default GlitchText;
