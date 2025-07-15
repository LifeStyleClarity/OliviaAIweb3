import { useState, useEffect, useCallback, useRef } from 'react';
import { profileService } from '../api';

const CACHE_DURATION = 10000; // 10 seconds

export function useProfileSettings(userId, walletAddress) {
  const [profileSettings, setProfileSettings] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Cache ref to avoid re-renders
  const cache = useRef({
    settings: new Map(),
    lastFetch: new Map()
  });

  // Check if cache is valid
  const isCacheValid = useCallback((key) => {
    const lastFetch = cache.current.lastFetch.get(key);
    return lastFetch && (Date.now() - lastFetch) < CACHE_DURATION;
  }, []);

  // Create default profile settings
  const createDefaultSettings = useCallback(async () => {
    try {
      return await profileService.createDefaultSettings(userId);
    } catch (err) {
      console.error('Error creating profile settings:', err);
      throw err;
    }
  }, [userId]);

  // Fetch or create profile settings with cache
  const fetchProfileSettings = useCallback(async (retries = 3) => {
    if (!userId) return;

    const cacheKey = `${userId}-settings`;

    // Check cache
    if (isCacheValid(cacheKey)) {
      const cachedSettings = cache.current.settings.get(cacheKey);
      if (cachedSettings) {
        setProfileSettings(cachedSettings);
        setIsLoading(false);
        return;
      }
    }

    try {
      setIsLoading(true);
      setError(null);

      // Check if settings exist
      let settings = await profileService.checkProfileSettingsExists(userId);

      // If settings don't exist, create them
      if (!settings) {
        settings = await createDefaultSettings();
      }

      // Update cache
      cache.current.settings.set(cacheKey, settings);
      cache.current.lastFetch.set(cacheKey, Date.now());

      setProfileSettings(settings);
      setError(null);
    } catch (err) {
      console.error('Error in profile settings:', err);
      if (retries > 0 && err.message?.includes('Network Error')) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        return fetchProfileSettings(retries - 1);
      }
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [userId, isCacheValid, createDefaultSettings]);

  // Update profile settings
  const updateSettings = useCallback(async (updateData) => {
    if (!userId) return;

    try {
      setIsLoading(true);
      setError(null);

      const updatedSettings = await profileService.updateProfileSettings(userId, updateData);

      // Update cache
      const cacheKey = `${userId}-settings`;
      cache.current.settings.set(cacheKey, updatedSettings);
      cache.current.lastFetch.set(cacheKey, Date.now());

      setProfileSettings(updatedSettings);
      return updatedSettings;
    } catch (err) {
      console.error('Error updating profile settings:', err);
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  // Initial fetch effect
  useEffect(() => {
    //console.log("userId : ", userId)
    if (!userId || !walletAddress) {
      setError('Missing user data or wallet');
      setIsLoading(false);
      return;
    }

    fetchProfileSettings();
  }, [userId, walletAddress, fetchProfileSettings]);

  return {
    profileSettings,
    isLoading,
    error,
    updateSettings,
    refreshSettings: fetchProfileSettings
  };
}
