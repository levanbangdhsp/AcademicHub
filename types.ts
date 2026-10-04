
export interface TabProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export interface NavigationProps extends TabProps {
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
  user: User | null;
  onLogout: () => void;
  onOpenAuth: () => void;
  onAiAccessDenied?: () => void;
}

export interface Software {
  id: number;
  title: string;
  desc: string;
  tag: string;
}

export interface FAQItem {
  q: string;
  a: string;
}

export interface Message {
  id: number;
  sender: 'user' | 'bot';
  text: string;
  suggestions?: string[];
}

export interface Topic {
  id: number;
  name: string;
  author: string;
  status: string;
  score: number | null;
  date: string | null;
  field?: string;
}

export interface TopicAnalysis {
  score: number;
  viability: string;
  suggestions: string[];
  novelty: string;
}

export type Role = 'admin' | 'user' | 'sub-admin';

export interface User {
  id?: number;
  name: string;
  email: string;
  phone?: string;
  role: Role;
  status?: string;
  canEdit?: boolean;
  canCheckAi?: boolean;
}

export interface FileRecord {
  id: number;
  user: string;
  type: string;
  fileName: string;
  date: string;
}

export const ADMIN_EMAIL = 'banglv@hcmue.edu.vn';

export const isAiCheckAdmin = (user: User | null | undefined): boolean => {
  if (!user) return false;
  const email = (user.email || '').trim().toLowerCase();
  if (email === ADMIN_EMAIL.toLowerCase() || user.role === 'admin') return true;
  if (user.canCheckAi === true) return true;

  // Real-time check from local granted list
  try {
    const raw = localStorage.getItem('ai_granted_staff_emails');
    if (raw) {
      const list = JSON.parse(raw);
      if (Array.isArray(list) && list.some((e: string) => String(e).trim().toLowerCase() === email)) {
        return true;
      }
    }
  } catch (e) {
    // Ignore error
  }

  return false;
};

