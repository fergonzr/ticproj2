// Solves a platform problem: expo-secure-store 
// (encrypted device storage) doesn't exist in a web browser.
// This file checks Platform.OS at runtime and routes 
// to the right storage:

// Native (iOS/Android): SecureStore — encrypted, sandboxed
// Web (browser): localStorage — plain browser storage
// All hooks that save tokens or user data go through here.
// Never import expo-secure-store directly.

import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";

/**
 * Cross-platform key-value storage.
 * Uses expo-secure-store on native and localStorage on web.
 */
export async function getItem(key: string): Promise<string | null> {
  if (Platform.OS === "web") {
    return localStorage.getItem(key);
  }
  return SecureStore.getItemAsync(key);
}

export async function setItem(key: string, value: string): Promise<void> {
  if (Platform.OS === "web") {
    localStorage.setItem(key, value);
    return;
  }
  return SecureStore.setItemAsync(key, value);
}

export async function deleteItem(key: string): Promise<void> {
  if (Platform.OS === "web") {
    localStorage.removeItem(key);
    return;
  }
  return SecureStore.deleteItemAsync(key);
}
