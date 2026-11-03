import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { MemberUser, UserBookmark } from '../types';
import { api } from '../services/api';

interface UserAuthContextType {
  user: MemberUser | null;
  userToken: string | null;
  isUserLoading: boolean;
  bookmarkedKeys: Set<string>;
  allBookmarks: UserBookmark[];
  loginUser: (token: string, user: MemberUser) => void;
  logoutUser: () => Promise<void>;
  refreshUser: () => Promise<void>;
  toggleBookmark: (item_type: 'speech' | 'reel' | 'book' | 'article' | 'aqwaal' | 'shayariyan', item_id: string) => Promise<boolean>;
  isBookmarked: (item_type: string, item_id: string) => boolean;
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;
  authModalTab: 'signin' | 'signup';
  setAuthModalTab: (tab: 'signin' | 'signup') => void;
  isProfileModalOpen: boolean;
  setIsProfileModalOpen: (open: boolean) => void;
  openAuthModal: (tab?: 'signin' | 'signup') => void;
}

const UserAuthContext = createContext<UserAuthContextType | undefined>(undefined);

export const UserAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<MemberUser | null>(null);
  const [userToken, setUserToken] = useState<string | null>(() => localStorage.getItem('mishkaat_user_token'));
  const [isUserLoading, setIsUserLoading] = useState(true);
  const [bookmarkedKeys, setBookmarkedKeys] = useState<Set<string>>(new Set());
  const [allBookmarks, setAllBookmarks] = useState<UserBookmark[]>([]);
  
  // Modals state
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState<'signin' | 'signup'>('signin');
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  const openAuthModal = (tab: 'signin' | 'signup' = 'signin') => {
    setAuthModalTab(tab);
    setIsAuthModalOpen(true);
  };

  const fetchBookmarks = useCallback(async () => {
    const token = localStorage.getItem('mishkaat_user_token');
    if (!token) {
      setBookmarkedKeys(new Set());
      setAllBookmarks([]);
      return;
    }
    try {
      const [list, ids] = await Promise.all([
        api.getUserBookmarks().catch(() => []),
        api.getUserBookmarkIds().catch(() => [])
      ]);
      setAllBookmarks(list);
      const keySet = new Set<string>();
      for (const item of ids) {
        keySet.add(`${item.item_type}:${item.item_id}`);
      }
      setBookmarkedKeys(keySet);
    } catch {
      // Ignore
    }
  }, []);

  const refreshUser = useCallback(async () => {
    const token = localStorage.getItem('mishkaat_user_token');
    if (!token) {
      setUser(null);
      setIsUserLoading(false);
      setBookmarkedKeys(new Set());
      setAllBookmarks([]);
      return;
    }
    try {
      const res = await api.getUserMe();
      setUser(res.user);
      setUserToken(token);
      await fetchBookmarks();
    } catch {
      localStorage.removeItem('mishkaat_user_token');
      setUser(null);
      setUserToken(null);
      setBookmarkedKeys(new Set());
      setAllBookmarks([]);
    } finally {
      setIsUserLoading(false);
    }
  }, [fetchBookmarks]);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const loginUser = (token: string, newUser: MemberUser) => {
    localStorage.setItem('mishkaat_user_token', token);
    setUserToken(token);
    setUser(newUser);
    fetchBookmarks();
  };

  const logoutUser = async () => {
    try {
      await api.userLogout();
    } catch {
      // Ignore
    } finally {
      localStorage.removeItem('mishkaat_user_token');
      setUserToken(null);
      setUser(null);
      setBookmarkedKeys(new Set());
      setAllBookmarks([]);
      setIsProfileModalOpen(false);
    }
  };

  const toggleBookmark = async (item_type: 'speech' | 'reel' | 'book' | 'article' | 'aqwaal' | 'shayariyan', item_id: string): Promise<boolean> => {
    if (!user) {
      openAuthModal('signin');
      return false;
    }

    const key = `${item_type}:${item_id}`;
    const wasBookmarked = bookmarkedKeys.has(key);

    // Optimistic UI update
    setBookmarkedKeys((prev) => {
      const next = new Set(prev);
      if (wasBookmarked) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });

    try {
      const res = await api.toggleBookmark(item_type, item_id);
      fetchBookmarks();
      return res.bookmarked;
    } catch {
      // Revert on error
      setBookmarkedKeys((prev) => {
        const next = new Set(prev);
        if (wasBookmarked) {
          next.add(key);
        } else {
          next.delete(key);
        }
        return next;
      });
      return wasBookmarked;
    }
  };

  const isBookmarked = (item_type: string, item_id: string) => {
    return bookmarkedKeys.has(`${item_type}:${item_id}`);
  };

  return (
    <UserAuthContext.Provider
      value={{
        user,
        userToken,
        isUserLoading,
        bookmarkedKeys,
        allBookmarks,
        loginUser,
        logoutUser,
        refreshUser,
        toggleBookmark,
        isBookmarked,
        isAuthModalOpen,
        setIsAuthModalOpen,
        authModalTab,
        setAuthModalTab,
        isProfileModalOpen,
        setIsProfileModalOpen,
        openAuthModal
      }}
    >
      {children}
    </UserAuthContext.Provider>
  );
};

export function useUserAuth() {
  const context = useContext(UserAuthContext);
  if (!context) {
    throw new Error('useUserAuth must be used within a UserAuthProvider');
  }
  return context;
}
