import React, { useState, useEffect } from 'react';
import { Article, ViewState, FirebaseConfig } from './types';
import { getArticles, saveArticle, deleteArticle, initializeFirebase } from './services/firebaseService';
import Dashboard from './components/Dashboard';
import Editor from './components/Editor';
import Settings from './components/Settings';
import { LayoutGrid, Settings as SettingsIcon, Bot, Database } from 'lucide-react';

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>(ViewState.DASHBOARD);
  const [articles, setArticles] = useState<Article[]>([]);
  const [editingArticle, setEditingArticle] = useState<Article | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [isFirebaseConfigured, setIsFirebaseConfigured] = useState(false);

  // Load data on mount
  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      const configStr = localStorage.getItem('cms_firebase_config');
      
      if (configStr) {
        try {
          const config: FirebaseConfig = JSON.parse(configStr);
          // Await initialization to ensure auth and db connection are ready
          const success = await initializeFirebase(config);
          setIsFirebaseConfigured(success);
        } catch (e) {
          console.error("Invalid config stored");
        }
      }
      
      // Load articles only after initialization attempt is complete
      await loadArticles();
      setIsLoading(false);
    };
    
    init();
  }, []);

  const loadArticles = async () => {
    try {
      const data = await getArticles();
      setArticles(data);
    } catch (error) {
      console.error("Failed to load articles", error);
    }
  };

  const handleCreate = () => {
    setEditingArticle(undefined);
    setView(ViewState.EDITOR);
  };

  const handleEdit = (article: Article) => {
    setEditingArticle(article);
    setView(ViewState.EDITOR);
  };

  const handleDelete = async (id: string) => {
    await deleteArticle(id);
    await loadArticles();
  };

  const handleSave = async (article: Omit<Article, 'id'> & { id?: string }) => {
    try {
      await saveArticle(article);
      await loadArticles();
      setView(ViewState.DASHBOARD);
    } catch (error) {
      // Error is already logged/alerted in service
      console.error("Save failed in UI");
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gray-50 font-sans text-gray-900">
      
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 bg-white border-r border-gray-200 flex flex-col fixed md:relative z-20 h-auto md:h-screen bottom-0 md:bottom-auto">
        <div className="p-6 flex items-center gap-3 border-b border-gray-100">
          <div className="bg-gradient-to-br from-indigo-600 to-purple-600 text-white p-2 rounded-lg">
             <Bot size={24} />
          </div>
          <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
            VibeCMS
          </h1>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <button
            onClick={() => setView(ViewState.DASHBOARD)}
            className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-colors ${
              view === ViewState.DASHBOARD 
                ? 'bg-indigo-50 text-indigo-700' 
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <LayoutGrid size={18} />
            Posts
          </button>
          
          <button
            onClick={() => setView(ViewState.SETTINGS)}
            className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-colors ${
              view === ViewState.SETTINGS 
                ? 'bg-indigo-50 text-indigo-700' 
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <SettingsIcon size={18} />
            Settings
          </button>
        </nav>

        <div className="p-4 border-t border-gray-100">
          <div className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium ${isFirebaseConfigured ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'}`}>
            <Database size={14} />
            {isFirebaseConfigured ? 'Firebase Connected' : 'Local Storage Mode'}
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto h-screen md:h-auto p-4 md:p-8 pb-24 md:pb-8">
        {view === ViewState.DASHBOARD && (
          <>
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              </div>
            ) : (
              <Dashboard
                articles={articles}
                onCreate={handleCreate}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            )}
          </>
        )}

        {view === ViewState.EDITOR && (
          <Editor
            initialArticle={editingArticle}
            onSave={handleSave}
            onCancel={() => setView(ViewState.DASHBOARD)}
          />
        )}

        {view === ViewState.SETTINGS && (
          <Settings 
            onClose={() => {
              const config = localStorage.getItem('cms_firebase_config');
              if(config) setIsFirebaseConfigured(true);
              // Trigger a reload of articles to check connection
              const init = async () => {
                 setIsLoading(true);
                 if (config) {
                     const parsed = JSON.parse(config);
                     await initializeFirebase(parsed);
                 }
                 await loadArticles();
                 setIsLoading(false);
              }
              init();
              setView(ViewState.DASHBOARD);
            }} 
          />
        )}
      </main>
    </div>
  );
};

export default App;