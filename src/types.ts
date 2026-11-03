export interface Scholar {
  id: string;
  full_name: string;
  honorific_title: string;
  slug: string;
  biography: string;
  profile_image: string | null;
  location: string;
  is_published: number;
  created_at: string;
  updated_at: string;
}

export type SpeechType = 'Islahi Taqreer' | 'Ilmi Taqreer';

export interface Speech {
  id: string;
  title: string;
  scholar_id: string;
  scholar_name?: string;
  scholar_title?: string;
  scholar_slug?: string;
  scholar_image?: string;
  speech_type: SpeechType;
  description: string;
  thumbnail: string | null;
  media_url: string;
  duration: string;
  upload_date: string;
  tags: string;
  is_published: number;
  created_at: string;
  updated_at: string;
}

export interface Reel {
  id: string;
  title: string;
  scholar_id: string;
  scholar_name?: string;
  scholar_title?: string;
  scholar_slug?: string;
  scholar_image?: string;
  description: string;
  video_url: string;
  thumbnail: string | null;
  duration: string;
  is_published: number;
  created_at: string;
  updated_at: string;
}

export interface BookCategory {
  id: string;
  name: string;
  slug: string;
  description: string;
  book_count?: number;
  created_at: string;
}

export interface Book {
  id: string;
  title: string;
  author_name: string;
  category_id: string;
  category_name?: string;
  category_slug?: string;
  cover_image: string | null;
  description: string;
  language: string;
  file_url: string | null;
  external_read_url: string | null;
  publication_details: string;
  allow_download: number;
  is_published: number;
  created_at: string;
  updated_at: string;
}

export interface ArticleCategory {
  id: string;
  name: string;
  slug: string;
  description: string;
  article_count?: number;
  created_at: string;
}

export interface Article {
  id: string;
  title: string;
  slug: string;
  category_id: string;
  category_name?: string;
  category_slug?: string;
  author_name: string;
  featured_image: string | null;
  excerpt: string;
  content: string;
  publication_date: string;
  tags: string;
  is_published: number;
  created_at: string;
  updated_at: string;
}

export interface AqwaalCategory {
  id: string;
  name: string;
  slug: string;
  created_at: string;
}

export type AqwaalType = 'Aqwaal' | 'Nasihat';

export interface Aqwaal {
  id: string;
  text: string;
  type: AqwaalType;
  scholar_id: string | null;
  scholar_name?: string;
  scholar_title?: string;
  attributed_to: string;
  category_id: string | null;
  category_name?: string;
  reference_source: string;
  image_url: string | null;
  is_published: number;
  created_at: string;
  updated_at: string;
}

export interface Shayariyan {
  id: string;
  title: string;
  poet_name: string;
  poet_image: string | null;
  poetry_text: string;
  sharah: string;
  category: string;
  language: string;
  publication_date: string;
  is_featured: number;
  is_published: number;
  created_at: string;
  updated_at: string;
}

export interface WebsiteSettings {
  website_name: string;
  welcome_title: string;
  welcome_message: string;
  about_text: string;
  contact_email: string;
  contact_phone: string;
  contact_address: string;
  footer_tagline: string;
  show_hero_cta: string;
  show_stats_dashboard: string;
  show_featured_scholars: string;
  show_latest_speeches: string;
  show_reels_section: string;
  show_featured_books: string;
  show_articles_section: string;
  show_aqwaal_section: string;
  show_shayariyan_section: string;
  [key: string]: string;
}

export interface WebsiteStats {
  published: {
    speeches: number;
    reels: number;
    books: number;
    articles: number;
    aqwaal: number;
    shayariyan: number;
    scholars: number;
  };
  total: {
    speeches: number;
    reels: number;
    books: number;
    articles: number;
    aqwaal: number;
    shayariyan: number;
    scholars: number;
  };
}

export interface AdminUser {
  id: string;
  username: string;
  full_name: string;
}

export interface MemberUser {
  id: string;
  full_name: string;
  email: string;
  avatar_url?: string | null;
  bio?: string | null;
  created_at?: string;
  total_bookmarks?: number;
}

export interface UserBookmark {
  id: string;
  item_type: 'speech' | 'reel' | 'book' | 'article' | 'aqwaal' | 'shayariyan';
  item_id: string;
  created_at: string;
}

export interface CommentItem {
  id: string;
  user_id: string;
  user_name: string;
  content: string;
  created_at: string;
}

export interface InteractionsData {
  likes_count: number;
  has_liked: boolean;
  comments: CommentItem[];
}

export interface ContactMessage {
  id: string;
  full_name: string;
  email: string;
  phone?: string | null;
  subject?: string | null;
  message: string;
  is_read: number;
  created_at: string;
}


