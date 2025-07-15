import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import ReactMarkdown from 'react-markdown';

const TypeWriter = ({ text = "", onComplete, onTextUpdate, speed = 5 }) => {
  const [displayText, setDisplayText] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    // Reset animation when text changes
    setDisplayText("");
    setCurrentIndex(0);
  }, [text]);

  useEffect(() => {
    if (currentIndex < text.length) {
      const timer = setTimeout(() => {
        setDisplayText((prev) => {
          const newText = prev + text[currentIndex];
          // Call onTextUpdate when text changes
          if (onTextUpdate) {
            onTextUpdate(newText);
          }
          return newText;
        });
        setCurrentIndex((prev) => prev + 1);
      }, speed);

      return () => clearTimeout(timer);
    } else if (onComplete) {
      onComplete();
    }
  }, [currentIndex, text, speed, onComplete, onTextUpdate]);

  // Process the text to render markdown links with the correct styling
  return (
    <ReactMarkdown
      components={{
        p: ({ children }) => <>{children}</>,
        a: ({ ...props }) => (
          <a
            {...props}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: "#31F46E",
              textDecoration: "underline",
            }}
          />
        ),
      }}
    >
      {displayText}
    </ReactMarkdown>
  );
};

TypeWriter.propTypes = {
  text: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onComplete: PropTypes.func,
  onTextUpdate: PropTypes.func,
  speed: PropTypes.number,
};

export default TypeWriter;
