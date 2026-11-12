import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';

const DATA_DIR = path.resolve(process.cwd(), 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DB_PATH = path.join(DATA_DIR, 'mishkaat.db');
export const db = new Database(DB_PATH);

// Enable foreign keys and WAL mode for high reliability
db.pragma('foreign_keys = ON');
db.pragma('journal_mode = WAL');

export function initDatabase() {
  // 1. Admins table
  db.exec(`
    CREATE TABLE IF NOT EXISTS admins (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      full_name TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);

  // 2. Scholars table
  db.exec(`
    CREATE TABLE IF NOT EXISTS scholars (
      id TEXT PRIMARY KEY,
      full_name TEXT NOT NULL,
      honorific_title TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      biography TEXT,
      profile_image TEXT,
      location TEXT,
      is_published INTEGER DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);

  // 3. Speeches table
  db.exec(`
    CREATE TABLE IF NOT EXISTS speeches (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      scholar_id TEXT NOT NULL,
      speech_type TEXT NOT NULL, -- 'Islahi Taqreer' or 'Ilmi Taqreer'
      description TEXT,
      thumbnail TEXT,
      media_url TEXT NOT NULL,
      duration TEXT,
      upload_date TEXT NOT NULL,
      tags TEXT,
      is_published INTEGER DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (scholar_id) REFERENCES scholars(id) ON DELETE CASCADE
    );
  `);

  // 4. Reels table
  db.exec(`
    CREATE TABLE IF NOT EXISTS reels (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      scholar_id TEXT NOT NULL,
      description TEXT,
      video_url TEXT NOT NULL,
      thumbnail TEXT,
      duration TEXT,
      is_published INTEGER DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (scholar_id) REFERENCES scholars(id) ON DELETE CASCADE
    );
  `);

  // 5. Book Categories table
  db.exec(`
    CREATE TABLE IF NOT EXISTS book_categories (
      id TEXT PRIMARY KEY,
      name TEXT UNIQUE NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      description TEXT,
      created_at TEXT NOT NULL
    );
  `);

  // 6. Books table
  db.exec(`
    CREATE TABLE IF NOT EXISTS books (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      author_name TEXT NOT NULL,
      category_id TEXT NOT NULL,
      cover_image TEXT,
      description TEXT,
      language TEXT DEFAULT 'Urdu',
      file_url TEXT,
      external_read_url TEXT,
      publication_details TEXT,
      allow_download INTEGER DEFAULT 1,
      is_published INTEGER DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (category_id) REFERENCES book_categories(id) ON DELETE RESTRICT
    );
  `);

  // 7. Article Categories table
  db.exec(`
    CREATE TABLE IF NOT EXISTS article_categories (
      id TEXT PRIMARY KEY,
      name TEXT UNIQUE NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      description TEXT,
      created_at TEXT NOT NULL
    );
  `);

  // 8. Articles table
  db.exec(`
    CREATE TABLE IF NOT EXISTS articles (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      category_id TEXT NOT NULL,
      author_name TEXT,
      featured_image TEXT,
      excerpt TEXT,
      content TEXT NOT NULL,
      publication_date TEXT NOT NULL,
      tags TEXT,
      is_published INTEGER DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (category_id) REFERENCES article_categories(id) ON DELETE RESTRICT
    );
  `);

  // 9. Aqwaal Categories table
  db.exec(`
    CREATE TABLE IF NOT EXISTS aqwaal_categories (
      id TEXT PRIMARY KEY,
      name TEXT UNIQUE NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      created_at TEXT NOT NULL
    );
  `);

  // 10. Aqwaal table
  db.exec(`
    CREATE TABLE IF NOT EXISTS aqwaal (
      id TEXT PRIMARY KEY,
      text TEXT NOT NULL,
      type TEXT NOT NULL, -- 'Aqwaal' or 'Nasihat'
      scholar_id TEXT,
      attributed_to TEXT,
      category_id TEXT,
      reference_source TEXT,
      image_url TEXT,
      is_published INTEGER DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (scholar_id) REFERENCES scholars(id) ON DELETE SET NULL,
      FOREIGN KEY (category_id) REFERENCES aqwaal_categories(id) ON DELETE SET NULL
    );
  `);

  // 11. Shayariyan table
  db.exec(`
    CREATE TABLE IF NOT EXISTS shayariyan (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      poet_name TEXT NOT NULL,
      poet_image TEXT,
      poetry_text TEXT NOT NULL,
      sharah TEXT,
      category TEXT,
      language TEXT DEFAULT 'Urdu',
      publication_date TEXT NOT NULL,
      is_featured INTEGER DEFAULT 0,
      is_published INTEGER DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);

  // 12. Website Settings table
  db.exec(`
    CREATE TABLE IF NOT EXISTS website_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);

  // 13. Sessions table for secure admin auth
  db.exec(`
    CREATE TABLE IF NOT EXISTS admin_sessions (
      token TEXT PRIMARY KEY,
      admin_id TEXT NOT NULL,
      expires_at INTEGER NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (admin_id) REFERENCES admins(id) ON DELETE CASCADE
    );
  `);

  // 14. Public Member Users table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      full_name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      avatar_url TEXT,
      bio TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);

  // 15. Public Member Sessions table
  db.exec(`
    CREATE TABLE IF NOT EXISTS user_sessions (
      token TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      expires_at INTEGER NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  // 16. User Bookmarks & Saved Items table
  db.exec(`
    CREATE TABLE IF NOT EXISTS user_bookmarks (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      item_type TEXT NOT NULL,
      item_id TEXT NOT NULL,
      created_at TEXT NOT NULL,
      UNIQUE(user_id, item_type, item_id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  // 17. Likes table for Speeches and Reels
  db.exec(`
    CREATE TABLE IF NOT EXISTS likes (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      item_type TEXT NOT NULL,
      item_id TEXT NOT NULL,
      created_at TEXT NOT NULL,
      UNIQUE(user_id, item_type, item_id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  // 18. Comments table for Speeches and Reels
  db.exec(`
    CREATE TABLE IF NOT EXISTS comments (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      user_name TEXT NOT NULL,
      item_type TEXT NOT NULL,
      item_id TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  // 19. Contact Messages table for visitors & members inquiries
  db.exec(`
    CREATE TABLE IF NOT EXISTS contact_messages (
      id TEXT PRIMARY KEY,
      full_name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT,
      subject TEXT,
      message TEXT NOT NULL,
      is_read INTEGER DEFAULT 0,
      created_at TEXT NOT NULL
    );
  `);

  // Create indexes for fast searching and relations
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_contact_created ON contact_messages(created_at);
    CREATE INDEX IF NOT EXISTS idx_speeches_scholar ON speeches(scholar_id);
    CREATE INDEX IF NOT EXISTS idx_speeches_published ON speeches(is_published);
    CREATE INDEX IF NOT EXISTS idx_speeches_type ON speeches(speech_type);
    CREATE INDEX IF NOT EXISTS idx_reels_scholar ON reels(scholar_id);
    CREATE INDEX IF NOT EXISTS idx_reels_published ON reels(is_published);
    CREATE INDEX IF NOT EXISTS idx_books_category ON books(category_id);
    CREATE INDEX IF NOT EXISTS idx_articles_category ON articles(category_id);
    CREATE INDEX IF NOT EXISTS idx_aqwaal_category ON aqwaal(category_id);
    CREATE INDEX IF NOT EXISTS idx_aqwaal_scholar ON aqwaal(scholar_id);
  `);

  // Seed default website settings if not already present
  const defaultSettings: Record<string, string> = {
    website_name: 'MISHKAAT',
    welcome_title: 'WELCOME TO MISHKAAT',
    welcome_message: 'Mishkaat is a premier digital sanctuary dedicated to the dissemination of authentic Islamic knowledge, scholarly addresses of Ahl-e-Sunnat, sacred literature, spiritual discourses, and uplifting reminders for seekers of truth worldwide.',
    about_text: 'Named after the sacred niche radiating divine illumination (Mishkaat), this platform curates the intellectual legacy, spiritual guidance, and profound teachings of respected scholars to nurture hearts and enlighten minds.',
    contact_email: 'contact@mishkaat.org',
    contact_phone: '+91 (0) 22 2847 0000',
    contact_address: 'Mishkaat Islamic Knowledge Foundation, Mumbai, India',
    footer_tagline: 'Illuminating Hearts with Authentic Islamic Knowledge and Ahl-e-Sunnat Heritage.',
    show_hero_cta: 'true',
    show_stats_dashboard: 'true',
    show_featured_scholars: 'true',
    show_latest_speeches: 'true',
    show_reels_section: 'true',
    show_featured_books: 'true',
    show_articles_section: 'true',
    show_aqwaal_section: 'true',
    show_shayariyan_section: 'true'
  };

  const insertSetting = db.prepare(`
    INSERT OR IGNORE INTO website_settings (key, value) VALUES (?, ?)
  `);

  for (const [key, value] of Object.entries(defaultSettings)) {
    insertSetting.run(key, value);
  }

  // Seed the EXACT 9 INITIAL SCHOLARS specified in the prompt requirement
  const initialScholars = [
    {
      id: 'sch-madni-miya',
      full_name: 'Shaikh Ul Islam Syed Madni Miya Ashrafi',
      honorific_title: 'SHAIKH UL ISLAM',
      slug: 'shaikh-ul-islam-syed-madni-miya-ashrafi',
      biography: 'Distinguished scholar, thinker, and spiritual luminary of the Ahle Sunnat wal Jamaat, internationally revered for profound mastery in Islamic jurisprudence, Tafseer, and Tasawwuf.',
      location: 'Kichhouchha Sharif, India'
    },
    {
      id: 'sch-hashmi-miya',
      full_name: 'Gazi-e-Millat Syed Hashmi Miya Ashrafi',
      honorific_title: 'GAZI E MILLAT',
      slug: 'gazi-e-millat-syed-hashmi-miya-ashrafi',
      biography: 'Renowned orator, scholar, and custodian of spiritual traditions, delivering impactful lectures on contemporary Islamic thought and moral rectitude.',
      location: 'Kichhouchha Sharif, India'
    },
    {
      id: 'sch-makki-miya',
      full_name: 'Khateeb-e-Hindustan Syed Makki Miya Ashrafi',
      honorific_title: 'KHATEEB E HINDUSTAN',
      slug: 'khateeb-e-hindustan-syed-makki-miya-ashrafi',
      biography: 'Celebrated speaker and scholarly voice known across the subcontinent for eloquent sermons upholding pristine Islamic traditions.',
      location: 'India'
    },
    {
      id: 'sch-mahmood-ashraf',
      full_name: 'Qaid-e-Millat Syed Mahmood Ashraf Ashrafi',
      honorific_title: 'QAID E MILLAT',
      slug: 'qaid-e-millat-syed-mahmood-ashraf-ashrafi',
      biography: 'Venerated spiritual guide and community leader dedicated to social upliftment, institutional building, and Islamic scholarship.',
      location: 'India'
    },
    {
      id: 'sch-noorani-miya',
      full_name: 'Taaj-ul-Ulama Syed Noorani Miya Ashrafi Jilani',
      honorific_title: 'TAAJ UL ULMA',
      slug: 'taaj-ul-ulama-syed-noorani-miya-ashrafi-jilani',
      biography: 'Eminent researcher, master of traditional sciences, and author revered for scholarly contributions to theological clarity and Islamic jurisprudence.',
      location: 'India'
    },
    {
      id: 'sch-peer-ajmal',
      full_name: 'Peer Ajmal Qadri',
      honorific_title: 'PEER AJMAL QADRI',
      slug: 'peer-ajmal-qadri',
      biography: 'Respected spiritual guide and Islamic scholar focusing on tazkiyah-e-nafs (purification of the soul), moral education, and youth engagement.',
      location: 'Pakistan / International'
    },
    {
      id: 'sch-salman-azhari',
      full_name: 'Mufti Salman Azhari',
      honorific_title: 'MUFTI SALMAN AZHARI',
      slug: 'mufti-salman-azhari',
      biography: 'Graduate of Al-Azhar University, Islamic jurist and prominent public intellectual known for scholarly addresses on contemporary youth challenges and Islamic identity.',
      location: 'India'
    },
    {
      id: 'sch-ameen-qadri',
      full_name: 'Syed Ameen Ul Qadri',
      honorific_title: 'SYED AMEEN UL QADRI',
      slug: 'syed-ameen-ul-qadri',
      biography: 'Prolific Islamic preacher and orator inspiring millions through heart-softening discourses on Seerat-un-Nabi, family harmony, and moral ethics.',
      location: 'Malegaon, India'
    },
    {
      id: 'sch-other-ulama',
      full_name: 'Other Ulama-e-Ahl-e-Sunnat',
      honorific_title: 'OTHER ULAMA E AHL E SUNNAT',
      slug: 'other-ulama-e-ahl-e-sunnat',
      biography: 'General repository and scholarly circle representing esteemed Ulama, Muftis, and Mashayekh of the Ahl-e-Sunnat tradition.',
      location: 'Global'
    },
    {
      id: 'sch-madina-sharif',
      full_name: 'Madina Munawwarah Sharif',
      honorific_title: 'HARAMAIN ZIYARAT & MANAZIR',
      slug: 'madina-munawwarah-sharif',
      biography: 'Roohani manazir, ziyarat-e-Roza-e-Rasool ﷺ, Masjide Nabawi, durood-o-salam aur Madina Munawwarah ki pur-noor fizaon par mabni mukhtasar reels.',
      location: 'Madinah Al-Munawwarah'
    },
    {
      id: 'sch-dunya-akhirat',
      full_name: 'Dunya Wa Akhirat Ki Fikr',
      honorific_title: 'ISLAHI REMINDERS & NASEEHAT',
      slug: 'dunya-aur-akhirat',
      biography: 'Dunya ki be-sabati, aakhirat ki tayyari, qabr wa hashr ki fikr aur tauba wa istighfar par mushtamil roohani admonitions.',
      location: 'Spiritual Reminders'
    },
    {
      id: 'sch-general-islam',
      full_name: 'General Islamic & Roohaniyat',
      honorific_title: 'SUNAN, WAZAIF & DUAYEN',
      slug: 'general-islamic',
      biography: 'Roz-marrah ki sunnaten, duain, adab-e-zindagi aur noorani peghamat.',
      location: 'General'
    }
  ];

  const insertScholar = db.prepare(`
    INSERT OR IGNORE INTO scholars (id, full_name, honorific_title, slug, biography, location, is_published, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, 1, datetime('now'), datetime('now'))
  `);

  for (const s of initialScholars) {
    insertScholar.run(s.id, s.full_name, s.honorific_title, s.slug, s.biography, s.location);
  }

  // Seed INITIAL BOOK CATEGORIES specified in Section 7
  const initialBookCategories = [
    { id: 'bcat-quran', name: 'Quran', slug: 'quran', description: 'Tafseer, translations, and sciences of the Holy Quran.' },
    { id: 'bcat-hadees', name: 'Hadees', slug: 'hadees', description: 'Collections of Prophetic traditions, commentaries, and Usool al-Hadith.' },
    { id: 'bcat-fiqh', name: 'Fiqh', slug: 'fiqh', description: 'Islamic jurisprudence, rulings of worship, and practical transactions.' },
    { id: 'bcat-tasawwuf', name: 'Tasawwuf', slug: 'tasawwuf', description: 'Spiritual purification, moral elevation, and Sufi classics.' },
    { id: 'bcat-tareekh', name: 'Tareekh (Seerat)', slug: 'tareekh-seerat', description: 'Noble biography of the Prophet (peace be upon him) and Islamic history.' },
    { id: 'bcat-aqeedah', name: 'Aqeedah', slug: 'aqeedah', description: 'Theological fundamentals and creed of Ahl-e-Sunnat wal Jamaat.' },
    { id: 'bcat-novels', name: 'Urdu Novels', slug: 'urdu-novels', description: 'Wholesome historical, moral, and literary Urdu novels.' }
  ];

  const insertBookCat = db.prepare(`
    INSERT OR IGNORE INTO book_categories (id, name, slug, description, created_at)
    VALUES (?, ?, ?, ?, datetime('now'))
  `);

  for (const c of initialBookCategories) {
    insertBookCat.run(c.id, c.name, c.slug, c.description);
  }

  // Seed INITIAL ARTICLE CATEGORIES specified in Section 8
  const initialArticleCategories = [
    { id: 'acat-shakhsiyat', name: 'Shakhsiyat', slug: 'shakhsiyat', description: 'Profiles and life sketches of luminaries and pious predecessors.' },
    { id: 'acat-current', name: 'Current', slug: 'current', description: 'Analysis of contemporary issues through the lens of traditional Islam.' },
    { id: 'acat-tahqeeqi', name: 'Tahqeeqi', slug: 'tahqeeqi', description: 'In-depth research papers, manuscript studies, and scholarly debates.' },
    { id: 'acat-islamic', name: 'Islamic', slug: 'islamic', description: 'Foundational guidance, articles on worship, ethics, and spirituality.' }
  ];

  const insertArticleCat = db.prepare(`
    INSERT OR IGNORE INTO article_categories (id, name, slug, description, created_at)
    VALUES (?, ?, ?, ?, datetime('now'))
  `);

  for (const c of initialArticleCategories) {
    insertArticleCat.run(c.id, c.name, c.slug, c.description);
  }

  // Seed INITIAL AQWAAL CATEGORIES specified in Section 9
  const initialAqwaalCategories = [
    { id: 'qcat-ikhlaq', name: 'Ikhlaqiyat (Morals)', slug: 'ikhlaqiyat' },
    { id: 'qcat-rohaniyat', name: 'Rohaniyat (Spirituality)', slug: 'rohaniyat' },
    { id: 'qcat-sabr', name: 'Sabr o Shukr (Patience & Gratitude)', slug: 'sabr-o-shukr' },
    { id: 'qcat-ilm', name: 'Ilm o Hikmat (Knowledge & Wisdom)', slug: 'ilm-o-hikmat' }
  ];

  const insertAqwaalCat = db.prepare(`
    INSERT OR IGNORE INTO aqwaal_categories (id, name, slug, created_at)
    VALUES (?, ?, ?, datetime('now'))
  `);

  for (const c of initialAqwaalCategories) {
    insertAqwaalCat.run(c.id, c.name, c.slug);
  }

  // Check if an admin exists, otherwise seed initial admin account if configured or setup defaults
  const adminCount = db.prepare('SELECT count(*) as count FROM admins').get() as { count: number };
  if (adminCount.count === 0) {
    const adminUser = process.env.ADMIN_USERNAME || 'admin';
    const adminPass = process.env.ADMIN_PASSWORD || 'Mishkaat@Admin2026!';
    const salt = bcrypt.genSaltSync(12);
    const hash = bcrypt.hashSync(adminPass, salt);
    
    db.prepare(`
      INSERT INTO admins (id, username, password_hash, full_name, created_at, updated_at)
      VALUES (?, ?, ?, ?, datetime('now'), datetime('now'))
    `).run('admin-primary', adminUser, hash, 'Chief Administrator');
  }

  // Dummy content seeding is permanently disabled
  return;
}

function _unusedSeedDummy() {

  // Seed INITIAL SPEECHES if empty and SEED_SAMPLE_CONTENT=true
  const speechesCount = db.prepare('SELECT count(*) as count FROM speeches').get() as { count: number };
  if (speechesCount.count === 0) {
    const initialSpeeches = [
      {
        id: 'sp_seerat_un_nabi',
        title: 'Seerat-e-Mustafa ﷺ Aur Hamari Zindagi Ka Maqsad',
        scholar_id: 'sch-madni-miya',
        speech_type: 'Islahi Taqreer',
        description: 'Iman-afroz aur roohani bayan az Shaikh-ul-Islam Hazrat Syed Madni Miya Ashrafi bar mauzu Seerat-e-Tayyiba aur itteba-e-Rasool ﷺ.',
        thumbnail: 'https://images.unsplash.com/photo-1542816417-0983c9c9ad53?auto=format&fit=crop&w=800&q=80',
        media_url: 'https://www.youtube.com/watch?v=0k1WcWf_p24',
        duration: '48:15',
        upload_date: new Date().toISOString().split('T')[0],
        tags: 'Seerat, Sunnat, Ishq-e-Rasool, Islahi',
        is_published: 1
      },
      {
        id: 'sp_azmat_e_ahle_bait',
        title: 'Azmat-e-Ahle Bait-e-Athaar Wa Sahaba-e-Kiram',
        scholar_id: 'sch-hashmi-miya',
        speech_type: 'Ilmi Taqreer',
        description: 'Dalail wa barahin se labrez ilmi khitab az Gazi-e-Millat Hazrat Syed Hashmi Miya Ashrafi bar mauzu maqaam-e-Sahaba wa Ahle Bait.',
        thumbnail: 'https://images.unsplash.com/photo-1564769625905-50e93615e769?auto=format&fit=crop&w=800&q=80',
        media_url: 'https://www.youtube.com/watch?v=kXx3_0lV_1M',
        duration: '52:40',
        upload_date: new Date().toISOString().split('T')[0],
        tags: 'Ahle Bait, Sahaba, Aqaid, Ilmi',
        is_published: 1
      },
      {
        id: 'sp_tarbiyat_e_aulad',
        title: 'Naojawanon Ki Tarbiyat Aur Namaz Ki Ahmiyat',
        scholar_id: 'sch-ameen-qadri',
        speech_type: 'Islahi Taqreer',
        description: 'Dilon ko jhanjhodne wala pur-asar bayan az Hazrat Allama Syed Aminul Qadri bar mauzu nijaat-e-aakhirat aur pakiza zindgi.',
        thumbnail: 'https://images.unsplash.com/photo-1584551246679-0daf3d275d0f?auto=format&fit=crop&w=800&q=80',
        media_url: 'https://www.youtube.com/watch?v=5rLzWqV37mY',
        duration: '39:20',
        upload_date: new Date().toISOString().split('T')[0],
        tags: 'Tarbiyat, Naojawan, Namaz, Tauba',
        is_published: 1
      }
    ];

    const insertSpeech = db.prepare(`
      INSERT INTO speeches (id, title, scholar_id, speech_type, description, thumbnail, media_url, duration, upload_date, tags, is_published, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `);
    for (const s of initialSpeeches) {
      insertSpeech.run(s.id, s.title, s.scholar_id, s.speech_type, s.description, s.thumbnail, s.media_url, s.duration, s.upload_date, s.tags, s.is_published);
    }
  }

  // Seed INITIAL REELS if empty
  const reelsCount = db.prepare('SELECT count(*) as count FROM reels').get() as { count: number };
  if (reelsCount.count === 0) {
    const initialReels = [
      {
        id: 'reel_sabr_ajr',
        title: 'Sabr Ka Azeem Ajr Aur Mushkilat Me Sukoon',
        scholar_id: 'sch-madni-miya',
        description: 'Shaikh-ul-Islam ki zubaan-e-faiz-tarjumaan se sabr aur tawakkul ka anmol pegham.',
        thumbnail: 'https://images.unsplash.com/photo-1542816417-0983c9c9ad53?auto=format&fit=crop&w=600&q=80',
        video_url: 'https://www.youtube.com/shorts/3jZ_7n2o4Yk',
        duration: '0:58',
        is_published: 1
      },
      {
        id: 'reel_walidain_khidma',
        title: 'Walidain Ki Khidmat — Jannat Ka Asan Darwaza',
        scholar_id: 'sch-ameen-qadri',
        description: 'Maa baap ke huqooq aur unki duaon ki taaseer par mukhtasar roohani naseehat.',
        thumbnail: 'https://images.unsplash.com/photo-1584551246679-0daf3d275d0f?auto=format&fit=crop&w=600&q=80',
        video_url: 'https://www.youtube.com/shorts/5vX9o1pQrTs',
        duration: '0:54',
        is_published: 1
      },
      {
        id: 'reel_darood_fazilat',
        title: 'Kasrat-e-Durood Shareef Ke Hairat-angez Fawaid',
        scholar_id: 'sch-hashmi-miya',
        description: 'Nabi-e-Kareem ﷺ par durood bhejne ke azeem barkaat wa fazilat.',
        thumbnail: 'https://images.unsplash.com/photo-1564769625905-50e93615e769?auto=format&fit=crop&w=600&q=80',
        video_url: 'https://www.youtube.com/shorts/8kL2mNpQ4rS',
        duration: '0:50',
        is_published: 1
      },
      {
        id: 'reel_ilm_amal',
        title: 'Ilm Ke Sath Amal Ki Zaroorat',
        scholar_id: 'sch-salman-azhari',
        description: 'Mufti Salman Azhari ka fikr-angez pegham ba-unwan ilm wa taqwa.',
        thumbnail: 'https://images.unsplash.com/photo-1590076215667-875d4ef2d7ee?auto=format&fit=crop&w=600&q=80',
        video_url: 'https://www.youtube.com/shorts/2wX7mNoP5rT',
        duration: '0:45',
        is_published: 1
      }
    ];

    const insertReel = db.prepare(`
      INSERT INTO reels (id, title, scholar_id, description, video_url, thumbnail, duration, is_published, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `);
    for (const r of initialReels) {
      insertReel.run(r.id, r.title, r.scholar_id, r.description, r.video_url, r.thumbnail, r.duration, r.is_published);
    }
  }

  // Ensure Madina Munawwarah & Dunya Akhirat reels are seeded
  const generalTopicReels = [
    {
      id: 'reel_madina_ziyarat_1',
      title: 'Madina Munawwarah — Roza-e-Aqdas Ki Noorani Ziyarat Aur Salam',
      scholar_id: 'sch-madina-sharif',
      description: 'Gumbad-e-Khizra aur Roza-e-Rasool ﷺ ki pur-kaif ziyarat. Assalamu Alaika Ya RasoolAllah ﷺ.',
      thumbnail: 'https://images.unsplash.com/photo-1542816417-0983c9c9ad53?auto=format&fit=crop&w=600&q=80',
      video_url: 'https://www.youtube.com/shorts/3jZ_7n2o4Yk',
      duration: '0:55',
      is_published: 1
    },
    {
      id: 'reel_madina_ziyarat_2',
      title: 'Babul Salam Se Roza-e-Mustafa ﷺ Par Haziri Ka Manzar',
      scholar_id: 'sch-madina-sharif',
      description: 'Madina Sharif ki muqaddas galiyan aur Masjide Nabawi Sharif ka rooh-parwar manzar.',
      thumbnail: 'https://images.unsplash.com/photo-1564769625905-50e93615e769?auto=format&fit=crop&w=600&q=80',
      video_url: 'https://www.youtube.com/shorts/8kL2mNpQ4rS',
      duration: '0:50',
      is_published: 1
    },
    {
      id: 'reel_dunya_haqeeqat_1',
      title: 'Dunya Ki Haqeeqat Aur Maut Ki Yaad — Ek Qalb-Guzar Nasihat',
      scholar_id: 'sch-dunya-akhirat',
      description: 'Dunya fani hai aur aakhirat baqi rehne wali hai. Fikr-e-aakhirat aur tauba ka paigham.',
      thumbnail: 'https://images.unsplash.com/photo-1507692049790-de58290a4334?auto=format&fit=crop&w=600&q=80',
      video_url: 'https://www.youtube.com/shorts/5vX9o1pQrTs',
      duration: '0:59',
      is_published: 1
    },
    {
      id: 'reel_dunya_haqeeqat_2',
      title: 'Qabr Ki Pehli Raat Aur Amal-e-Saleh Ki Roshni',
      scholar_id: 'sch-dunya-akhirat',
      description: 'Maut ke baad qabr me sirf nek aamal kaam aayenge. Ghaflat se bedari ka dars.',
      thumbnail: 'https://images.unsplash.com/photo-1590076215667-875d4ef2d7ee?auto=format&fit=crop&w=600&q=80',
      video_url: 'https://www.youtube.com/shorts/2wX7mNoP5rT',
      duration: '0:48',
      is_published: 1
    }
  ];

  const insertGeneralReel = db.prepare(`
    INSERT OR IGNORE INTO reels (id, title, scholar_id, description, video_url, thumbnail, duration, is_published, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
  `);
  for (const r of generalTopicReels) {
    insertGeneralReel.run(r.id, r.title, r.scholar_id, r.description, r.video_url, r.thumbnail, r.duration, r.is_published);
  }

  // Seed INITIAL BOOKS (comprehensive classical collection across all disciplines)
  const initialBooks = [
    {
      id: 'bk_kanz_ul_iman',
      title: 'Kanz-ul-Iman Fi Tarjumat-il-Quran',
      author_name: 'Aala Hazrat Imam Ahmad Raza Khan Barelvi',
      category_id: 'bcat-quran',
      cover_image: 'https://images.unsplash.com/photo-1609599006353-e629aaabfeae?auto=format&fit=crop&w=600&q=80',
      description: 'Urdu zuban me sab se mustanad, be-misaal aur adab wa ta\'zeem se bharpoor tarjuma-e-Quran.',
      language: 'Urdu',
      file_url: 'https://archive.org/download/KanzUlImanUrdu/Kanz-ul-Iman.pdf',
      external_read_url: 'https://archive.org/details/KanzUlImanUrdu',
      publication_details: 'Maktaba-tul-Madina, Karachi',
      allow_download: 1,
      is_published: 1
    },
    {
      id: 'bk_tafseer_noor_ul_irfan',
      title: 'Tafseer Noor-ul-Irfan',
      author_name: 'Hakeem-ul-Ummat Mufti Ahmad Yar Khan Naeemi',
      category_id: 'bcat-quran',
      cover_image: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80',
      description: 'Mukhtasar, jame aur pur-asar tafseer jo aam wa khas ke liye hidayat ka sarchashma hai.',
      language: 'Urdu',
      file_url: 'https://archive.org/download/NoorUlIrfanUrdu/Noor-ul-Irfan.pdf',
      external_read_url: 'https://archive.org/details/NoorUlIrfanUrdu',
      publication_details: 'Naeemi Kutub Khana, Gujrat',
      allow_download: 1,
      is_published: 1
    },
    {
      id: 'bk_sahih_bukhari',
      title: 'Sahih al-Bukhari (Mukammal Urdu Tarjuma)',
      author_name: 'Imam Muhammad bin Ismail Bukhari',
      category_id: 'bcat-hadees',
      cover_image: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=600&q=80',
      description: 'Kutub-e-Hadith me Asah-hul-Kutub ba\'d Kitabullah ka aali tareen maqaam rakhne wali azeem tareen kitab.',
      language: 'Urdu',
      file_url: 'https://archive.org/download/SahihBukhariUrduComplete/Sahih-Bukhari.pdf',
      external_read_url: 'https://archive.org/details/SahihBukhariUrduComplete',
      publication_details: 'Zia-ul-Quran Publications, Lahore',
      allow_download: 1,
      is_published: 1
    },
    {
      id: 'bk_mishkat_masabih',
      title: 'Mishkat al-Masabih (Urdu Sharah)',
      author_name: 'Imam Khatib Tabrizi',
      category_id: 'bcat-hadees',
      cover_image: 'https://images.unsplash.com/photo-1532012164546-f432f2e3777f?auto=format&fit=crop&w=600&q=80',
      description: 'Darse Nizami me dakhil Hadees Sharif ka maroof tareen wa jame tareen majmua.',
      language: 'Urdu',
      file_url: 'https://archive.org/download/MishkatUlMasabihUrdu/Mishkat.pdf',
      external_read_url: 'https://archive.org/details/MishkatUlMasabihUrdu',
      publication_details: 'Farid Book Stall, Lahore',
      allow_download: 1,
      is_published: 1
    },
    {
      id: 'bk_bahar_e_shariat',
      title: 'Bahar-e-Shariat (Mukammal Jildat)',
      author_name: 'Sadrush Shariah Mufti Amjad Ali Azmi',
      category_id: 'bcat-fiqh',
      cover_image: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80',
      description: 'Hanafi Fiqh ka azeem tareen daera-e-maarif aur aam feham sharie rehnumai.',
      language: 'Urdu',
      file_url: 'https://archive.org/download/BaharEShariatMukammal/Bahar-e-Shariat.pdf',
      external_read_url: 'https://archive.org/details/BaharEShariatMukammal',
      publication_details: 'Maktaba-tul-Madina, Karachi',
      allow_download: 1,
      is_published: 1
    },
    {
      id: 'bk_qanun_e_shariat',
      title: 'Qanun-e-Shariat',
      author_name: 'Qazi Shams-ud-Din Ahmad Jafari',
      category_id: 'bcat-fiqh',
      cover_image: 'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?auto=format&fit=crop&w=600&q=80',
      description: 'Rozmarrah ke sharie masail, taharat, namaz, roza, zakat wa hajj ki aasan aur mustanad kitab.',
      language: 'Urdu',
      file_url: 'https://archive.org/download/QanunEShariatUrdu/Qanun-e-Shariat.pdf',
      external_read_url: 'https://archive.org/details/QanunEShariatUrdu',
      publication_details: 'Razavi Kitab Ghar, Delhi',
      allow_download: 1,
      is_published: 1
    },
    {
      id: 'bk_kashf_al_mahjoob',
      title: 'Kashf-ul-Mahjoob (Urdu Tarjuma)',
      author_name: 'Hazrat Data Ganj Bakhsh Ali Hujwiri',
      category_id: 'bcat-tasawwuf',
      cover_image: 'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?auto=format&fit=crop&w=600&q=80',
      description: 'Tasawwuf wa tareeqat ka pehla aur nihayat motabar qadeem risala.',
      language: 'Urdu',
      file_url: 'https://archive.org/download/KashfUlMahjoobUrdu/Kashf-ul-Mahjoob.pdf',
      external_read_url: 'https://archive.org/details/KashfUlMahjoobUrdu',
      publication_details: 'Zia-ul-Quran Publications, Lahore',
      allow_download: 1,
      is_published: 1
    },
    {
      id: 'bk_kimya_e_saadat',
      title: 'Kimya-e-Sa\'adat (Urdu)',
      author_name: 'Hujjat-ul-Islam Imam Muhammad Ghazali',
      category_id: 'bcat-tasawwuf',
      cover_image: 'https://images.unsplash.com/photo-1532012164546-f432f2e3777f?auto=format&fit=crop&w=600&q=80',
      description: 'Nafs ki paakizgi, akhlaq ki durustagi aur qalb ki roohaniyat ka azeem nuskha-e-kimiya.',
      language: 'Urdu',
      file_url: 'https://archive.org/download/KimiyaESaadatUrdu/Kimiya-e-Saadat.pdf',
      external_read_url: 'https://archive.org/details/KimiyaESaadatUrdu',
      publication_details: 'Maktaba-e-Nabawiyya, Lahore',
      allow_download: 1,
      is_published: 1
    },
    {
      id: 'bk_seerat_e_mustafa',
      title: 'Seerat-e-Mustafa ﷺ',
      author_name: 'Allama Abdul Mustafa Azmi',
      category_id: 'bcat-tareekh',
      cover_image: 'https://images.unsplash.com/photo-1532012164546-f432f2e3777f?auto=format&fit=crop&w=600&q=80',
      description: 'Huzoor Sarwar-e-Kainaat ﷺ ki mubarak zindagi par nihayat aam feham aur mustanad kitab.',
      language: 'Urdu',
      file_url: 'https://archive.org/download/SeeratEMustafaByAllamaAbdulMustafaAzmi/Seerat-e-Mustafa.pdf',
      external_read_url: 'https://archive.org/details/SeeratEMustafaByAllamaAbdulMustafaAzmi',
      publication_details: 'Farid Book Stall, Lahore',
      allow_download: 1,
      is_published: 1
    },
    {
      id: 'bk_shamail_tirmidhi',
      title: 'Shama\'il al-Muhammadiyyah (Khasail-e-Nabawi)',
      author_name: 'Imam Abu Isa Muhammad Tirmidhi',
      category_id: 'bcat-tareekh',
      cover_image: 'https://images.unsplash.com/photo-1609599006353-e629aaabfeae?auto=format&fit=crop&w=600&q=80',
      description: 'Aqa Kareem ﷺ ke jism-e-aqdas, libas, guftagu, ibadat aur mubarak adaat ka behtareen bayan.',
      language: 'Urdu',
      file_url: 'https://archive.org/download/ShamailTirmidhiUrdu/Shamail.pdf',
      external_read_url: 'https://archive.org/details/ShamailTirmidhiUrdu',
      publication_details: 'Zia-ul-Quran Publications, Lahore',
      allow_download: 1,
      is_published: 1
    },
    {
      id: 'bk_al_mutaqad',
      title: 'Al-Mutaqad Al-Muntaqad (Aqaid Ahle Sunnat)',
      author_name: 'Imam Fazl-e-Rasool Badayuni',
      category_id: 'bcat-aqeedah',
      cover_image: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=600&q=80',
      description: 'Ahle Sunnat wal Jamaat ke aqaid-e-haqqa par mustanad aur maroof tareen kitab.',
      language: 'Urdu',
      file_url: 'https://archive.org/download/AlMutaqadAlMuntaqad/Al-Mutaqad.pdf',
      external_read_url: 'https://archive.org/details/AlMutaqadAlMuntaqad',
      publication_details: 'Imam Ahmad Raza Academy, Bareilly Sharif',
      allow_download: 1,
      is_published: 1
    },
    {
      id: 'bk_tamheed_ul_iman',
      title: 'Tamheed-ul-Iman Bi Ayat-il-Quran',
      author_name: 'Aala Hazrat Imam Ahmad Raza Khan Barelvi',
      category_id: 'bcat-aqeedah',
      cover_image: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80',
      description: 'Iman ki buniyaad aur Huzoor Aqdas ﷺ ki sachhi mohabbat par mudallal risala.',
      language: 'Urdu',
      file_url: 'https://archive.org/download/TamheedUlIman/Tamheed-ul-Iman.pdf',
      external_read_url: 'https://archive.org/details/TamheedUlIman',
      publication_details: 'Maktaba-tul-Madina, Karachi',
      allow_download: 1,
      is_published: 1
    },
    {
      id: 'bk_dastan_iman_faroshon',
      title: 'Dastan-e-Iman Faroshon Ki (Complete)',
      author_name: 'Al-Tamash',
      category_id: 'bcat-novels',
      cover_image: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=600&q=80',
      description: 'Sultan Salahuddin Ayyubi ke daur-e-hukoomat aur Saleebi jangon par mustanad tareekhi dastan.',
      language: 'Urdu',
      file_url: 'https://archive.org/download/DastanEImanFaroshonKiComplete/Dastan.pdf',
      external_read_url: 'https://archive.org/details/DastanEImanFaroshonKiComplete',
      publication_details: 'Al-Bayan Publications, Lahore',
      allow_download: 1,
      is_published: 1
    },
    {
      id: 'bk_hikayaat_saadi',
      title: 'Hikayaat-e-Saadi (Gulistan wa Bostan)',
      author_name: 'Shaikh Saadi Shirazi',
      category_id: 'bcat-novels',
      cover_image: 'https://images.unsplash.com/photo-1516979187457-637abb4f9353?auto=format&fit=crop&w=600&q=80',
      description: 'Hikmat, danaai, naseehat aur akhlaqiyyat se labrez sabaq aamoz qisse aur kahaniyan.',
      language: 'Urdu',
      file_url: 'https://archive.org/download/HikayaatESaadiUrdu/Hikayaat.pdf',
      external_read_url: 'https://archive.org/details/HikayaatESaadiUrdu',
      publication_details: 'Ferozsons, Lahore',
      allow_download: 1,
      is_published: 1
    }
  ];

  const insertBook = db.prepare(`
    INSERT OR IGNORE INTO books (id, title, author_name, category_id, cover_image, description, language, file_url, external_read_url, publication_details, allow_download, is_published, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
  `);
  for (const b of initialBooks) {
    insertBook.run(b.id, b.title, b.author_name, b.category_id, b.cover_image, b.description, b.language, b.file_url, b.external_read_url, b.publication_details, b.allow_download, b.is_published);
  }

  // Seed INITIAL ARTICLES if empty
  const articlesCount = db.prepare('SELECT count(*) as count FROM articles').get() as { count: number };
  if (articlesCount.count === 0) {
    const initialArticles = [
      {
        id: 'art_shaikh_ul_islam_hayat',
        title: 'Shaikh-ul-Islam Syed Madni Miya Ki Ilmi Wa Deeni Khidmat',
        slug: 'shaikh-ul-islam-syed-madni-miya-ilmi-khidmat',
        category_id: 'acat-shakhsiyat',
        author_name: 'Idara Mishkaat Research Wing',
        featured_image: 'https://images.unsplash.com/photo-1542816417-0983c9c9ad53?auto=format&fit=crop&w=800&q=80',
        excerpt: 'Shaikh-ul-Islam Hazrat Syed Madni Miya Ashrafi ki shakhsiyat, aalam-e-Islam me unka ilmi muqam aur asr-e-hazir me dawat-e-haq ka tajzia.',
        content: `<h3>Muqaddama</h3><p>Aalam-e-Islam ki un mumtaz tareen ilmi wa roohani shakhsiyat me Hazrat Shaikh-ul-Islam Syed Muhammad Madni Miya Ashrafi Al-Jilani ka ism-e-girami sar-e-fehrist hai jinhon ne asr-e-hazir me aqaid-e-Ahle Sunnat ki hifazat aur dawat-o-tableegh me azeem tareen karname sar anjam diye hain.</p><h3>Ilmi Baseerat Wa Tafseer-e-Ashrafi</h3><p>Aap ki azeem tasneef 'Tafseer-e-Ashrafi' fiqr-o-shaoor aur tafseeri adab ka shahkar hai jis me aayat-e-Qurani ke roohani wa asri asbaaq ko nihayat fasahat se bayan kiya gaya hai.</p><h3>Dawat-e-Deen Ka Aalami Safar</h3><p>Dunya bhar me hazaron jalsat wa majalis me aap ke ilmi khitabat ne lakhoon dilon me Ishq-e-Mustafa ﷺ ki shama roshan ki hai.</p>`,
        publication_date: new Date().toISOString().split('T')[0],
        tags: 'Shaikh-ul-Islam, Shakhsiyat, Kichhouchha Sharif, Tafseer',
        is_published: 1
      },
      {
        id: 'art_aqaid_ahle_sunnat_importance',
        title: 'Aqaid-e-Ahle Sunnat Ki Hifazat Aur Hamari Zimedari',
        slug: 'aqaid-e-ahle-sunnat-ki-hifazat',
        category_id: 'acat-tahqeeqi',
        author_name: 'Mufti Muhammad Aslam Misbahi',
        featured_image: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=800&q=80',
        excerpt: 'Sawaad-e-Azam Ahle Sunnat wal Jamaat ka tareekhi tasalsul aur fiqri fitnon ke sad-e-baab ke liye amli iqdamat.',
        content: `<h3>Aqaid Ki Bunyad</h3><p>Iman ki bunyad durust aqeede par hai. Sahaba-e-Kiram, Tabi'een, A'imma-e-Mujtahideen aur Auliya-e-Kamilin ke raste par qayam rehna hi nijaat ki zamanat hai.</p><h3>Fitnon Se Hifazat</h3><p>Maujuda door me digital media aur shobada-bazi ke zarye aqaid par hamle kiye ja rahe hain, jiska ilmi aur mudallal jawab dena har aalim aur nojawan ki zimedari hai.</p>`,
        publication_date: new Date().toISOString().split('T')[0],
        tags: 'Aqaid, Ahle Sunnat, Tahqeeq, Maslak',
        is_published: 1
      },
      {
        id: 'art_tasawwuf_rooh_e_islam',
        title: 'Tasawwuf — Islam Ka Roohani Nizam Aur Tehzeeb-e-Nafs',
        slug: 'tasawwuf-islam-ka-roohani-nizam',
        category_id: 'acat-islamic',
        author_name: 'Mishkaat Scholarly Council',
        featured_image: 'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?auto=format&fit=crop&w=800&q=80',
        excerpt: 'Ihsan aur Tasawwuf ka Quran wa Hadees se suboot aur roohani sukoot ke asbaab par ek jame mazmoon.',
        content: `<h3>Ihsan Ka Maqam</h3><p>Hadees-e-Jibreel me maqam-e-Ihsan ko bayan farmaya gaya: 'Allah ki ibadat is tarah karo jaise use dekh rahe ho'. Yehi Tasawwuf ka asl jauhar hai.</p><h3>Auliya-e-Kiram Ka Tareeqa</h3><p>Khwaja Gareeb Nawaz, Ghaus-e-Azam, aur Data Ganj Bakhsh Alaihimur Rahmah ne is roohani tareeqe se lakhoon logon ko sharaf-e-Islam se musharraf kiya.</p>`,
        publication_date: new Date().toISOString().split('T')[0],
        tags: 'Tasawwuf, Tazkiya, Roohaniyat, Ihsan',
        is_published: 1
      }
    ];

    const insertArticle = db.prepare(`
      INSERT INTO articles (id, title, slug, category_id, author_name, featured_image, excerpt, content, publication_date, tags, is_published, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `);
    for (const a of initialArticles) {
      insertArticle.run(a.id, a.title, a.slug, a.category_id, a.author_name, a.featured_image, a.excerpt, a.content, a.publication_date, a.tags, a.is_published);
    }
  }

  // Seed INITIAL AQWAAL if empty
  const aqwaalCount = db.prepare('SELECT count(*) as count FROM aqwaal').get() as { count: number };
  if (aqwaalCount.count === 0) {
    const initialAqwaal = [
      {
        id: 'q_ilm_amal',
        text: 'العلم بلا عمل كالشجر بلا ثمر — علم بغیر عمل کے ایسا ہے جیسے بے پھل کا درخت۔ بے عمل عالم اس چراغ کی طرح ہے جو دوسروں کو روشنی دیتا ہے مگر خود جل کر راکھ ہو جاتا ہے۔',
        type: 'Aqwaal',
        scholar_id: 'sch-madni-miya',
        attributed_to: 'Hazrat Shaikh-ul-Islam Syed Madni Miya Ashrafi',
        category_id: 'qcat-ilm',
        reference_source: 'Al-Kalam Al-Mufeed',
        image_url: null,
        is_published: 1
      },
      {
        id: 'q_ishq_rasool',
        text: 'محبت رسول ﷺ کے بغیر نہ ایمان مکمل ہوتا ہے اور نہ ہی کوئی نیکی بارگاہ الٰہی میں شرف قبولیت پاتی ہے۔ عشق رسول ﷺ ہر مومن کی روح کی غذا ہے۔',
        type: 'Nasihat',
        scholar_id: 'sch-hashmi-miya',
        attributed_to: 'Gazi-e-Millat Hazrat Syed Hashmi Miya Ashrafi',
        category_id: 'qcat-rohaniyat',
        reference_source: 'Khutbaat-e-Hashmi',
        image_url: null,
        is_published: 1
      },
      {
        id: 'q_sabr_hikmat',
        text: 'مصیبت کے وقت صبر کرنا عبادت ہے اور شکوہ و شکایت ایمان کی کمزوری کی علامت ہے۔ إنَّ مَعَ العُسْرِ يُسْرًا (بے شک ہر تنگی کے ساتھ آسانی ہے)۔',
        type: 'Nasihat',
        scholar_id: 'sch-ameen-qadri',
        attributed_to: 'Hazrat Allama Syed Ameen Ul Qadri',
        category_id: 'qcat-sabr',
        reference_source: 'Islahi Majalis',
        image_url: null,
        is_published: 1
      }
    ];

    const insertAqwaal = db.prepare(`
      INSERT INTO aqwaal (id, text, type, scholar_id, attributed_to, category_id, reference_source, image_url, is_published, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `);
    for (const q of initialAqwaal) {
      insertAqwaal.run(q.id, q.text, q.type, q.scholar_id, q.attributed_to, q.category_id, q.reference_source, q.image_url, q.is_published);
    }
  }

  // Seed INITIAL SHAYARIYAN if empty
  const shayariyanCount = db.prepare('SELECT count(*) as count FROM shayariyan').get() as { count: number };
  if (shayariyanCount.count === 0) {
    const initialShayari = [
      {
        id: 'sh_subha_taiba',
        title: 'صبح طیبہ میں ہوئی بٹتا ہے باڑہ نور کا',
        poet_name: 'Aala Hazrat Imam Ahmad Raza Khan Barelvi',
        poet_image: null,
        poetry_text: 'صبح طیبہ میں ہوئی بٹتا ہے باڑہ نور کا\nصدقہ لینے نور کا آیا ہے تارا نور کا\n\nSubha Taiba Me Hui Bat-ta Hai Baara Noor Ka\nSadqa Lene Noor Ka Aaya Hai Taara Noor Ka',
        sharah: 'اس مطلع میں اعلیٰ حضرت علیہ الرحمہ فرماتے ہیں کہ جب مدینہ منورہ کی مبارک صبح طلوع ہوتی ہے تو ہر طرف سرکار دو عالم ﷺ کا نور تقسیم ہوتا ہے، یہاں تک کہ آسمان کا چمکتا ہوا تارا بھی اس نور کا صدقہ لینے زمین پر جھکتا ہے۔',
        category: 'Naat Sharif',
        language: 'Urdu',
        publication_date: new Date().toISOString().split('T')[0],
        is_featured: 1,
        is_published: 1
      },
      {
        id: 'sh_kaaba_ke_badrudduja',
        title: 'کعبے کے بدرالدجیٰ تم پہ کروڑوں درود',
        poet_name: 'Aala Hazrat Imam Ahmad Raza Khan Barelvi',
        poet_image: null,
        poetry_text: 'کعبے کے بدرالدجیٰ تم پہ کروڑوں درود\nطیبہ کے شمس الضحیٰ تم پہ کروڑوں درود\n\nKaabe Ke Badrudduja Tum Pe Karoron Durood\nTaiba Ke Shamsudduha Tum Pe Karoron Durood',
        sharah: 'حضور نبی کریم ﷺ کی شان اقدس میں درود و سلام کا نذرانہ، جس میں آپ کو کعبہ کا چودھویں کا چاند اور مدینہ منورہ کا چمکتا ہوا سورج قرار دیا گیا ہے۔',
        category: 'Salam Sharif',
        language: 'Urdu',
        publication_date: new Date().toISOString().split('T')[0],
        is_featured: 1,
        is_published: 1
      }
    ];

    const insertShayari = db.prepare(`
      INSERT INTO shayariyan (id, title, poet_name, poet_image, poetry_text, sharah, category, language, publication_date, is_featured, is_published, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `);
    for (const sh of initialShayari) {
      insertShayari.run(sh.id, sh.title, sh.poet_name, sh.poet_image, sh.poetry_text, sh.sharah, sh.category, sh.language, sh.publication_date, sh.is_featured, sh.is_published);
    }
  }
}

// Generate unique secure ID
export function generateId(prefix = 'mish'): string {
  return `${prefix}_${crypto.randomBytes(8).toString('hex')}`;
}
