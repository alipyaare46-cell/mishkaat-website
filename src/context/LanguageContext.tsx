import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'en' | 'ur' | 'ar';

export interface Translations {
  home: string;
  speeches: string;
  reels: string;
  books: string;
  articles: string;
  aqwaal: string;
  shayariyan: string;
  contact: string;
  portal: string;
  search: string;
  searchPlaceholder: string;
  welcomeTitle: string;
  welcomeSubtitle: string;
  welcomeDesc: string;
  exploreSpeeches: string;
  exploreBooks: string;
  exploreReels: string;
  liveStatsTitle: string;
  realtimeUpdate: string;
  totalSpeeches: string;
  totalReels: string;
  totalBooks: string;
  totalArticles: string;
  totalAqwaal: string;
  totalShayariyan: string;
  totalScholars: string;
  featuredScholars: string;
  scholarsSubtitle: string;
  exploreAll: string;
  viewProfile: string;
  latestSpeeches: string;
  speechesSubtitle: string;
  viewAllSpeeches: string;
  islamicReels: string;
  reelsSubtitle: string;
  viewAllReels: string;
  digitalLibrary: string;
  librarySubtitle: string;
  exploreLibrary: string;
  latestArticles: string;
  articlesSubtitle: string;
  allArticles: string;
  readArticle: string;
  aqwaalTitle: string;
  aqwaalSubtitle: string;
  viewAllMaxims: string;
  shayariyanTitle: string;
  shayariyanSubtitle: string;
  viewAllPoetry: string;
  sharah: string;
  allTypes: string;
  islahiTaqreer: string;
  ilmiTaqreer: string;
  filterByScholar: string;
  allScholars: string;
  allCategories: string;
  allDisciplines: string;
  readOnline: string;
  downloadPdf: string;
  externalReader: string;
  close: string;
  backToDirectory: string;
  dedicatedSpeeches: string;
  dedicatedReels: string;
  poweredBy: string;
  copyright: string;
}

