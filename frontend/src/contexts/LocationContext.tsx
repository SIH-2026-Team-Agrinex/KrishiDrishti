import React, { createContext, useContext, useState, useEffect } from 'react';
import { LocationInfo } from '../types/weather.types';
import { localDb } from '../services/db/localDb';

export type GeolocationStatus = 'idle' | 'prompt' | 'loading' | 'granted' | 'denied' | 'unavailable';

interface LocationContextType {
  location: LocationInfo;
  status: GeolocationStatus;
  requestCurrentLocation: () => Promise<void>;
  setManualLocation: (city: string, state?: string, lat?: number, lon?: number) => void;
  isPermissionBannerVisible: boolean;
  dismissPermissionBanner: () => void;
}

const DEFAULT_LOCATION: LocationInfo = {
  latitude: 20.5937,
  longitude: 78.9629,
  city: 'Real-time Field',
  state: 'India',
  country: 'India',
  isCustomLocation: false,
};

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export const LocationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [location, setLocation] = useState<LocationInfo>(() => {
    const saved = localDb.getLocation();
    return saved || DEFAULT_LOCATION;
  });
  const [status, setStatus] = useState<GeolocationStatus>(() => {
    const saved = localDb.getLocation();
    return saved ? 'granted' : 'prompt';
  });
  const [isPermissionBannerVisible, setIsPermissionBannerVisible] = useState<boolean>(() => {
    return !localDb.getLocation();
  });

  // Auto-detect real-time GPS location on initial mount if supported
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const { latitude, longitude, accuracy } = pos.coords;
          let city = 'Current Field';
          let state = 'India';

          try {
            const res = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10`
            );
            if (res.ok) {
              const data = await res.json();
              city = data.address?.city || data.address?.town || data.address?.village || data.address?.county || data.address?.state_district || 'Current Location';
              state = data.address?.state || 'India';
            }
          } catch (e) {
            // keep default
          }

          const newLoc: LocationInfo = {
            latitude,
            longitude,
            accuracy,
            city,
            state,
            country: 'India',
            isCustomLocation: false,
          };
          setLocation(newLoc);
          localDb.setLocation(newLoc);
          setStatus('granted');
          setIsPermissionBannerVisible(false);
        },
        () => {
          setStatus('prompt');
        },
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 }
      );
    }
  }, []);

  const requestCurrentLocation = async () => {
    if (!navigator.geolocation) {
      setStatus('unavailable');
      return;
    }

    setStatus('loading');

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        let city = 'Current Field';
        let state = 'India';

        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10`
          );
          if (res.ok) {
            const data = await res.json();
            city = data.address?.city || data.address?.town || data.address?.village || data.address?.county || data.address?.state_district || 'Current Location';
            state = data.address?.state || 'India';
          }
        } catch (e) {
          // fallback
        }

        const newLoc: LocationInfo = {
          latitude,
          longitude,
          accuracy,
          city,
          state,
          country: 'India',
          isCustomLocation: false,
        };
        setLocation(newLoc);
        localDb.setLocation(newLoc);
        setStatus('granted');
        setIsPermissionBannerVisible(false);
      },
      (err) => {
        console.warn('Geolocation denied or timed out:', err);
        setStatus('denied');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  };

  const setManualLocation = (city: string, state: string = 'India', lat: number = 20.5937, lon: number = 78.9629) => {
    const newLoc: LocationInfo = {
      latitude: lat,
      longitude: lon,
      city,
      state,
      country: 'India',
      isCustomLocation: true,
    };
    setLocation(newLoc);
    localDb.setLocation(newLoc);
    setStatus('granted');
    setIsPermissionBannerVisible(false);
  };

  const dismissPermissionBanner = () => {
    setIsPermissionBannerVisible(false);
  };

  return (
    <LocationContext.Provider
      value={{
        location,
        status,
        requestCurrentLocation,
        setManualLocation,
        isPermissionBannerVisible,
        dismissPermissionBanner,
      }}
    >
      {children}
    </LocationContext.Provider>
  );
};

export const useLocation = () => {
  const context = useContext(LocationContext);
  if (!context) throw new Error('useLocation must be used within a LocationProvider');
  return context;
};
