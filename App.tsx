import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Plus, Search, Calendar, ChevronLeft, 
  Trash2, Edit3, Image as ImageIcon, Loader2, 
  X, Home, User, LayoutGrid, Settings, Check
} from 'lucide-react';
import { JournalEntry, ViewState, GoogleConfig } from './types';
import { DriveService } from './services/driveService';
import { Button, Input, TextArea, Card } from './components/Components';

// --- Constants ---
const GOOGLE_CLIENT_ID = "111426887413-md2gvq2djc7p7qqgp57p5v0s1eichp8b.apps.googleusercontent.com";
const GOOGLE_API_KEY = "AIzaSyA7EBoWEqbAYkTdCDKsm3kD-6vL21CdRkY";

// Modern, flatter mood palette
const MOODS = [
  { id: 'awesome', emoji: '🥰', label: 'Great', bg: 'bg-accent-emerald', text: 'text-accent-emeraldText', border: 'border-accent-emerald' },
  { id: 'happy', emoji: '🙂', label: 'Good', bg: 'bg-accent-amber', text: 'text-accent-amberText', border: 'border-accent-amber' },
  { id: 'okay', emoji: '😐', label: 'Okay', bg: 'bg-accent-slate', text: 'text-accent-slateText', border: 'border-accent-slate' },
  { id: 'bad', emoji: '😶‍🌫️', label: 'Off', bg: 'bg-accent-rose', text: 'text-accent-roseText', border: 'border-accent-rose' },
  { id: 'terrible', emoji: '😫', label: 'Bad', bg: 'bg-accent-violet', text: 'text-accent-violetText', border: 'border-accent-violet' },
];

// --- Sub-Components ---

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

    useEffect(() => {
        if (!fileId && !thumbnailUrl) {
            setIsLoading(false);
            return;
        }

        let active = true;
        setIsLoading(true);

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
              }
           } catch (err) {
                console.warn("Failed to load secure image", err);
                if (active) setIsLoading(false);
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
            <div className={`bg-surface-100 dark:bg-surface-800 flex items-center justify-center animate-pulse ${className}`}>
                <ImageIcon className="w-6 h-6 text-surface-300" />
            </div>
        );
    }
    
    return (
        <img 
            src={finalSrc} 
            alt={alt} 
            className={`${className} ${!finalSrc ? 'opacity-0' : 'opacity-100'} transition-opacity duration-500`}
            loading="lazy"
            onLoad={onLoad}
        />
    );
};

