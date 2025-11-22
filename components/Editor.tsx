import React, { useState } from 'react';
import { Article } from '../types';
import { generatePostIdeas, polishContent, generateTags, generateArticleContent } from '../services/geminiService';
import { Save, Wand2, Tag, Type, FileText, RefreshCw, ArrowLeft, Sparkles } from 'lucide-react';

interface EditorProps {
  initialArticle?: Article;
  onSave: (article: Omit<Article, 'id'> & { id?: string }) => Promise<void>;
  onCancel: () => void;
}

const Editor: React.FC<EditorProps> = ({ initialArticle, onSave, onCancel }) => {
  const [title, setTitle] = useState(initialArticle?.title || '');
  const [content, setContent] = useState(initialArticle?.content || '');
  const [tags, setTags] = useState<string[]>(initialArticle?.tags || []);
  const [status, setStatus] = useState<'draft' | 'published'>(initialArticle?.status || 'draft');
  const [isSaving, setIsSaving] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);

  // AI Features
  const handleGenerateIdeas = async () => {
    if (!title && !content) {
      alert("Please enter a topic in the title field to generate ideas.");
      return;
    }
    setAiLoading(true);
    const topic = title || "Technology Trends";
    const ideas = await generatePostIdeas(topic);
    if (ideas.length > 0) {
        // Just picking the first one for simplicity in this demo, could be a modal
        const selected = confirm(`Use this title?\n\n${ideas[0]}`);
        if (selected) setTitle(ideas[0]);
    }
    setAiLoading(false);
  };

  const handleGenerateContent = async () => {
    if (!title) {
      alert("Please enter a title first to generate relevant content.");
      return;
    }
    
    if (content && !confirm("This will replace your current content. Are you sure you want to continue?")) {
        return;
    }

    setAiLoading(true);
    const generatedText = await generateArticleContent(title);
    if (generatedText) {
        setContent(generatedText);
    }
    setAiLoading(false);
  };

  const handlePolish = async () => {
    if (!content) return;
    setAiLoading(true);
    const polished = await polishContent(content);
    setContent(polished);
    setAiLoading(false);
  };

  const handleAutoTag = async () => {
    if (!content) return;
    setAiLoading(true);
    const newTags = await generateTags(content);
    setTags([...new Set([...tags, ...newTags])]);
    setAiLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    await onSave({
      id: initialArticle?.id,
      title,
      content,
      excerpt: content.substring(0, 150) + '...',
      tags,
      status,
      createdAt: initialArticle?.createdAt || Date.now(),
      updatedAt: Date.now()
    });
    setIsSaving(false);
  };

  return (
    <div className="max-w-4xl mx-auto">
       <button onClick={onCancel} className="mb-4 flex items-center text-gray-500 hover:text-gray-800 transition-colors">
         <ArrowLeft size={18} className="mr-1"/> Back to Dashboard
       </button>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        
        {/* Toolbar */}
        <div className="border-b border-gray-100 bg-gray-50 p-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="bg-indigo-100 text-indigo-700 p-2 rounded-lg">
              <Wand2 size={20} />
            </span>
            <span className="text-sm font-semibold text-indigo-900">Gemini AI Tools:</span>
          </div>
          
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleGenerateIdeas}
              disabled={aiLoading}
              className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium bg-white border border-gray-200 text-gray-700 rounded-md hover:bg-gray-50 hover:border-gray-300 transition-all disabled:opacity-50"
            >
              {aiLoading ? <RefreshCw className="animate-spin" size={14} /> : <Type size={14} />}
              Title Ideas
            </button>
            <button
              type="button"
              onClick={handleGenerateContent}
              disabled={aiLoading}
              className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium bg-white border border-gray-200 text-gray-700 rounded-md hover:bg-gray-50 hover:border-gray-300 transition-all disabled:opacity-50"
            >
              {aiLoading ? <RefreshCw className="animate-spin" size={14} /> : <Sparkles size={14} />}
              Generate Content
            </button>
            <button
              type="button"
              onClick={handlePolish}
              disabled={aiLoading}
              className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium bg-white border border-gray-200 text-gray-700 rounded-md hover:bg-gray-50 hover:border-gray-300 transition-all disabled:opacity-50"
            >
              {aiLoading ? <RefreshCw className="animate-spin" size={14} /> : <FileText size={14} />}
              Polish Content
            </button>
            <button
              type="button"
              onClick={handleAutoTag}
              disabled={aiLoading}
              className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium bg-white border border-gray-200 text-gray-700 rounded-md hover:bg-gray-50 hover:border-gray-300 transition-all disabled:opacity-50"
            >
               {aiLoading ? <RefreshCw className="animate-spin" size={14} /> : <Tag size={14} />}
              Auto Tag
            </button>
          </div>
        </div>

        <div className="p-8 space-y-6">
          {/* Title Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Post Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full text-2xl font-bold p-3 border-b-2 border-gray-200 focus:border-indigo-500 outline-none transition-colors placeholder-gray-300"
              placeholder="Enter an amazing title..."
              required
            />
          </div>

          {/* Content Textarea */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Content Body</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={12}
              className="w-full p-4 text-lg leading-relaxed text-gray-700 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 outline-none transition-all placeholder-gray-400"
              placeholder="Start writing your story (or use 'Generate Content' above)..."
              required
            />
          </div>

          {/* Meta Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Tags */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tags</label>
              <div className="flex flex-wrap gap-2 p-3 border border-gray-200 rounded-lg min-h-[50px] bg-white">
                {tags.map((tag, index) => (
                  <span key={index} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                    {tag}
                    <button
                      type="button"
                      onClick={() => setTags(tags.filter((_, i) => i !== index))}
                      className="ml-1.5 text-indigo-500 hover:text-indigo-700 focus:outline-none"
                    >
                      ×
                    </button>
                  </span>
                ))}
                <input
                  type="text"
                  className="flex-1 min-w-[100px] text-sm outline-none"
                  placeholder={tags.length === 0 ? "Add tags..." : ""}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      const val = e.currentTarget.value.trim();
                      if (val) {
                        setTags([...tags, val]);
                        e.currentTarget.value = '';
                      }
                    }
                  }}
                />
              </div>
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Publication Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as 'draft' | 'published')}
                className="w-full p-3 border border-gray-200 rounded-lg bg-white text-gray-700 focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 outline-none"
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2.5 text-sm font-medium text-gray-700 hover:bg-white hover:shadow-sm rounded-lg transition-all"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="flex items-center gap-2 px-8 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 focus:ring-4 focus:ring-indigo-100 transition-all shadow-md disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isSaving ? <RefreshCw className="animate-spin" size={18} /> : <Save size={18} />}
            {initialArticle ? 'Update Post' : 'Create Post'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default Editor;