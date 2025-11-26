
import { BoardItem, User } from '../types';

// If you deploy the server, change this URL to your deployed server address
// e.g. 'https://my-utpadakata-api.herokuapp.com/api'
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

/**
 * Tries to fetch from the MongoDB backend, falls back to localStorage if offline/no server.
 */
export const storageService = {
  async loginUser(user: Partial<User>): Promise<User> {
    try {
      const res = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(user)
      });
      if (!res.ok) throw new Error('Server offline');
      return await res.json();
    } catch (e) {
      console.warn("Backend unavailable, using LocalStorage");
      // Fallback
      return user as User;
    }
  },

  async loadWorkspace(userId: string): Promise<BoardItem[]> {
    try {
      const res = await fetch(`${API_URL}/workspace/${userId}`);
      if (!res.ok) throw new Error('Server offline');
      const data = await res.json();
      return data.items || [];
    } catch (e) {
      console.warn("Backend unavailable, using LocalStorage");
      const local = localStorage.getItem(`utpadakata_items_${userId}`);
      return local ? JSON.parse(local) : [];
    }
  },

  async saveWorkspace(userId: string, items: BoardItem[]): Promise<void> {
    // Always save to local storage for immediate redundancy
    localStorage.setItem(`utpadakata_items_${userId}`, JSON.stringify(items));

    try {
      await fetch(`${API_URL}/workspace/${userId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items })
      });
    } catch (e) {
      // Silent fail on server sync if offline
    }
  }
};