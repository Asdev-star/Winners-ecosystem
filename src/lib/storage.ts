// src/lib/storage.ts
import type { StateStorage } from "zustand/middleware";

/**
 * Platform-agnostic storage for Zustand persistence.
 * Uses localStorage on web and can be extended for React Native.
 */
const webStorage: StateStorage = {
  getItem: (name) => {
    return localStorage.getItem(name);
  },
  setItem: (name, value) => {
    localStorage.setItem(name, value);
  },
  removeItem: (name) => {
    localStorage.removeItem(name);
  },
};

// In a real React Native environment, this would be replaced by AsyncStorage
// For now, we provide the web implementation by default
export const persistStorage = webStorage;

/**
 * A helper to provide storage based on platform.
 * This can be used in React Native build by shimming this file or using conditional imports.
 */
export function getPersistStorage(): StateStorage {
  return persistStorage;
}
