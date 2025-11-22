import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Plus, Search, Book, Calendar, Moon, Sun, ChevronLeft, 
  Trash2, Edit3, Save, Image as ImageIcon, Loader2, LogIn, Settings,
  Filter, LayoutGrid, X, Download, Maximize2, Smile, Paperclip, CheckSquare, Square,
  MoreHorizontal, BookHeart, LogOut, User
} from 'lucide-react';
import { JournalEntry, ViewState, JournalAttachment, GoogleConfig, ChecklistItem } from './types';
import { DriveService } from './services/driveService';
import { Button, Input, TextArea, Card, Modal } from './components/Components';

// --- Constants ---
// Hardcoded Credentials as requested
const GOOGLE_CLIENT_ID = "111426887413-md2gvq2djc7p7qqgp57p5v0s1eichp8b.apps.googleusercontent.com";
const GOOGLE_API_KEY = "AIzaSyA7EBoWEqbAYkTdCDKsm3kD-6vL21CdRkY";

const MOODS = [
  { id: 'happy', emoji: '🥰', label: 'Happy', color: 'bg-pink-100 text-pink-600' },
  { id: 'excited', emoji: '🤩', label: 'Excited', color: 'bg-yellow-100 text-yellow-600' },
  { id: 'calm', emoji: '😌', label: 'Calm', color: 'bg-blue-100 text-blue-600' },
  { id: 'neutral', emoji: '😐', label: 'Neutral', color: 'bg-gray-100 text-gray-600' },
  { id: 'tired', emoji: '😴', label: 'Tired', color: 'bg-indigo-100 text-indigo-600' },
  { id: 'sad', emoji: '😔', label: 'Sad', color: 'bg-slate-100 text-slate-600' },
  { id: 'angry', emoji: '😤', label: 'Angry', color: 'bg-red-100 text-red-600' },
];

// --- Sub-Components ---

const LoadingScreen = ({ message }: { message: string }) => (
  <div className="flex flex-col items-center justify-center h-full min-h-[50vh] text-surface-400 animate-in fade-in duration-700">
    <div className="relative">
      <div className="absolute inset-0 bg-brand-500 blur-3xl opacity-20 rounded-full animate-pulse"></div>
      <Loader2 className="relative w-12 h-12 animate-spin mb-6 text-brand-500" />
    </div>
    <p className="font-display font-bold tracking-widest uppercase text-xs text-brand-900/40 dark:text-brand-100/40">{message}</p>
  </div>
);

const SecureImage = ({ 
    fileId, 
    thumbnailUrl,
    fallbackSrc, 
    alt, 
    className, 
    onLoad 
}: { 
    fileId?: string, 
    thumbnailUrl?: string,
    fallbackSrc?: string, 
    alt: string, 
    className?: string,
    onLoad?: () => void
}) => {
    const [src, setSrc] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [hasError, setHasError] = useState(false);

    useEffect(() => {
        if (!fileId && !thumbnailUrl) {
            setIsLoading(false);
            return;
        }

        let active = true;
        setIsLoading(true);
        setHasError(false);

        const loadImage = async () => {
           try {
              let url: string | null = null;
              if (thumbnailUrl) {
                 try {
                    url = await DriveService.fetchAuthenticatedBlob(thumbnailUrl);
                 } catch (e) {
                    console.warn("Thumbnail fetch failed", e);
                 }
              }
              if (!url && fileId) {
                 url = await DriveService.downloadMedia(fileId);
              }
              if (active && url) {
                  setSrc(url);
                  setIsLoading(false);
              } else if (active) {
                  throw new Error("No image source available");
              }
           } catch (err) {
                console.warn("Failed to load secure image", err);
                if (active) {
                    setHasError(true);
                    setIsLoading(false);
                }
           }
        };
        loadImage();
        return () => { active = false; };
    }, [fileId, thumbnailUrl]);

    useEffect(() => {
        return () => {
            if (src && src.startsWith('blob:')) URL.revokeObjectURL(src);
        };
    }, [src]);

    const finalSrc = src || fallbackSrc;

    if (isLoading) {
        return (
            <div className={`bg-surface-100 dark:bg-surface-800 flex items-center justify-center ${className}`}>
                <Loader2 className="w-6 h-6 text-surface-300 animate-spin" />
            </div>
        );
    }
    if (hasError && !fallbackSrc) {
         return (
            <div className={`bg-surface-100 dark:bg-surface-800 flex items-center justify-center ${className}`}>
                <ImageIcon className="w-6 h-6 text-surface-300" />
            </div>
        );
    }
    return (
        <img 
            src={finalSrc} 
            alt={alt} 
            className={`${className} ${!finalSrc ? 'opacity-0' : 'opacity-100'}`}
            loading="lazy"
            onLoad={onLoad}
        />
    );
};

// --- Views ---

