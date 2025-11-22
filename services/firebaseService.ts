import { getAuth, signInAnonymously } from 'firebase/auth';
import { getFirestore, collection, getDocs, addDoc, updateDoc, deleteDoc, doc, Firestore } from 'firebase/firestore';
// Fix: Import from @firebase/app directly to resolve export issues in some environments
import { initializeApp, getApps, getApp, FirebaseApp } from '@firebase/app';
import { Article, FirebaseConfig } from '../types';

// State management
let app: FirebaseApp | null = null;
let db: Firestore | null = null;
let useLocalStorage = true;
let hasAlertedPermissionError = false;

export const initializeFirebase = async (config: FirebaseConfig) => {
  try {
    if (!config.apiKey) throw new Error("No API Key");
    
    // Reset state
    db = null;
    hasAlertedPermissionError = false;
    
    // Singleton pattern for Firebase App
    if (getApps().length === 0) {
      app = initializeApp(config);
    } else {
      app = getApp();
    }
    
    // Initialize Auth and sign in anonymously
    // This is critical for Firestore rules that check 'request.auth != null'
    const auth = getAuth(app);
    if (!auth.currentUser) {
        try {
            await signInAnonymously(auth);
            console.log("Signed in anonymously to Firebase");
        } catch (authError: any) {
            console.warn("Anonymous auth failed. If your Firestore rules require auth, requests will fail.", authError.message);
        }
    }
    
    db = getFirestore(app);
    useLocalStorage = false;
    console.log("Firebase initialized successfully");
    return true;
  } catch (error) {
    console.error("Firebase initialization failed:", error);
    useLocalStorage = true;
    return false;
  }
};

// Helper to generate ID for local storage
const generateId = () => Math.random().toString(36).substr(2, 9);

// Helper to handle permission errors and switch modes
const handlePermissionError = async (e: any, operationName: string, retryCallback: () => Promise<any>) => {
  console.error(`Firebase ${operationName} Error:`, e);
  
  // Check for permission/auth errors
  if (
    e.code === 'permission-denied' || 
    e.code === 'unavailable' || 
    (e.message && e.message.includes("Missing or insufficient permissions"))
  ) {
    if (!hasAlertedPermissionError) {
      hasAlertedPermissionError = true;
      alert(
        `Firebase Permission Error\n\n` +
        `The app is switching to Local Storage mode so you can continue working.\n\n` +
        `To fix this permanently:\n` +
        `1. Go to Firebase Console > Authentication > Sign-in method\n` +
        `2. Enable "Anonymous" provider\n` +
        `3. Check Firestore Rules are not blocking access.`
      );
    }
    
    console.warn("Switching to Local Storage fallback due to permission error.");
    useLocalStorage = true;
    // Retry the operation immediately using the new Local Storage mode
    return retryCallback();
  }
  
  // If it's another type of error, throw it
  throw e;
};

// --- CRUD Operations ---

export const getArticles = async (): Promise<Article[]> => {
  // Local Storage Path
  if (useLocalStorage || !db) {
    const stored = localStorage.getItem('cms_articles');
    return stored ? JSON.parse(stored) : [];
  }

  // Firestore Path
  try {
    const colRef = collection(db, 'articles');
    const snapshot = await getDocs(colRef);
    
    const articles = snapshot.docs.map(doc => {
      const data = doc.data();
      return { 
        id: doc.id, 
        title: data.title || 'Untitled',
        content: data.content || '',
        excerpt: data.excerpt || '',
        tags: Array.isArray(data.tags) ? data.tags : [],
        status: data.status || 'draft',
        createdAt: data.createdAt || Date.now(),
        updatedAt: data.updatedAt || Date.now(),
        ...data 
      } as Article;
    });

    return articles.sort((a, b) => b.updatedAt - a.updatedAt);
    
  } catch (e: any) {
    return handlePermissionError(e, 'Fetch', getArticles);
  }
};

export const saveArticle = async (article: Omit<Article, 'id'> & { id?: string }): Promise<Article> => {
  const now = Date.now();
  
  // Prepare data: Remove 'id' and undefined values
  const { id, ...rest } = article;
  const cleanData = Object.entries({ ...rest, updatedAt: now }).reduce((acc, [key, value]) => {
    if (value !== undefined) acc[key] = value;
    return acc;
  }, {} as any);

  // Local Storage Path
  if (useLocalStorage || !db) {
    const stored = localStorage.getItem('cms_articles');
    const articles: Article[] = stored ? JSON.parse(stored) : [];
    
    if (id) {
      const index = articles.findIndex(a => a.id === id);
      if (index !== -1) {
        articles[index] = { ...articles[index], ...cleanData } as Article;
        localStorage.setItem('cms_articles', JSON.stringify(articles));
        return articles[index];
      }
    } 
    
    // Create new
    const newArticle: Article = { ...cleanData, id: generateId(), createdAt: now } as Article;
    articles.unshift(newArticle);
    localStorage.setItem('cms_articles', JSON.stringify(articles));
    return newArticle;
  }

  // Firestore Path
  try {
    if (id) {
      const docRef = doc(db, 'articles', id);
      await updateDoc(docRef, cleanData);
      return { ...cleanData, id } as Article;
    } else {
      const colRef = collection(db, 'articles');
      const payload = { ...cleanData, createdAt: now };
      const docRef = await addDoc(colRef, payload);
      return { ...payload, id: docRef.id } as Article;
    }
  } catch (e: any) {
    return handlePermissionError(e, 'Save', () => saveArticle(article));
  }
};

export const deleteArticle = async (id: string): Promise<void> => {
  // Local Storage Path
  if (useLocalStorage || !db) {
    const stored = localStorage.getItem('cms_articles');
    if (stored) {
      const articles: Article[] = JSON.parse(stored);
      const filtered = articles.filter(a => a.id !== id);
      localStorage.setItem('cms_articles', JSON.stringify(filtered));
    }
    return;
  }

  // Firestore Path
  try {
    await deleteDoc(doc(db, 'articles', id));
  } catch (e: any) {
    return handlePermissionError(e, 'Delete', () => deleteArticle(id));
  }
};