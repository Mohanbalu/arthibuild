import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, UserRole } from '../types';
import { StorageService } from '../services/storage';
import { DEMO_USERS } from '../services/seedData';

interface LoginResult {
  success: boolean;
  error?: string;
  user?: UserProfile;
}

interface AuthContextType {
  currentUser: UserProfile;
  role: UserRole;
  isAuthenticated: boolean;
  login: (identifier: string, password: string) => LoginResult;
  logout: () => void;
  switchUser: (user: UserProfile) => void;
  availableUsers: UserProfile[];
  isAdmin: boolean;
  isPM: boolean;
  isCoordinator: boolean;
  isCustomer: boolean;
  canManageProjects: boolean;
  canManageTasks: boolean;
  canVerifyMilestones: boolean;
  canUploadSiteUpdates: boolean;
  canSubmitCustomization: boolean;
  canReviewCustomization: boolean;
  canConductInspection: boolean;
  canSignHandover: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  StorageService.init();

  // Read initial session from localStorage
  const [sessionUser, setSessionUser] = useState<UserProfile | null>(() => {
    return StorageService.getAuthSession();
  });

  const isAuthenticated = sessionUser !== null;
  const currentUser = sessionUser || DEMO_USERS[0];

  useEffect(() => {
    StorageService.saveAuthSession(sessionUser);
  }, [sessionUser]);

  // Authenticate user with predefined demo accounts
  const login = (identifier: string, password: string): LoginResult => {
    const cleanId = identifier.trim().toLowerCase();
    const cleanPass = password.trim();

    if (!cleanId) {
      return { success: false, error: 'Please enter your username or email address.' };
    }
    if (!cleanPass) {
      return { success: false, error: 'Please enter your account password.' };
    }

    const matchedUser = DEMO_USERS.find(user => {
      const emailMatch = user.email.toLowerCase() === cleanId;
      const usernameMatch = user.username.toLowerCase() === cleanId;
      return emailMatch || usernameMatch;
    });

    if (!matchedUser) {
      return {
        success: false,
        error: 'Account not recognized. Please check your username/email or use the demo credentials below.'
      };
    }

    if (matchedUser.demoPassword && matchedUser.demoPassword !== cleanPass) {
      return {
        success: false,
        error: 'Incorrect password entered. Please use the demo password assigned to this account.'
      };
    }

    // Credentials valid
    setSessionUser(matchedUser);
    StorageService.saveAuthSession(matchedUser);
    return { success: true, user: matchedUser };
  };

  // Sign out
  const logout = () => {
    setSessionUser(null);
    StorageService.clearAuthSession();
  };

  // Switch demo user (when authenticated)
  const switchUser = (user: UserProfile) => {
    setSessionUser(user);
    StorageService.saveAuthSession(user);
  };

  const role = currentUser.role;
  const isAdmin = role === 'admin';
  const isPM = role === 'project_manager' || isAdmin;
  const isCoordinator = role === 'site_coordinator' || isAdmin || isPM;
  const isCustomer = role === 'customer';

  // Specific capability permissions
  const canManageProjects = isAdmin;
  const canManageTasks = isAdmin || isPM || isCoordinator;
  const canVerifyMilestones = isAdmin || isPM;
  const canUploadSiteUpdates = isAdmin || isPM || isCoordinator;
  const canSubmitCustomization = isCustomer || isAdmin;
  const canReviewCustomization = isAdmin || isPM;
  const canConductInspection = isAdmin || isPM || isCoordinator;
  const canSignHandover = isAdmin || isPM;

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        role,
        isAuthenticated,
        login,
        logout,
        switchUser,
        availableUsers: DEMO_USERS,
        isAdmin,
        isPM,
        isCoordinator,
        isCustomer,
        canManageProjects,
        canManageTasks,
        canVerifyMilestones,
        canUploadSiteUpdates,
        canSubmitCustomization,
        canReviewCustomization,
        canConductInspection,
        canSignHandover
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