const LoginView: React.FC<{ onLogin: () => void }> = ({ onLogin }) => (
  <div className="min-h-[100dvh] flex flex-col items-center justify-center p-6 bg-surface-50 dark:bg-surface-950 text-center overflow-hidden">
     {/* Abstract Background Shapes */}
     <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-200/30 dark:bg-brand-900/10 rounded-full blur-3xl animate-float"></div>
     <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-200/30 dark:bg-blue-900/10 rounded-full blur-3xl animate-float" style={{animationDelay: '2s'}}></div>

    <div className="relative z-10 max-w-md w-full backdrop-blur-sm">
        <div className="w-24 h-24 bg-white dark:bg-surface-800 rounded-[2rem] flex items-center justify-center shadow-soft mx-auto mb-10 rotate-3 hover:rotate-6 transition-transform duration-500">
          <BookHeart className="text-brand-500 w-12 h-12" />
        </div>
        <h1 className="text-6xl font-display font-bold mb-6 text-surface-900 dark:text-white tracking-tight">
          My <span className="text-brand-500">Diaries</span>
        </h1>
        <p className="text-xl text-surface-600 dark:text-surface-400 mb-12 leading-relaxed font-medium">
          Your private digital sanctuary. <br/>
          <span className="text-sm opacity-70 font-normal">Synced with Google Drive</span>
        </p>
        
        <div className="space-y-4">
            <Button onClick={onLogin} className="w-full text-lg !rounded-2xl h-16" variant="primary">
            <LogIn className="w-6 h-6 mr-3" />
            Sign in with Google
            </Button>
        </div>

        <div className="mt-8 p-4 bg-white/50 dark:bg-surface-900/50 rounded-xl border border-surface-200 dark:border-surface-800 text-xs text-surface-500">
            <p className="mb-2 font-bold">Mobile Login Issues?</p>
            <p>Ensure this URL is in your Google Cloud "Authorized JavaScript origins":</p>
            <code className="block mt-2 p-2 bg-surface-100 dark:bg-surface-950 rounded select-all font-mono text-brand-600 break-all">
                {window.location.origin}
            </code>
        </div>
    </div>
  </div>
);