// Glassmorphism Bottom Nav
const BottomNav = ({ 
    activeView, 
    onChangeView 
}: { 
    activeView: ViewState['type'], 
    onChangeView: (v: ViewState['type']) => void 
}) => {
    if (activeView === 'LOGIN' || activeView === 'CREATE' || activeView === 'EDIT') return null;

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 pointer-events-none pb-safe">
            <div className="mx-auto px-6 pb-6 pt-0 max-w-md pointer-events-auto">
                <div className="glass-panel rounded-[2.5rem] shadow-glass border border-white/20 flex items-center justify-between px-8 py-3">
                    <button 
                        onClick={() => onChangeView('LIST')}
                        className={`flex flex-col items-center gap-1 p-2 transition-all duration-300 ${activeView === 'LIST' ? 'text-surface-900 dark:text-white scale-110' : 'text-surface-400 hover:text-surface-600'}`}
                    >
                        <Home className={`w-6 h-6 ${activeView === 'LIST' ? 'fill-current' : ''}`} />
                    </button>

                    <button 
                        onClick={() => onChangeView('CREATE')}
                        className="bg-surface-900 dark:bg-white text-white dark:text-surface-900 w-14 h-14 rounded-full shadow-xl flex items-center justify-center transform -translate-y-6 hover:scale-105 active:scale-95 transition-all border-4 border-surface-50 dark:border-surface-950"
                    >
                        <Plus className="w-7 h-7" />
                    </button>

                    <button 
                        onClick={() => onChangeView('SETTINGS')}
                        className={`flex flex-col items-center gap-1 p-2 transition-all duration-300 ${activeView === 'SETTINGS' ? 'text-surface-900 dark:text-white scale-110' : 'text-surface-400 hover:text-surface-600'}`}
                    >
                        <User className={`w-6 h-6 ${activeView === 'SETTINGS' ? 'fill-current' : ''}`} />
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- Views ---

const LoginView: React.FC<{ onLogin: () => void }> = ({ onLogin }) => (
  <div className="min-h-screen flex flex-col bg-surface-50 dark:bg-surface-950 p-6 relative overflow-hidden">
      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop')] bg-cover bg-center opacity-5 mix-blend-overlay"></div>
      
      <div className="flex-1 flex flex-col items-center justify-center relative z-10 animate-fade-in-up">
          <div className="w-24 h-24 bg-surface-900 dark:bg-white rounded-[2rem] mb-8 flex items-center justify-center shadow-xl rotate-3">
             <Edit3 className="w-10 h-10 text-white dark:text-surface-900" />
          </div>

          <h1 className="text-4xl font-sans font-bold text-surface-900 dark:text-white mb-4 tracking-tight text-center">
              My Diaries
          </h1>
          
          <p className="text-surface-500 dark:text-surface-400 text-center max-w-[260px] leading-relaxed mb-12 font-medium">
              Capture your thoughts, feelings, and memories in a safe, private space.
          </p>

          <Button onClick={onLogin} className="w-full max-w-xs !rounded-full !py-4 text-lg shadow-xl" variant="primary">
              Connect with Google Drive
          </Button>
          
          <p className="text-xs text-surface-400 mt-8 text-center max-w-xs">
              Your data is stored directly in your own Google Drive. We cannot read your entries.
          </p>
      </div>
  </div>
);

const EntryListView: React.FC<{
  entries: JournalEntry[];
  onSelect: (id: string) => void;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  isLoading: boolean;
  userProfile?: any;
}> = ({ entries, onSelect, searchTerm, onSearchChange, isLoading }) => {
  
  const filteredEntries = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return entries.filter(e => 
      e.title.toLowerCase().includes(term) || 
      new Date(e.date).toLocaleDateString().includes(term)
    );
  }, [entries, searchTerm]);

  // Group entries by month/year if list is long, but simple list for now
  
  return (
    <div className="flex-1 h-full overflow-y-auto no-scrollbar bg-surface-50 dark:bg-surface-950 pb-32">
       <div className="px-6 pt-12 pb-6 sticky top-0 z-20 bg-surface-50/90 dark:bg-surface-950/90 backdrop-blur-sm">
           <div className="flex justify-between items-end mb-6">
                <div>
                    <h2 className="text-sm font-bold text-surface-400 uppercase tracking-wider mb-1">Welcome Back</h2>
                    <h1 className="text-3xl font-bold text-surface-900 dark:text-white">Your Journal</h1>
                </div>
                <div className="w-10 h-10 rounded-full bg-surface-200 dark:bg-surface-800 flex items-center justify-center overflow-hidden border-2 border-white dark:border-surface-700 shadow-sm">
                    <User className="w-5 h-5 text-surface-400" />
                </div>
           </div>

           <div className="relative">
               <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" />
               <input 
                 type="text" 
                 placeholder="Search memories..."
                 value={searchTerm}
                 onChange={(e) => onSearchChange(e.target.value)}
                 className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-white dark:bg-surface-900 border-none outline-none shadow-sm text-surface-700 dark:text-surface-200 placeholder:text-surface-400 transition-shadow focus:shadow-md"
               />
           </div>
       </div>

       {isLoading && entries.length === 0 ? (
           <div className="flex flex-col items-center justify-center pt-20 gap-4">
               <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
               <p className="text-surface-400 text-sm font-medium">Syncing with Drive...</p>
           </div>
       ) : (
           <div className="px-6 space-y-5">
               {filteredEntries.length === 0 && !isLoading && (
                   <div className="text-center py-20">
                       <div className="w-16 h-16 bg-surface-100 dark:bg-surface-900 rounded-full flex items-center justify-center mx-auto mb-4">
                           <LayoutGrid className="w-6 h-6 text-surface-300" />
                       </div>
                       <p className="text-surface-400 font-medium">No entries found.</p>
                   </div>
               )}
               
               {filteredEntries.map((entry) => {
                   const dateObj = new Date(entry.date);
                   const day = dateObj.getDate();
                   const month = dateObj.toLocaleDateString('en-US', { month: 'short' });
                   const moodObj = MOODS.find(m => m.id === entry.mood);

                   return (
                       <Card 
                          key={entry.id} 
                          onClick={() => onSelect(entry.id)}
                          className="p-0 animate-fade-in-up group overflow-hidden"
                       >
                           <div className="flex h-full">
                               {/* Left Date Column */}
                               <div className="w-20 flex flex-col items-center justify-center bg-surface-50 dark:bg-surface-900/50 border-r border-surface-100 dark:border-surface-800/50 p-4">
                                   <span className="text-2xl font-bold text-surface-900 dark:text-white">{day}</span>
                                   <span className="text-xs font-bold text-surface-400 uppercase">{month}</span>
                               </div>
                               
                               {/* Content Column */}
                               <div className="flex-1 p-5 min-w-0">
                                   <div className="flex justify-between items-start mb-2">
                                        {moodObj ? (
                                            <span className="text-2xl animate-bounce-slight" title={moodObj.label}>{moodObj.emoji}</span>
                                        ) : (
                                            <div className="w-6 h-6"></div>
                                        )}
                                        {entry.coverImage && (
                                            <div className="w-8 h-8 rounded-lg overflow-hidden ml-2 flex-shrink-0 bg-surface-100">
                                                <SecureImage fileId={entry.coverImageId} thumbnailUrl={entry.coverImage} alt="" className="w-full h-full object-cover" />
                                            </div>
                                        )}
                                   </div>
                                   <h3 className="font-bold text-lg text-surface-900 dark:text-surface-50 truncate mb-1">
                                       {entry.title || "Untitled"}
                                   </h3>
                                   <p className="text-surface-500 dark:text-surface-400 text-sm truncate font-serif">
                                       {entry.content || "No preview available..."}
                                   </p>
                               </div>
                           </div>
                       </Card>
                   );
               })}
           </div>
       )}
    </div>
  );
};

