import { useAuth } from '../contexts/AuthContext';
import { useTonConnectUI } from '@tonconnect/ui-react';
import { useTradeData } from '../hooks/useTradeData';
import { useProfileSettings } from '../hooks/useProfileSettings';

function Tests() {
  const { userData, userAuthenticated } = useAuth();
  const [tonConnectUI] = useTonConnectUI();
  const wallet = tonConnectUI.wallet;

  const {
    trades,
    portfolio,
    lastUpdate,
    loadingStates: tradeLoadingStates,
    errors: tradeErrors
  } = useTradeData(
    userData?.user_id,
    wallet?.account?.address
  );

  const {
    profileSettings,
    isLoading: profileLoading,
    error: profileError
  } = useProfileSettings(
    userData?.user_id,
    wallet?.account?.address
  );

  const loadingStates = {
    ...tradeLoadingStates,
    profile: profileLoading
  };

  const errors = {
    ...tradeErrors,
    profile: profileError
  };

  if (!userAuthenticated) {
    return (
      <div className="container mx-auto p-4">
        <div className="border border-red-400 text-red-700 px-4 py-3 rounded">
          <p className="font-bold">Not Authenticated</p>
          <p>Please log in to view trades data.</p>
        </div>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="container mx-auto p-4">
        <div className="border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
          <p className="font-bold">Authentication Status</p>
          <p>Authenticated: {String(userAuthenticated)}</p>
          <p>Waiting for user data...</p>
        </div>
      </div>
    );
  }

  const isLoading = Object.values(loadingStates).some(state => state);
  if (isLoading) {
    return (
      <div className="container mx-auto p-4">
        <div className="border border-blue-400 text-blue-700 px-4 py-3 rounded">
          <p className="font-bold">Loading Data</p>
          <div className="mt-2">
            {loadingStates.profile && <p>Loading profile settings...</p>}
            {loadingStates.portfolio && <p>Loading portfolio data...</p>}
            {loadingStates.trades && <p>Loading trades data...</p>}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Debug Data</h1>
      
      <div className="mb-4 border border-green-400 text-green-700 px-4 py-3 rounded">
        <p className="font-bold">Authentication Status</p>
        <p>Authenticated: {String(userAuthenticated)}</p>
      </div>
      
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold mb-2">User Data</h2>
          <pre className="p-4 rounded-lg overflow-auto border">
            {JSON.stringify(userData, null, 2)}
          </pre>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-2">Portfolio Data</h2>
          {errors.portfolio ? (
            <div className="text-red-500 mb-2">Error: {errors.portfolio}</div>
          ) : null}
          <pre className="p-4 rounded-lg overflow-auto border">
            {JSON.stringify(portfolio, null, 2)}
          </pre>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-2">Profile Settings</h2>
          {errors.profile ? (
            <div className="text-red-500 mb-2">Error: {errors.profile}</div>
          ) : null}
          <pre className="p-4 rounded-lg overflow-auto border">
            {JSON.stringify(profileSettings, null, 2)}
          </pre>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-2">Trades Data</h2>
          <div className="border border-blue-400 text-blue-700 px-4 py-3 rounded mb-2">
            <p>Auto-refreshing every 30 seconds</p>
            <p>Last update: {lastUpdate.toLocaleTimeString()}</p>
          </div>
          {errors.trades ? (
            <div className="text-red-500 mb-2">Error: {errors.trades}</div>
          ) : null}
          <pre className="p-4 rounded-lg overflow-auto border">
            {JSON.stringify(trades, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
}

export default Tests;
