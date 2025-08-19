import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useInternetIdentity } from '../contexts/InternetIdentityContext';
import { useAuth } from '../contexts/AuthContext';
import icpService from '../api/services/icp.service';
import Button from '../components/ui/Button';
import { toast } from 'sonner';

export default function ICPSetup() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState('prompt'); // 'prompt', 'authenticating', 'creating', 'success', 'error'
  const [error, setError] = useState(null);
  
  const { login: internetIdentityLogin, principal, isAuthenticated } = useInternetIdentity();
  const { userData, setUserData, setIsGuestUser, setUserAuthenticated } = useAuth();

  const handleCreateICPIdentity = async () => {
    setIsLoading(true);
    setError(null);
    setStep('authenticating');
    
    try {
      console.log('🔐 Starting Internet Identity login process...');
      
      // Step 1: Authenticate with Internet Identity
      const loginSuccess = await internetIdentityLogin();
      
      if (!loginSuccess) {
        setError('Internet Identity authentication failed. Please try again.');
        setStep('error');
        setIsLoading(false);
        return;
      }
      
      console.log('🔐 Internet Identity login successful, creating ICP user...');
      setStep('creating');
      
      // Step 2: Create ICP user account
      const result = await icpService.createUser(
        userData?.first_name || 'User',
        userData?.last_name || '',
        userData?.email || '',
        userData?.telegram_id || null,
        userData?.crypto_wallet_address || null
      );
      
      if (result.success) {
        // Update auth context
        setUserData({
          ...userData,
          user_id: result.user.id.toString(),
          auth_method: 'internet_identity',
          is_guest: false
        });
        setIsGuestUser(false);
        setUserAuthenticated(true);
        
        setStep('success');
        toast.success('ICP Identity created successfully! Your chats will now be saved permanently.');
        
        console.log('🔐 ICP Identity created successfully:', result.user);
        
        // Redirect to chat after a short delay
        setTimeout(() => {
          navigate('/');
        }, 3000);
      } else {
        setError(result.message || 'Failed to create ICP identity');
        setStep('error');
        console.error('🔐 ICP user creation failed:', result);
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      setStep('error');
      console.error('🔐 ICP identity creation error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToChat = () => {
    navigate('/');
  };

  const handleRetry = () => {
    setStep('prompt');
    setError(null);
  };

  const renderContent = () => {
    switch (step) {
      case 'authenticating':
        return (
          <div className="text-center">
            <div className="animate-spin w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-6"></div>
            <h2 className="text-2xl font-semibold text-white mb-4">Authenticating with Internet Identity...</h2>
            <p className="text-gray-300">
              Please complete the authentication process in the popup window.
            </p>
          </div>
        );
        
      case 'creating':
        return (
          <div className="text-center">
            <div className="animate-spin w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-6"></div>
            <h2 className="text-2xl font-semibold text-white mb-4">Creating your ICP Identity...</h2>
            <p className="text-gray-300">
              Setting up your decentralized identity on the Internet Computer.
            </p>
          </div>
        );
        
      case 'success':
        return (
          <div className="text-center">
            <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-semibold text-white mb-4">ICP Identity Created Successfully! 🎉</h2>
            <p className="text-gray-300 mb-4">
              Your Internet Computer identity has been created and linked to your account.
            </p>
            <p className="text-gray-300 mb-4">
              Principal ID: <span className="font-mono text-sm text-blue-400">{principal}</span>
            </p>
            <p className="text-gray-300">
              Redirecting you back to chat...
            </p>
          </div>
        );
        
      case 'error':
        return (
          <div className="text-center">
            <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-2xl font-semibold text-white mb-4">Something went wrong</h2>
            <p className="text-red-400 mb-6">{error}</p>
            <div className="flex gap-4 justify-center">
              <Button
                onPress={handleRetry}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg"
              >
                Try Again
              </Button>
              <Button
                onPress={handleBackToChat}
                className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg"
              >
                Back to Chat
              </Button>
            </div>
          </div>
        );
        
      default:
        return (
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
                Click the button below to authenticate with Internet Identity and create your decentralized identity.
              </p>
              
              <Button
                onPress={handleCreateICPIdentity}
                isLoading={isLoading}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg"
              >
                {isLoading ? 'Creating Identity...' : 'Create ICP Identity'}
              </Button>
            </div>

            <div className="bg-gray-700/30 rounded-lg p-6">
              <h2 className="text-2xl font-semibold text-white mb-4">What happens next?</h2>
              <ol className="text-gray-300 space-y-2">
                <li>1. You'll authenticate with Internet Identity</li>
                <li>2. Your decentralized identity will be created</li>
                <li>3. Your conversations will be saved permanently</li>
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
        );
    }
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

        {renderContent()}
      </div>
    </div>
  );
} 