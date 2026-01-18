// removed Message import

export type Role = 'system' | 'user' | 'assistant' | 'data';

export interface MediaAttachment {
  id: string;
  type: 'image' | 'video';
  url: string;
  thumbnailUrl?: string;
  prompt?: string;
}

export interface MessageNode {
  id: string;
  role: Role;
  content: string;
  parentId: string | null;
  childrenIds: string[];
  createdAt: number;
  attachments?: MediaAttachment[];
  visionImages?: string[]; // Vision images for multimodal models

  // Metadata for UI state
  isEditing?: boolean;
  isPinned?: boolean;
}

export interface ChatTree {
  rootId: string | null;
  messages: Record<string, MessageNode>;
  currentLeafId: string | null; // The currently active "end" of the conversation
}
