

export interface JournalEntry {
  id: string; // This will be the Drive File ID for notes.md
  title: string;
  content: string;
  mood?: string; // 'happy', 'sad', 'neutral', etc.
  date: string; // ISO String
  updatedAt: string; // ISO String
  attachments?: JournalAttachment[];
  coverImage?: string;
  coverImageId?: string; // Permanent File ID for the cover image
  checklist?: ChecklistItem[];
}

export interface ChecklistItem {
  text: string;
  checked: boolean;
}

export interface JournalAttachment {
  id: string;
  name: string;
  mimeType: string;
  webViewLink: string;
  webContentLink?: string; // Direct download link
  thumbnailLink?: string;
}

export type ViewState = 
  | { type: 'LIST' }
  | { type: 'CREATE' }
  | { type: 'EDIT'; id: string }
  | { type: 'READ'; id: string }
  | { type: 'SETUP' }
  | { type: 'LOGIN' };

export interface ThemeContextType {
  isDark: boolean;
  toggleTheme: () => void;
}

// Google API Types (Simplified)
export interface GoogleConfig {
  clientId: string;
  apiKey: string;
}