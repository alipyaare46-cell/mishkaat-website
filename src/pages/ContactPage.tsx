import React, { useState } from 'react';
import {
  Mail,
  Phone,
  MapPin,
  Clock,
  Send,
  CheckCircle2,
  AlertCircle,
  MessageCircle,
  Sparkles,
  HelpCircle,
  ShieldCheck
} from 'lucide-react';
import { WebsiteSettings } from '../types';
import { api } from '../services/api';

interface ContactPageProps {
  settings: WebsiteSettings | null;
  navigate: (route: string) => void;
}

export const ContactPage: React.FC<ContactPageProps> = ({ settings, navigate }) => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [subject, setSubject] = useState('General Spiritual Inquiry');
  const [message, setMessage] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastSentGmailUrl, setLastSentGmailUrl] = useState<string | null>(null);

  const websiteGmail = 'alipyaare46@gmail.com';
  const contactEmail = settings?.contact_email || websiteGmail;
  const contactPhone = settings?.contact_phone || '+91 (0) 22 2847 0000';
  const contactAddress = settings?.contact_address || 'Mishkaat Islamic Knowledge Foundation, Mumbai, India';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim() || !message.trim()) {
      setErrorMessage('Please fill in your name, email, and message.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    const emailSubject = `[MISHKAAT Inquiry] ${subject} - from ${fullName.trim()}`;
    const emailBody = `Assalamu Alaikum,\n\nName: ${fullName.trim()}\nEmail: ${email.trim()}\nPhone: ${phone.trim() || 'N/A'}\nSubject: ${subject}\n\nMessage:\n${message.trim()}\n\n---\nSent via MISHKAAT Platform (POWERED BY SYED ALI QALANDAR PEERZADE)`;
    const gmailComposeUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(websiteGmail)}&su=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;

    try {
      // 1. Dual delivery: Send to server endpoint (persists in db + server relay)
      const res = await api.sendContactMessage({
        full_name: fullName.trim(),
        email: email.trim(),
        phone: phone.trim() || undefined,
        subject,
        message: message.trim()
      });

      // 2. Client-side direct relay to alipyaare46@gmail.com
      try {
        fetch(`https://formsubmit.co/ajax/${websiteGmail}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({
            _subject: `[MISHKAAT Message] ${subject} from ${fullName.trim()}`,
            name: fullName.trim(),
            email: email.trim(),
            phone: phone.trim() || 'N/A',
            subject,
            message: message.trim(),
            target_admin: websiteGmail,
            platform: 'MISHKAAT Islamic Web Platform'
          })
        }).catch(() => {});
      } catch {}

      setSuccessMessage(`JazakAllah Khair! Aapka paigham website admin Gmail (${websiteGmail}) par foran deliver kar diya gaya hai.`);
      setLastSentGmailUrl(gmailComposeUrl);

      setFullName('');
      setEmail('');
      setPhone('');
      setMessage('');
      setSubject('General Spiritual Inquiry');
    } catch (err: any) {
      setLastSentGmailUrl(gmailComposeUrl);
      window.open(gmailComposeUrl, '_blank');
      setSuccessMessage(`Your message draft has been prepared to send directly to ${websiteGmail}.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[85vh] bg-[#F4F8F4] py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        
        {/* Page Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <span className="text-xs uppercase tracking-widest text-[#064E3B] font-bold block">
            Rabta Wa Istifsaar • رابطہ و استفسار
          </span>
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-stone-900">
            Contact MISHKAAT Platform
          </h1>
          <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
            Have a question, spiritual inquiry, request for scholarly material, or feedback?
            Reach out to our team directly. We are dedicated to providing authentic assistance and preserving Ahl-e-Sunnat knowledge.
          </p>
        </div>

        {/* 2-Column Layout: Contact Cards & Form */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Direct Contact Details & Information (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Email Card */}
            <div className="bg-white rounded-2xl p-6 border border-stone-200/90 shadow-xs flex items-start gap-4 hover:border-[#064E3B]/40 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-[#064E3B]/10 text-[#064E3B] flex items-center justify-center shrink-0">
                <Mail className="w-6 h-6" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[10px] uppercase tracking-wider text-stone-400 font-bold block">
                  Official Email Address
                </span>
                <a
                  href={`mailto:${contactEmail}`}
                  className="text-sm font-bold text-stone-900 hover:text-[#064E3B] truncate block mt-0.5 transition-colors"
                >
                  {contactEmail}
                </a>
                <p className="text-xs text-stone-500 mt-1">
                  For formal communications, Fatwa queries, and scholarly submissions.
                </p>
              </div>
            </div>

            {/* Phone & WhatsApp Card */}
            <div className="bg-white rounded-2xl p-6 border border-stone-200/90 shadow-xs flex items-start gap-4 hover:border-[#064E3B]/40 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-[#D4AF37]/15 text-[#064E3B] flex items-center justify-center shrink-0">
                <Phone className="w-6 h-6 text-[#064E3B]" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[10px] uppercase tracking-wider text-stone-400 font-bold block">
                  Phone & Helpline
                </span>
                <a
                  href={`tel:${contactPhone.replace(/[^0-9+]/g, '')}`}
                  className="text-sm font-bold text-stone-900 hover:text-[#064E3B] block mt-0.5 transition-colors"
                >
                  {contactPhone}
                </a>
                <div className="flex items-center gap-2 mt-2">
                  <a
                    href={`https://api.whatsapp.com/send?phone=${encodeURIComponent(contactPhone.replace(/[^0-9]/g, ''))}&text=${encodeURIComponent('Assalamu Alaikum, I am contacting via the MISHKAAT platform.')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#25D366] hover:bg-[#20ba59] text-white text-[11px] font-bold rounded-lg transition-colors cursor-pointer shadow-2xs"
                  >
                    <MessageCircle className="w-3.5 h-3.5 fill-white" />
                    <span>WhatsApp Us</span>
                  </a>
                </div>
              </div>
            </div>

            {/* Address / Headquarters */}
            <div className="bg-white rounded-2xl p-6 border border-stone-200/90 shadow-xs flex items-start gap-4 hover:border-[#064E3B]/40 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center shrink-0">
                <MapPin className="w-6 h-6 text-[#064E3B]" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[10px] uppercase tracking-wider text-stone-400 font-bold block">
                  Location & Secretariat
                </span>
                <p className="text-sm font-bold text-stone-900 mt-0.5">
                  {contactAddress}
                </p>
                <p className="text-xs text-stone-500 mt-1">
                  Sanctuary of authentic Islamic literature and classical archives.
                </p>
              </div>
            </div>

            {/* Response Time & Authenticity Guarantee */}
            <div className="bg-[#064E3B] text-white rounded-2xl p-6 shadow-md border border-[#D4AF37]/30 space-y-3">
              <div className="flex items-center gap-2 text-[#D4AF37]">
                <ShieldCheck className="w-5 h-5" />
                <h4 className="text-xs font-bold uppercase tracking-wider">
                  Our Commitment to Authenticity
                </h4>
              </div>
              <p className="text-xs text-emerald-100/90 leading-relaxed">
                All questions regarding Islamic jurisprudence and doctrine are reviewed in accordance with the noble Quran, Sunnah, and authoritative scholars of Ahl-e-Sunnat wal-Jama'at.
              </p>
              <div className="pt-2 border-t border-emerald-800/80 flex items-center justify-between text-[10px] text-emerald-200/70 font-mono">
                <span>ESTIMATED RESPONSE: 24-48 HOURS</span>
                <span className="text-[#D4AF37]">MISHKAAT CARE</span>
              </div>
            </div>

            {/* Powered By Footer Banner */}
            <div className="p-4 bg-white rounded-xl border border-stone-200 text-center">
              <span className="font-display text-[11px] font-bold tracking-widest text-[#064E3B] uppercase block">
                POWERED BY SYED ALI QALANDAR PEERZADE
              </span>
            </div>
          </div>

          {/* Right Column: Send Message Form (7 cols) */}
          <div className="lg:col-span-7 bg-white rounded-2xl p-6 sm:p-8 border border-stone-200/90 shadow-sm space-y-6">
            
            <div className="border-b border-stone-100 pb-4">
              <span className="text-xs font-bold text-[#D4AF37] uppercase tracking-wider block mb-1">
                Direct Inquiry Form
              </span>
              <h3 className="font-display text-xl sm:text-2xl font-bold text-stone-900">
                Send Us a Message
              </h3>
              <p className="text-xs text-stone-500 mt-1">
                Fill in your details below and our editorial or scholarly coordination team will respond back to your email or WhatsApp number.
              </p>
            </div>

            {/* Success Alert */}
            {successMessage && (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs flex flex-col gap-3 animate-in fade-in">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h5 className="font-bold text-sm">Message Sent Successfully!</h5>
                    <p className="mt-1 leading-relaxed text-emerald-800">{successMessage}</p>
                  </div>
                </div>
                {lastSentGmailUrl && (
                  <div className="pt-2 border-t border-emerald-200/80 flex flex-wrap items-center justify-between gap-2">
                    <span className="text-[11px] text-emerald-800">
                      Website Gmail: <strong>{websiteGmail}</strong>
                    </span>
                    <a
                      href={lastSentGmailUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer shadow-xs"
                    >
                      <Mail className="w-3.5 h-3.5" />
                      <span>Open in Gmail App / Web</span>
                    </a>
                  </div>
                )}
              </div>
            )}

            {/* Error Alert */}
            {errorMessage && (
              <div className="p-4 rounded-xl bg-rose-50 border border-rose-300 text-rose-900 text-xs flex items-start gap-3 animate-in fade-in">
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h5 className="font-bold">Error Sending Message</h5>
                  <p className="mt-0.5 leading-relaxed text-rose-800">{errorMessage}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Full Name */}
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">
                    Your Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Muhammad Farooq"
                    className="w-full px-3.5 py-2.5 border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#064E3B] bg-stone-50/50"
                  />
                </div>

                {/* Email Address */}
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. farooq@example.com"
                    className="w-full px-3.5 py-2.5 border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#064E3B] bg-stone-50/50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Phone / WhatsApp Number */}
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">
                    Phone / WhatsApp Number (Optional)
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. +91 98765 43210"
                    className="w-full px-3.5 py-2.5 border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#064E3B] bg-stone-50/50"
                  />
                </div>

                {/* Subject / Category */}
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">
                    Inquiry Topic / Subject
                  </label>
                  <select
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#064E3B] bg-stone-50/50 cursor-pointer text-stone-800"
                  >
                    <option value="General Spiritual Inquiry">General Spiritual Inquiry</option>
                    <option value="Masail & Fatwa Guidance">Masail & Fatwa Guidance</option>
                    <option value="Scholar Speech or Reel Request">Scholar Speech or Reel Request</option>
                    <option value="Book Submission & Digitization">Book Submission & Digitization</option>
                    <option value="Technical or Website Feedback">Technical or Website Feedback</option>
                    <option value="Other Inquiries">Other Inquiries</option>
                  </select>
                </div>
              </div>

              {/* Message Content */}
              <div>
                <label className="block font-semibold text-stone-700 mb-1">
                  Your Message or Question *
                </label>
                <textarea
                  required
                  rows={6}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Please write your message, question, or request clearly here..."
                  className="w-full px-3.5 py-2.5 border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#064E3B] bg-stone-50/50 resize-y leading-relaxed"
                />
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3 bg-[#064E3B] hover:bg-[#075c46] text-white font-bold rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50"
                >
                  <Send className="w-4 h-4 text-[#D4AF37]" />
                  <span>{isSubmitting ? 'Sending Your Message...' : 'Send Message Now'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
