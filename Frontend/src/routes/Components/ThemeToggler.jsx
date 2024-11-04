import React, { useReducer, useEffect } from 'react';
import { Sun, Moon } from 'lucide-react';

// Action types
const TOGGLE_THEME = 'TOGGLE_THEME';
const SET_THEME = 'SET_THEME';

// Reducer function
const themeReducer = (state, action) => {
  switch (action.type) {
    case TOGGLE_THEME:
      return state === 'style1' ? 'style2' : 'style1';
    case SET_THEME:
      return action.payload;
    default:
      return state;
  }
};

const ThemeToggler = () => {
  const [theme, dispatch] = useReducer(themeReducer, 'style1');

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      dispatch({ type: SET_THEME, payload: savedTheme });
    }
  }, []);

  useEffect(() => {
    const link = document.getElementById('dynamic-css');
    if (link) {
      link.href = `${process.env.PUBLIC_URL}/styles/${theme}.css`;
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    dispatch({ type: TOGGLE_THEME });
  };

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-full bg-gray-200 dark:bg-gray-700"
      aria-label="Toggle theme"
    >
      {theme === 'style1' ? (
        <Moon className="w-5 h-5 text-gray-800 dark:text-gray-200" />
      ) : (
        <Sun className="w-5 h-5 text-gray-800 dark:text-gray-200" />
      )}
    </button>
  );
};

export default ThemeToggler;