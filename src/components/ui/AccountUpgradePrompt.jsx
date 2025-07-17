import { useState } from 'react';
import { toast } from 'sonner';
import { useInternetIdentity } from '../../hooks/useInternetIdentity';
import { useAuth } from '../../contexts/AuthContext';
import { useWebSocket } from '../../contexts/WebSocketContext';
import icpService from '../../api/services/icp.service';
import Button from './Button';

const AccountUpgradePrompt = ({ isOpen, onClose, onUpgradeSuccess }) => {
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [step, setStep] = useState('prompt'); // 'prompt', 'upgrading', 'success'
  const [upgradeResult, setUpgradeResult] = useState(null);
  
  const { login: internetIdentityLogin, principal, isLoading: iiLoading } = useInternetIdentity();
  const { userData, setUserData, setIsGuestUser, setUserAuthenticated } = useAuth();
  const { icpUser } = useWebSocket();

  // Debug logging
  console.log('🔍 AccountUpgradePrompt props:', { isOpen, isUpgrading, step });

  const handleUpgradeWithII = async () => {
    try {
      setIsUpgrading(true);
      setStep('upgrading');
      
      // Step 1: Login with Internet Identity
      const loginSuccess = await internetIdentityLogin();
      if (!loginSuccess) {
        toast.error('Internet Identity login failed');
        setIsUpgrading(false);
        setStep('prompt');
        return;
      }

      // Step 2: Create new ICP user with Internet Identity
      const result = await icpService.createUser(
        userData?.first_name || 'User',
        userData?.last_name || '',
        userData?.email || '',
        userData?.telegram_id || null,
        userData?.crypto_wallet_address || null
      );
      
      if (result.success) {
        setUpgradeResult({ 
          success: true, 
          upgradedUser: result.user,
          migratedMessages: 0,
          message: 'ICP Identity created successfully!'
        });
        setStep('success');
        
        // Update auth context
        setUserData({
          ...userData,
          user_id: result.user.id.toString(),
          auth_method: 'internet_identity',
          is_guest: false
        });
        setIsGuestUser(false);
        setUserAuthenticated(true);
        
        toast.success('ICP Identity created! Your chats will now be saved permanently.');
        
        // Notify parent component
        if (onUpgradeSuccess) {
          onUpgradeSuccess(result);
        }
      } else {
        toast.error(result.message || 'Failed to create ICP identity');
        setIsUpgrading(false);
        setStep('prompt');
      }
    } catch (error) {
      console.error('ICP identity creation error:', error);
      toast.error('Failed to create ICP identity');
      setIsUpgrading(false);
      setStep('prompt');
    }
  };

  const handleClose = () => {
    if (!isUpgrading) {
      onClose();
      setStep('prompt');
      setUpgradeResult(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 relative">
        {/* Close Button */}
        {!isUpgrading && (
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 w-8 h-8 flex items-center justify-center"
          >
            ✕
          </button>
        )}

        {/* Prompt Step */}
        {step === 'prompt' && (
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🎉</span>
            </div>
            
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Keep Your Conversations Forever!
            </h2>
            
            <p className="text-gray-600 mb-6">
              You've been chatting with Olivia! Upgrade to a permanent account to own your chat history on the blockchain.
            </p>

            <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4 mb-6">
              <h3 className="font-semibold text-gray-900 mb-2">✨ What you'll get:</h3>
              <ul className="text-left text-gray-700 space-y-1">
                <li>• Keep all your chat history forever</li>
                <li>• Access from any device</li>
                <li>• True data ownership on blockchain</li>
                <li>• Secure decentralized identity</li>
              </ul>
            </div>

            <div className="space-y-3">
              <Button
                onPress={handleUpgradeWithII}
                className="w-full h-12 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold rounded-lg"
                isDisabled={isUpgrading || iiLoading}
              >
                {iiLoading ? 'Initializing...' : '🔐 Upgrade with Internet Identity'}
              </Button>
              
              <Button
                onPress={handleClose}
                className="w-full h-12 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg"
              >
                Maybe Later
              </Button>
            </div>
          </div>
        )}

        {/* Upgrading Step */}
        {step === 'upgrading' && (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
              <span className="text-2xl">⚡</span>
            </div>
            
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Upgrading Your Account
            </h2>
            
            <p className="text-gray-600 mb-6">
              Please complete the Internet Identity authentication and we'll migrate your data to the blockchain.
            </p>

            <div className="flex items-center justify-center space-x-2">
              <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce delay-100"></div>
              <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce delay-200"></div>
            </div>
          </div>
        )}

        {/* Success Step */}
        {step === 'success' && upgradeResult && (
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🎊</span>
            </div>
            
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Welcome to Your Permanent Account!
            </h2>
            
            <p className="text-gray-600 mb-6">
              Your account has been successfully upgraded to the blockchain.
            </p>

            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 mb-6">
              <h3 className="font-semibold text-gray-900 mb-2">Migration Complete:</h3>
              <ul className="text-left text-gray-700 space-y-1">
                <li>• {upgradeResult.migratedMessages} messages migrated</li>
                <li>• Your data is now on the blockchain</li>
                <li>• You can access it from any device</li>
                <li>• Your identity is secured forever</li>
              </ul>
            </div>

            <Button
              onPress={handleClose}
              className="w-full h-12 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold rounded-lg"
            >
              Start Using Your New Account
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AccountUpgradePrompt; 