const Sidebar = ({ 
    activeView, 
    onChangeView, 
    onToggleTheme, 
    isDark, 
    onSignOut 
}: { 
    activeView: ViewState['type'], 
    onChangeView: (v: ViewState['type']) => void,
    onToggleTheme: () => void,
    isDark: boolean,
    onSignOut: () => void
}) => {
    return (
        <div className="hidden md:flex flex-col w-80 h-full sticky top-0 p-6 bg-[#F8F9FC] dark:bg-[#121214]">
            <div className="flex items-center gap-3 mb-12 px-4">
                <div className="w-10 h-10 bg-brand-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-brand-500/30">
                    <BookHeart className="w-6 h-6" />
                </div>
                <span className="font-display font-bold text-2xl text-surface-900 dark:text-white">My Diaries</span>
            </div>

            <nav className="space-y-2 flex-1">
                <button 
                    onClick={() => onChangeView('LIST')}
                    className={`w-full flex items-center gap-4 px-6 py-4 rounded-[20px] transition-all duration-300 font-semibold text-left ${
                        activeView === 'LIST' 
                        ? 'bg-white dark:bg-surface-800 text-brand-600 dark:text-brand-300 shadow-soft' 
                        : 'text-surface-500 hover:bg-white/50 dark:hover:bg-surface-800/50 hover:text-surface-900 dark:hover:text-white'
                    }`}
                >
                    <LayoutGrid className="w-5 h-5" />
                    All Entries
                </button>
            </nav>

            <div className="bg-white dark:bg-surface-900 p-4 rounded-[2rem] shadow-soft border border-surface-50 dark:border-surface-800">
                <div className="flex items-center justify-between mb-4">
                   <span className="text-xs font-bold text-surface-400 uppercase tracking-wider ml-2">Theme</span>
                   <button onClick={onToggleTheme} className="p-2 rounded-full bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-300 hover:bg-surface-200 dark:hover:bg-surface-700 transition-colors">
                       {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                   </button>
                </div>
                <button onClick={onSignOut} className="w-full flex items-center justify-center gap-2 text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 py-3 rounded-xl transition-colors">
                    <LogOut className="w-4 h-4" /> Sign Out
                </button>
            </div>
        </div>
    );
};

const MobileNav = ({ onChangeView, activeView }: { onChangeView: (v: ViewState['type']) => void, activeView: ViewState['type'] }) => (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-surface-900/90 backdrop-blur-xl border-t border-surface-100 dark:border-surface-800 pb-safe-bottom z-40 shadow-[0_-5px_20px_rgba(0,0,0,0.03)]">
        <div className="flex justify-between items-end px-8 pt-2 pb-4">
             <button 
                onClick={() => onChangeView('LIST')} 
                className={`flex flex-col items-center gap-1 p-2 rounded-2xl transition-colors ${activeView === 'LIST' ? 'text-brand-600 dark:text-brand-400' : 'text-surface-400'}`}
             >
                 <LayoutGrid className={`w-6 h-6 ${activeView === 'LIST' ? 'fill-current' : ''}`} />
                 <span className="text-[10px] font-medium">Journal</span>
             </button>

             <button 
                onClick={() => onChangeView('CREATE')}
                className="transform -translate-y-6 bg-brand-600 text-white w-16 h-16 rounded-full shadow-glow hover:scale-105 transition-all active:scale-95 flex items-center justify-center border-4 border-[#F8F9FC] dark:border-[#121214]"
             >
                 <Plus className="w-8 h-8" />
             </button>

             <button 
                onClick={() => onChangeView('SETTINGS')} 
                className={`flex flex-col items-center gap-1 p-2 rounded-2xl transition-colors ${activeView === 'SETTINGS' ? 'text-brand-600 dark:text-brand-400' : 'text-surface-400'}`}
             >
                 <User className={`w-6 h-6 ${activeView === 'SETTINGS' ? 'fill-current' : ''}`} />
                 <span className="text-[10px] font-medium">Settings</span>
             </button>
        </div>
    </div>
);

const MobileSettingsView: React.FC<{ 
    onBack: () => void;
    isDark: boolean;
    onToggleTheme: () => void;
    onSignOut: () => void;
}> = ({ onBack, isDark, onToggleTheme, onSignOut }) => (
    <div className="fixed inset-0 bg-[#F8F9FC] dark:bg-[#121214] z-50 animate-slide-up flex flex-col h-[100dvh]">
        <header className="bg-white dark:bg-surface-900 px-6 py-4 flex items-center gap-4 shadow-sm border-b border-surface-100 dark:border-surface-800 pt-safe-top">
             <button onClick={onBack} className="p-2 -ml-2 text-surface-600 dark:text-surface-300">
                 <ChevronLeft className="w-6 h-6" />
             </button>
             <h2 className="text-lg font-display font-bold text-surface-900 dark:text-white">Settings</h2>
        </header>
        <div className="p-6 space-y-6 flex-1 overflow-y-auto">
             <div className="bg-white dark:bg-surface-900 rounded-3xl p-6 shadow-soft border border-surface-50 dark:border-surface-800">
                 <div className="flex items-center justify-between">
                     <div className="flex items-center gap-4">
                         <div className="w-10 h-10 rounded-full bg-surface-100 dark:bg-surface-800 flex items-center justify-center text-surface-600 dark:text-surface-300">
                             {isDark ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                         </div>
                         <div>
                             <h3 className="font-bold text-surface-900 dark:text-white">Dark Mode</h3>
                             <p className="text-sm text-surface-500">Easier on the eyes</p>
                         </div>
                     </div>
                     <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" checked={isDark} onChange={onToggleTheme} className="sr-only peer" />
                        <div className="w-11 h-6 bg-surface-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-brand-300 dark:peer-focus:ring-brand-800 rounded-full peer dark:bg-surface-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-brand-600"></div>
                     </label>
                 </div>
             </div>

             <button onClick={onSignOut} className="w-full bg-white dark:bg-surface-900 p-4 rounded-3xl shadow-soft border border-surface-50 dark:border-surface-800 flex items-center justify-center gap-2 text-red-500 font-medium active:scale-95 transition-transform">
                 <LogOut className="w-5 h-5" />
                 Sign Out
             </button>

             <div className="text-center text-surface-400 text-sm mt-10">
                 <p>My Diaries v1.1</p>
                 <p className="text-xs mt-1 opacity-60">Synced with Google Drive</p>
             </div>
        </div>
    </div>
);

const EntryListView: React.FC<{
  entries: JournalEntry[];
  onSelect: (id: string) => void;
  onCreate: () => void;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  isLoading: boolean;
}> = ({ entries, onSelect, onCreate, searchTerm, onSearchChange, isLoading }) => {
  
  const [selectedMood, setSelectedMood] = useState<string | null>(null);

  const filteredEntries = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return entries.filter(e => {
      const matchesSearch = e.title.toLowerCase().includes(term) || 
      new Date(e.date).toLocaleDateString().includes(term) ||
      (e.mood && e.mood.toLowerCase().includes(term));
      
      const matchesMood = selectedMood ? e.mood === selectedMood : true;

      return matchesSearch && matchesMood;
    });
  }, [entries, searchTerm, selectedMood]);

  if (isLoading && entries.length === 0) return <LoadingScreen message="Syncing..." />;

  return (
    <div className="flex-1 h-[100dvh] overflow-y-auto px-4 md:px-10 pb-safe-bottom no-scrollbar">
       {/* Sticky Header with Blur */}
       <header className="sticky top-0 z-30 pt-safe-top bg-[#F8F9FC]/95 dark:bg-[#121214]/95 backdrop-blur-xl -mx-4 px-4 md:mx-0 md:px-0 transition-all pb-2 border-b border-transparent md:bg-transparent md:backdrop-blur-none md:static md:border-none md:pt-12">
           <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4 md:mb-6 pt-4 md:pt-0">
               <div className="flex justify-between items-center">
                   <div>
                        <h2 className="text-3xl md:text-4xl font-display font-bold text-surface-900 dark:text-white mb-1">My Journal</h2>
                        <p className="text-surface-500 font-medium text-sm md:text-base">{entries.length} memories stored</p>
                   </div>
               </div>
               
               <div className="relative w-full md:w-72 group">
                   <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400 group-focus-within:text-brand-500 transition-colors" />
                   <input 
                     type="text" 
                     placeholder="Search..."
                     value={searchTerm}
                     onChange={(e) => onSearchChange(e.target.value)}
                     className="w-full pl-12 pr-4 py-3 rounded-2xl bg-white dark:bg-surface-800 border border-surface-100 dark:border-surface-700 focus:border-brand-200 dark:focus:border-brand-800 focus:ring-4 focus:ring-brand-50 dark:focus:ring-brand-900/20 outline-none transition-all shadow-sm text-base"
                   />
               </div>
           </div>

           {/* Mood Filter (Sticky on mobile) */}
           <div className="flex gap-2 overflow-x-auto pb-2 mb-2 no-scrollbar snap-x mask-linear-fade">
               <button 
                   onClick={() => setSelectedMood(null)}
                   className={`flex-shrink-0 snap-start px-5 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
                       selectedMood === null 
                       ? 'bg-surface-900 text-white dark:bg-white dark:text-surface-900 shadow-lg scale-105' 
                       : 'bg-white dark:bg-surface-800 text-surface-500 dark:text-surface-400 hover:bg-surface-50 dark:hover:bg-surface-700 border border-surface-100 dark:border-surface-800'
                   }`}
               >
                   All
               </button>
               {MOODS.map(m => (
                   <button 
                       key={m.id}
                       onClick={() => setSelectedMood(selectedMood === m.id ? null : m.id)}
                       className={`flex-shrink-0 snap-start px-4 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap flex items-center gap-2 ${
                           selectedMood === m.id 
                           ? `${m.color} shadow-lg scale-105 ring-1 ring-black/5` 
                           : 'bg-white dark:bg-surface-800 text-surface-500 dark:text-surface-400 hover:bg-surface-50 dark:hover:bg-surface-700 border border-surface-100 dark:border-surface-800 grayscale hover:grayscale-0'
                       }`}
                   >
                       <span className="text-lg">{m.emoji}</span>
                       <span>{m.label}</span>
                   </button>
               ))}
           </div>
       </header>

       {filteredEntries.length === 0 ? (
           <div className="flex flex-col items-center justify-center py-20 opacity-60">
               <div className="w-24 h-24 bg-surface-100 dark:bg-surface-800 rounded-full flex items-center justify-center mb-6">
                   <Book className="w-10 h-10 text-surface-300" />
               </div>
               <p className="text-lg font-medium text-surface-500">No entries found.</p>
               <Button variant="ghost" onClick={onCreate} className="mt-4 md:hidden">Create one now</Button>
           </div>
       ) : (
           <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6 pb-32 md:pb-10">
               {filteredEntries.map((entry, idx) => {
                   const dateObj = new Date(entry.date);
                   const day = dateObj.getDate();
                   const month = dateObj.toLocaleString('default', { month: 'short' });
                   const moodObj = MOODS.find(m => m.id === entry.mood);

                   return (
                       <div 
                          key={entry.id} 
                          onClick={() => onSelect(entry.id)}
                          className="group relative bg-white dark:bg-surface-900 rounded-3xl md:rounded-[2rem] p-4 md:p-5 shadow-soft hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer border border-surface-50 dark:border-surface-800/50 animate-slide-up fill-mode-backwards flex flex-col min-h-[200px] md:h-64 active:scale-[0.98]"
                          style={{ animationDelay: `${idx * 50}ms` }}
                       >
                           {/* Date Badge */}
                           <div className="absolute top-4 left-4 md:top-5 md:left-5 z-10 bg-white/90 dark:bg-surface-900/90 backdrop-blur-sm px-3 py-2 rounded-2xl shadow-sm border border-surface-100 dark:border-surface-800 text-center min-w-[3.5rem]">
                               <span className="block text-xs font-bold text-surface-400 uppercase">{month}</span>
                               <span className="block text-xl font-display font-bold text-surface-900 dark:text-white">{day}</span>
                           </div>

                           {/* Mood Badge */}
                           {moodObj && (
                               <div className="absolute top-4 right-4 md:top-5 md:right-5 z-10 text-2xl filter drop-shadow-sm transform group-hover:scale-110 transition-transform">
                                   {moodObj.emoji}
                               </div>
                           )}

                           {/* Content Container */}
                           <div className="flex-1 mt-2 rounded-2xl overflow-hidden relative bg-surface-50 dark:bg-surface-800">
                               {entry.coverImageId || entry.coverImage ? (
                                   <SecureImage 
                                      fileId={entry.coverImageId}
                                      thumbnailUrl={entry.coverImage}
                                      fallbackSrc={entry.coverImage?.replace(/=s\d+/, '=s600')}
                                      alt="Cover"
                                      className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700"
                                   />
                               ) : (
                                   <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-surface-50 to-surface-100 dark:from-surface-800 dark:to-surface-800/50">
                                       <p className="font-serif italic text-surface-400 text-sm p-6 text-center line-clamp-4 leading-relaxed">
                                           {entry.content.substring(0, 100)}...
                                       </p>
                                   </div>
                               )}
                           </div>

                           {/* Footer Title */}
                           <div className="pt-4 px-1">
                               <h3 className="font-display font-bold text-xl text-surface-900 dark:text-surface-100 truncate group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                                   {entry.title || "Untitled Entry"}
                               </h3>
                           </div>
                       </div>
                   );
               })}
           </div>
       )}

       {/* Floating Action Button - DESKTOP ONLY (Mobile has nav bar) */}
       <div className="hidden md:block fixed bottom-10 right-10 z-40">
           <Button variant="fab" onClick={onCreate}>
               <Plus className="w-8 h-8" />
           </Button>
       </div>
    </div>
  );
};

