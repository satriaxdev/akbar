export enum Tab {
  CHAT = 'CHAT',
  VISION = 'VISION',
  IMAGE_GEN = 'IMAGE_GEN',
  VOICE = 'VOICE',
}

export type TabType = Tab.CHAT | Tab.VISION | Tab.IMAGE_GEN | Tab.VOICE;

export interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
}