const EntryEditorView: React.FC<{
  initialData?: JournalEntry;
  onSave: (data: any) => Promise<void>;
  onCancel: () => void;
}> = ({ initialData, onSave, onCancel }) => {
  // Single page editor for modern fluid feel
  const [title, setTitle] = useState(initialData?.title || '');
  const [content, setContent] = useState(initialData?.content || '');
  const [date, setDate] = useState(initialData?.date || new Date().toISOString());
  const [mood, setMood] = useState(initialData?.mood || '');
  const [isSaving, setIsSaving] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  
  // Auto-resize title
  const titleRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
      if (titleRef.current) {
          titleRef.current.style.height = 'auto';
          titleRef.current.style.height = titleRef.current.scrollHeight + 'px';
      }
  }, [title]);

  const handleSave = async () => {
      if (!title.trim()) return;
      setIsSaving(true);
      try { await onSave({ title, content, date, mood, files: pendingFiles }); } 
      finally { setIsSaving(false); }
  };

  return (
      <div className="fixed inset-0 z-50 bg-surface-50 dark:bg-surface-950 flex flex-col animate-fade-in">
          {/* Top Bar */}
          <div className="flex items-center justify-between px-6 py-4 bg-surface-50/80 dark:bg-surface-950/80 backdrop-blur-sm z-20 sticky top-0">
              <button onClick={onCancel} className="p-2 -ml-2 rounded-full hover:bg-surface-200 dark:hover:bg-surface-800 text-surface-600 dark:text-surface-300 transition-colors">
                  <X className="w-6 h-6" />
              </button>
              <span className="text-sm font-bold text-surface-400 uppercase tracking-widest">
                  {initialData ? 'Edit Entry' : 'New Entry'}
              </span>
              <button 
                onClick={handleSave} 
                disabled={isSaving || !title} 
                className="p-2 -mr-2 text-brand-600 dark:text-brand-400 disabled:opacity-50 font-bold"
              >
                  {isSaving ? <Loader2 className="w-6 h-6 animate-spin" /> : <Check className="w-6 h-6" />}
              </button>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto pb-safe">
               <div className="max-w-2xl mx-auto px-6 py-4 space-y-8">
                   
                   {/* Date & Mood Row */}
                   <div className="flex flex-wrap items-center gap-4">
                       <div className="relative group">
                           <input 
                             type="date" 
                             value={date.split('T')[0]} 
                             onChange={e => setDate(new Date(e.target.value).toISOString())}
                             className="absolute inset-0 opacity-0 cursor-pointer z-10"
                           />
                           <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 shadow-sm text-surface-600 dark:text-surface-300 text-sm font-medium group-hover:bg-surface-100 transition-colors">
                               <Calendar className="w-4 h-4" />
                               {new Date(date).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}
                           </div>
                       </div>
                   </div>

                   {/* Mood Selector - Horizontal Scroll */}
                   <div className="overflow-x-auto no-scrollbar pb-2 -mx-6 px-6 flex gap-3">
                       {MOODS.map(m => (
                           <button
                               key={m.id}
                               onClick={() => setMood(m.id)}
                               className={`flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-2xl border transition-all duration-300 ${
                                   mood === m.id 
                                   ? `${m.bg} ${m.text} ${m.border} shadow-md scale-105 ring-2 ring-offset-2 ring-offset-surface-50 dark:ring-offset-surface-950 ring-${m.bg.split('-')[1]}-400` 
                                   : 'bg-white dark:bg-surface-900 border-surface-200 dark:border-surface-800 text-surface-500 grayscale hover:grayscale-0'
                               }`}
                           >
                               <span className="text-xl">{m.emoji}</span>
                               <span className="text-sm font-bold">{m.label}</span>
                           </button>
                       ))}
                   </div>

                   {/* Title */}
                   <textarea
                       ref={titleRef}
                       placeholder="Title your day..."
                       value={title}
                       onChange={e => setTitle(e.target.value)}
                       rows={1}
                       className="w-full bg-transparent text-4xl font-bold text-surface-900 dark:text-white placeholder:text-surface-300 dark:placeholder:text-surface-700 border-none outline-none resize-none overflow-hidden"
                   />

                   {/* Editor */}
                   <textarea
                       placeholder="Write your story..."
                       value={content}
                       onChange={e => setContent(e.target.value)}
                       className="w-full min-h-[40vh] bg-transparent text-lg leading-loose font-serif text-surface-700 dark:text-surface-200 placeholder:text-surface-300 dark:placeholder:text-surface-700 border-none outline-none resize-none"
                   />

                   {/* Image Attachments */}
                   <div className="border-t border-surface-200 dark:border-surface-800 pt-6">
                        <label className="inline-flex items-center gap-2 text-sm font-bold text-surface-500 hover:text-brand-600 cursor-pointer transition-colors mb-4">
                            <div className="p-2 bg-surface-100 dark:bg-surface-900 rounded-lg">
                                <ImageIcon className="w-5 h-5" />
                            </div>
                            Add Photos
                            <input type="file" className="hidden" multiple accept="image/*" onChange={e => e.target.files && setPendingFiles(p => [...p, ...Array.from(e.target.files!)])} />
                        </label>

                        {pendingFiles.length > 0 && (
                            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                                {pendingFiles.map((f, i) => (
                                    <div key={i} className="aspect-square relative rounded-2xl overflow-hidden group">
                                        <img src={URL.createObjectURL(f)} className="h-full w-full object-cover" />
                                        <button onClick={() => setPendingFiles(p => p.filter((_, x) => x !== i))} className="absolute top-1 right-1 bg-black/50 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                                            <X className="w-3 h-3" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                   </div>
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
  }> = ({ entry, onBack, onEdit, onDelete }) => {
    const moodObj = MOODS.find(m => m.id === entry.mood);
  
    return (
      <div className="fixed inset-0 z-50 bg-white dark:bg-surface-950 flex flex-col animate-fade-in overflow-y-auto">
          
          {/* Cover Image Hero */}
          <div className="relative h-72 w-full flex-shrink-0 bg-surface-100 dark:bg-surface-900">
             {entry.coverImage || entry.coverImageId ? (
                 <SecureImage 
                    fileId={entry.coverImageId} 
                    thumbnailUrl={entry.coverImage} 
                    fallbackSrc={entry.coverImage?.replace(/=s\d+/, '=s800')} 
                    alt="Cover" 
                    className="w-full h-full object-cover" 
                 />
             ) : (
                 <div className="w-full h-full bg-gradient-to-br from-brand-50 to-brand-100 dark:from-surface-900 dark:to-surface-800 flex items-center justify-center">
                     <div className="text-surface-300 dark:text-surface-700">
                        <ImageIcon className="w-12 h-12 opacity-20" />
                     </div>
                 </div>
             )}
             
             {/* Navigation overlay */}
             <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-start bg-gradient-to-b from-black/40 to-transparent">
                 <button onClick={onBack} className="bg-white/20 backdrop-blur-md text-white p-3 rounded-full hover:bg-white/30 transition-colors">
                     <ChevronLeft className="w-6 h-6" />
                 </button>
                 
                 <div className="flex gap-3">
                     <button onClick={onEdit} className="bg-white/20 backdrop-blur-md text-white p-3 rounded-full hover:bg-white/30 transition-colors">
                         <Edit3 className="w-5 h-5" />
                     </button>
                     <button onClick={onDelete} className="bg-white/20 backdrop-blur-md text-red-200 p-3 rounded-full hover:bg-red-500/30 transition-colors">
                         <Trash2 className="w-5 h-5" />
                     </button>
                 </div>
             </div>

             {/* Mood Badge - Floating */}
             {moodObj && (
                 <div className="absolute -bottom-6 right-8 shadow-lg">
                      <div className={`flex items-center gap-2 px-5 py-3 rounded-2xl bg-white dark:bg-surface-800 border border-surface-100 dark:border-surface-700`}>
                          <span className="text-2xl">{moodObj.emoji}</span>
                          <span className="font-bold text-sm text-surface-600 dark:text-surface-300">{moodObj.label}</span>
                      </div>
                 </div>
             )}
          </div>

          {/* Content Body */}
          <div className="px-8 pt-10 pb-24 max-w-2xl mx-auto w-full">
               <div className="mb-8 border-b border-surface-100 dark:border-surface-800 pb-8">
                   <p className="text-surface-400 font-bold uppercase tracking-widest text-xs mb-3">
                       {new Date(entry.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                   </p>
                   <h1 className="text-3xl md:text-4xl font-bold text-surface-900 dark:text-white leading-tight">
                       {entry.title}
                   </h1>
               </div>

               <div className="prose prose-lg dark:prose-invert prose-p:text-surface-600 dark:prose-p:text-surface-300 font-serif leading-loose max-w-none">
                   {entry.content.split('\n').map((p, i) => (
                       p.trim() ? <p key={i}>{p}</p> : <br key={i}/>
                   ))}
               </div>
          </div>
      </div>
    );
  };

// --- Main App ---

const App: React.FC = () => {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [view, setView] = useState<ViewState>({ type: 'LOGIN' }); 
  const [isLoading, setIsLoading] = useState(false);
  const [activeEntryData, setActiveEntryData] = useState<JournalEntry | undefined>(undefined);
  const [searchTerm, setSearchTerm] = useState('');

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
      setView({ type: 'READ', id });
      const meta = entries.find(e => e.id === id);
      if(meta) {
          try {
              const content = await DriveService.getEntryContent(id);
              const updated = { ...meta, ...content };
              if(content.attachments.length > 0 && !meta.coverImageId) {
                  updated.coverImageId = content.attachments[0].id;
                  updated.coverImage = content.attachments[0].thumbnailLink;
              }
              setActiveEntryData(updated);
          } catch(e) { console.error(e); }
      }
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
      if(!confirm("Delete this memory?")) return;
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
                <>
                    <EntryListView entries={entries} onSelect={handleReadEntry} searchTerm={searchTerm} onSearchChange={setSearchTerm} isLoading={isLoading} />
                    
                    {/* Settings Modal Overlay */}
                    {view.type === 'SETTINGS' && (
                         <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4">
                             <div className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in" onClick={() => setView({type: 'LIST'})}></div>
                             <div className="bg-white dark:bg-surface-900 w-full sm:max-w-sm rounded-t-[2rem] sm:rounded-[2.5rem] p-8 shadow-2xl animate-slide-up relative z-10">
                                 <div className="w-12 h-1.5 bg-surface-200 dark:bg-surface-700 rounded-full mx-auto mb-8"></div>
                                 <h2 className="text-2xl font-bold mb-2 dark:text-white">Settings</h2>
                                 <p className="text-surface-500 mb-8">Manage your account and preferences.</p>
                                 
                                 <div className="space-y-3">
                                    <Button variant="secondary" className="w-full justify-start" icon={Settings}>Preferences (Coming Soon)</Button>
                                    <Button variant="danger" onClick={handleSignOut} className="w-full !rounded-2xl justify-start">
                                        <div className="flex items-center w-full">
                                            <span className="flex-1 text-left">Sign Out</span>
                                        </div>
                                    </Button>
                                 </div>
                             </div>
                         </div>
                    )}
                    <BottomNav activeView={view.type} onChangeView={(t) => setView({type: t} as ViewState)} />
                </>
            );
          case 'CREATE': 
             return <EntryEditorView onSave={d => handleSaveEntry(d, false)} onCancel={() => setView({type: 'LIST'})} />;
          case 'EDIT': 
             return <EntryEditorView initialData={activeEntryData} onSave={d => handleSaveEntry(d, true)} onCancel={() => setView({type: 'READ', id: activeEntryData!.id})} />;
          case 'READ': 
             return <EntryReaderView entry={activeEntryData!} onBack={() => setView({type: 'LIST'})} onEdit={() => setView({type: 'EDIT', id: activeEntryData!.id})} onDelete={() => handleDelete(activeEntryData!.id)} />;
          default: return null;
      }
  };

  return (
    <div className="antialiased h-screen w-full max-w-md mx-auto bg-surface-50 dark:bg-surface-950 shadow-2xl overflow-hidden relative flex flex-col border-x border-surface-200 dark:border-surface-800">
        {renderView()}
    </div>
  );
};

export default App;
