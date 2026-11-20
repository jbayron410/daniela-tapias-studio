import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import {
  getCachedSeasonalTheme,
  fetchSeasonalThemeConfig,
  isChristmasThemeActive,
} from '../api/gallery';

const SeasonalThemeContext = createContext({
  seasonalConfig: null,
  isFestive: false,
  setSeasonalConfig: () => {},
  refreshSeasonalTheme: async () => {},
});

export function SeasonalThemeProvider({ children }) {
  const [seasonalConfig, setSeasonalConfig] = useState(() => getCachedSeasonalTheme());
  const location = useLocation();

  const refreshSeasonalTheme = useCallback(async () => {
    const config = await fetchSeasonalThemeConfig();
    if (config) {
      setSeasonalConfig(config);
    }
    return config;
  }, []);

  useEffect(() => {
    let isMounted = true;
    fetchSeasonalThemeConfig().then((config) => {
      if (isMounted && config) {
        setSeasonalConfig(config);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const isFestive = isChristmasThemeActive(seasonalConfig);
  const isAdminRoute = location.pathname.startsWith('/admin');

  useEffect(() => {
    const shouldApplyBodyClass = isFestive && !isAdminRoute;
    document.body.classList.toggle('festive-theme', shouldApplyBodyClass);

    return () => {
      document.body.classList.remove('festive-theme');
    };
  }, [isFestive, isAdminRoute]);

  return (
    <SeasonalThemeContext.Provider
      value={{
        seasonalConfig,
        isFestive,
        setSeasonalConfig,
        refreshSeasonalTheme,
      }}
    >
      {children}
    </SeasonalThemeContext.Provider>
  );
}

export function useSeasonalTheme() {
  return useContext(SeasonalThemeContext);
}
