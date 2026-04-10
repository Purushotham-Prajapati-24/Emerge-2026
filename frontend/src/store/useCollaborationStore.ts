import { create } from 'zustand';

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: string;
  seenBy: string[]; // List of user IDs who have seen this message
}

interface CollabUser {
  id: string;
  name: string;
  color: string;
}

export interface FileNode {
  id: string;
  name: string;
  language: string;
  isMain?: boolean;
}

interface CollaborationState {
  users: CollabUser[];
  messages: Message[];
  files: FileNode[];
  activeFileId: string | null;
  terminalOutput: string;
  
  setUsers: (users: CollabUser[]) => void;
  addMessage: (msg: Message) => void;
  setMessages: (msgs: Message[]) => void;
  setFiles: (files: FileNode[]) => void;
  setActiveFileId: (fileId: string | null) => void;
  appendTerminal: (text: string) => void;
}

export const useCollaborationStore = create<CollaborationState>((set) => ({
  users: [],
  messages: [],
  files: [],
  activeFileId: null,
  terminalOutput: '',

  setUsers: (users) => set({ users }),
  
  addMessage: (msg) => set((state) => ({ 
    messages: [...state.messages, msg] 
  })),

  setMessages: (messages) => set({ messages }),

  setFiles: (files) => set({ files }),

  setActiveFileId: (activeFileId) => set({ activeFileId }),

  appendTerminal: (text) => set((state) => ({ 
    terminalOutput: state.terminalOutput + text 
  })),
}));
