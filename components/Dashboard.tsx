import React from 'react';
import { Article } from '../types';
import { Edit3, Trash2, Calendar, Tag, FileText } from 'lucide-react';

interface DashboardProps {
  articles: Article[];
  onCreate: () => void;
  onEdit: (article: Article) => void;
  onDelete: (id: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ articles, onCreate, onEdit, onDelete }) => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Your Posts</h2>
          <p className="text-gray-500 text-sm mt-1">Manage and organize your content.</p>
        </div>
        <button
          onClick={onCreate}
          className="inline-flex items-center justify-center px-5 py-2.5 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all"
        >
          + New Post
        </button>
      </div>

      {articles.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border border-dashed border-gray-300">
          <div className="mx-auto w-16 h-16 bg-indigo-50 text-indigo-500 rounded-full flex items-center justify-center mb-4">
            <FileText size={32} />
          </div>
          <h3 className="text-lg font-medium text-gray-900">No posts yet</h3>
          <p className="mt-2 text-sm text-gray-500 max-w-sm mx-auto">Get started by creating your first blog post. You can use Gemini AI to help you write!</p>
          <button
            onClick={onCreate}
            className="mt-6 text-indigo-600 hover:text-indigo-800 font-medium text-sm"
          >
            Create your first post &rarr;
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {articles.map((article) => (
            <div
              key={article.id}
              className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow duration-200 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    article.status === 'published' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {article.status === 'published' ? 'Published' : 'Draft'}
                  </span>
                  <span className="flex items-center text-xs text-gray-400">
                    <Calendar size={12} className="mr-1" />
                    {new Date(article.updatedAt).toLocaleDateString()}
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 truncate mb-1">{article.title}</h3>
                <p className="text-sm text-gray-500 truncate mb-3">{article.excerpt}</p>
                
                <div className="flex flex-wrap gap-2">
                  {article.tags.slice(0, 3).map(tag => (
                    <span key={tag} className="inline-flex items-center text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                      <Tag size={10} className="mr-1" /> {tag}
                    </span>
                  ))}
                  {article.tags.length > 3 && (
                    <span className="text-xs text-gray-400 py-1">+ {article.tags.length - 3} more</span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-center">
                <button
                  onClick={() => onEdit(article)}
                  className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                  title="Edit"
                >
                  <Edit3 size={18} />
                </button>
                <button
                  onClick={() => {
                    if(confirm('Are you sure you want to delete this post?')) onDelete(article.id);
                  }}
                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Delete"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Dashboard;
