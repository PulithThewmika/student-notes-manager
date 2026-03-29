/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('theme');
    if (saved) return saved;
    return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  });

  const [fontSize, setFontSizeState] = useState(() => localStorage.getItem('fontSize') || 'medium');
  const [compactMode, setCompactModeState] = useState(() => localStorage.getItem('compactMode') === 'true');
  const [animations, setAnimationsState] = useState(() => localStorage.getItem('animations') !== 'false');

  useEffect(() => {
    localStorage.setItem('theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('fontSize', fontSize);
    document.documentElement.setAttribute('data-fontsize', fontSize);
  }, [fontSize]);

  useEffect(() => {
    localStorage.setItem('compactMode', compactMode);
    document.documentElement.setAttribute('data-compact', compactMode);
  }, [compactMode]);

  useEffect(() => {
    localStorage.setItem('animations', animations);
    document.documentElement.setAttribute('data-animations', animations);
  }, [animations]);

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  const setFontSize = (size) => setFontSizeState(size);
  const setCompactMode = (compact) => setCompactModeState(compact);
  const setAnimations = (anim) => setAnimationsState(anim);

  return (
    <ThemeContext.Provider value={{ 
      theme, setTheme, toggleTheme, 
      fontSize, setFontSize, 
      compactMode, setCompactMode, 
      animations, setAnimations 
    }}>
      {children}
    </ThemeContext.Provider>
  );
};
