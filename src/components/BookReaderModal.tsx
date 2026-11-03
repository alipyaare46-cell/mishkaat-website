import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  X,
  BookOpen,
  Download,
  Maximize2,
  Minimize2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Info,
  Bookmark,
  Share2,
  FileText,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertCircle,
  Highlighter,
  Trash2,
  Copy,
  Check,
  Plus
} from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';
import { Book } from '../types';
import { useUserAuth } from '../context/UserAuthContext';
import { ShareModal } from './ShareModal';

// Configure PDF.js worker using matching cdnjs build
if (typeof window !== 'undefined' && pdfjsLib.GlobalWorkerOptions) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version || '4.10.38'}/pdf.worker.min.mjs`;
}

export interface BookStudyNote {
  id: string;
  pageNumber: number;
  color: 'gold' | 'emerald' | 'blue' | 'rose';
  highlightSnippet?: string;
  noteText: string;
  createdAt: string;
}

interface BookReaderModalProps {
  book: Book | null;
  onClose: () => void;
}

export const BookReaderModal: React.FC<BookReaderModalProps> = ({ book, onClose }) => {
  const { user, isBookmarked, toggleBookmark, openAuthModal } = useUserAuth();

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [showInfoSidebar, setShowInfoSidebar] = useState(false);
  const [showNotesDrawer, setShowNotesDrawer] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);

  // Study Notes & Highlights State
  const [notes, setNotes] = useState<BookStudyNote[]>([]);
  const [newNoteText, setNewNoteText] = useState('');
  const [newSnippet, setNewSnippet] = useState('');
  const [selectedColor, setSelectedColor] = useState<'gold' | 'emerald' | 'blue' | 'rose'>('gold');
  const [notesFilter, setNotesFilter] = useState<'all' | 'page'>('all');
  const [copiedNoteId, setCopiedNoteId] = useState<string | null>(null);

  // PDF.js State
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [jumpPageInput, setJumpPageInput] = useState<string>('1');
  const [isLoadingPdf, setIsLoadingPdf] = useState<boolean>(true);
  const [pdfError, setPdfError] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const renderTaskRef = useRef<any>(null);

  const pdfUrl = book?.file_url || book?.external_read_url;

  // Load PDF Document via PDF.js directly inside website
  useEffect(() => {
    if (!book || !pdfUrl) {
      setIsLoadingPdf(false);
      setPdfDoc(null);
      setNumPages(0);
      return;
    }

    let isMounted = true;
    setIsLoadingPdf(true);
    setPdfError(null);
    setCurrentPage(1);
    setJumpPageInput('1');

    let loadingTask: any = null;
    try {
      loadingTask = pdfjsLib.getDocument({
        url: pdfUrl,
        cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/cmaps/',
        cMapPacked: true
      });

      loadingTask.promise
        .then((loadedDoc: any) => {
          if (!isMounted) return;
          setPdfDoc(loadedDoc);
          setNumPages(loadedDoc.numPages);
          setIsLoadingPdf(false);
        })
        .catch((err: any) => {
          if (!isMounted) return;
          console.warn('PDF.js loading warning:', err);
          setPdfError('Unable to render PDF directly in this browser. You can download the book file below to read on your device.');
          setIsLoadingPdf(false);
        });
    } catch (err) {
      console.warn('PDF.js task creation error:', err);
      setPdfError('Unable to render PDF directly in this browser. You can download the book file below to read on your device.');
      setIsLoadingPdf(false);
    }

    return () => {
      isMounted = false;
      try {
        if (loadingTask) loadingTask.destroy();
      } catch {}
    };
  }, [book?.id, pdfUrl]);

  // Render current page to Canvas
  const renderPage = useCallback(
    async (pageNumber: number) => {
      if (!pdfDoc || !canvasRef.current) return;

      try {
        // Cancel previous render task if active
        if (renderTaskRef.current) {
          try {
            renderTaskRef.current.cancel();
          } catch {}
          renderTaskRef.current = null;
        }

        const page = await pdfDoc.getPage(pageNumber);
        const canvas = canvasRef.current;
        if (!canvas) return;

        const baseScale = zoomLevel / 100;
        // Account for high-DPI displays
        const pixelRatio = window.devicePixelRatio || 1;
        const viewport = page.getViewport({ scale: baseScale * pixelRatio });

        canvas.height = viewport.height;
        canvas.width = viewport.width;
        canvas.style.width = `${viewport.width / pixelRatio}px`;
        canvas.style.height = `${viewport.height / pixelRatio}px`;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const renderContext = {
          canvasContext: ctx,
          viewport
        };

        const task = page.render(renderContext);
        renderTaskRef.current = task;
        await task.promise;
      } catch (err: any) {
        if (err?.name !== 'RenderingCancelledException') {
          console.error('Page render error:', err);
        }
      }
    },
    [pdfDoc, zoomLevel]
  );

  useEffect(() => {
    if (pdfDoc && currentPage >= 1 && currentPage <= numPages) {
      renderPage(currentPage);
      setJumpPageInput(String(currentPage));
    }
  }, [pdfDoc, currentPage, zoomLevel, renderPage, numPages]);

  // Keyboard navigation (Left / Right arrow keys for flipping pages)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === 'n') {
        goToNextPage();
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp' || e.key === 'p') {
        goToPrevPage();
      } else if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const isSaved = book ? isBookmarked('book', book.id) : false;

  const handleSave = async () => {
    if (!book) return;
    if (!user) {
      openAuthModal('signin');
      return;
    }
    await toggleBookmark('book', book.id);
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const handleZoomIn = () => setZoomLevel((z) => Math.min(z + 20, 240));
  const handleZoomOut = () => setZoomLevel((z) => Math.max(z - 20, 60));
  const handleResetZoom = () => setZoomLevel(100);

  const goToPrevPage = () => {
    setCurrentPage((p) => Math.max(1, p - 1));
  };

  const goToNextPage = () => {
    setCurrentPage((p) => Math.min(numPages, p + 1));
  };

  const handleJumpPageSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const pageNum = parseInt(jumpPageInput, 10);
    if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= numPages) {
      setCurrentPage(pageNum);
    } else {
      setJumpPageInput(String(currentPage));
    }
  };

  const goToPage = (p: number) => {
    if (p >= 1 && p <= (numPages || 9999)) {
      setCurrentPage(p);
      setJumpPageInput(String(p));
    }
  };

  // LocalStorage persistence for Study Notes
  const storageKey = book ? `mishkaat_book_notes_${book.id}` : '';

  useEffect(() => {
    if (!storageKey) return;
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        setNotes(JSON.parse(saved));
      } else {
        setNotes([]);
      }
    } catch (e) {
      setNotes([]);
    }
  }, [storageKey]);

  const saveNotesToStorage = (updatedNotes: BookStudyNote[]) => {
    setNotes(updatedNotes);
    if (storageKey) {
      try {
        localStorage.setItem(storageKey, JSON.stringify(updatedNotes));
      } catch (e) {
        console.warn('Could not save notes:', e);
      }
    }
  };

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteText.trim() && !newSnippet.trim()) return;

    const newEntry: BookStudyNote = {
      id: 'note_' + Date.now(),
      pageNumber: currentPage,
      color: selectedColor,
      highlightSnippet: newSnippet.trim() || undefined,
      noteText: newNoteText.trim() || 'Highlighted text reference',
      createdAt: new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      })
    };

    const updated = [newEntry, ...notes];
    saveNotesToStorage(updated);
    setNewNoteText('');
    setNewSnippet('');
  };

  const handleDeleteNote = (id: string) => {
    const updated = notes.filter((n) => n.id !== id);
    saveNotesToStorage(updated);
  };

  const handleCopyNote = (n: BookStudyNote) => {
    const textToCopy = `[${book?.title || 'Kitab'} - Page ${n.pageNumber}]\n${
      n.highlightSnippet ? `"${n.highlightSnippet}"\n` : ''
    }${n.noteText}`;
    navigator.clipboard.writeText(textToCopy);
    setCopiedNoteId(n.id);
    setTimeout(() => setCopiedNoteId(null), 2000);
  };

  const notesForCurrentPage = notes.filter((n) => n.pageNumber === currentPage);
  const displayedNotes = notesFilter === 'page' ? notesForCurrentPage : notes;

  if (!book) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-1 sm:p-4 bg-black/90 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        ref={containerRef}
        className="bg-stone-900 text-white rounded-2xl shadow-2xl border border-white/10 w-full max-w-[98vw] sm:max-w-6xl h-[94vh] flex flex-col overflow-hidden relative"
      >
        {/* Top Navigation & Reader Toolbar */}
        <div className="p-2.5 sm:p-3 bg-stone-900/95 border-b border-white/10 flex items-center justify-between gap-2 text-xs shrink-0 select-none">
          {/* Left: Book Branding & Title */}
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div className="w-8 h-8 rounded-lg bg-[#064E3B] flex items-center justify-center text-[#D4AF37] shrink-0 border border-[#D4AF37]/30 shadow-xs">
              <BookOpen className="w-4 h-4" />
            </div>
            <div className="min-w-0 pr-2">
              <div className="flex items-center gap-2">
                <h3 className="text-xs sm:text-sm font-bold truncate text-white leading-tight">
                  {book.title}
                </h3>
                <span className="hidden md:inline-block px-2 py-0.5 rounded text-[10px] font-semibold bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/30 shrink-0">
                  {book.category_name || 'Kutub'}
                </span>
              </div>
              <p className="text-[11px] text-stone-400 truncate">
                Musannif: <span className="text-stone-300 font-medium">{book.author_name}</span>
                {book.language && ` • ${book.language}`}
              </p>
            </div>
          </div>

          {/* Center: In-Website Page Navigation Controls */}
          {numPages > 0 && (
            <div className="flex items-center gap-1 bg-stone-800/90 rounded-lg p-1 border border-white/10 shrink-0">
              <button
                onClick={goToPrevPage}
                disabled={currentPage <= 1}
                className="p-1 sm:px-2 py-1 rounded text-stone-300 hover:text-white disabled:opacity-40 disabled:hover:text-stone-300 transition-colors cursor-pointer flex items-center gap-0.5 text-xs font-semibold"
                title="Previous Page (Left Arrow)"
              >
                <ChevronLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Prev</span>
              </button>

              <form onSubmit={handleJumpPageSubmit} className="flex items-center gap-1 px-1">
                <input
                  type="text"
                  value={jumpPageInput}
                  onChange={(e) => setJumpPageInput(e.target.value)}
                  onBlur={() => setJumpPageInput(String(currentPage))}
                  className="w-10 sm:w-12 text-center bg-stone-900 border border-white/20 rounded py-0.5 text-xs text-white font-mono focus:outline-none focus:border-[#D4AF37]"
                />
                <span className="text-stone-400 font-mono text-[11px]">
                  / {numPages}
                </span>
              </form>

              <button
                onClick={goToNextPage}
                disabled={currentPage >= numPages}
                className="p-1 sm:px-2 py-1 rounded text-stone-300 hover:text-white disabled:opacity-40 disabled:hover:text-stone-300 transition-colors cursor-pointer flex items-center gap-0.5 text-xs font-semibold"
                title="Next Page (Right Arrow)"
              >
                <span className="hidden sm:inline">Next</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Right: Zoom, Save, Download, Info, Close Controls */}
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            {/* Zoom Controls */}
            {numPages > 0 && (
              <div className="hidden sm:flex items-center bg-stone-800 rounded-lg border border-white/10 px-1 py-0.5">
                <button
                  onClick={handleZoomOut}
                  className="p-1 text-stone-400 hover:text-white transition-colors cursor-pointer"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <span className="px-1 text-[11px] font-mono text-stone-300 min-w-[38px] text-center">
                  {zoomLevel}%
                </span>
                <button
                  onClick={handleZoomIn}
                  className="p-1 text-stone-400 hover:text-white transition-colors cursor-pointer"
                  title="Zoom In"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
                {zoomLevel !== 100 && (
                  <button
                    onClick={handleResetZoom}
                    className="p-1 text-stone-400 hover:text-white transition-colors cursor-pointer ml-1"
                    title="Reset Zoom to 100%"
                  >
                    <RotateCcw className="w-3 h-3" />
                  </button>
                )}
              </div>
            )}

            {/* Highlights & Study Notes Toggle Button */}
            <button
              onClick={() => {
                setShowNotesDrawer(!showNotesDrawer);
                if (showInfoSidebar) setShowInfoSidebar(false);
              }}
              className={`px-2 sm:px-2.5 py-1.5 rounded-lg border transition-all cursor-pointer flex items-center gap-1.5 text-xs font-semibold ${
                showNotesDrawer
                  ? 'bg-[#064E3B] text-white border-emerald-500 shadow-md ring-1 ring-emerald-400'
                  : 'bg-stone-800 border-white/10 text-stone-300 hover:text-white hover:bg-stone-700'
              }`}
              title="Kitab Ke Hawashi Aur Notes (حواشی و نوٹس)"
            >
              <Highlighter className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span className="hidden sm:inline">Notes</span>
              {notes.length > 0 && (
                <span className="ml-0.5 px-1.5 py-0.2 bg-[#D4AF37] text-stone-950 text-[10px] font-black rounded-full shadow-xs">
                  {notes.length}
                </span>
              )}
            </button>

            {/* Save to Bookshelf */}
            <button
              onClick={handleSave}
              className={`p-2 rounded-lg border transition-colors cursor-pointer flex items-center gap-1 text-xs font-semibold ${
                isSaved
                  ? 'bg-[#D4AF37]/20 border-[#D4AF37]/40 text-[#D4AF37]'
                  : 'bg-stone-800 border-white/10 text-stone-300 hover:text-white hover:bg-stone-700'
              }`}
              title={isSaved ? 'Saved to Bookshelf' : 'Save to Bookshelf'}
            >
              <Bookmark className={`w-3.5 h-3.5 ${isSaved ? 'fill-[#D4AF37]' : ''}`} />
              <span className="hidden lg:inline">{isSaved ? 'Saved' : 'Save'}</span>
            </button>

            {/* Direct Download PDF button */}
            {pdfUrl && (
              <a
                href={pdfUrl}
                download={book.title ? `${book.title}.pdf` : 'book.pdf'}
                target="_blank"
                rel="noopener noreferrer"
                className="px-2.5 sm:px-3 py-1.5 rounded-lg bg-[#D4AF37] hover:bg-[#e6c148] text-stone-950 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                title="Download PDF directly to your device"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Download</span>
              </a>
            )}

            {/* Share */}
            <button
              onClick={() => setIsShareOpen(true)}
              className="p-2 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white border border-white/10 transition-colors cursor-pointer"
              title="Share Book"
            >
              <Share2 className="w-3.5 h-3.5" />
            </button>

            {/* Info Sidebar Toggle */}
            <button
              onClick={() => setShowInfoSidebar(!showInfoSidebar)}
              className={`p-2 rounded-lg border transition-colors cursor-pointer ${
                showInfoSidebar
                  ? 'bg-[#064E3B] text-white border-emerald-600'
                  : 'bg-stone-800 text-stone-300 hover:text-white border-white/10'
              }`}
              title="Book Sanad & Overview"
            >
              <Info className="w-3.5 h-3.5" />
            </button>

            {/* Fullscreen Toggle */}
            <button
              onClick={toggleFullscreen}
              className="p-2 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white border border-white/10 transition-colors cursor-pointer"
              title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
            >
              {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-stone-800 hover:bg-rose-900/80 hover:text-white text-stone-300 border border-white/10 transition-colors cursor-pointer ml-1"
              aria-label="Close reader"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* In-Website Reader Body */}
        <div className="flex-1 relative flex overflow-hidden bg-[#181a18]">
          {/* Main Canvas Scroll Area (Renders directly inside page without new tab!) */}
          <div className="flex-1 h-full w-full relative overflow-auto flex items-start justify-center p-2 sm:p-6 select-none">
            {isLoadingPdf ? (
              <div className="h-full flex flex-col items-center justify-center p-8 text-center space-y-3">
                <Loader2 className="w-10 h-10 text-[#D4AF37] animate-spin" />
                <p className="text-sm font-semibold text-stone-200">
                  کتاب کے صفحات ویب سائٹ میں لوڈ ہو رہے ہیں...
                </p>
                <p className="text-xs text-stone-400">
                  Loading digital manuscript directly in reader... please wait
                </p>
              </div>
            ) : pdfError ? (
              <div className="h-full flex flex-col items-center justify-center p-8 text-center max-w-md space-y-4">
                <div className="w-14 h-14 rounded-full bg-amber-900/30 border border-amber-600/40 flex items-center justify-center text-[#D4AF37] mx-auto">
                  <AlertCircle className="w-8 h-8" />
                </div>
                <h4 className="text-base font-bold text-stone-200">{book.title}</h4>
                <p className="text-xs text-stone-400 leading-relaxed">
                  {pdfError}
                </p>
                {pdfUrl && (
                  <a
                    href={pdfUrl}
                    download={book.title || 'book.pdf'}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#D4AF37] text-stone-950 text-xs font-bold rounded-lg shadow-md hover:bg-[#e6c148] transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download Book to Device</span>
                  </a>
                )}
              </div>
            ) : numPages > 0 ? (
              <div className="relative flex flex-col items-center justify-start my-auto">
                <div className="bg-white rounded-lg shadow-2xl overflow-hidden border border-white/20 transition-all duration-150 relative">
                  <canvas ref={canvasRef} className="block max-w-full h-auto mx-auto" />
                </div>

                {/* Quick Page Notes Notification Badge */}
                {notesForCurrentPage.length > 0 && (
                  <button
                    onClick={() => {
                      setShowNotesDrawer(true);
                      setNotesFilter('page');
                      if (showInfoSidebar) setShowInfoSidebar(false);
                    }}
                    className="mt-3 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#064E3B]/90 hover:bg-[#064E3B] text-emerald-100 border border-emerald-500/50 text-xs font-semibold shadow-lg backdrop-blur-xs transition-transform hover:scale-105 active:scale-95 cursor-pointer"
                  >
                    <Highlighter className="w-3.5 h-3.5 text-[#D4AF37]" />
                    <span>اس صفحہ ({currentPage}) پر {notesForCurrentPage.length} حاشیہ/نوٹ موجود ہیں • کھولیں</span>
                  </button>
                )}

                {/* Floating Mobile Page Quick Buttons */}
                <div className="sm:hidden flex items-center justify-center gap-3 mt-4 py-2 px-4 bg-stone-900/90 rounded-full border border-white/10 shadow-lg">
                  <button
                    onClick={goToPrevPage}
                    disabled={currentPage <= 1}
                    className="p-1.5 text-stone-300 disabled:opacity-30"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <span className="text-xs font-mono text-stone-200">
                    {currentPage} / {numPages}
                  </span>
                  <button
                    onClick={goToNextPage}
                    disabled={currentPage >= numPages}
                    className="p-1.5 text-stone-300 disabled:opacity-30"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ) : (
              /* If no PDF attached yet */
              <div className="h-full flex flex-col items-center justify-center p-8 max-w-md text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-[#064E3B]/40 border border-[#D4AF37]/40 flex items-center justify-center text-[#D4AF37] mx-auto">
                  <BookOpen className="w-8 h-8" />
                </div>
                <h4 className="text-base font-bold text-stone-200">{book.title}</h4>
                <p className="text-xs text-stone-400 leading-relaxed">
                  Musannif: <strong className="text-stone-300">{book.author_name}</strong>
                  <br />
                  This book record is active in the library. Editorial staff will link the digitized manuscript file shortly.
                </p>
                {book.external_read_url && (
                  <a
                    href={book.external_read_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#064E3B] text-white text-xs font-semibold rounded-lg hover:bg-[#075c46] transition-colors"
                  >
                    <FileText className="w-4 h-4" />
                    <span>Open Publisher Archives</span>
                  </a>
                )}
              </div>
            )}
          </div>

          {/* Slide-out Book Info & Metadata Sidebar */}
          {showInfoSidebar && (
            <div className="w-80 sm:w-96 bg-stone-900 border-l border-white/10 flex flex-col h-full shadow-2xl z-30 animate-in slide-in-from-right duration-200 shrink-0">
              <div className="p-4 border-b border-white/10 flex items-center justify-between">
                <span className="text-xs font-bold text-[#D4AF37] uppercase tracking-wider flex items-center gap-1.5">
                  <FileText className="w-4 h-4" />
                  Kitab Details & Sanad
                </span>
                <button
                  onClick={() => setShowInfoSidebar(false)}
                  className="p-1 text-stone-400 hover:text-white rounded"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-5 overflow-y-auto space-y-5 text-xs text-stone-300">
                {/* Book Cover Preview */}
                {book.cover_image && (
                  <div className="w-28 mx-auto aspect-3/4 rounded-lg overflow-hidden border border-[#D4AF37]/30 shadow-md">
                    <img
                      src={book.cover_image}
                      alt={book.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                <div>
                  <h4 className="text-sm font-bold text-white mb-1">{book.title}</h4>
                  <p className="text-xs text-[#D4AF37] font-medium">Musannif: {book.author_name}</p>
                </div>

                <div className="space-y-2 border-t border-b border-white/10 py-3 text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-stone-400">Category:</span>
                    <span className="font-semibold text-stone-200">{book.category_name || 'General'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-400">Language:</span>
                    <span className="font-semibold text-stone-200">{book.language || 'Urdu'}</span>
                  </div>
                  {numPages > 0 && (
                    <div className="flex justify-between">
                      <span className="text-stone-400">Total Pages:</span>
                      <span className="font-semibold text-[#D4AF37] font-mono">{numPages} Pages</span>
                    </div>
                  )}
                  {book.publication_details && (
                    <div className="flex justify-between">
                      <span className="text-stone-400">Publication:</span>
                      <span className="font-semibold text-stone-200 text-right max-w-[180px]">
                        {book.publication_details}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-stone-400">Download Status:</span>
                    <span className={`font-semibold ${book.allow_download === 1 ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {book.allow_download === 1 ? 'Allowed' : 'Online Viewing'}
                    </span>
                  </div>
                </div>

                {book.description && (
                  <div>
                    <h5 className="text-[11px] uppercase tracking-wider text-stone-400 font-bold mb-1.5">
                      Kitab Ka Khulasa (Overview)
                    </h5>
                    <p className="text-xs leading-relaxed text-stone-300 whitespace-pre-line font-sans">
                      {book.description}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Slide-out Study Notes & Highlights Drawer */}
          {showNotesDrawer && (
            <div className="w-80 sm:w-96 bg-stone-900 border-l border-white/10 flex flex-col h-full shadow-2xl z-30 animate-in slide-in-from-right duration-200 shrink-0">
              <div className="p-3.5 border-b border-white/10 flex items-center justify-between bg-stone-950/60">
                <span className="text-xs font-bold text-[#D4AF37] uppercase tracking-wider flex items-center gap-1.5">
                  <Highlighter className="w-4 h-4 text-[#D4AF37]" />
                  حواشی و نوٹس (Study Notes)
                </span>
                <button
                  onClick={() => setShowNotesDrawer(false)}
                  className="p-1 text-stone-400 hover:text-white rounded transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {/* Add New Note Box */}
                <form
                  onSubmit={handleAddNote}
                  className="p-3 rounded-xl border border-white/10 space-y-3 bg-stone-800/60"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-stone-200 flex items-center gap-1">
                      <span>صفحہ نمبر:</span>
                      <span className="text-[#D4AF37] font-mono font-bold px-1.5 py-0.5 bg-stone-900 rounded border border-white/10">
                        {currentPage}
                      </span>
                    </span>
                    {/* Color Picker */}
                    <div className="flex items-center gap-1.5">
                      {(['gold', 'emerald', 'blue', 'rose'] as const).map((clr) => {
                        const clrMap = {
                          gold: 'bg-[#D4AF37] border-amber-300',
                          emerald: 'bg-emerald-500 border-emerald-300',
                          blue: 'bg-sky-500 border-sky-300',
                          rose: 'bg-rose-500 border-rose-300'
                        };
                        return (
                          <button
                            key={clr}
                            type="button"
                            onClick={() => setSelectedColor(clr)}
                            className={`w-4 h-4 rounded-full transition-transform cursor-pointer border ${clrMap[clr]} ${
                              selectedColor === clr ? 'scale-125 ring-2 ring-white shadow-md' : 'opacity-60 hover:opacity-100'
                            }`}
                            title={clr}
                          />
                        );
                      })}
                    </div>
                  </div>

                  {/* Highlight quotation/snippet */}
                  <div>
                    <label className="block text-[10px] text-stone-400 mb-1 font-medium">
                      اقتباس یا عبارت (Highlighted Text / Quote - اختیاری):
                    </label>
                    <input
                      type="text"
                      value={newSnippet}
                      onChange={(e) => setNewSnippet(e.target.value)}
                      placeholder="متن کا منتخب حصہ یہاں لکھیں..."
                      className="w-full bg-stone-900 border border-white/15 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-stone-500 focus:outline-none focus:border-[#D4AF37]"
                    />
                  </div>

                  {/* Note / Hashiya Textarea */}
                  <div>
                    <label className="block text-[10px] text-stone-400 mb-1 font-medium">
                      حاشیہ یا نوٹ (Your Study Note / Reflection):
                    </label>
                    <textarea
                      value={newNoteText}
                      onChange={(e) => setNewNoteText(e.target.value)}
                      rows={3}
                      placeholder="اس صفحے کے متعلق تفہیم، نکتہ، یا حوالہ درج کریں..."
                      className="w-full bg-stone-900 border border-white/15 rounded-lg p-2 text-xs text-white placeholder-stone-500 focus:outline-none focus:border-[#D4AF37] resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={!newNoteText.trim() && !newSnippet.trim()}
                    className="w-full py-2 bg-[#064E3B] hover:bg-[#075c46] disabled:opacity-40 disabled:hover:bg-[#064E3B] text-white rounded-lg text-xs font-bold transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>نوٹ محفوظ کریں (Save Note)</span>
                  </button>
                </form>

                {/* Filter and Count Header */}
                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] font-semibold text-stone-400 font-mono">
                    {notes.length} Total Notes
                  </span>
                  <div className="flex items-center gap-1 bg-stone-800 p-0.5 rounded-lg border border-white/10 text-[10px]">
                    <button
                      type="button"
                      onClick={() => setNotesFilter('all')}
                      className={`px-2 py-0.5 rounded transition-colors cursor-pointer ${
                        notesFilter === 'all' ? 'bg-[#D4AF37] text-stone-950 font-bold' : 'text-stone-300 hover:text-white'
                      }`}
                    >
                      All ({notes.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setNotesFilter('page')}
                      className={`px-2 py-0.5 rounded transition-colors cursor-pointer ${
                        notesFilter === 'page' ? 'bg-[#D4AF37] text-stone-950 font-bold' : 'text-stone-300 hover:text-white'
                      }`}
                    >
                      Page {currentPage} ({notesForCurrentPage.length})
                    </button>
                  </div>
                </div>

                {/* Notes List */}
                {displayedNotes.length === 0 ? (
                  <div className="text-center py-8 px-4 border border-dashed border-white/10 rounded-xl bg-stone-800/20">
                    <Highlighter className="w-8 h-8 text-stone-500 mx-auto mb-2 opacity-50" />
                    <p className="text-xs text-stone-300 font-medium">کوئی نوٹ موجود نہیں ہے</p>
                    <p className="text-[11px] text-stone-500 mt-1">
                      {notesFilter === 'page'
                        ? `صفحہ ${currentPage} پر ابھی کوئی حاشیہ درج نہیں ہے۔`
                        : 'کتاب پڑھتے وقت اہم نکات اور تفاسیر اوپر دیے گئے باکس میں محفوظ کریں۔'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {displayedNotes.map((n) => {
                      const colorBorderMap = {
                        gold: 'border-l-[#D4AF37] bg-amber-950/20',
                        emerald: 'border-l-emerald-400 bg-emerald-950/20',
                        blue: 'border-l-sky-400 bg-sky-950/20',
                        rose: 'border-l-rose-400 bg-rose-950/20'
                      };
                      return (
                        <div
                          key={n.id}
                          className={`p-3 rounded-xl border border-white/10 border-l-4 transition-all hover:border-white/20 shadow-xs ${
                            colorBorderMap[n.color] || colorBorderMap.gold
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1.5">
                            <button
                              type="button"
                              onClick={() => goToPage(n.pageNumber)}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-stone-800 hover:bg-[#D4AF37] hover:text-stone-950 text-stone-200 text-[10px] font-mono font-bold transition-colors cursor-pointer border border-white/10"
                              title={`Jump to Page ${n.pageNumber}`}
                            >
                              <span>Page {n.pageNumber}</span>
                              <span className="text-[9px] opacity-70">↗</span>
                            </button>
                            <div className="flex items-center gap-1.5 text-stone-400">
                              <span className="text-[10px]">{n.createdAt}</span>
                              <button
                                type="button"
                                onClick={() => handleCopyNote(n)}
                                className="p-1 hover:text-white transition-colors cursor-pointer rounded"
                                title="Copy note text"
                              >
                                {copiedNoteId === n.id ? (
                                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteNote(n.id)}
                                className="p-1 hover:text-rose-400 transition-colors cursor-pointer rounded"
                                title="Delete note"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {n.highlightSnippet && (
                            <div className="mb-2 p-2 rounded bg-black/40 border-l-2 border-stone-400 text-xs italic text-stone-200 font-serif">
                              &ldquo;{n.highlightSnippet}&rdquo;
                            </div>
                          )}

                          <p className="text-xs text-stone-200 leading-relaxed whitespace-pre-wrap">
                            {n.noteText}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer branding */}
        <div className="px-4 py-2 bg-stone-900 border-t border-white/10 flex items-center justify-between text-[10px] text-stone-400 shrink-0">
          <span className="font-mono text-[#D4AF37]">
            POWERED BY SYED ALI QALANDAR PEERZADE
          </span>
          <span className="hidden sm:inline text-stone-300">
            Direct In-Website Canvas Reader • No External Tabs Needed
          </span>
        </div>
      </div>

      {/* Share Modal */}
      <ShareModal
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        title={book.title}
        category="Islamic Book"
      />
    </div>
  );
};
