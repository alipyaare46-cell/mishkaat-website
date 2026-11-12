import { Language } from '../context/LanguageContext';
import { Scholar } from '../types';

export interface TranslatedScholar {
  name: string;
  title: string;
  bio: string;
  location: string;
}

// Multilingual dictionaries for the 9 Core Scholars
export const SCHOLARS_TRANSLATIONS: Record<string, Record<Language, TranslatedScholar>> = {
  'sch-madni-miya': {
    en: {
      name: 'Shaikh Ul Islam Syed Madni Miya Ashrafi',
      title: 'SHAIKH UL ISLAM',
      bio: 'Distinguished scholar, thinker, and spiritual luminary of the Ahle Sunnat wal Jamaat, internationally revered for profound mastery in Islamic jurisprudence, Tafseer, and Tasawwuf.',
      location: 'Kichhouchha Sharif, India'
    },
    ur: {
      name: 'شیخ الاسلام حضرت علامہ سید محمد مدنی میاں اشرفی الجیلانی',
      title: 'شیخ الاسلام',
      bio: 'اہل سنت و جماعت کے مایہ ناز مفکر، محدثِ دوراں اور روحانی پیشوا، جنہیں علومِ اسلامیہ، تفسیر، فقہ اور تصوف میں بین الاقوامی سطح پر مرجعیت و سند حاصل ہے۔',
      location: 'کچھوچھہ شریف، ہندوستان'
    },
    ar: {
      name: 'شيخ الإسلام العلامة السيد محمد مدني ميا الأشرفي الجيلاني',
      title: 'شيخ الإسلام',
      bio: 'من كبار علماء أهل السنة والجماعة ومفكريها، عالم رباني ومجدد زمانه، متقن لعلوم التفسير والحديث والفقه الإسلامي والتصوف.',
      location: 'كشوشة شريف، الهند'
    }
  },
  'sch-hashmi-miya': {
    en: {
      name: 'Gazi-e-Millat Syed Hashmi Miya Ashrafi',
      title: 'GAZI E MILLAT',
      bio: 'Renowned orator, scholar, and custodian of spiritual traditions, delivering impactful lectures on contemporary Islamic thought and moral rectitude.',
      location: 'Kichhouchha Sharif, India'
    },
    ur: {
      name: 'غازیِ ملت حضرت علامہ سید ہاشمی میاں اشرفی الجیلانی',
      title: 'غازیِ ملت',
      bio: 'عالمِ اسلام کے بین الاقوامی خطیب، محقق اور مصلح، جن کے مدلل خطابات اور فکری دروس نے لاکھوں دلوں میں عشقِ رسول ﷺ اور دینی بصیرت پیدا کی۔',
      location: 'کچھوچھہ شریف، ہندوستان'
    },
    ar: {
      name: 'غازي الملة العلامة السيد محمد هاشمي ميا الأشرفي',
      title: 'غازي الملة',
      bio: 'خطيب العصر وعالم محقق من أعيان الأشراف، عرف بمحاضراته المؤثرة ودفاعه المستميت عن معتقد أهل السنة وقضايا المسلمين.',
      location: 'كشوشة شريف، الهند'
    }
  },
  'sch-makki-miya': {
    en: {
      name: 'Khateeb-e-Hindustan Syed Makki Miya Ashrafi',
      title: 'KHATEEB E HINDUSTAN',
      bio: 'Celebrated speaker and scholarly voice known across the subcontinent for eloquent sermons upholding pristine Islamic traditions.',
      location: 'India'
    },
    ur: {
      name: 'خطیبِ ہندوستان حضرت علامہ سید مکی میاں اشرفی',
      title: 'خطیبِ ہندوستان',
      bio: 'برصغیر پاک و ہند کے معروف و مقبول خطیب، جن کے شیریں اور پرتاثیر بیانات سنتِ نبوی اور اصلاحِ معاشرہ کا روشن چراغ ہیں۔',
      location: 'ہندوستان'
    },
    ar: {
      name: 'خطيب الهند العلامة السيد مكي ميا الأشرفي',
      title: 'خطيب الهند',
      bio: 'خطيب مفوه وداعية إسلامي بارز، معروف ببيانه العذب ودعوته المباركة لنشر السنن النبوية وإصلاح المجتمع.',
      location: 'الهند'
    }
  },
  'sch-mahmood-ashraf': {
    en: {
      name: 'Qaid-e-Millat Syed Mahmood Ashraf Ashrafi',
      title: 'QAID E MILLAT',
      bio: 'Venerated spiritual guide and community leader dedicated to social upliftment, institutional building, and Islamic scholarship.',
      location: 'India'
    },
    ur: {
      name: 'قائدِ ملت حضرت علامہ سید محمود اشرف اشرفی',
      title: 'قائدِ ملت',
      bio: 'جلیل القدر روحانی رہنما، ملی قائد اور مربی، جنہوں نے مسلکِ حق، تعلیمی اداروں کی تعمیر اور ملی اتحاد کے لیے بے لوث خدمات انجام دیں۔',
      location: 'ہندوستان'
    },
    ar: {
      name: 'قائد الملة العلامة السيد محمود أشرف الأشرفي',
      title: 'قائد الملة',
      bio: 'مرشد روحي وقائد إسلامي محنك، كرس جهوده في خدمة المؤسسات الدينية، ونشر العلم الشرعي، ووحدة الأمة الإسلامية.',
      location: 'الهند'
    }
  },
  'sch-noorani-miya': {
    en: {
      name: 'Taaj-ul-Ulama Syed Noorani Miya Ashrafi Jilani',
      title: 'TAAJ UL ULMA',
      bio: 'Eminent researcher, master of traditional sciences, and author revered for scholarly contributions to theological clarity and Islamic jurisprudence.',
      location: 'India'
    },
    ur: {
      name: 'تاج العلماء حضرت علامہ سید نورانی میاں اشرفی الجیلانی',
      title: 'تاجُ العلماء',
      bio: 'عظیم محقق، علومِ عقلیہ و نقلیہ کے ماہر اور درجنوں وقیع کتب کے مصنف، جن کے قلم و بیان نے کلامی اور فقہی مسائل میں امت کی رہنمائی فرمائی۔',
      location: 'ہندوستان'
    },
    ar: {
      name: 'تاج العلماء العلامة السيد نوراني ميا الأشرفي الجيلاني',
      title: 'تاج العلماء',
      bio: 'علامة باحث ومحقق متقن للعلوم العقلية والنقلية، ومؤلف كتب قيمة في الفقه وعلم الكلام والدفاع عن تراث أهل السنة.',
      location: 'الهند'
    }
  },
  'sch-peer-ajmal': {
    en: {
      name: 'Fakhr-e-Mashayekh Syed Peer Ajmal Raza Qadri',
      title: 'FAKHR E MASHAYEKH',
      bio: 'Spiritual mentor and orator inspiring youths towards religious commitment, Prophetic love, and upright character.',
      location: 'Rawalpindi, Pakistan'
    },
    ur: {
      name: 'فخرِ مشائخ حضرت علامہ پیر سید اجمل رضا قادری',
      title: 'فخرِ مشائخ',
      bio: 'معروف روحانی شخصیت، پرخلوص داعی اور خطیب، جن کے دل نشین بیانات نے نوجوان نسل کو بے راہ روی سے نکال کر عشقِ مصطفیٰ ﷺ سے جوڑا۔',
      location: 'راولپنڈی، پاکستان'
    },
    ar: {
      name: 'فخر المشايخ العلامة پير السيد أجمل رضا القادري',
      title: 'فخر المشايخ',
      bio: 'داعية إسلامي ومرب روحي محبوب لدى الشباب، تتميز دروسه بالصدق والمحبة والتذكير باتباع الهدي النبوي الشريف.',
      location: 'روالبندي، باكستان'
    }
  },
  'sch-ameen-qadri': {
    en: {
      name: 'Bulbul-e-Bagh-e-Madina Allama Syed Aminul Qadri',
      title: 'BULBUL E BAGH E MADINA',
      bio: 'Dynamic orator and religious educator mobilizing youth worldwide through moving reminders, moral revitalization, and scholarly wisdom.',
      location: 'Malegaon, Maharashtra, India'
    },
    ur: {
      name: 'بلبلِ باغِ مدینہ حضرت علامہ سید امین القادری',
      title: 'بلبلِ باغِ مدینہ',
      bio: 'نوجوانوں کے ہر دلعزیز خطیب اور داعیِ اسلام، جن کے رقت انگیز اور حکمت آموز خطابات نے دنیا بھر میں اسلامی بیداری اور توبہ کی تحریک برپا کی۔',
      location: 'مالیگاؤں، مہاراشٹر، ہندوستان'
    },
    ar: {
      name: 'بلبل بستان المدينة العلامة السيد أمين القادري',
      title: 'بلبل المدينة',
      bio: 'خطيب وداعية متميز أثر في أجيال من الشباب عبر محاضراته الإصلاحية وحثه الدائم على الاستقامة وبر الوالدين وإحياء السنن.',
      location: 'ماليغاؤن، ماهاراشترا، الهند'
    }
  },
  'sch-sufi-mehmood': {
    en: {
      name: 'Kanz-ul-Karamat Hazrat Sufi Peer Syed Mehmood Shah Qadri',
      title: 'KANZ UL KARAMAT',
      bio: 'Venerated ascetic, Sufi master, and spiritual beacon guiding seekers upon the path of Tazkiyah, Dhikr, and unconditional divine love.',
      location: 'India'
    },
    ur: {
      name: 'کنز الکرامات حضرت صوفی پیر سید محمود شاہ قادری',
      title: 'کنزُ الکرامات',
      bio: 'عارف باللہ، صاحبِ کرامت صوفی بزرگ اور مربی، جن کی مجلسِ ذکر اور روحانی توجہ نے سالکینِ راہِ حق کے قلوب کو نورِ عرفان سے مالا مال کیا۔',
      location: 'ہندوستان'
    },
    ar: {
      name: 'كنز الكرامات الصوفي پير السيد محمود شاه القادري',
      title: 'كنز الكرامات',
      bio: 'عارف بالله وشيخ صوفي جليل، من أهل الذكر والتزكية والتقوى، كرس حياته لتربية القلوب ونشر المحبة الإلهية.',
      location: 'الهند'
    }
  },
  'sch-general-islamic': {
    en: {
      name: 'General Islamic Reminders',
      title: 'SUNAN, WAZAIF & DUAYEN',
      bio: 'Daily Prophetic traditions, spiritual invocations, and practical Islamic etiquettes for daily living.',
      location: 'General'
    },
    ur: {
      name: 'عمومی اسلامی پیغامات',
      title: 'سنن، وظائف و دعائیں',
      bio: 'روزمرہ کی مبارک سنتیں، مستند دعائیں، قرآنی وظائف اور پاکیزہ طرزِ زندگی کے رہنما اصول۔',
      location: 'عمومی'
    },
    ar: {
      name: 'مواعظ وتوجيهات إسلامية عامة',
      title: 'سنن، أذكار وأدعية',
      bio: 'سنن نبوية شريفة، أوراد مأثورة، وأدعية مستجابة ترشد المسلم في حياته اليومية.',
      location: 'عام'
    }
  }
};

