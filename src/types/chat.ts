export interface ChatMessage {
  id: string;
  text: string;
  sentAt: string;
  sentAtNew: string;
  isEdited?: boolean;
}
