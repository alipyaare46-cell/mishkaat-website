import React, { useState, useEffect } from 'react';
import { MessageSquare, Send, Trash2, User, X, LogIn, Heart } from 'lucide-react';
import { CommentItem } from '../types';
import { api } from '../services/api';
import { useUserAuth } from '../context/UserAuthContext';
import { useAuth } from '../context/AuthContext';

interface CommentsSectionProps {
  itemType: 'speech' | 'reel';
  itemId: string;
  itemTitle?: string;
  comments: CommentItem[];
  onCommentAdded: (newComment: CommentItem) => void;
  onCommentDeleted: (commentId: string) => void;
  onClose?: () => void;
  isOverlay?: boolean; // If used in YouTube Shorts slide-over sheet
}

export const CommentsSection: React.FC<CommentsSectionProps> = ({
  itemType,
  itemId,
  itemTitle,
  comments,
  onCommentAdded,
  onCommentDeleted,
  onClose,
  isOverlay = false
}) => {
  const { user, openAuthModal } = useUserAuth();
  const { admin } = useAuth();
  const effectiveUser = user || (admin ? { id: admin.id, full_name: admin.full_name || admin.username, email: '' } : null);

  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    if (!effectiveUser) {
      openAuthModal('signin');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await api.postComment(itemType, itemId, content.trim());
      onCommentAdded(res.comment);
      setContent('');
    } catch (err: any) {
      setError(err.message || 'Failed to post reflection / comment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (commentId: string) => {
    try {
      await api.deleteComment(commentId);
      onCommentDeleted(commentId);
    } catch (err: any) {
      setError(err.message || 'Failed to delete comment');
    }
  };

  const formatCommentDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      const now = new Date();
      const diffMs = now.getTime() - d.getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays < 7) return `${diffDays}d ago`;
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  return (
    <div
      className={`flex flex-col ${
        isOverlay
          ? 'bg-stone-900/95 backdrop-blur-md text-white border-t border-white/10 rounded-t-2xl shadow-2xl h-[65%] max-h-[500px] absolute bottom-0 left-0 right-0 z-40'
          : 'bg-stone-50 border border-stone-200 rounded-xl p-4 text-stone-900'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-stone-200/20 px-4 pt-3 shrink-0">
        <div className="flex items-center gap-2">
          <MessageSquare className={`w-4 h-4 ${isOverlay ? 'text-[#D4AF37]' : 'text-[#064E3B]'}`} />
          <h4 className="text-xs font-bold tracking-wide uppercase">
            Comments & Reflections ({comments.length})
          </h4>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className={`p-1 rounded-full ${
              isOverlay ? 'hover:bg-white/10 text-stone-300' : 'hover:bg-stone-200 text-stone-600'
            } transition-colors cursor-pointer`}
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {error && (
        <div className="px-4 py-2 bg-rose-500/20 text-rose-300 text-[11px] shrink-0 border-b border-rose-500/30">
          {error}
        </div>
      )}

      {/* Comments List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3.5 divide-y divide-white/5">
        {comments.length === 0 ? (
          <div className="py-8 text-center space-y-1">
            <MessageSquare className="w-8 h-8 mx-auto opacity-30 mb-2" />
            <p className="text-xs font-semibold opacity-70">No reflections posted yet.</p>
            <p className="text-[11px] opacity-50">Be the first to share an authentic reflection or prayer.</p>
          </div>
        ) : (
          comments.map((c) => {
            const canDelete = admin || (user && user.id === c.user_id);
            return (
              <div key={c.id} className="pt-3 first:pt-0 flex items-start gap-3 group">
                <div
                  className={`w-7 h-7 rounded-full shrink-0 flex items-center justify-center text-xs font-bold ${
                    isOverlay ? 'bg-[#064E3B] text-[#D4AF37] border border-[#D4AF37]/40' : 'bg-[#064E3B]/10 text-[#064E3B]'
                  }`}
                >
                  {c.user_name ? c.user_name.charAt(0).toUpperCase() : 'U'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold truncate">
                      {c.user_name || 'Mishkaat Member'}
                    </span>
                    <span className="text-[10px] opacity-50 font-mono shrink-0">
                      {formatCommentDate(c.created_at)}
                    </span>
                  </div>
                  <p className="text-xs mt-1 leading-relaxed whitespace-pre-wrap break-words opacity-90">
                    {c.content}
                  </p>
                </div>
                {canDelete && (
                  <button
                    onClick={() => handleDelete(c.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-stone-400 hover:text-rose-500 transition-opacity cursor-pointer shrink-0"
                    title="Delete reflection"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Input / Post Area */}
      <div className="p-3 border-t border-stone-200/20 bg-black/20 shrink-0">
        {effectiveUser ? (
          <form onSubmit={handleSubmit} className="flex items-center gap-2">
            <div
              className={`w-7 h-7 rounded-full shrink-0 flex items-center justify-center text-xs font-bold ${
                isOverlay ? 'bg-[#D4AF37] text-stone-900' : 'bg-[#064E3B] text-white'
              }`}
            >
              {effectiveUser.full_name.charAt(0).toUpperCase()}
            </div>
            <input
              type="text"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Add your respectful reflection..."
              className={`flex-1 px-3 py-1.5 text-xs rounded-full focus:outline-none focus:ring-1 ${
                isOverlay
                  ? 'bg-white/10 text-white placeholder:text-stone-400 border border-white/10 focus:ring-[#D4AF37]'
                  : 'bg-white text-stone-900 placeholder:text-stone-400 border border-stone-300 focus:ring-[#064E3B]'
              }`}
            />
            <button
              type="submit"
              disabled={isSubmitting || !content.trim()}
              className={`p-2 rounded-full cursor-pointer transition-colors disabled:opacity-40 ${
                isOverlay
                  ? 'bg-[#D4AF37] text-stone-950 hover:bg-[#e6c148]'
                  : 'bg-[#064E3B] text-white hover:bg-[#075c46]'
              }`}
              title="Post comment"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        ) : (
          <div className="flex items-center justify-between gap-3 text-xs py-1">
            <span className="opacity-75 text-[11px]">Sign in to like, comment & save videos.</span>
            <button
              type="button"
              onClick={() => openAuthModal('signin')}
              className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#D4AF37] text-stone-950 font-bold text-xs rounded-full hover:bg-[#e6c148] transition-colors cursor-pointer shrink-0"
            >
              <LogIn className="w-3 h-3" />
              <span>Sign In</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