// Multilingual translations for categories across Books, Articles, Speeches, Aqwaal & Shayari
export const CATEGORY_TRANSLATIONS: Record<string, Record<Language, string>> = {
  // Books categories
  'quran': { en: 'Holy Quran & Tafseer', ur: 'قرآن پاک و تفاسیر', ar: 'القرآن الكريم وعلومه' },
  'hadees': { en: 'Hadees & Commentaries', ur: 'حدیث شریف و شروحات', ar: 'الحديث الشريف وشروحه' },
  'fiqh': { en: 'Fiqh & Jurisprudence', ur: 'فقہ اسلامی و فتاویٰ', ar: 'الفقه الإسلامي والفتاوى' },
  'tasawwuf': { en: 'Tasawwuf & Ihsan', ur: 'تصوف و احسان', ar: 'التصوف والتزكية' },
  'tareekh-seerat': { en: 'Seerat & Islamic History', ur: 'سیرت النبی ﷺ و تاریخ', ar: 'السيرة النبوية والتاريخ' },
  'tareekh (seerat)': { en: 'Seerat & Islamic History', ur: 'سیرت النبی ﷺ و تاریخ', ar: 'السيرة النبوية والتاريخ' },
  'aqeedah': { en: 'Aqeedah & Theology', ur: 'عقائد اہل سنت', ar: 'العقيدة والتوحيد' },
  'urdu novels': { en: 'Moral Urdu Novels', ur: 'اصلاحی و تاریخی ناولز', ar: 'روايات إسلامية هادفة' },
  'urdu-novels': { en: 'Moral Urdu Novels', ur: 'اصلاحی و تاریخی ناولز', ar: 'روايات إسلامية هادفة' },

  // Articles categories
  'shakhsiyat': { en: 'Eminent Scholars & Luminaries', ur: 'شخصیات و مشائخِ عظام', ar: 'شخصيات وأعلام الإسلام' },
  'current': { en: 'Contemporary Issues', ur: 'عصری و موجودہ مسائل', ar: 'قضايا إسلامية معاصرة' },
  'tahqeeqi': { en: 'Scholarly Research', ur: 'تحقیقی و فکری مضامین', ar: 'بحوث ودراسات محكمة' },
  'islamic': { en: 'Islamic Teachings', ur: 'تعلیماتِ اسلام و اخلاقیات', ar: 'تعاليم وأخلاق إسلامية' },

  // Speech types & genres
  'islahi taqreer': { en: 'Islahi Taqreer (Moral)', ur: 'اصلاحی تقریر و بیانات', ar: 'خطبة إصلاحية وتوجيهية' },
  'ilmi taqreer': { en: 'Ilmi Taqreer (Academic)', ur: 'علمی و فکری خطابات', ar: 'محاضرة علمية محكمة' },
  'munazara': { en: 'Munazara & Refutations', ur: 'مناظرہ و ردِ باطل', ar: 'مناظرات وردود علمية' },
  'seerat conference': { en: 'Seerat Conference', ur: 'سیرت النبی ﷺ کانفرنس', ar: 'مؤتمر السيرة النبوية' },
  'duroos-e-quran': { en: 'Duroos-e-Quran', ur: 'دروسِ قرآن پاک', ar: 'دروس تفسير القرآن' },
  'duroos-e-hadees': { en: 'Duroos-e-Hadees', ur: 'دروسِ حدیث شریف', ar: 'دروس الحديث الشريف' },

  // Aqwaal categories
  'ilm': { en: 'Knowledge & Wisdom', ur: 'علم و حکمت', ar: 'العلم والحكمة' },
  'adab': { en: 'Manners & Ethics', ur: 'ادب و اخلاق', ar: 'الأدب والأخلاق' },
  'ishq': { en: 'Love for the Prophet ﷺ', ur: 'عشقِ رسول ﷺ', ar: 'محبة النبي ﷺ' },
  'khidma': { en: 'Service to Humanity', ur: 'خدمتِ خلق', ar: 'خدمة المجتمع' },
  'sabr': { en: 'Patience & Gratitude', ur: 'صبر و شکر', ar: 'الصبر واليقين' },
  'tauheed': { en: 'Tauheed & Sunnah', ur: 'توحید و سنت', ar: 'التوحيد والاتباع' },

  // Poetry categories
  'naat sharif': { en: 'Naat Sharif (Prophetic Praise)', ur: 'نعتِ رسول مقبول ﷺ', ar: 'المدائح النبوية' },
  'salam sharif': { en: 'Salam Sharif (Greetings)', ur: 'سلام و درود شریف', ar: 'الصلاة والسلام' },
  'manqabat': { en: 'Manqabat (Saintly Praise)', ur: 'منقبتِ اولیائے کرام', ar: 'المناقب الشريفة' },
  'hamd': { en: 'Hamd (Praise of Allah)', ur: 'حمدِ باری تعالیٰ', ar: 'الحمد والثناء' }
};

/**
 * Helper to get translated scholar fields dynamically
 */
export function translateScholar(scholar: Scholar, lang: Language): TranslatedScholar {
  const byId = SCHOLARS_TRANSLATIONS[scholar.id];
  if (byId && byId[lang]) {
    return byId[lang];
  }

  // Fallback by slug
  const bySlug = Object.values(SCHOLARS_TRANSLATIONS).find(
    (item) => item.en.name.toLowerCase() === scholar.full_name.toLowerCase()
  );
  if (bySlug && bySlug[lang]) {
    return bySlug[lang];
  }

  return {
    name: scholar.full_name,
    title: scholar.honorific_title,
    bio: scholar.biography || '',
    location: scholar.location || ''
  };
}

/**
 * Helper to get translated category names dynamically
 */
export function translateCategory(nameOrSlug: string, lang: Language): string {
  if (!nameOrSlug) return '';
  const key = nameOrSlug.toLowerCase().trim();
  const found = CATEGORY_TRANSLATIONS[key];
  if (found && found[lang]) {
    return found[lang];
  }
  return nameOrSlug;
}