const EntryEditorView: React.FC<{
  initialData?: JournalEntry;
  onSave: (data: any) => Promise<void>;
  onCancel: () => void;
  onDeleteAttachment?: (id: string) => Promise<void>;
}> = ({ initialData, onSave, onCancel, onDeleteAttachment }) => {
  const [title, setTitle] = useState(initialData?.title || '');
  const [content, setContent] = useState(initialData?.content || '');
  const [date, setDate] = useState(initialData?.date || new Date().toISOString());
  const [mood, setMood] = useState(initialData?.mood || '');
  const [checklist, setChecklist] = useState<ChecklistItem[]>(initialData?.checklist || []);
  const [newChecklistItem, setNewChecklistItem] = useState('');
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dateInputRef = useRef<HTMLInputElement>(null);

  const handleSave = async () => {
      setIsSaving(true);
      try { await onSave({ title, content, date, mood, files: pendingFiles, checklist }); } 
      finally { setIsSaving(false); }
  };

  const handleAddChecklist = (e: React.FormEvent) => {
      e.preventDefault();
      if (newChecklistItem.trim()) {
          setChecklist([...checklist, { text: newChecklistItem.trim(), checked: false }]);
          setNewChecklistItem('');
      }
  };

  return (
      <div className="fixed inset-0 z-50 bg-[#F8F9FC] dark:bg-[#121214] flex flex-col animate-slide-up h-[100dvh]">
          {/* Toolbar */}
          <div className="flex items-center justify-between px-4 py-3 md:px-8 md:py-4 bg-white dark:bg-surface-900 border-b border-surface-100 dark:border-surface-800 shadow-sm z-20 sticky top-0 pt-safe-top">
              <button onClick={onCancel} className="p-2 -ml-2 rounded-full hover:bg-surface-100 dark:hover:bg-surface-800 text-surface-500 transition-colors">
                  <X className="w-6 h-6" />
              </button>
              <div className="flex items-center gap-3 md:gap-4">
                  <button 
                     onClick={() => fileInputRef.current?.click()}
                     className="p-2 rounded-full bg-surface-50 hover:bg-brand-50 text-surface-500 hover:text-brand-600 transition-colors"
                  >
                      <Paperclip className="w-5 h-5" />
                  </button>
                  <Button onClick={handleSave} disabled={isSaving || (!title && !content)} className="!py-2 !px-4 md:!px-6 !rounded-xl text-sm font-bold">
                      {isSaving ? 'Saving...' : 'Save'}
                  </Button>
              </div>
          </div>

          {/* Editor Canvas */}
          <div className="flex-1 overflow-y-auto bg-[#F8F9FC] dark:bg-[#121214] md:bg-surface-50/50 md:dark:bg-black/20 pb-safe-bottom">
              <div className="max-w-3xl mx-auto my-0 md:my-12 bg-white dark:bg-surface-900 min-h-full md:min-h-[80vh] md:rounded-[2rem] shadow-none md:shadow-soft p-6 md:p-16 relative pb-32 md:pb-16">
                  
                  {/* Header Info */}
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 md:mb-10 pb-6 border-b border-dashed border-surface-200 dark:border-surface-700">
                      <div className="relative cursor-pointer group" onClick={() => dateInputRef.current?.showPicker()}>
                          <span className="text-sm font-bold text-brand-500 uppercase tracking-widest mb-1 block">Date</span>
                          <div className="text-xl md:text-2xl font-display font-bold text-surface-800 dark:text-surface-200 flex items-center gap-2 group-hover:text-brand-600 transition-colors">
                              {new Date(date).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
                              <Edit3 className="w-4 h-4 opacity-0 group-hover:opacity-50" />
                          </div>
                          <input ref={dateInputRef} type="date" value={date.split('T')[0]} onChange={e => setDate(new Date(e.target.value).toISOString())} className="absolute inset-0 opacity-0 cursor-pointer" />
                      </div>

                      {/* Mood Selector */}
                      <div className="flex gap-2 overflow-x-auto py-2 hide-scrollbar -mx-2 px-2 md:mx-0 md:px-0">
                          {MOODS.map(m => (
                              <button 
                                  key={m.id} 
                                  onClick={() => setMood(m.id)}
                                  className={`p-3 text-2xl rounded-2xl transition-all hover:scale-110 flex-shrink-0 ${mood === m.id ? 'bg-surface-100 dark:bg-surface-800 scale-110 shadow-sm ring-2 ring-brand-200' : 'opacity-50 hover:opacity-100'}`}
                              >
                                  {m.emoji}
                              </button>
                          ))}
                      </div>
                  </div>

                  {/* Inputs */}
                  <input 
                      placeholder="Title..."
                      value={title}
                      onChange={e => setTitle(e.target.value)}
                      className="w-full text-3xl md:text-5xl font-display font-bold bg-transparent border-none outline-none placeholder:text-surface-300 text-surface-900 dark:text-white mb-6 md:mb-8"
                  />

                  <TextArea 
                      placeholder="Start writing your memory..."
                      value={content}
                      onChange={e => setContent(e.target.value)}
                      className="min-h-[40vh] text-lg md:text-xl leading-loose font-serif text-surface-700 dark:text-surface-300 !px-0"
                  />

                  {/* Checklist */}
                  <div className="mt-8 md:mt-12 bg-surface-50 dark:bg-surface-800/30 rounded-3xl p-5 md:p-6">
                      <h4 className="font-bold text-surface-400 text-xs uppercase tracking-widest mb-4 flex items-center gap-2">
                          <CheckSquare className="w-4 h-4" /> Checklist
                      </h4>
                      <div className="space-y-3">
                          {checklist.map((item, i) => (
                              <div key={i} className="flex items-center gap-3 group">
                                  <button onClick={() => {
                                      const n = [...checklist]; n[i].checked = !n[i].checked; setChecklist(n);
                                  }} className="p-1 -m-1">
                                      {item.checked ? <CheckSquare className="text-brand-500 w-5 h-5" /> : <Square className="text-surface-300 w-5 h-5" />}
                                  </button>
                                  <span className={`flex-1 font-medium ${item.checked ? 'line-through text-surface-400' : 'text-surface-700 dark:text-surface-200'}`}>{item.text}</span>
                                  <button onClick={() => setChecklist(checklist.filter((_, idx) => idx !== i))} className="text-surface-300 hover:text-red-500 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity p-2">
                                      <X className="w-4 h-4" />
                                  </button>
                              </div>
                          ))}
                          <form onSubmit={handleAddChecklist} className="flex gap-2 mt-4">
                              <Input value={newChecklistItem} onChange={e => setNewChecklistItem(e.target.value)} placeholder="Add item..." className="!py-3 !bg-white dark:!bg-surface-800 text-sm" />
                              <Button type="submit" variant="secondary" className="!py-2 !px-4 !rounded-xl text-sm">Add</Button>
                          </form>
                      </div>
                  </div>

                  {/* Attachments Preview */}
                  {(pendingFiles.length > 0 || (initialData?.attachments?.length ?? 0) > 0) && (
                      <div className="mt-8 md:mt-12 grid grid-cols-3 md:grid-cols-4 gap-3 md:gap-4 pb-20 md:pb-0">
                          {pendingFiles.map((f, i) => (
                              <div key={i} className="relative aspect-square rounded-2xl overflow-hidden bg-surface-100">
                                  <img src={URL.createObjectURL(f)} className="w-full h-full object-cover opacity-80" />
                                  <button onClick={() => setPendingFiles(p => p.filter((_, idx) => idx !== i))} className="absolute top-1 right-1 bg-black/50 text-white p-1 rounded-full">
                                      <X className="w-3 h-3" />
                                  </button>
                              </div>
                          ))}
                          {initialData?.attachments?.map(att => (
                              <div key={att.id} className="relative aspect-square rounded-2xl overflow-hidden bg-surface-100 group">
                                  <SecureImage fileId={att.id} thumbnailUrl={att.thumbnailLink} alt="" className="w-full h-full object-cover" />
                                  <button onClick={() => onDeleteAttachment && onDeleteAttachment(att.id)} className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                                      <Trash2 className="w-3 h-3" />
                                  </button>
                              </div>
                          ))}
                      </div>
                  )}
                  <input type="file" ref={fileInputRef} className="hidden" multiple accept="image/*" onChange={e => e.target.files && setPendingFiles(p => [...p, ...Array.from(e.target.files!)])} />
              </div>
          </div>
      </div>
  );
};

const EntryReaderView: React.FC<{
    entry: JournalEntry;
    onBack: () => void;
    onEdit: () => void;
    onDelete: () => void;
    isLoading: boolean;
  }> = ({ entry, onBack, onEdit, onDelete, isLoading }) => {
    const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
    
    if (isLoading || !entry) return <LoadingScreen message="Opening..." />;

    const moodObj = MOODS.find(m => m.id === entry.mood);
  
    return (
      <div className="fixed inset-0 z-40 bg-[#F8F9FC] dark:bg-[#121214] flex flex-col animate-scale-in origin-center h-[100dvh]">
        <div className="flex items-center justify-between px-4 py-3 md:px-8 md:py-4 bg-white dark:bg-surface-900 border-b border-surface-100 dark:border-surface-800 shadow-sm z-20 sticky top-0 pt-safe-top">
             <button onClick={onBack} className="flex items-center gap-2 px-4 py-2 rounded-full hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors text-surface-600 dark:text-surface-300 font-medium -ml-2">
                 <ChevronLeft className="w-5 h-5" /> Back
             </button>
             <div className="flex items-center gap-2">
                 <button onClick={onEdit} className="p-2 text-brand-600 hover:bg-brand-50 rounded-full transition-colors"><Edit3 className="w-5 h-5" /></button>
                 <button onClick={onDelete} className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors"><Trash2 className="w-5 h-5" /></button>
             </div>
        </div>
  
        <div className="flex-1 overflow-y-auto bg-[#F8F9FC] dark:bg-[#121214] md:bg-surface-50/50 md:dark:bg-black/20 pb-safe-bottom">
            <article className="max-w-3xl mx-auto my-0 md:my-12 bg-white dark:bg-surface-900 min-h-full md:min-h-[80vh] md:rounded-[2rem] shadow-none md:shadow-soft overflow-hidden">
                {/* Hero Image */}
                {(entry.coverImageId || entry.coverImage) && (
                    <div className="w-full h-64 md:h-80 relative">
                        <SecureImage fileId={entry.coverImageId} thumbnailUrl={entry.coverImage} fallbackSrc={entry.coverImage?.replace(/=s\d+/, '=s1200')} alt="Cover" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                    </div>
                )}
                
                <div className="p-6 md:p-16 relative pb-32 md:pb-16">
                    {/* Header */}
                    <div className="flex justify-between items-start mb-6 md:mb-8">
                        <div className="flex-1 pr-4">
                            <span className="text-brand-600 font-bold tracking-widest text-xs uppercase mb-2 block">
                                {new Date(entry.date).toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                            </span>
                            <h1 className="text-3xl md:text-5xl font-display font-bold text-surface-900 dark:text-white leading-tight break-words">
                                {entry.title || "Untitled"}
                            </h1>
                        </div>
                        {moodObj && <div className="text-4xl bg-surface-50 dark:bg-surface-800 p-3 rounded-2xl shadow-sm flex-shrink-0">{moodObj.emoji}</div>}
                    </div>
  
                    {/* Content */}
                    <div className="prose dark:prose-invert prose-lg md:prose-xl prose-p:text-surface-600 dark:prose-p:text-surface-300 prose-p:font-serif prose-headings:font-display mb-12 max-w-none">
                        {entry.content.split('\n').map((p, i) => <p key={i}>{p}</p>)}
                    </div>

                    {/* Checklist */}
                    {entry.checklist && entry.checklist.length > 0 && (
                        <div className="bg-brand-50/50 dark:bg-brand-900/10 rounded-3xl p-6 md:p-8 mb-12 border border-brand-100 dark:border-brand-900/20">
                             <h4 className="font-bold text-brand-400 text-xs uppercase tracking-widest mb-4 flex items-center gap-2">
                                <CheckSquare className="w-4 h-4" /> Checklist
                             </h4>
                             <div className="space-y-3">
                                 {entry.checklist.map((item, i) => (
                                     <div key={i} className="flex items-center gap-3">
                                         {item.checked ? <CheckSquare className="text-brand-500 w-5 h-5 flex-shrink-0" /> : <Square className="text-brand-300 w-5 h-5 flex-shrink-0" />}
                                         <span className={`font-medium ${item.checked ? 'line-through text-brand-400' : 'text-surface-700 dark:text-surface-200'}`}>{item.text}</span>
                                     </div>
                                 ))}
                             </div>
                        </div>
                    )}
  
                    {/* Gallery */}
                    {entry.attachments && entry.attachments.length > 0 && (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 pb-20 md:pb-0">
                            {entry.attachments.map(att => (
                                <div key={att.id} onClick={() => setLightboxUrl(att.webViewLink)} className="aspect-square rounded-2xl overflow-hidden bg-surface-100 cursor-zoom-in hover:opacity-90 transition-opacity">
                                    <SecureImage fileId={att.id} thumbnailUrl={att.thumbnailLink} alt="" className="w-full h-full object-cover" />
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </article>
        </div>

        {/* Lightbox */}
        {lightboxUrl && (
             <div className="fixed inset-0 z-[60] bg-black/95 flex items-center justify-center p-4 animate-in fade-in" onClick={() => setLightboxUrl(null)}>
                 <img src={lightboxUrl} className="max-w-full max-h-full rounded-lg shadow-2xl" />
                 <button className="absolute top-4 right-4 text-white bg-white/20 p-2 rounded-full hover:bg-white/30"><X /></button>
             </div>
        )}
      </div>
    );
  };

// --- Main App ---

const App: React.FC = () => {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [view, setView] = useState<ViewState>({ type: 'LOGIN' }); 
  const [isLoading, setIsLoading] = useState(false);
  const [activeEntryData, setActiveEntryData] = useState<JournalEntry | undefined>(undefined);
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('theme') === 'dark');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    localStorage.setItem('theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  useEffect(() => {
      const cfg: GoogleConfig = {
          clientId: GOOGLE_CLIENT_ID,
          apiKey: GOOGLE_API_KEY
      };
      initializeDrive(cfg);
  }, []);

  const initializeDrive = async (cfg: GoogleConfig) => {
    setIsLoading(true);
    try {
        await DriveService.init(cfg);
        if (DriveService.restoreSession()) await refreshEntries();
        else setView({ type: 'LOGIN' });
    } catch (e) {
        console.error(e);
        setView({ type: 'LOGIN' });
    } finally {
        setIsLoading(false);
    }
  };

  const refreshEntries = async () => {
    setIsLoading(true);
    try {
        const list = await DriveService.listEntries();
        setEntries(list);
        setView({ type: 'LIST' });
    } catch(e) { console.error(e); } 
    finally { setIsLoading(false); }
  };

  const handleReadEntry = async (id: string) => {
      setIsLoading(true);
      setView({ type: 'READ', id });
      const meta = entries.find(e => e.id === id);
      if(meta) {
          try {
              const content = await DriveService.getEntryContent(id);
              if(content.attachments.length > 0 && !meta.coverImageId) {
                  DriveService.updateCoverImage(id, content.attachments[0].id, content.attachments[0].thumbnailLink);
                  const updated = { ...meta, ...content, coverImageId: content.attachments[0].id, coverImage: content.attachments[0].thumbnailLink };
                  setActiveEntryData(updated);
                  setEntries(prev => prev.map(e => e.id === id ? updated : e));
              } else {
                  setActiveEntryData({ ...meta, ...content });
              }
          } catch(e) { console.error(e); }
      }
      setIsLoading(false);
  };

  const handleSaveEntry = async (data: any, isUpdate = false) => {
      const base = isUpdate && activeEntryData ? activeEntryData : { id: '', updatedAt: '' };
      const entry: JournalEntry = { ...base, ...data, updatedAt: new Date().toISOString() };
      
      try {
          const res = await DriveService.saveEntry(entry, data.files);
          const finalEntry = { ...entry, id: res.id, coverImageId: res.coverImageId, coverImage: res.coverImage };
          
          if(isUpdate) {
               setEntries(p => p.map(e => e.id === entry.id ? finalEntry : e));
               setActiveEntryData(finalEntry);
               setView({ type: 'READ', id: entry.id });
          } else {
               setEntries(p => [finalEntry, ...p]);
               setView({ type: 'LIST' });
               setTimeout(refreshEntries, 1000);
          }
      } catch(e) { alert("Save failed"); console.error(e); }
  };

  const handleDelete = async (id: string) => {
      if(!confirm("Delete this memory forever?")) return;
      await DriveService.deleteEntry(id);
      setEntries(p => p.filter(e => e.id !== id));
      setView({ type: 'LIST' });
  };

  const handleSignOut = () => {
      DriveService.signOut();
      setView({ type: 'LOGIN' });
  };

  const renderView = () => {
      switch(view.type) {
          case 'LOGIN': return <LoginView onLogin={() => DriveService.signIn().then(refreshEntries)} />;
          case 'LIST': 
          case 'SETTINGS':
            return (
                <div className="flex h-[100dvh] overflow-hidden bg-[#F8F9FC] dark:bg-[#121214]">
                    <Sidebar 
                      activeView="LIST" 
                      onChangeView={(t) => { if (t !== 'EDIT' && t !== 'READ') setView({type: t} as ViewState); }} 
                      onToggleTheme={() => setDarkMode(!darkMode)} 
                      isDark={darkMode} 
                      onSignOut={handleSignOut} 
                    />
                    <EntryListView entries={entries} onSelect={handleReadEntry} onCreate={() => setView({type: 'CREATE'})} searchTerm={searchTerm} onSearchChange={setSearchTerm} isLoading={isLoading} />
                    <MobileNav 
                      onChangeView={(t) => { if (t !== 'EDIT' && t !== 'READ') setView({type: t} as ViewState); }} 
                      activeView={view.type} 
                    />
                    {view.type === 'SETTINGS' && (
                        <MobileSettingsView 
                            onBack={() => setView({type: 'LIST'})}
                            isDark={darkMode}
                            onToggleTheme={() => setDarkMode(!darkMode)}
                            onSignOut={handleSignOut}
                        />
                    )}
                </div>
            );
          case 'CREATE': 
             return <EntryEditorView onSave={d => handleSaveEntry(d, false)} onCancel={() => setView({type: 'LIST'})} />;
          case 'EDIT': 
             return <EntryEditorView initialData={activeEntryData} onSave={d => handleSaveEntry(d, true)} onCancel={() => setView({type: 'READ', id: activeEntryData!.id})} onDeleteAttachment={async (aid) => { 
                 if(!confirm("Delete image?")) return; 
                 await DriveService.deleteFile(aid); 
                 setActiveEntryData(p => p ? ({...p, attachments: p.attachments?.filter(a => a.id !== aid)}) : undefined); 
             }} />;
          case 'READ': 
             return <EntryReaderView entry={activeEntryData!} onBack={() => setView({type: 'LIST'})} onEdit={() => setView({type: 'EDIT', id: activeEntryData!.id})} onDelete={() => handleDelete(activeEntryData!.id)} isLoading={isLoading} />;
          default: return null;
      }
  };

  return (
    <div className="antialiased">
        {renderView()}
    </div>
  );
};

export default App;