const translations: Record<Language, Translations> = {
  en: {
    home: 'Home',
    speeches: 'Videos & Speeches',
    reels: 'Reels',
    books: 'Books',
    articles: 'Articles',
    aqwaal: 'Aqwaal',
    shayariyan: 'Shayariyan',
    contact: 'Contact Us',
    portal: 'Portal',
    search: 'Search knowledge base',
    searchPlaceholder: 'Search speeches, scholars, reels, books, articles, quotes, poetry...',
    welcomeTitle: 'WELCOME TO MISHKAAT',
    welcomeSubtitle: 'Sanctuary of Ahl-e-Sunnat Knowledge',
    welcomeDesc: 'Immerse yourself in authentic Islamic scholarship, verified speeches of respected Ahl-e-Sunnat Ulama, sacred digital manuscripts, inspiring reels, research articles, and timeless spiritual reflections.',
    exploreSpeeches: 'Scholarly Speeches',
    exploreBooks: 'Digital Library',
    exploreReels: 'Islamic Reels',
    liveStatsTitle: 'Live Knowledge Repository Statistics',
    realtimeUpdate: 'Updated in Real-Time',
    totalSpeeches: 'Speeches',
    totalReels: 'Islamic Reels',
    totalBooks: 'Books',
    totalArticles: 'Articles',
    totalAqwaal: 'Aqwaal',
    totalShayariyan: 'Shayariyan',
    totalScholars: 'Scholars',
    featuredScholars: 'Scholars of Ahl-e-Sunnat',
    scholarsSubtitle: 'Eminent Asateza & Mashayekh',
    exploreAll: 'Explore All',
    viewProfile: 'View Profile & Speeches',
    latestSpeeches: 'Latest Speeches (Taqreer)',
    speechesSubtitle: 'Audio & Video Discourses',
    viewAllSpeeches: 'View All Speeches',
    islamicReels: 'Islamic Reels',
    reelsSubtitle: 'Spiritual Short Videos',
    viewAllReels: 'View All Reels',
    digitalLibrary: 'Islamic Digital Library',
    librarySubtitle: 'Kutub-e-Muqaddasa & Research',
    exploreLibrary: 'Explore Library',
    latestArticles: 'Latest Articles',
    articlesSubtitle: 'Tahqeeq & Islamic Thought',
    allArticles: 'All Articles',
    readArticle: 'Read Article',
    aqwaalTitle: 'Aqwaal & Nasihat',
    aqwaalSubtitle: 'Wisdom & Spiritual Guidance',
    viewAllMaxims: 'View All Maxims',
    shayariyanTitle: 'Shayariyan & Sharah',
    shayariyanSubtitle: 'Naat, Manqabat & Devotional Verse',
    viewAllPoetry: 'View All Poetry',
    sharah: 'Sharah (Explanation)',
    allTypes: 'All Types',
    islahiTaqreer: 'Islahi Taqreer',
    ilmiTaqreer: 'Ilmi Taqreer',
    filterByScholar: 'Filter by Scholar',
    allScholars: 'All Respected Scholars',
    allCategories: 'All Categories',
    allDisciplines: 'All Disciplines',
    readOnline: 'Read Online',
    downloadPdf: 'Download PDF',
    externalReader: 'External Reader',
    close: 'Close',
    backToDirectory: 'Back to Directory',
    dedicatedSpeeches: 'Dedicated Speeches',
    dedicatedReels: 'Dedicated Reels',
    poweredBy: 'POWERED BY SYED ALI QALANDAR PEERZADE',
    copyright: 'MISHKAAT Platform. All rights reserved. Ahl-e-Sunnat Heritage.'
  },
  ur: {
    home: 'صفحہ اول',
    speeches: 'ویڈیوز و تقاریر',
    reels: 'ریلز',
    books: 'کتب خانہ',
    articles: 'مقالات',
    aqwaal: 'اقوال و نصائح',
    shayariyan: 'شاعری و شرح',
    contact: 'رابطہ',
    portal: 'پورٹل',
    search: 'تلاش کریں',
    searchPlaceholder: 'تقاریر، علماء، ریلز، کتب، مضامین، اقوال، شاعری تلاش کریں...',
    welcomeTitle: 'مشکوٰۃ میں خوش آمدید',
    welcomeSubtitle: 'علمِ اہل سنت کا معتمد مرکز',
    welcomeDesc: 'معتبر علمِ دین، علمائے اہل سنت کی مستند تقاریر، نادر و نایاب کتب، بصیرت افروز ریلز، تحقیقی مقالات اور روحانی ارشادات سے اپنے قلوب کو منور کریں۔',
    exploreSpeeches: 'علمی و اصلاحی تقاریر',
    exploreBooks: 'ڈیجیٹل کتب خانہ',
    exploreReels: 'اسلامک ریلز',
    liveStatsTitle: 'مرکزِ علم کی لائیو شماریات',
    realtimeUpdate: 'بروقت خودکار اپ ڈیٹ',
    totalSpeeches: 'تقاریر',
    totalReels: 'مختصر ریلز',
    totalBooks: 'کتب',
    totalArticles: 'مقالات',
    totalAqwaal: 'اقوالِ حکمت',
    totalShayariyan: 'شاعری و کلام',
    totalScholars: 'علمائے کرام',
    featuredScholars: 'علمائے اہل سنت والجماعت',
    scholarsSubtitle: 'اساتذہ و مشائخِ عظام',
    exploreAll: 'مکمل فہرست دیکھیں',
    viewProfile: 'سوانح و بیانات دیکھیں',
    latestSpeeches: 'تازہ ترین تقاریر و خطابات',
    speechesSubtitle: 'صوتی و تصویری بیانات',
    viewAllSpeeches: 'تمام تقاریر دیکھیں',
    islamicReels: 'اسلامک ریلز و شارٹس',
    reelsSubtitle: 'مختصر روحانی پیغامات',
    viewAllReels: 'تمام ریلز دیکھیں',
    digitalLibrary: 'اسلامی ڈیجیٹل کتب خانہ',
    librarySubtitle: 'کتبِ مقدسہ و علمی تحقیقات',
    exploreLibrary: 'کتب خانے کا جائزہ لیں',
    latestArticles: 'تازہ ترین مضامین و مقالات',
    articlesSubtitle: 'تحقیق و فکرو شعور',
    allArticles: 'تمام مضامین',
    readArticle: 'مضمون پڑھیں',
    aqwaalTitle: 'اقوال و نصائح',
    aqwaalSubtitle: 'حکمت و روحانی رہنمائی',
    viewAllMaxims: 'تمام اقوال دیکھیں',
    shayariyanTitle: 'شاعری و شرح',
    shayariyanSubtitle: 'نعت، منقبت و روحانی کلام',
    viewAllPoetry: 'تمام کلام دیکھیں',
    sharah: 'شرح و مفہوم',
    allTypes: 'تمام اقسام',
    islahiTaqreer: 'اصلاحی تقریر',
    ilmiTaqreer: 'علمی تقریر',
    filterByScholar: 'عالمِ دین کے لحاظ سے',
    allScholars: 'تمام علمائے کرام',
    allCategories: 'تمام زمرہ جات',
    allDisciplines: 'تمام موضوعات',
    readOnline: 'آن لائن مطالعہ',
    downloadPdf: 'ڈاؤن لوڈ پی ڈی ایف',
    externalReader: 'بیرونی ریڈر',
    close: 'بند کریں',
    backToDirectory: 'واپس فہرست پر جائیں',
    dedicatedSpeeches: 'مخصوص تقاریر',
    dedicatedReels: 'مخصوص ریلز',
    poweredBy: 'POWERED BY SYED ALI QALANDAR PEERZADE',
    copyright: 'مشکوٰۃ پلیٹ فارم۔ جملہ حقوق بحقِ ورثہ اہل سنت محفوظ ہیں۔'
  },
  ar: {
    home: 'الرئيسية',
    speeches: 'المحاضرات',
    reels: 'الريلز',
    books: 'المكتبة',
    articles: 'المقالات',
    aqwaal: 'الأقوال والنصائح',
    shayariyan: 'القصائد والشروح',
    contact: 'اتصل بنا',
    portal: 'البوابة',
    search: 'بحث في المحتوى',
    searchPlaceholder: 'ابحث عن المحاضرات، العلماء، الكتب، المقالات، الأقوال...',
    welcomeTitle: 'مرحباً بكم في مشكاة',
    welcomeSubtitle: 'منارة المعرفة الإسلامية لأهل السنة',
    welcomeDesc: 'منصة إسلامية متكاملة لنشر التراث العلمي الأصيل، وخطب علماء أهل السنة والجماعة، والمخطوطات الرقمية، والمقالات المحكمة، والوصايا الإيمانية.',
    exploreSpeeches: 'المحاضرات العلمية',
    exploreBooks: 'المكتبة الرقمية',
    exploreReels: 'الفيديوهات القصيرة',
    liveStatsTitle: 'إحصائيات المنصة الحية',
    realtimeUpdate: 'تحديث فوري وتلقائي',
    totalSpeeches: 'المحاضرات',
    totalReels: 'الفيديوهات',
    totalBooks: 'الكتب',
    totalArticles: 'المقالات',
    totalAqwaal: 'الأقوال والحكم',
    totalShayariyan: 'القصائد',
    totalScholars: 'العلماء',
    featuredScholars: 'علماء أهل السنة والجماعة',
    scholarsSubtitle: 'الأعلام والمشايخ الأجلاء',
    exploreAll: 'عرض الكل',
    viewProfile: 'عرض الملف والمحاضرات',
    latestSpeeches: 'أحدث المحاضرات والخطب',
    speechesSubtitle: 'تسجيلات صوتية ومرئية',
    viewAllSpeeches: 'جميع المحاضرات',
    islamicReels: 'ريلز إسلامية قصيرة',
    reelsSubtitle: 'مواعظ إيمانية سريعة',
    viewAllReels: 'جميع المقاطع القصيرة',
    digitalLibrary: 'المكتبة الإسلامية الرقمية',
    librarySubtitle: 'أمهات الكتب والبحوث',
    exploreLibrary: 'تصفح المكتبة',
    latestArticles: 'أحدث المقالات والبحوث',
    articlesSubtitle: 'دراسات فكرية وتاريخية',
    allArticles: 'جميع المقالات',
    readArticle: 'قراءة المقال',
    aqwaalTitle: 'الأقوال والمواعظ',
    aqwaalSubtitle: 'حكم وفوائد روحية',
    viewAllMaxims: 'جميع الأقوال',
    shayariyanTitle: 'القصائد والشروح',
    shayariyanSubtitle: 'مدائح نبوية وشروح شعرية',
    viewAllPoetry: 'جميع القصائد',
    sharah: 'الشرح والبيان',
    allTypes: 'جميع الأنواع',
    islahiTaqreer: 'خطبة إصلاحية',
    ilmiTaqreer: 'محاضرة علمية',
    filterByScholar: 'تصفية حسب الشيخ',
    allScholars: 'كافة العلماء',
    allCategories: 'جميع التصنيفات',
    allDisciplines: 'جميع الفروع',
    readOnline: 'قراءة مباشرة',
    downloadPdf: 'تحميل ملف PDF',
    externalReader: 'قارئ خارجي',
    close: 'إغلاق',
    backToDirectory: 'العودة للدليل',
    dedicatedSpeeches: 'المحاضرات المسندة',
    dedicatedReels: 'المقاطع المسندة',
    poweredBy: 'POWERED BY SYED ALI QALANDAR PEERZADE',
    copyright: 'منصة مشكاة. جميع الحقوق محفوظة لتراث أهل السنة والجماعة.'
  }
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: Translations;
  isRTL: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('mishkaat_lang') as Language;
    return saved === 'ur' || saved === 'ar' || saved === 'en' ? saved : 'en';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('mishkaat_lang', lang);
  };

  const isRTL = language === 'ur' || language === 'ar';

  useEffect(() => {
    document.documentElement.setAttribute('dir', isRTL ? 'rtl' : 'ltr');
    document.documentElement.setAttribute('lang', language);
  }, [language, isRTL]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t: translations[language], isRTL }}>
      {children}
    </LanguageContext.Provider>
  );
};

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
}
