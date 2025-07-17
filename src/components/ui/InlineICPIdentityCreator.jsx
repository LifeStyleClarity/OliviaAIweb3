import { useState } from 'react';
import { useInternetIdentity } from '../../hooks/useInternetIdentity';
import { useAuth } from '../../contexts/AuthContext';
import { useWebSocket } from '../../contexts/WebSocketContext';
import icpService from '../../api/services/icp.service';
import Button from './Button';

const InlineICPIdentityCreator = ({ onSendMessage }) => {
  const [step, setStep] = useState('prompt'); // 'prompt', 'authenticating', 'creating', 'success', 'error'
  const [isLoading, setIsLoading] = useState(false);
  const [identityAnchor, setIdentityAnchor] = useState(null);
  const [error, setError] = useState(null);
  
  const { login: internetIdentityLogin } = useInternetIdentity();
  const { userData, setUserData, setIsGuestUser, setUserAuthenticated } = useAuth();
  const { icpUser } = useWebSocket();

  const handleCreateIdentity = async () => {
    setIsLoading(true);
    setError(null);
    setStep('authenticating');
    
    try {
      // Step 1: Authenticate with Internet Identity
      const loginSuccess = await internetIdentityLogin();
      
      if (!loginSuccess) {
        setError('Internet Identity authentication failed. Please try again.');
        setStep('error');
        setIsLoading(false);
        return;
      }
      
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
        
        // Extract identity anchor number from principal
        const principalId = result.user.id.toString();
        const anchorNumber = principalId.slice(-5); // Show last 5 characters as anchor
        setIdentityAnchor(anchorNumber);
        
        setStep('success');
        
        // Send success message back to chat
        if (onSendMessage) {
          setTimeout(() => {
            onSendMessage('ICP identity created successfully! Continue chatting...');
          }, 3000);
        }
      } else {
        setError(result.message || 'Failed to create ICP identity');
        setStep('error');
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      setStep('error');
      console.error('ICP identity creation error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetry = () => {
    setStep('prompt');
    setError(null);
    setIdentityAnchor(null);
  };

  const handleMaybeLater = () => {
    if (onSendMessage) {
      onSendMessage('Maybe later');
    }
  };

  // Prompt step
  if (step === 'prompt') {
    return (
      <div className="mt-2 p-4 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg">
        <div className="text-sm text-gray-700 mb-3">
          💡 <strong>Want to save your chat history permanently?</strong>
          <br />
          Create an ICP identity to store your conversations securely on the blockchain!
        </div>
        <div className="text-xs text-gray-600 mb-4">
          • Your conversations will be saved permanently<br />
          • Access from any device with your secure identity<br />
          • No passwords needed - uses Face ID, Touch ID, or security keys
        </div>
        <div className="flex gap-2">
          <Button
            variant="solid"
            size="sm"
            className="text-xs bg-blue-600 hover:bg-blue-700 text-white"
            onPress={handleCreateIdentity}
            disabled={isLoading}
          >
            🔐 Create ICP Identity
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-xs"
            onPress={handleMaybeLater}
            disabled={isLoading}
          >
            Maybe later
          </Button>
        </div>
      </div>
    );
  }

  // Authenticating step
  if (step === 'authenticating') {
    return (
      <div className="mt-2 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm font-medium text-blue-900">Authenticating with Internet Identity...</span>
        </div>
        <div className="text-xs text-blue-700">
          Please complete the authentication process in the Internet Identity window.
        </div>
      </div>
    );
  }

  // Creating step
  if (step === 'creating') {
    return (
      <div className="mt-2 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm font-medium text-blue-900">Creating your ICP identity...</span>
        </div>
        <div className="text-xs text-blue-700">
          Setting up your permanent account on the ICP blockchain.
        </div>
      </div>
    );
  }

  // Success step
  if (step === 'success') {
    return (
      <div className="mt-2 p-4 bg-green-50 border border-green-200 rounded-lg">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-lg">🎉</span>
          <span className="text-sm font-medium text-green-900">ICP Identity Created Successfully!</span>
        </div>
        <div className="text-xs text-green-700 mb-3">
          Your Identity Anchor: <strong>#{identityAnchor}</strong>
          <br />
          All your conversations are now being saved permanently on the ICP blockchain!
        </div>
        <div className="text-xs text-green-600">
          You can now continue chatting normally - everything will be saved securely! 🔐
        </div>
      </div>
    );
  }

  // Error step
  if (step === 'error') {
    return (
      <div className="mt-2 p-4 bg-red-50 border border-red-200 rounded-lg">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-lg">❌</span>
          <span className="text-sm font-medium text-red-900">Identity Creation Failed</span>
        </div>
        <div className="text-xs text-red-700 mb-3">
          {error}
        </div>
        <div className="flex gap-2">
          <Button
            variant="solid"
            size="sm"
            className="text-xs bg-red-600 hover:bg-red-700 text-white"
            onPress={handleRetry}
          >
            Try Again
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-xs"
            onPress={handleMaybeLater}
          >
            Maybe Later
          </Button>
        </div>
      </div>
    );
  }

  return null;
};

export default InlineICPIdentityCreator; 