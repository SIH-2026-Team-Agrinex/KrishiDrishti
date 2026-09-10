import React, { createContext, useContext, useState, useEffect } from 'react';
import { LocationInfo } from '../types/weather.types';
import { localDb } from '../services/db/localDb';
import { weatherService } from '../services/api/weatherService';

export type GeolocationStatus = 'idle' | 'prompt' | 'loading' | 'granted' | 'denied' | 'unavailable';

interface LocationContextType {
  location: LocationInfo;
  status: GeolocationStatus;
  requestCurrentLocation: () => Promise<void>;
  refreshLocation: () => Promise<LocationInfo>;
  setManualLocation: (city: string, state?: string, lat?: number, lon?: number) => void;
  isPermissionBannerVisible: boolean;
  dismissPermissionBanner: () => void;
}

export const DEFAULT_LOCATION: LocationInfo = {
  latitude: 20.5937,
  longitude: 78.9629,
  city: 'Real-time Field',
  state: 'India',
  country: 'India',
  isCustomLocation: false,
};

export async function getRealTimeTestLocation(currentFallback?: LocationInfo): Promise<LocationInfo> {
  // 1. Check if high-precision GPS is available right at test time
  if (typeof navigator !== 'undefined' && navigator.geolocation) {
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 4500,
          maximumAge: 10000,
        });
      });
      const { latitude, longitude, accuracy } = pos.coords;
      let city = 'Current Field';
      let state = 'India';
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=12`,
          { headers: { 'Accept': 'application/json' } }
        );
        if (res.ok) {
          const data = await res.json();
          const addr = data.address || {};
          city = addr.city || addr.town || addr.village || addr.suburb || addr.county || addr.state_district || city;
          state = addr.state || state;
        }
      } catch {}

      const gpsLoc: LocationInfo = {
        latitude,
        longitude,
        accuracy,
        city,
        state,
        country: 'India',
        isCustomLocation: false,
      };
      localDb.setLocation(gpsLoc);
      return gpsLoc;
    } catch {
      // GPS permission denied, unvailable, or timed out
    }
  }

  // 2. If user already established a custom verified farm location, preserve it
  if (currentFallback && currentFallback.isCustomLocation) {
    return currentFallback;
  }

  // 3. Fallback to real-time network IP geolocation (accurate to city/region without needing GPS approval)
  try {
    const ipRes = await fetch('https://ipwho.is/');
    if (ipRes.ok) {
      const data = await ipRes.json();
      if (data.success !== false && data.latitude && data.longitude) {
        const ipLoc: LocationInfo = {
          latitude: data.latitude,
          longitude: data.longitude,
          city: data.city || 'Current Field',
          state: data.region || data.country || 'India',
          country: data.country || 'India',
          isCustomLocation: false,
        };
        localDb.setLocation(ipLoc);
        return ipLoc;
      }
    }
  } catch {}

  // 4. Secondary IP geolocation fallback
  try {
    const ipRes2 = await fetch('https://freeipapi.com/api/json');
    if (ipRes2.ok) {
      const data2 = await ipRes2.json();
      if (data2.latitude && data2.longitude) {
        const ipLoc2: LocationInfo = {
          latitude: data2.latitude,
          longitude: data2.longitude,
          city: data2.cityName || 'Current Field',
          state: data2.regionName || 'India',
          country: data2.countryName || 'India',
          isCustomLocation: false,
        };
        localDb.setLocation(ipLoc2);
        return ipLoc2;
      }
    }
  } catch {}

  return currentFallback || DEFAULT_LOCATION;
}

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

  // Auto-detect real-time GPS location on mount with fast IP fallback
  useEffect(() => {
    const initLocation = async () => {
      const saved = localDb.getLocation();
      // If user has a custom location, keep it
      if (saved && saved.isCustomLocation) {
        return;
      }

      // If saved location is still unverified default, refresh it with real-time location
      const isUnverifiedDefault = !saved || (saved.latitude === 20.5937 && saved.longitude === 78.9629 && !saved.isCustomLocation);

      if (isUnverifiedDefault) {
        const fresh = await getRealTimeTestLocation(saved || undefined);
        setLocation(fresh);
        setStatus('granted');
        setIsPermissionBannerVisible(false);
      }
    };

    initLocation();
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

  const refreshLocation = async (): Promise<LocationInfo> => {
    setStatus('loading');
    const fresh = await getRealTimeTestLocation(location);
    setLocation(fresh);
    localDb.setLocation(fresh);
    setStatus('granted');
    try {
      await weatherService.getCurrentWeather(fresh);
    } catch {}
    return fresh;
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
        refreshLocation,
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
