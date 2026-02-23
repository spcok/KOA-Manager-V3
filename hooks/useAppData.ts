
import { use } from 'react';
import { AppContext } from '../context/AppContext';

/**
 * Custom hook to access the global application state and actions.
 * Throws an error if used outside of an AppProvider.
 * This is the React 19-compliant way to consume context.
 */
export const useAppData = () => {
  const context = use(AppContext);
  if (!context) {
    throw new Error('useAppData must be used within an AppProvider');
  }
  return context;
};
