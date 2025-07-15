import { createContext, useContext, useState } from 'react';
import PropTypes from 'prop-types';

// Create the context
const TokenInfluencerContext = createContext();

// Create a provider component
export function TokenInfluencerProvider({ children }) {
  const [selectedData, setSelectedData] = useState({
    token: null,
    influencer: null,
    userData: null
  });

  // Function to update the context with new data
  const setTokenInfluencerData = (token, influencer, userData) => {
    setSelectedData({
      token,
      influencer,
      userData
    });
  };

  // Value to be provided to consumers
  const value = {
    selectedData,
    setTokenInfluencerData
  };

  return (
    <TokenInfluencerContext.Provider value={value}>
      {children}
    </TokenInfluencerContext.Provider>
  );
}

TokenInfluencerProvider.propTypes = {
  children: PropTypes.node.isRequired
};

// Custom hook to use the context
export function useTokenInfluencer() {
  const context = useContext(TokenInfluencerContext);
  if (context === undefined) {
    throw new Error('useTokenInfluencer must be used within a TokenInfluencerProvider');
  }
  return context;
}
