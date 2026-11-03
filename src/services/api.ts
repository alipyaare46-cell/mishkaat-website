import {
  Scholar,
  Speech,
  Reel,
  Book,
  BookCategory,
  Article,
  ArticleCategory,
  Aqwaal,
  AqwaalCategory,
  Shayariyan,
  WebsiteSettings,
  WebsiteStats,
  AdminUser,
  MemberUser,
  UserBookmark,
  CommentItem,
  InteractionsData,
  ContactMessage
} from '../types';


const API_BASE = '/api';

function getAuthHeader(): Record<string, string> {
  const token = localStorage.getItem('mishkaat_admin_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function getUserAuthHeader(): Record<string, string> {
  const token = localStorage.getItem('mishkaat_user_token') || localStorage.getItem('mishkaat_admin_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers = {
    'Content-Type': 'application/json',
    ...getAuthHeader(),
    ...options.headers
  };

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({ error: 'An unexpected error occurred' }));
    throw new Error(errorBody.error || `Request failed with status ${res.status}`);
  }

  return res.json();
}

async function userRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers = {
    'Content-Type': 'application/json',
    ...getUserAuthHeader(),
    ...options.headers
  };

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({ error: 'An unexpected error occurred' }));
    throw new Error(errorBody.error || `Request failed with status ${res.status}`);
  }

  return res.json();
}

