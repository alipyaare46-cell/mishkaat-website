import React from 'react';
import { Mail, Phone, MapPin, Shield } from 'lucide-react';
import { WebsiteSettings } from '../types';
import { useLanguage } from '../context/LanguageContext';

interface FooterProps {
  settings: WebsiteSettings | null;
  navigate: (route: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ settings, navigate }) => {
  const currentYear = new Date().getFullYear();
  const { t, language } = useLanguage();

  const handleLink = (route: string) => {
    navigate(route);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-[#05382b] text-emerald-100/90 border-t border-emerald-900/60 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 pb-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          
          {/* Brand & Mission */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <img
                src="/assets/aistudio/Mishkaat_Emerald_Gold_Emblem_2c4210f5.png"
                alt="Mishkaat Logo"
                referrerPolicy="no-referrer"
                className="w-11 h-11 rounded-lg bg-white object-contain p-0.5 border border-[#D4AF37]/70 shadow-sm shrink-0"
              />
              <span className="font-display text-2xl font-bold tracking-wider text-[#D4AF37]">
                MISHKAAT
              </span>
            </div>
            <p className="text-xs leading-relaxed text-emerald-200/80">
              {language === 'en' ? (settings?.about_text ||
                'Mishkaat is a sacred knowledge repository curating authentic Ahl-e-Sunnat scholarly addresses, classical manuscripts, contemporary research, spiritual maxims, and devotional poetry.')
                : t.welcomeDesc}
            </p>
            <div className="pt-2 text-xs text-emerald-300/80 italic font-serif">
              "{settings?.footer_tagline || 'Illuminating Hearts with Authentic Islamic Knowledge and Ahl-e-Sunnat Heritage.'}"
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-xs uppercase tracking-widest text-[#D4AF37] font-semibold mb-4">
              {language === 'ur' ? 'مرکزِ علوم' : language === 'ar' ? 'أقسام المنصة' : 'Knowledge Hub'}
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button
                  onClick={() => handleLink('home')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  {t.home}
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleLink('speeches')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  {t.speeches}
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleLink('reels')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  {t.reels}
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleLink('books')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  {t.books}
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleLink('articles')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  {t.articles}
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleLink('aqwaal')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  {t.aqwaal}
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleLink('shayariyan')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  {t.shayariyan}
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleLink('contact')}
                  className="hover:text-white transition-colors cursor-pointer text-[#D4AF37] font-semibold"
                >
                  {t.contact}
                </button>
              </li>
            </ul>

          </div>

          {/* Content Disciplines */}
          <div>
            <h4 className="text-xs uppercase tracking-widest text-[#D4AF37] font-semibold mb-4">
              Scholarly Branches
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button
                  onClick={() => handleLink('speeches')}
                  className="hover:text-white transition-colors cursor-pointer text-left"
                >
                  Islahi Taqreer (Moral Sermons)
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleLink('speeches')}
                  className="hover:text-white transition-colors cursor-pointer text-left"
                >
                  Ilmi Taqreer (Academic Discourses)
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleLink('books')}
                  className="hover:text-white transition-colors cursor-pointer text-left"
                >
                  Tafseer, Hadees & Fiqh
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleLink('books')}
                  className="hover:text-white transition-colors cursor-pointer text-left"
                >
                  Tasawwuf & Tareekh
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleLink('articles')}
                  className="hover:text-white transition-colors cursor-pointer text-left"
                >
                  Tahqeeqi & Shakhsiyat
                </button>
              </li>
            </ul>
          </div>

          {/* Contact Information (Configurable by Admin) */}
          <div className="space-y-4">
            <h4 className="text-xs uppercase tracking-widest text-[#D4AF37] font-semibold">
              Contact & Inquiries
            </h4>
            <div className="space-y-2.5 text-xs">
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-[#D4AF37] shrink-0 mt-0.5" />
                <span className="leading-relaxed">
                  {settings?.contact_address || 'Mishkaat Islamic Knowledge Foundation, Mumbai, India'}
                </span>
              </div>
              <div className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-[#D4AF37] shrink-0" />
                <a
                  href={`mailto:${settings?.contact_email || 'contact@mishkaat.org'}`}
                  className="hover:text-white transition-colors"
                >
                  {settings?.contact_email || 'contact@mishkaat.org'}
                </a>
              </div>
              <div className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-[#D4AF37] shrink-0" />
                <span>{settings?.contact_phone || '+91 (0) 22 2847 0000'}</span>
              </div>
            </div>

            <div className="pt-2 flex flex-col gap-2">
              <button
                onClick={() => handleLink('contact')}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-[#D4AF37] hover:bg-[#e0bc46] text-stone-950 font-bold text-xs rounded-lg transition-colors cursor-pointer shadow-xs"
              >
                <Mail className="w-3.5 h-3.5" />
                <span>Send Us a Message (Rabta)</span>
              </button>
              <button
                onClick={() => handleLink('admin')}
                className="inline-flex items-center gap-1.5 text-[11px] text-emerald-300/80 hover:text-[#D4AF37] transition-colors cursor-pointer pt-1"
              >
                <Shield className="w-3 h-3" />
                <span>Administrator Authentication</span>
              </button>
            </div>
          </div>
        </div>

        {/* Lower Divider & Legal */}
        <div className="mt-12 pt-6 border-t border-emerald-900/80 flex flex-col md:flex-row items-center justify-between gap-4 text-[11px] text-emerald-300/70">
          <div className="space-y-1.5 text-center md:text-left">
            <div>
              © {currentYear} MISHKAAT Platform. All rights reserved. Ahl-e-Sunnat Heritage.
            </div>
            <div className="font-display tracking-widest text-[#D4AF37] font-bold text-xs uppercase">
              POWERED BY SYED ALI QALANDAR PEERZADE
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="hover:text-emerald-100 transition-colors cursor-pointer">
              Privacy Policy
            </span>
            <span aria-hidden="true">·</span>
            <span className="hover:text-emerald-100 transition-colors cursor-pointer">
              Terms of Use
            </span>
            <span aria-hidden="true">·</span>
            <span className="hover:text-emerald-100 transition-colors cursor-pointer">
              Copyright & Attribution Guidelines
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};
