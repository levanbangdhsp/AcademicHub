
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
}

export interface FileRecord {
  id: number;
  user: string;
  type: string;
  fileName: string;
  date: string;
}
