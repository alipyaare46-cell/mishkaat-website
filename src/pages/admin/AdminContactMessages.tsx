import React, { useState, useEffect } from 'react';
import {
  Mail,
  Phone,
  MessageSquare,
  Trash2,
  CheckCircle,
  Clock,
  ExternalLink,
  MessageCircle,
  AlertCircle,
  Inbox
} from 'lucide-react';
import { ContactMessage } from '../../types';
import { api } from '../../services/api';
import { ConfirmDeleteModal } from '../../components/ConfirmDeleteModal';

interface AdminContactMessagesProps {
  onRefreshAll?: () => void;
}

export const AdminContactMessages: React.FC<AdminContactMessagesProps> = () => {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');

  const [messageToDelete, setMessageToDelete] = useState<ContactMessage | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchMessages = async () => {
    setIsLoading(true);
    try {
      const data = await api.getContactMessages();
      setMessages(data || []);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load messages');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  const handleMarkAsRead = async (id: string) => {
    try {
      await api.markContactMessageRead(id);
      setMessages((prev) =>
        prev.map((m) => (m.id === id ? { ...m, is_read: 1 } : m))
      );
    } catch (err: any) {
      alert(err.message || 'Failed to update message');
    }
  };

  const confirmDeleteMessage = async () => {
    if (!messageToDelete) return;
    setIsDeleting(true);
    try {
      await api.deleteContactMessage(messageToDelete.id);
      setMessages((prev) => prev.filter((m) => m.id !== messageToDelete.id));
      setMessageToDelete(null);
    } catch (err: any) {
      alert(err.message || 'Failed to delete message');
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredMessages = messages.filter((m) => {
    if (filter === 'unread') return m.is_read === 0;
    if (filter === 'read') return m.is_read === 1;
    return true;
  });

  const unreadCount = messages.filter((m) => m.is_read === 0).length;

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-stone-900">
              Visitor & Member Inquiries
            </h2>
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-500 text-stone-950">
                {unreadCount} New
              </span>
            )}
          </div>
          <p className="text-xs text-stone-500">
            Messages, questions, and Fatwa inquiries sent via the Contact Us page.
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1.5 bg-stone-100 p-1 rounded-xl border border-stone-200 text-xs">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer ${
              filter === 'all' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            All ({messages.length})
          </button>
          <button
            onClick={() => setFilter('unread')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer ${
              filter === 'unread' ? 'bg-[#064E3B] text-white shadow-xs' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Unread ({unreadCount})
          </button>
          <button
            onClick={() => setFilter('read')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer ${
              filter === 'read' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Read ({messages.length - unreadCount})
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Messages List */}
      {isLoading ? (
        <div className="py-16 text-center text-stone-500 text-xs">
          Loading inquiries...
        </div>
      ) : filteredMessages.length === 0 ? (
        <div className="py-16 text-center space-y-3 bg-white rounded-2xl border border-stone-200 p-8">
          <Inbox className="w-10 h-10 text-stone-300 mx-auto" />
          <h4 className="text-sm font-bold text-stone-700">No Messages Found</h4>
          <p className="text-xs text-stone-500 max-w-sm mx-auto">
            {filter === 'unread'
              ? 'All incoming inquiries have been reviewed and marked as read.'
              : 'No messages have been submitted through the Contact Us form yet.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredMessages.map((m) => (
            <div
              key={m.id}
              className={`p-5 rounded-2xl border transition-all ${
                m.is_read === 0
                  ? 'bg-amber-50/40 border-amber-300 shadow-xs'
                  : 'bg-white border-stone-200'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-stone-100">
                <div className="flex items-center gap-2.5">
                  <span
                    className={`w-2.5 h-2.5 rounded-full ${
                      m.is_read === 0 ? 'bg-amber-500 animate-pulse' : 'bg-stone-300'
                    }`}
                  />
                  <h3 className="text-sm font-bold text-stone-900">
                    {m.full_name}
                  </h3>
                  {m.subject && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#064E3B]/10 text-[#064E3B]">
                      {m.subject}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3 text-xs text-stone-400 font-mono">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{new Date(m.created_at).toLocaleString()}</span>
                </div>
              </div>

              {/* Sender Contact Bar */}
              <div className="py-2.5 flex flex-wrap items-center gap-4 text-xs text-stone-600 border-b border-stone-50">
                <a
                  href={`mailto:${m.email}`}
                  className="flex items-center gap-1.5 text-[#064E3B] hover:underline font-semibold"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>{m.email}</span>
                </a>

                {m.phone && (
                  <>
                    <a
                      href={`tel:${m.phone}`}
                      className="flex items-center gap-1.5 text-stone-700 hover:text-stone-900"
                    >
                      <Phone className="w-3.5 h-3.5 text-stone-400" />
                      <span>{m.phone}</span>
                    </a>

                    <a
                      href={`https://api.whatsapp.com/send?phone=${encodeURIComponent(
                        m.phone.replace(/[^0-9]/g, '')
                      )}&text=${encodeURIComponent(
                        `Assalamu Alaikum ${m.full_name}, regarding your message on MISHKAAT Platform:`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#25D366] text-white rounded text-[10px] font-bold"
                    >
                      <MessageCircle className="w-3 h-3 fill-white" />
                      <span>WhatsApp</span>
                    </a>
                  </>
                )}
              </div>

              {/* Message Body */}
              <p className="py-3 text-xs leading-relaxed text-stone-800 whitespace-pre-wrap">
                {m.message}
              </p>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-stone-100 flex items-center justify-between">
                <div>
                  {m.is_read === 0 ? (
                    <button
                      onClick={() => handleMarkAsRead(m.id)}
                      className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#064E3B] hover:bg-[#075c46] text-white text-xs font-semibold rounded-lg cursor-pointer transition-colors"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>Mark as Read</span>
                    </button>
                  ) : (
                    <span className="text-[11px] text-stone-400 font-medium">
                      ✓ Reviewed
                    </span>
                  )}
                </div>

                <button
                  onClick={() => setMessageToDelete(m)}
                  className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                  title="Delete message"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={!!messageToDelete}
        title="Delete Inquiry Message"
        message="Are you sure you want to delete this message? This cannot be undone."
        itemName={messageToDelete ? `From: ${messageToDelete.full_name}` : undefined}
        isDeleting={isDeleting}
        onConfirm={confirmDeleteMessage}
        onCancel={() => setMessageToDelete(null)}
      />
    </div>
  );
};
