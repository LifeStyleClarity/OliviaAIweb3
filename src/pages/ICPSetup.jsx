import React from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/ui/Button';

export default function ICPSetup() {
  const navigate = useNavigate();

  const handleBackToChat = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black flex items-center justify-center p-4">
      <div className="bg-gray-800/50 backdrop-blur-lg rounded-2xl p-8 max-w-2xl w-full border border-gray-700">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">
            Let's get your ICP ID setup! 🚀
          </h1>
          <p className="text-gray-300 text-lg">
            Create your Internet Computer identity to save your conversations permanently
          </p>
        </div>

        <div className="space-y-6">
          <div className="bg-gray-700/30 rounded-lg p-6">
            <h2 className="text-2xl font-semibold text-white mb-4">What is an ICP ID?</h2>
            <p className="text-gray-300 mb-4">
              An ICP (Internet Computer Protocol) ID is your decentralized digital identity that allows 
              Olivia to store all your conversations permanently and securely on the blockchain.
            </p>
            <p className="text-gray-300">
              With an ICP ID, Olivia can remember your previous conversations and provide more 
              personalized and helpful responses over time.
            </p>
          </div>

          <div className="bg-blue-600/20 border border-blue-500/30 rounded-lg p-6">
            <h2 className="text-2xl font-semibold text-white mb-4">Create Your ICP Identity</h2>
            <p className="text-gray-300 mb-4">
              Click the button below to create your Internet Computer identity. It only takes a minute!
            </p>
            
            <a
              href="https://identity.internetcomputer.org/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
            >
              Create ICP Identity →
            </a>
          </div>

          <div className="bg-gray-700/30 rounded-lg p-6">
            <h2 className="text-2xl font-semibold text-white mb-4">After Creating Your Identity</h2>
            <ol className="text-gray-300 space-y-2">
              <li>1. Complete the identity creation process</li>
              <li>2. Return to this app</li>
              <li>3. Your conversations will automatically be saved to ICP</li>
              <li>4. Olivia will remember your chat history for better responses</li>
            </ol>
          </div>

          <div className="flex justify-center pt-6">
            <Button
              onPress={handleBackToChat}
              className="bg-gray-600 hover:bg-gray-700 text-white px-8 py-3 rounded-lg"
            >
              Back to Chat
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
} 