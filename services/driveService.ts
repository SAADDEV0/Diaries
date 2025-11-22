import { JournalEntry, JournalAttachment, GoogleConfig, ChecklistItem } from '../types';

const SCOPES = 'https://www.googleapis.com/auth/drive.file';
const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest';
const ROOT_FOLDER_NAME = 'My Journal';
const STORAGE_TOKEN_KEY = 'mindflow_google_token';

declare global {
  interface Window {
    gapi: any;
    google: any;
  }
}

// Helper to convert images to PNG
const convertImageToPng = (file: File): Promise<File> => {
  return new Promise((resolve, reject) => {
    // If already PNG, return as is
    if (file.type === 'image/png') {
      resolve(file);
      return;
    }

    const img = document.createElement('img');
    const url = URL.createObjectURL(file);
    
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        canvas.toBlob((blob) => {
          if (blob) {
            const lastDot = file.name.lastIndexOf('.');
            const nameWithoutExt = lastDot === -1 ? file.name : file.name.substring(0, lastDot);
            const name = `${nameWithoutExt}.png`;
            const newFile = new File([blob], name, { type: 'image/png' });
            resolve(newFile);
          } else {
            reject(new Error('Canvas conversion failed'));
          }
          URL.revokeObjectURL(url);
        }, 'image/png');
      } else {
        reject(new Error('Could not get canvas context'));
      }
    };
    
    img.onerror = (e) => {
      URL.revokeObjectURL(url);
      reject(e);
    };
    
    img.src = url;
  });
};

