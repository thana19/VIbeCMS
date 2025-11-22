export interface Article {
  id: string;
  title: string;
  content: string;
  excerpt: string;
  tags: string[];
  status: 'draft' | 'published';
  createdAt: number;
  updatedAt: number;
}

export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

export enum ViewState {
  DASHBOARD = 'DASHBOARD',
  EDITOR = 'EDITOR',
  SETTINGS = 'SETTINGS',
}
