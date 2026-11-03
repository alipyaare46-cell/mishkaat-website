import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Download, Smartphone, Laptop, Check, X, Share, ExternalLink, Copy } from 'lucide-react';
import emblemImg from '../assets/images/mishkaat_brand_emblem_1793182102461.jpg';

interface PwaInstallButtonProps {
  variant?: 'header' | 'banner' | 'menu';
}

export const PwaInstallButton: React.FC<PwaInstallButtonProps> = ({ variant = 'header' }) => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showInstallModal, setShowInstallModal] = useState(false);
  const [isBannerDismissed, setIsBannerDismissed] = useState(false);

  useEffect(() => {
    // Check if already launched in standalone mode
    if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone) {
      setIsInstalled(true);
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handler);

    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      setShowInstallModal(false);
    });

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = async () => {
    // Always open modal so the user gets immediate visual response
    setShowInstallModal(true);

    if (deferredPrompt) {
      try {
        deferredPrompt.prompt();
        const choiceResult = await deferredPrompt.userChoice;
        if (choiceResult && choiceResult.outcome === 'accepted') {
          setIsInstalled(true);
        }
        setDeferredPrompt(null);
      } catch (err) {
        console.warn('Native install prompt deferred:', err);
      }
    }
  };

  if (isInstalled) {
    return null;
  }

  return (
    <>
      {variant === 'header' && (
        <button
          onClick={handleInstallClick}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-stone-950 bg-gradient-to-r from-[#D4AF37] to-[#F3E5AB] hover:from-[#e0bc46] hover:to-[#ebd48a] rounded-md transition-all shadow-sm cursor-pointer active:scale-95 whitespace-nowrap"
          title="Install / Download MISHKAAT App on your device (ایپ ڈاؤن لوڈ کریں)"
        >
          <Download className="w-3.5 h-3.5 text-stone-950" />
          <span className="hidden sm:inline">Install App</span>
          <span className="sm:hidden">App</span>
        </button>
      )}

      {variant === 'menu' && (
        <button
          onClick={handleInstallClick}
          className="w-full flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-[#064E3B] to-[#043327] border border-[#D4AF37]/40 text-white font-semibold text-xs transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#D4AF37] text-stone-950 flex items-center justify-center font-bold">
              <Download className="w-4 h-4" />
            </div>
            <div className="text-left">
              <p className="font-bold text-white leading-tight">Install Mishkaat App</p>
              <p className="text-[10px] text-emerald-200">موبائل ایپ مفت انسٹال کریں</p>
            </div>
          </div>
          <span className="px-2.5 py-1 bg-[#D4AF37] text-stone-950 rounded-md text-[10px] font-bold">
            Download
          </span>
        </button>
      )}

      {variant === 'banner' && !isBannerDismissed && (
        <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:w-96 z-40 bg-stone-900/95 text-white border border-[#D4AF37]/50 rounded-2xl p-3.5 shadow-2xl backdrop-blur-md animate-in slide-in-from-bottom duration-300">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <img
                src={emblemImg}
                alt="Mishkaat Icon"
                className="w-11 h-11 rounded-xl object-cover border border-[#D4AF37]/60 shadow-sm shrink-0"
              />
              <div>
                <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                  <span>MISHKAAT App</span>
                  <span className="px-1.5 py-0.2 bg-[#D4AF37]/20 text-[#D4AF37] rounded text-[9px] font-semibold border border-[#D4AF37]/30">
                    PWA
                  </span>
                </h4>
                <p className="text-[11px] text-stone-300 mt-0.5 leading-snug">
                  Download for offline reading & automatic updates.
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsBannerDismissed(true)}
              className="text-stone-400 hover:text-white p-1 rounded-md cursor-pointer"
              aria-label="Dismiss banner"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="mt-3 flex items-center justify-end gap-2 pt-2 border-t border-white/10">
            <button
              onClick={() => setIsBannerDismissed(true)}
              className="px-2.5 py-1 text-stone-400 hover:text-white text-xs cursor-pointer"
            >
              Later
            </button>
            <button
              onClick={handleInstallClick}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-[#D4AF37] hover:bg-[#e6c148] text-stone-950 text-xs font-bold transition-colors cursor-pointer shadow-sm"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Install App (ڈاؤن لوڈ کریں)</span>
            </button>
          </div>
        </div>
      )}

      {/* Visual Universal Installation Modal */}
      {showInstallModal && (
        <InstallGuideModal
          deferredPrompt={deferredPrompt}
          onPromptNative={() => {
            if (deferredPrompt) {
              deferredPrompt.prompt();
              setShowInstallModal(false);
            }
          }}
          onClose={() => setShowInstallModal(false)}
        />
      )}
    </>
  );
};

interface InstallGuideModalProps {
  deferredPrompt: any;
  onPromptNative: () => void;
  onClose: () => void;
}

function InstallGuideModal({ deferredPrompt, onPromptNative, onClose }: InstallGuideModalProps) {
  const detectPlatform = (): 'android' | 'ios' | 'pc' => {
    if (typeof window === 'undefined') return 'android';
    const ua = window.navigator.userAgent.toLowerCase();
    if (/iphone|ipad|ipod/.test(ua)) return 'ios';
    if (/android/.test(ua)) return 'android';
    return 'android'; // default friendly mobile tab
  };

  const [activeTab, setActiveTab] = useState<'android' | 'ios' | 'pc'>(detectPlatform());
  const [copiedLink, setCopiedLink] = useState(false);

  const handleCopy = () => {
    try {
      navigator.clipboard.writeText(window.location.origin);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    } catch {}
  };

  const modalContent = (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-[999999] flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div className="bg-stone-900 text-white rounded-2xl shadow-2xl border border-[#D4AF37]/50 p-5 sm:p-6 max-w-md w-full space-y-4 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3.5">
          <div className="flex items-center gap-3">
            <img
              src={emblemImg}
              alt="Mishkaat Logo"
              className="w-11 h-11 rounded-xl object-cover border border-[#D4AF37]/60 shadow-md shrink-0"
            />
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-1.5">
                <span>MISHKAAT App Install</span>
                <span className="px-1.5 py-0.2 bg-[#D4AF37]/20 text-[#D4AF37] rounded text-[9px] font-bold border border-[#D4AF37]/30">
                  PWA
                </span>
              </h3>
              <p className="text-[11px] text-[#D4AF37]">موبائل یا کمپیوٹر پر براہ راست انسٹال کریں</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-white rounded-lg hover:bg-stone-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 1-Click Native Install Prompt if available */}
        {deferredPrompt && (
          <div className="bg-[#064E3B]/60 border border-emerald-500/60 p-3.5 rounded-xl text-center space-y-2.5">
            <p className="text-xs text-emerald-100 font-semibold">
              ✨ آپ کا براؤزر ڈائریکٹ انسٹال سپورٹ کرتا ہے!
            </p>
            <button
              onClick={onPromptNative}
              className="w-full py-2.5 px-4 bg-gradient-to-r from-[#D4AF37] to-[#F3E5AB] text-stone-950 font-bold text-xs rounded-xl shadow-lg hover:brightness-105 active:scale-95 cursor-pointer flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4 text-stone-950" />
              <span>فوراً ہوم اسکرین پر انسٹال کریں (Install Now)</span>
            </button>
          </div>
        )}

        {/* Platform Tabs Selector */}
        <div className="flex items-center gap-1 p-1 bg-stone-850 rounded-xl border border-white/10 bg-stone-800/80">
          <button
            type="button"
            onClick={() => setActiveTab('android')}
            className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'android'
                ? 'bg-[#064E3B] text-white shadow-sm ring-1 ring-emerald-500'
                : 'text-stone-400 hover:text-white'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>Android</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('ios')}
            className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'ios'
                ? 'bg-[#064E3B] text-white shadow-sm ring-1 ring-emerald-500'
                : 'text-stone-400 hover:text-white'
            }`}
          >
            <span>🍏 iPhone</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('pc')}
            className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'pc'
                ? 'bg-[#064E3B] text-white shadow-sm ring-1 ring-emerald-500'
                : 'text-stone-400 hover:text-white'
            }`}
          >
            <Laptop className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>PC / Mac</span>
          </button>
        </div>

        {/* Tab Instructions Content */}
        <div className="bg-stone-800/50 p-4 rounded-xl border border-white/10 space-y-3">
          {activeTab === 'android' && (
            <div className="space-y-2.5 text-xs text-stone-200">
              <span className="font-bold text-[#D4AF37] block">
                Android Chrome میں انسٹال کرنے کا طریقہ:
              </span>
              <ol className="list-decimal pl-5 space-y-2 leading-relaxed text-stone-300">
                <li>
                  گوگل کروم (Chrome) میں اوپر دائیں جانب موجود <strong className="text-white">تین نقطوں والے مینو (⋮)</strong> پر ٹیپ کریں۔
                </li>
                <li>
                  مینو میں سے <strong className="text-[#D4AF37]">"Install app"</strong> یا <strong className="text-[#D4AF37]">"Add to Home screen"</strong> منتخب کریں۔
                </li>
                <li>
                  سامنے آنے والی ونڈو میں <strong className="text-emerald-400">Install</strong> پر کلک کریں۔ ایپ آپ کے موبائل کی ہوم اسکرین پر ظاہر ہو جائے گی۔
                </li>
              </ol>
            </div>
          )}

          {activeTab === 'ios' && (
            <div className="space-y-2.5 text-xs text-stone-200">
              <span className="font-bold text-[#D4AF37] block">
                iPhone / iPad Safari میں انسٹال کرنے کا طریقہ:
              </span>
              <ol className="list-decimal pl-5 space-y-2 leading-relaxed text-stone-300">
                <li>
                  ایپل سفاری (Safari) کے نیچے درمیان میں موجود <span className="text-sky-400 font-bold inline-flex items-center gap-1"><Share className="w-3.5 h-3.5 inline" /> Share</span> آئیکن پر ٹیپ کریں۔
                </li>
                <li>
                  تھوڑا نیچے اسکرول کر کے <strong className="text-[#D4AF37]">"Add to Home Screen" (ہوم اسکرین پر شامل کریں)</strong> پر ٹیپ کریں۔
                </li>
                <li>
                  اوپر دائیں جانب <strong className="text-emerald-400">Add</strong> دبائیں۔ مشکوٰۃ ایپ فورا آپ کے آئی فون پر انسٹال ہو جائے گی!
                </li>
              </ol>
            </div>
          )}

          {activeTab === 'pc' && (
            <div className="space-y-2.5 text-xs text-stone-200">
              <span className="font-bold text-[#D4AF37] block">
                کمپیوٹر (Chrome / Edge) پر انسٹال کرنے کا طریقہ:
              </span>
              <ol className="list-decimal pl-5 space-y-2 leading-relaxed text-stone-300">
                <li>
                  براؤزر کے اوپر ایڈریس بار (جہاں ویب سائٹ کا نام لکھا ہوتا ہے) کے دائیں جانب دیکھیں۔
                </li>
                <li>
                  وہاں موجود <strong className="text-[#D4AF37]">Install Icon (⊕ یا کمپیوٹر نما آئیکن)</strong> پر کلک کریں۔
                </li>
                <li>
                  پھر <strong className="text-emerald-400">Install</strong> پر کلک کریں، ایپ ڈیسک ٹاپ پر سافٹ ویئر کی طرح انسٹال ہو جائے گی۔
                </li>
              </ol>
            </div>
          )}

          {/* Copy URL fallback */}
          <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs">
            <span className="text-stone-400 text-[11px]">ویب سائٹ کا لنک کاپی کریں:</span>
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 px-3 py-1 bg-stone-700 hover:bg-stone-600 text-stone-200 rounded-lg text-xs font-semibold cursor-pointer transition-colors"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-[#D4AF37]" />}
              <span>{copiedLink ? 'Copied!' : 'Copy Link'}</span>
            </button>
          </div>
        </div>

        {/* Feature badge */}
        <div className="p-3 bg-[#064E3B]/30 rounded-xl border border-emerald-500/30 text-[11px] text-emerald-100 flex items-start gap-2">
          <Check className="w-4 h-4 text-[#D4AF37] shrink-0 mt-0.5" />
          <span>
            <strong>Automatic Realtime Updates:</strong> جیسے ہی ایڈمن کی جانب سے کوئی بھی نئی ویڈیو، تقریر، کتاب یا شعر شامل کیا جائے گا، انسٹال شدہ ایپ خود بخود تازہ مواد کو اپڈیٹ کر لے گی!
          </span>
        </div>

        <button
          onClick={onClose}
          className="w-full py-2.5 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-xl text-xs font-bold cursor-pointer transition-colors"
        >
          Close / بند کریں
        </button>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : modalContent;
}