export const DriveService = {
  tokenClient: null as any,
  accessToken: null as string | null,
  isInitialized: false,

  // --- Initialization & Auth ---

  init: async (config: GoogleConfig): Promise<void> => {
    // Helper to wait for Google scripts to load
    const waitForScripts = () => new Promise<void>((resolve) => {
      const check = () => {
        if (window.gapi && window.google) {
          resolve();
        } else {
          setTimeout(check, 100); // Check every 100ms
        }
      };
      check();
    });

    await waitForScripts();

    return new Promise((resolve, reject) => {
      window.gapi.load('client', async () => {
        try {
          await window.gapi.client.init({
            apiKey: config.apiKey,
            discoveryDocs: [DISCOVERY_DOC],
          });

          DriveService.tokenClient = window.google.accounts.oauth2.initTokenClient({
            client_id: config.clientId,
            scope: SCOPES,
            callback: (response: any) => {
              if (response.error !== undefined) {
                throw response;
              }
              DriveService.handleTokenResponse(response);
            },
          });

          DriveService.isInitialized = true;
          resolve();
        } catch (err) {
          reject(err);
        }
      });
    });
  },

  // Helper to handle and save token
  handleTokenResponse: (response: any) => {
    DriveService.accessToken = response.access_token;
    // Calculate expiry time (default 1 hour)
    const expiresIn = response.expires_in || 3599;
    const expiryTime = Date.now() + expiresIn * 1000;

    localStorage.setItem(STORAGE_TOKEN_KEY, JSON.stringify({
      token: response,
      expiry: expiryTime
    }));
  },

  // Attempt to restore session from localStorage
  restoreSession: (): boolean => {
    const stored = localStorage.getItem(STORAGE_TOKEN_KEY);
    if (!stored) return false;

    try {
      const { token, expiry } = JSON.parse(stored);
      // Check if token is valid (with 5 minute buffer)
      if (Date.now() < expiry - 5 * 60 * 1000) {
        // Restore token to gapi client
        window.gapi.client.setToken(token);
        DriveService.accessToken = token.access_token;
        return true;
      }
    } catch (e) {
      console.error("Failed to parse stored token", e);
    }

    // If invalid or expired, clear it
    localStorage.removeItem(STORAGE_TOKEN_KEY);
    return false;
  },

  signIn: (): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (!DriveService.tokenClient) {
        reject(new Error('Drive Service not initialized'));
        return;
      }

      // Override callback for this specific sign-in request
      DriveService.tokenClient.callback = (resp: any) => {
        if (resp.error) {
          reject(resp);
        } else {
          DriveService.handleTokenResponse(resp);
          resolve();
        }
      };

      if (window.gapi.client.getToken() === null) {
        DriveService.tokenClient.requestAccessToken({ prompt: 'consent' });
      } else {
        DriveService.tokenClient.requestAccessToken({ prompt: '' });
      }
    });
  },

  signOut: () => {
    const token = window.gapi.client.getToken();
    if (token !== null) {
      window.google.accounts.oauth2.revoke(token.access_token);
      window.gapi.client.setToken('');
      DriveService.accessToken = null;
    }
    localStorage.removeItem(STORAGE_TOKEN_KEY);
  },

  getIsLoggedIn: () => {
    return !!DriveService.accessToken;
  },

  // --- Folder Management ---

  findFile: async (name: string, parentId: string = 'root', mimeType?: string): Promise<any | null> => {
    let query = `name = '${name}' and '${parentId}' in parents and trashed = false`;
    if (mimeType) {
      query += ` and mimeType = '${mimeType}'`;
    }
    
    try {
      const response = await window.gapi.client.drive.files.list({
        q: query,
        fields: 'files(id, name, parents)',
        spaces: 'drive',
      });
      return response.result.files[0] || null;
    } catch (e) {
      console.error("Error finding file:", e);
      return null;
    }
  },

  createFolder: async (name: string, parentId: string = 'root'): Promise<string> => {
    const fileMetadata = {
      name,
      mimeType: 'application/vnd.google-apps.folder',
      parents: [parentId],
    };

    const response = await window.gapi.client.drive.files.create({
      resource: fileMetadata,
      fields: 'id',
    });

    return response.result.id;
  },

  getOrCreateFolder: async (name: string, parentId: string = 'root'): Promise<string> => {
    const existing = await DriveService.findFile(name, parentId, 'application/vnd.google-apps.folder');
    if (existing) return existing.id;
    return await DriveService.createFolder(name, parentId);
  },

  ensureDatePath: async (dateStr: string): Promise<{ dayFolderId: string, imagesFolderId: string }> => {
    const date = new Date(dateStr);
    const year = date.getFullYear().toString();
    const monthName = date.toLocaleString('default', { month: 'long' });
    const monthIndex = date.getMonth() + 1;
    const monthFolder = `${monthIndex} ${monthName}`;
    const day = date.getDate().toString();

    const rootId = await DriveService.getOrCreateFolder(ROOT_FOLDER_NAME);
    const yearId = await DriveService.getOrCreateFolder(year, rootId);
    const monthId = await DriveService.getOrCreateFolder(monthFolder, yearId);
    const dayId = await DriveService.getOrCreateFolder(day, monthId);
    const imagesId = await DriveService.getOrCreateFolder('images', dayId);

    return { dayFolderId: dayId, imagesFolderId: imagesId };
  },

  // --- Entry Operations ---

  listEntries: async (searchText?: string): Promise<JournalEntry[]> => {
    // Query by appProperty instead of name to allow custom titles/filenames
    // This works for both old 'notes.md' files and new titled files
    let query = "appProperties has { key='type' and value='journal-entry' } and trashed = false";
    
    if (searchText) {
      const safeSearch = searchText.replace(/'/g, "\\'");
      query += ` and fullText contains '${safeSearch}'`;
    }

    try {
      const response = await window.gapi.client.drive.files.list({
        q: query,
        fields: 'files(id, name, appProperties, createdTime, modifiedTime)',
        spaces: 'drive',
        pageSize: 100
      });

      const files = response.result.files || [];
      const entries: JournalEntry[] = [];

      for (const file of files) {
        const date = file.appProperties?.journalDate || file.createdTime;
        const title = file.appProperties?.title || file.name.replace(/\.md$/i, '') || 'Untitled Entry';
        const mood = file.appProperties?.mood;
        const coverImage = file.appProperties?.coverImage;
        const coverImageId = file.appProperties?.coverImageId;
        
        entries.push({
          id: file.id,
          title: title,
          content: '', // Loaded on demand
          mood: mood,
          date: date,
          updatedAt: file.modifiedTime,
          coverImage: coverImage,
          coverImageId: coverImageId,
        });
      }
      
      // Client-side sort to ensure correct order despite index lag
      return entries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
    } catch (e) {
      console.error("Error listing entries", e);
      return [];
    }
  },

  getEntryContent: async (fileId: string): Promise<{ content: string, attachments: JournalAttachment[], checklist: ChecklistItem[] }> => {
    try {
      // 1. Get Content
      const response = await window.gapi.client.drive.files.get({
        fileId: fileId,
        alt: 'media',
      });
      let content = response.body;

      // Parse content to strip metadata header if present
      // Check for our format: Title: ... \n Date: ... \n Mood: ...
      const lines = content.split('\n');
      if (lines.length >= 3 && 
          lines[0].startsWith('Title: ') && 
          lines[1].startsWith('Date: ') && 
          lines[2].startsWith('Mood: ')) {
          
          // Metadata detected. 
          // Find where content starts (usually after an empty line at index 3)
          let startIndex = 3;
          if (lines[startIndex] === '') {
            startIndex = 4;
          }
          content = lines.slice(startIndex).join('\n');
      }

      // Parse Checklist if present
      const checklist: ChecklistItem[] = [];
      const checklistMarker = '\n## Checklist\n';
      const checklistIndex = content.indexOf(checklistMarker);

      if (checklistIndex !== -1) {
          const checklistStr = content.substring(checklistIndex + checklistMarker.length);
          content = content.substring(0, checklistIndex).trim(); // Remove checklist from main content
          
          checklistStr.split('\n').forEach((line: string) => {
              const match = line.match(/^- \[(x| )\] (.*)/);
              if (match) {
                  checklist.push({
                      checked: match[1] === 'x',
                      text: match[2]
                  });
              }
          });
      }

      // 2. Get Attachments
      const fileMeta = await window.gapi.client.drive.files.get({
        fileId: fileId,
        fields: 'parents'
      });
      
      const parentId = fileMeta.result.parents?.[0];
      let attachments: JournalAttachment[] = [];

      if (parentId) {
        const imagesFolder = await DriveService.findFile('images', parentId, 'application/vnd.google-apps.folder');
        
        if (imagesFolder) {
          const imgs = await window.gapi.client.drive.files.list({
            q: `'${imagesFolder.id}' in parents and trashed = false`,
            fields: 'files(id, name, mimeType, webViewLink, webContentLink, thumbnailLink)',
          });
          attachments = imgs.result.files as JournalAttachment[];
        }
      }

      return { content, attachments, checklist };
    } catch (e) {
      console.error("Error loading content", e);
      return { content: "Error loading content. Please check your internet connection.", attachments: [], checklist: [] };
    }
  },

  // Updates only the metadata of a file (for lazy fixing cover images)
  updateCoverImage: async (fileId: string, coverImageId: string, coverImageLink?: string): Promise<void> => {
      try {
        await window.gapi.client.drive.files.update({
            fileId: fileId,
            resource: {
                appProperties: { 
                    coverImageId: coverImageId,
                    coverImage: coverImageLink
                }
            }
        });
      } catch(e) {
          console.error("Failed to update cover image metadata", e);
      }
  },

  saveEntry: async (entry: JournalEntry, filesToUpload: File[]): Promise<{ id: string, coverImageId?: string, coverImage?: string }> => {
    const { dayFolderId, imagesFolderId } = await DriveService.ensureDatePath(entry.date);

    // Generate clean filename from title
    const safeTitle = (entry.title || 'Untitled').replace(/[/\\?%*:|"<>\.]/g, '-');
    const fileName = `${safeTitle}.md`;

    // Format current time to Moroccan Timezone (Africa/Casablanca)
    // Using en-GB to get DD/MM/YYYY format, but enforcing the timezone
    const moroccanDate = new Date().toLocaleString('en-GB', {
      timeZone: 'Africa/Casablanca',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    }).replace(',', '');

    // Prepare checklist content
    let checklistContent = '';
    if (entry.checklist && entry.checklist.length > 0) {
        checklistContent = '\n\n## Checklist\n' + entry.checklist.map(item => 
            `- [${item.checked ? 'x' : ' '}] ${item.text}`
        ).join('\n');
    }

    // Prepare formatted content with metadata header
    const formattedContent = `Title: ${entry.title}
Date: ${moroccanDate}
Mood: ${entry.mood || 'None'}

${entry.content}${checklistContent}`;

    const fileMetadata = {
      name: fileName,
      mimeType: 'text/markdown',
      parents: [dayFolderId],
      appProperties: {
        type: 'journal-entry',
        journalDate: entry.date,
        title: entry.title,
        mood: entry.mood || ''
      }
    };

    let fileId = entry.id;

    // Check for existing legacy file if we don't have an ID
    if (!fileId) {
      const existing = await DriveService.findFile('notes.md', dayFolderId);
      if (existing) fileId = existing.id;
    }

    if (fileId) {
      // --- UPDATE EXISTING ---
      
      // 1. Check if we need to move the file to the new date folder
      const currentFile = await window.gapi.client.drive.files.get({
           fileId: fileId,
           fields: 'parents'
      });
      const currentParents = currentFile.result.parents || [];
      
      if (!currentParents.includes(dayFolderId)) {
           const previousParents = currentParents.join(',');
           await window.gapi.client.drive.files.update({
               fileId: fileId,
               addParents: dayFolderId,
               removeParents: previousParents,
               fields: 'id, parents'
           });
      }

      // 2. Update Content (using formattedContent)
      await window.gapi.client.request({
        path: `/upload/drive/v3/files/${fileId}`,
        method: 'PATCH',
        params: { uploadType: 'media' },
        body: formattedContent
      });
      
      // 3. Update Metadata
      await window.gapi.client.drive.files.update({
        fileId: fileId,
        resource: {
          name: fileName,
          appProperties: { 
            title: entry.title, 
            journalDate: entry.date,
            mood: entry.mood || ''
          }
        }
      });
    } else {
      // --- CREATE NEW ---
      const boundary = '-------314159265358979323846';
      const delimiter = "\r\n--" + boundary + "\r\n";
      const close_delim = "\r\n--" + boundary + "--";

      const multipartRequestBody =
        delimiter +
        'Content-Type: application/json\r\n\r\n' +
        JSON.stringify(fileMetadata) +
        delimiter +
        'Content-Type: text/markdown\r\n' +
        '\r\n' +
        formattedContent +
        close_delim;

      const request = await window.gapi.client.request({
        path: '/upload/drive/v3/files',
        method: 'POST',
        params: { uploadType: 'multipart' },
        headers: { 'Content-Type': 'multipart/related; boundary="' + boundary + '"' },
        body: multipartRequestBody
      });
      
      fileId = request.result.id;
    }

    // 3. Upload Images (Converted to PNG if needed) & Capture first ID
    let coverImageIdToSet: string | undefined = undefined;
    let coverImageLinkToSet: string | undefined = undefined;

    for (const rawFile of filesToUpload) {
       let fileToUpload = rawFile;
       if (rawFile.type.startsWith('image/')) {
         try {
           fileToUpload = await convertImageToPng(rawFile);
         } catch (e) {
           console.warn("Image conversion failed, uploading original", e);
         }
       }

       const metadata = {
         name: fileToUpload.name,
         parents: [imagesFolderId]
       };
       
       const accessToken = window.gapi.auth.getToken().access_token;
       const form = new FormData();
       form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
       form.append('file', fileToUpload);

       // Important: Request fields=id,thumbnailLink so we can use it immediately
       const uploadRes = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,thumbnailLink', {
         method: 'POST',
         headers: new Headers({ 'Authorization': 'Bearer ' + accessToken }),
         body: form
       });
       
       if (uploadRes.ok) {
            const data = await uploadRes.json();
            if (!coverImageIdToSet) {
                coverImageIdToSet = data.id;
                coverImageLinkToSet = data.thumbnailLink;
            }
       }
    }

    // 4. UPDATE COVER IMAGE
    // Logic: Use newly uploaded ID if available, otherwise try to find existing one if none set
    let finalCoverId = coverImageIdToSet || entry.coverImageId;
    let finalCoverLink = coverImageLinkToSet || entry.coverImage;

    // If we don't have a cover yet (not in entry, not uploaded), check the folder
    if (!finalCoverId) {
        try {
            const imgs = await window.gapi.client.drive.files.list({
                q: `'${imagesFolderId}' in parents and trashed = false and mimeType contains 'image/'`,
                fields: 'files(id, thumbnailLink)',
                pageSize: 1
            });
            if (imgs.result.files?.[0]) {
                finalCoverId = imgs.result.files[0].id;
                finalCoverLink = imgs.result.files[0].thumbnailLink;
            }
        } catch (e) {
            console.warn("Failed to list images for cover", e);
        }
    }

    // Only update if we found something different or new
    if (finalCoverId && finalCoverId !== entry.coverImageId) {
        try {
            await window.gapi.client.drive.files.update({
                fileId: fileId,
                resource: {
                    appProperties: { 
                        coverImage: finalCoverLink,
                        coverImageId: finalCoverId
                    }
                }
            });
        } catch(e) {
            console.error("Failed to update final cover image", e);
        }
    }

    return { id: fileId, coverImageId: finalCoverId, coverImage: finalCoverLink };
  },

  deleteEntry: async (fileId: string): Promise<void> => {
    const fileMeta = await window.gapi.client.drive.files.get({
      fileId: fileId,
      fields: 'parents'
    });
    
    const parentId = fileMeta.result.parents?.[0];
    if (parentId) {
       await window.gapi.client.drive.files.delete({
         fileId: parentId
       });
    }
  },

  deleteFile: async (fileId: string): Promise<void> => {
    await window.gapi.client.drive.files.delete({
      fileId: fileId
    });
  },

  // Generalized fetch for authenticated Drive content (works for thumbnails and media)
  fetchAuthenticatedBlob: async (url: string): Promise<string> => {
    try {
      const token = window.gapi.client.getToken();
      const accessToken = token ? token.access_token : null;
      if (!accessToken) throw new Error("No access token");

      const response = await fetch(url, {
          headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      
      if (!response.ok) throw new Error(`Failed to fetch content: ${response.statusText}`);
      
      const blob = await response.blob();
      return URL.createObjectURL(blob);
    } catch (e) {
        console.error("Authenticated fetch failed", e);
        throw e;
    }
  },

  downloadMedia: async (fileId: string): Promise<string> => {
    return DriveService.fetchAuthenticatedBlob(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`);
  },

  getThumbnail: async (fileId: string, thumbnailLink?: string): Promise<string> => {
      if (thumbnailLink) {
         try {
           return await DriveService.fetchAuthenticatedBlob(thumbnailLink);
         } catch {
           // fallback
         }
      }
      return DriveService.downloadMedia(fileId);
  }
};