export const api = {
  // Auth
  getAdminStatus: () => request<{ hasAdmin: boolean }>('/admin/status'),
  login: (username: string, password: string) =>
    request<{ token: string; admin: AdminUser }>('/admin/login', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    }),
  getMe: () => request<{ admin: AdminUser }>('/admin/me'),
  logout: () =>
    request<{ success: boolean }>('/admin/logout', {
      method: 'POST'
    }),
  changePassword: (data: { currentPassword: string; newPassword: string; confirmPassword: string }) =>
    request<{ success: boolean; message: string }>('/admin/change-password', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  // File Upload with real-time percentage progress support (Handles multi-GB files up to 4GB smoothly)
  uploadFile: async (
    file: File,
    onProgress?: (percent: number) => void
  ): Promise<{ url: string; filename: string; size: number }> => {
    const CHUNK_SIZE = 4 * 1024 * 1024; // 4MB per chunk (fast, rock-solid transfers preventing TCP connection drops)

    // For files 4MB or smaller, single-flight upload is fast and direct
    if (file.size <= CHUNK_SIZE) {
      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        const formData = new FormData();
        formData.append('file', file);

        if (onProgress) {
          xhr.upload.onprogress = (event) => {
            if (event.lengthComputable) {
              const percent = Math.round((event.loaded / event.total) * 100);
              onProgress(percent);
            }
          };
        }

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const data = JSON.parse(xhr.responseText);
              resolve(data);
            } catch {
              reject(new Error('Invalid response from upload server'));
            }
          } else {
            try {
              const err = JSON.parse(xhr.responseText);
              reject(new Error(err.error || `Upload failed (${xhr.status})`));
            } catch {
              reject(new Error(`Upload failed (${xhr.status})`));
            }
          }
        };

        xhr.onerror = () => reject(new Error('Network connection error during upload'));
        xhr.open('POST', `${API_BASE}/upload`);
        const headers = getAuthHeader();
        for (const [k, v] of Object.entries(headers)) {
          xhr.setRequestHeader(k, v);
        }
        xhr.send(formData);
      });
    }

    // For large files (up to 4GB), slice into 4MB chunks
    const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
    const uploadId = `up_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

    for (let i = 0; i < totalChunks; i++) {
      const start = i * CHUNK_SIZE;
      const end = Math.min(start + CHUNK_SIZE, file.size);
      const chunkBlob = file.slice(start, end);

      // Attempt upload with up to 5 automatic retries per chunk to survive flaky connections on multi-GB transfers
      let attempts = 0;
      let uploaded = false;
      let lastError: Error | null = null;

      while (attempts < 5 && !uploaded) {
        attempts++;
        try {
          await new Promise<void>((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            const chunkFormData = new FormData();
            chunkFormData.append('chunk', chunkBlob, file.name);
            chunkFormData.append('uploadId', uploadId);
            chunkFormData.append('chunkIndex', i.toString());
            chunkFormData.append('totalChunks', totalChunks.toString());
            chunkFormData.append('filename', file.name);

            xhr.timeout = 180000; // 3 minutes timeout per 4MB chunk

            if (onProgress) {
              xhr.upload.onprogress = (event) => {
                if (event.lengthComputable) {
                  const currentChunkLoaded = event.loaded;
                  const overallBytes = i * CHUNK_SIZE + currentChunkLoaded;
                  const percent = Math.min(99, Math.round((overallBytes / file.size) * 100));
                  onProgress(percent);
                }
              };
            }

            xhr.onload = () => {
              if (xhr.status >= 200 && xhr.status < 300) {
                resolve();
              } else {
                try {
                  const err = JSON.parse(xhr.responseText);
                  reject(new Error(err.error || `Chunk ${i + 1}/${totalChunks} upload failed`));
                } catch {
                  reject(new Error(`Chunk ${i + 1}/${totalChunks} upload failed (${xhr.status})`));
                }
              }
            };

            xhr.onerror = () => reject(new Error(`Network error on chunk ${i + 1}/${totalChunks}`));
            xhr.ontimeout = () => reject(new Error(`Timeout on chunk ${i + 1}/${totalChunks}`));
            
            // Pass uploadId & chunkIndex in query string so multer parses them synchronously before reading the multipart body stream
            xhr.open('POST', `${API_BASE}/upload-chunk?uploadId=${encodeURIComponent(uploadId)}&chunkIndex=${i}&totalChunks=${totalChunks}`);
            const headers = getAuthHeader();
            for (const [k, v] of Object.entries(headers)) {
              xhr.setRequestHeader(k, v);
            }
            xhr.send(chunkFormData);
          });
          uploaded = true;
        } catch (err: any) {
          lastError = err;
          if (attempts < 5) {
            // Progressive backoff before retrying chunk
            await new Promise((r) => setTimeout(r, Math.min(1000 * attempts, 4000)));
          }
        }
      }

      if (!uploaded) {
        throw lastError || new Error(`Failed to upload chunk ${i + 1} of ${totalChunks} after 5 attempts`);
      }
    }

    if (onProgress) onProgress(99);

    // Call server to assemble all uploaded chunks sequentially
    const completeRes = await fetch(`${API_BASE}/upload-chunk-complete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify({
        uploadId,
        filename: file.name,
        totalChunks
      })
    });

    if (!completeRes.ok) {
      const err = await completeRes.json().catch(() => ({ error: 'Failed to assemble uploaded chunks on server' }));
      throw new Error(err.error || 'Server failed to assemble uploaded chunks');
    }

    if (onProgress) onProgress(100);
    return await completeRes.json();
  },

  // Settings & Stats
  getSettings: () => request<WebsiteSettings>('/settings'),
  updateSettings: (settings: Partial<WebsiteSettings>) =>
    request<{ success: boolean }>('/settings', {
      method: 'PUT',
      body: JSON.stringify(settings)
    }),
  getStats: () => request<WebsiteStats>('/stats'),

  // Scholars
  getScholars: (all = false, search = '') => {
    const params = new URLSearchParams();
    if (all) params.append('all', '1');
    if (search) params.append('search', search);
    return request<Scholar[]>(`/scholars?${params.toString()}`);
  },
  getScholarDetail: (slugOrId: string) =>
    request<{ scholar: Scholar; speeches: Speech[]; reels: Reel[] }>(`/scholars/${slugOrId}`),
  createScholar: (data: Partial<Scholar>) =>
    request<Scholar>('/scholars', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  updateScholar: (id: string, data: Partial<Scholar>) =>
    request<Scholar>(`/scholars/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),
  deleteScholar: (id: string) =>
    request<{ success: boolean }>(`/scholars/${id}`, {
      method: 'DELETE'
    }),

  // Speeches
  getSpeeches: (params: { all?: boolean; type?: string; scholar_id?: string; search?: string } = {}) => {
    const q = new URLSearchParams();
    if (params.all) q.append('all', '1');
    if (params.type) q.append('type', params.type);
    if (params.scholar_id) q.append('scholar_id', params.scholar_id);
    if (params.search) q.append('search', params.search);
    return request<Speech[]>(`/speeches?${q.toString()}`);
  },
  getSpeechDetail: (id: string) => request<Speech>(`/speeches/${id}`),
  createSpeech: (data: Partial<Speech>) =>
    request<Speech>('/speeches', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  updateSpeech: (id: string, data: Partial<Speech>) =>
    request<Speech>(`/speeches/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),
  deleteSpeech: (id: string) =>
    request<{ success: boolean }>(`/speeches/${id}`, {
      method: 'DELETE'
    }),

  // Reels
  getReels: (params: { all?: boolean; scholar_id?: string; search?: string } = {}) => {
    const q = new URLSearchParams();
    if (params.all) q.append('all', '1');
    if (params.scholar_id) q.append('scholar_id', params.scholar_id);
    if (params.search) q.append('search', params.search);
    return request<Reel[]>(`/reels?${q.toString()}`);
  },
  createReel: (data: Partial<Reel>) =>
    request<Reel>('/reels', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  updateReel: (id: string, data: Partial<Reel>) =>
    request<Reel>(`/reels/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),
  deleteReel: (id: string) =>
    request<{ success: boolean }>(`/reels/${id}`, {
      method: 'DELETE'
    }),

  // Books
  getBookCategories: () => request<BookCategory[]>('/book-categories'),
  createBookCategory: (data: { name: string; slug: string; description?: string }) =>
    request<BookCategory>('/book-categories', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  deleteBookCategory: (id: string) =>
    request<{ success: boolean }>(`/book-categories/${id}`, {
      method: 'DELETE'
    }),
  getBooks: (params: { all?: boolean; category_id?: string; search?: string } = {}) => {
    const q = new URLSearchParams();
    if (params.all) q.append('all', '1');
    if (params.category_id) q.append('category_id', params.category_id);
    if (params.search) q.append('search', params.search);
    return request<Book[]>(`/books?${q.toString()}`);
  },
  createBook: (data: Partial<Book>) =>
    request<Book>('/books', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  updateBook: (id: string, data: Partial<Book>) =>
    request<Book>(`/books/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),
  deleteBook: (id: string) =>
    request<{ success: boolean }>(`/books/${id}`, {
      method: 'DELETE'
    }),

  // Articles
  getArticleCategories: () => request<ArticleCategory[]>('/article-categories'),
  createArticleCategory: (data: { name: string; slug: string; description?: string }) =>
    request<ArticleCategory>('/article-categories', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  deleteArticleCategory: (id: string) =>
    request<{ success: boolean }>(`/article-categories/${id}`, {
      method: 'DELETE'
    }),
  getArticles: (params: { all?: boolean; category_id?: string; search?: string } = {}) => {
    const q = new URLSearchParams();
    if (params.all) q.append('all', '1');
    if (params.category_id) q.append('category_id', params.category_id);
    if (params.search) q.append('search', params.search);
    return request<Article[]>(`/articles?${q.toString()}`);
  },
  getArticleDetail: (idOrSlug: string) =>
    request<{ article: Article; related: Article[] }>(`/articles/${idOrSlug}`),
  createArticle: (data: Partial<Article>) =>
    request<Article>('/articles', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  updateArticle: (id: string, data: Partial<Article>) =>
    request<Article>(`/articles/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),
  deleteArticle: (id: string) =>
    request<{ success: boolean }>(`/articles/${id}`, {
      method: 'DELETE'
    }),

  // Aqwaal
  getAqwaalCategories: () => request<AqwaalCategory[]>('/aqwaal-categories'),
  createAqwaalCategory: (data: { name: string; slug: string }) =>
    request<AqwaalCategory>('/aqwaal-categories', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  deleteAqwaalCategory: (id: string) =>
    request<{ success: boolean }>(`/aqwaal-categories/${id}`, {
      method: 'DELETE'
    }),
  getAqwaal: (params: { all?: boolean; type?: string; category_id?: string; search?: string } = {}) => {
    const q = new URLSearchParams();
    if (params.all) q.append('all', '1');
    if (params.type) q.append('type', params.type);
    if (params.category_id) q.append('category_id', params.category_id);
    if (params.search) q.append('search', params.search);
    return request<Aqwaal[]>(`/aqwaal?${q.toString()}`);
  },
  createAqwaal: (data: Partial<Aqwaal>) =>
    request<Aqwaal>('/aqwaal', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  updateAqwaal: (id: string, data: Partial<Aqwaal>) =>
    request<Aqwaal>(`/aqwaal/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),
  deleteAqwaal: (id: string) =>
    request<{ success: boolean }>(`/aqwaal/${id}`, {
      method: 'DELETE'
    }),

  // Shayariyan
  getShayariyan: (params: { all?: boolean; search?: string } = {}) => {
    const q = new URLSearchParams();
    if (params.all) q.append('all', '1');
    if (params.search) q.append('search', params.search);
    return request<Shayariyan[]>(`/shayariyan?${q.toString()}`);
  },
  getShayariyanDetail: (id: string) => request<Shayariyan>(`/shayariyan/${id}`),
  createShayariyan: (data: Partial<Shayariyan>) =>
    request<Shayariyan>('/shayariyan', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  updateShayariyan: (id: string, data: Partial<Shayariyan>) =>
    request<Shayariyan>(`/shayariyan/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),
  deleteShayariyan: (id: string) =>
    request<{ success: boolean }>(`/shayariyan/${id}`, {
      method: 'DELETE'
    }),

  // Global Search
  searchGlobal: (query: string) =>
    request<{
      scholars: Scholar[];
      speeches: Speech[];
      reels: Reel[];
      books: Book[];
      articles: Article[];
      aqwaal: Aqwaal[];
      shayariyan: Shayariyan[];
    }>(`/search?q=${encodeURIComponent(query)}`),

  // Public Member User Auth & Bookmarks
  userRegister: (data: { full_name: string; email: string; password: string }) =>
    request<{ token: string; user: MemberUser }>('/user/register', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  userLogin: (data: { email: string; password: string }) =>
    request<{ token: string; user: MemberUser }>('/user/login', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  getUserMe: () => userRequest<{ user: MemberUser }>('/user/me'),
  userLogout: () =>
    userRequest<{ success: boolean }>('/user/logout', {
      method: 'POST'
    }),
  updateUserProfile: (data: { full_name: string; bio?: string; currentPassword?: string; newPassword?: string }) =>
    userRequest<{ user: MemberUser }>('/user/profile', {
      method: 'PUT',
      body: JSON.stringify(data)
    }),
  getUserBookmarks: () => userRequest<UserBookmark[]>('/user/bookmarks'),
  getUserBookmarkIds: () => userRequest<{ item_type: string; item_id: string }[]>('/user/bookmarks/ids'),
  toggleBookmark: (item_type: string, item_id: string) =>
    userRequest<{ bookmarked: boolean; message: string }>('/user/bookmarks/toggle', {
      method: 'POST',
      body: JSON.stringify({ item_type, item_id })
    }),

  // Social Interactions (Likes & Comments for Videos & Reels)
  getInteractions: (itemType: string, itemId: string) =>
    userRequest<InteractionsData>(`/interactions/${itemType}/${itemId}`),
  toggleLike: (itemType: string, itemId: string) =>
    userRequest<{ liked: boolean; likes_count: number }>('/interactions/like', {
      method: 'POST',
      body: JSON.stringify({ item_type: itemType, item_id: itemId })
    }),
  postComment: (itemType: string, itemId: string, content: string) =>
    userRequest<{ comment: CommentItem; comments_count: number }>('/interactions/comment', {
      method: 'POST',
      body: JSON.stringify({ item_type: itemType, item_id: itemId, content })
    }),
  deleteComment: (id: string) =>
    userRequest<{ success: boolean }>(`/interactions/comment/${id}`, {
      method: 'DELETE'
    }),

  // Contact Us & Inquiries
  sendContactMessage: (data: { full_name: string; email: string; phone?: string; subject?: string; message: string }) =>
    request<{ success: boolean; message: string }>('/contact', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  getContactMessages: () => request<ContactMessage[]>('/contact-messages'),
  markContactMessageRead: (id: string) =>
    request<{ success: boolean }>(`/contact-messages/${id}/read`, {
      method: 'PUT'
    }),
  deleteContactMessage: (id: string) =>
    request<{ success: boolean }>(`/contact-messages/${id}`, {
      method: 'DELETE'
    })
};


