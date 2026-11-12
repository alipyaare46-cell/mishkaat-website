import React, { useState, useMemo } from 'react';
import { FileText, Search, Calendar, User, ArrowLeft, Tag, Share2, BookOpen } from 'lucide-react';
import { Article, ArticleCategory } from '../types';
import { useLanguage } from '../context/LanguageContext';

interface ArticlesPageProps {
  articles: Article[];
  categories: ArticleCategory[];
  activeArticleSlug: string | null;
  onSelectArticle: (slug: string) => void;
  onBackToList: () => void;
}

export const ArticlesPage: React.FC<ArticlesPageProps> = ({
  articles,
  categories,
  activeArticleSlug,
  onSelectArticle,
  onBackToList
}) => {
  const { language, translateCategory } = useLanguage();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const activeArticle = useMemo(() => {
    if (!activeArticleSlug) return null;
    return articles.find((a) => a.slug === activeArticleSlug) || null;
  }, [articles, activeArticleSlug]);

  const relatedArticles = useMemo(() => {
    if (!activeArticle) return [];
    return articles
      .filter((a) => a.category_id === activeArticle.category_id && a.id !== activeArticle.id)
      .slice(0, 3);
  }, [articles, activeArticle]);

  const filteredArticles = useMemo(() => {
    return articles.filter((a) => {
      if (selectedCategory !== 'all' && a.category_id !== selectedCategory) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = a.title.toLowerCase().includes(q);
        const matchAuthor = (a.author_name || '').toLowerCase().includes(q);
        const matchExcerpt = (a.excerpt || '').toLowerCase().includes(q);
        const matchTags = (a.tags || '').toLowerCase().includes(q);
        if (!matchTitle && !matchAuthor && !matchExcerpt && !matchTags) return false;
      }
      return true;
    });
  }, [articles, selectedCategory, searchQuery]);

  // SINGLE ARTICLE DETAIL READER VIEW
  if (activeArticle) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        {/* Back navigation */}
        <button
          onClick={onBackToList}
          className="inline-flex items-center gap-2 text-xs font-semibold text-[#064E3B] hover:text-[#D4AF37] transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Articles</span>
        </button>

        {/* Article Header */}
        <article className="bg-white rounded-2xl border border-stone-200/80 p-6 sm:p-10 space-y-6 shadow-sm">
          <div>
            <span className="text-xs uppercase tracking-widest text-[#D4AF37] font-bold block mb-2">
              {translateCategory(activeArticle.category_name || 'Islamic Research')}
            </span>
            <h1 className="font-display text-2xl sm:text-4xl font-bold text-stone-900 leading-tight">
              {activeArticle.title}
            </h1>

            <div className="flex flex-wrap items-center gap-y-2 gap-x-4 mt-4 pt-4 border-t border-stone-100 text-xs text-stone-500">
              <span className="flex items-center gap-1.5 font-medium text-stone-700">
                <User className="w-3.5 h-3.5 text-emerald-800" />
                <span>{activeArticle.author_name || 'Mishkaat Editorial'}</span>
              </span>
              <span aria-hidden="true">·</span>
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-emerald-800" />
                <span>{activeArticle.publication_date}</span>
              </span>
            </div>
          </div>

          {/* Featured Image */}
          {activeArticle.featured_image && (
            <div className="aspect-16/9 rounded-xl overflow-hidden bg-stone-100 border border-stone-200">
              <img
                src={activeArticle.featured_image}
                alt={activeArticle.title}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Excerpt Lead */}
          {activeArticle.excerpt && (
            <p className="text-sm sm:text-base font-serif italic text-stone-700 bg-[#F4F8F4] p-4 rounded-xl border border-emerald-900/10 leading-relaxed">
              "{activeArticle.excerpt}"
            </p>
          )}

          {/* Article Full Content (supports Urdu, Arabic & English) */}
          <div className="text-stone-800 text-sm sm:text-base leading-relaxed space-y-4 whitespace-pre-line font-sans border-t border-stone-100 pt-6">
            {activeArticle.content}
          </div>

          {/* Tags */}
          {activeArticle.tags && (
            <div className="pt-6 border-t border-stone-100 flex items-center gap-2">
              <Tag className="w-3.5 h-3.5 text-stone-400" />
              <div className="text-xs text-stone-500">
                {activeArticle.tags.split(',').map((tag, idx) => (
                  <span key={idx} className="mr-2 text-emerald-800">
                    #{tag.trim()}
                  </span>
                ))}
              </div>
            </div>
          )}
        </article>

        {/* Related Articles */}
        {relatedArticles.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-sm uppercase tracking-wider text-stone-600 font-bold">
              Related Articles
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {relatedArticles.map((rel) => (
                <div
                  key={rel.id}
                  onClick={() => onSelectArticle(rel.slug)}
                  className="bg-white rounded-xl border border-stone-200 p-4 hover:border-[#D4AF37] hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
                >
                  <h4 className="text-xs font-bold text-stone-900 line-clamp-2 group-hover:text-[#064E3B]">
                    {rel.title}
                  </h4>
                  <p className="text-[11px] text-stone-400 mt-2">
                    {rel.publication_date}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ARTICLES LIST VIEW
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      {/* Header */}
      <div className="border-b border-stone-200 pb-6">
        <span className="text-xs uppercase tracking-widest text-[#064E3B] font-bold block mb-1">
          Tahqeeq, Seerat & Islamic Thought
        </span>
        <h1 className="font-display text-3xl sm:text-4xl font-bold text-stone-900">
          Islamic Articles & Essays
        </h1>
        <p className="text-xs sm:text-sm text-stone-600 mt-2 max-w-2xl leading-relaxed">
          Read essays spanning Shakhsiyat (scholarly profiles), Current affairs, Tahqeeqi research dissertations, and general Islamic guidance.
        </p>
      </div>

      {/* Filter and Search */}
      <div className="bg-white rounded-xl border border-stone-200 p-4 sm:p-5 space-y-4 shadow-xs">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
              selectedCategory === 'all'
                ? 'bg-[#064E3B] text-white shadow-xs'
                : 'bg-stone-100 text-stone-600 hover:text-stone-900'
            }`}
          >
            {language === 'ur' ? 'تمام زمرے' : language === 'ar' ? 'جميع الفئات' : 'All Categories'} ({articles.length})
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedCategory(c.id)}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                selectedCategory === c.id
                  ? 'bg-[#064E3B] text-white shadow-xs'
                  : 'bg-stone-100 text-stone-600 hover:text-stone-900'
              }`}
            >
              {translateCategory(c.name)}
            </button>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between pt-3 border-t border-stone-100 text-xs">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search articles by title, author, topic..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#064E3B]"
            />
          </div>

          <span className="text-stone-400">
            {filteredArticles.length} {filteredArticles.length === 1 ? 'Article' : 'Articles'}
          </span>
        </div>
      </div>

      {/* Articles Grid */}
      {filteredArticles.length === 0 ? (
        <div className="bg-white rounded-xl border border-stone-200 p-12 text-center space-y-3">
          <FileText className="w-10 h-10 text-stone-300 mx-auto" />
          <h3 className="text-sm font-semibold text-stone-700">No articles found</h3>
          <p className="text-xs text-stone-400 max-w-sm mx-auto">
            Try adjusting your search query or selecting a different category.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredArticles.map((article) => (
            <div
              key={article.id}
              onClick={() => onSelectArticle(article.slug)}
              className="bg-white rounded-xl border border-stone-200/80 overflow-hidden hover:shadow-md hover:border-[#D4AF37]/50 transition-all cursor-pointer group flex flex-col justify-between"
            >
              {article.featured_image && (
                <div className="aspect-16/9 bg-stone-100 overflow-hidden">
                  <img
                    src={article.featured_image}
                    alt={article.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
              )}

              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-[#D4AF37] font-semibold block mb-1">
                    {translateCategory(article.category_name || '')}
                  </span>
                  <h3 className="text-base font-bold text-stone-900 group-hover:text-[#064E3B] transition-colors line-clamp-2">
                    {article.title}
                  </h3>
                  {article.excerpt && (
                    <p className="text-xs text-stone-600 line-clamp-3 mt-2 leading-relaxed">
                      {article.excerpt}
                    </p>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-400">
                  <span>{article.author_name || 'Editorial'}</span>
                  <span>{article.publication_date}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
