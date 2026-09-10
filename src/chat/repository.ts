import { Auth } from "firebase/auth";
import {
  addDoc,
  deleteDoc,
  collection,
  doc,
  limit,
  query,
  serverTimestamp,
  updateDoc,
  orderBy,
  onSnapshot,
  type Firestore,
  type QueryDocumentSnapshot,
  type Unsubscribe,
} from "firebase/firestore";
import {
  chatMessageConverter,
  type ChatMessageDocument,
  type ChatMessage,
} from "./model";

export type SubscribeToRoomMessages = (
  roomId: string,
  onMessages: (messages: ChatMessage[]) => void,
  onError: (error: Error) => void,
) => Unsubscribe;

export function latestMessagesInDisplayOrder(
  docs: readonly QueryDocumentSnapshot<ChatMessageDocument>[],
): ChatMessage[] {
  return docs.map((item) => ({ id: item.id, ...item.data() })).reverse();
}

export function createChatRepository(services: { auth: Auth; db: Firestore }) {
  function messagesCollection(roomId: string) {
    return collection(services.db, "rooms", roomId, "messages").withConverter(
      chatMessageConverter,
    );
  }

  async function createMessage(input: {
    roomId: string;
    text: string;
  }): Promise<string> {
    const user = services.auth.currentUser;
    if (!user) throw new Error("ログインが必要です。");
    const text = input.text.trim();
    if (!text || text.length > 200) throw new Error("本文は1-200文字です。");

    const created = await addDoc(messagesCollection(input.roomId), {
      text,
      senderId: user.uid,
      createdAt: serverTimestamp(),
      updatedAt: null,
    });
    return created.id;
  }

  async function updateMessageText(
    roomId: string,
    messageId: string,
    textInput: string,
  ): Promise<void> {
    const text = textInput.trim();
    if (!text || text.length > 200) throw new Error("本文は1-200文字です。");

    await updateDoc(doc(messagesCollection(roomId), messageId), {
      text,
      updatedAt: serverTimestamp(),
    });
  }

  function deleteMessage(roomId: string, messageId: string): Promise<void> {
    return deleteDoc(doc(messagesCollection(roomId), messageId));
  }

  const subscribeToRoomMessages: SubscribeToRoomMessages = (
    roomId,
    onMessages,
    onError,
  ) => {
    const latest = query(
      messagesCollection(roomId),
      orderBy("createdAt", "desc"),
      limit(50),
    );

    return onSnapshot(
      latest,
      (snapshot) => {
        try {
          onMessages(latestMessagesInDisplayOrder(snapshot.docs));
        } catch (error) {
          onError(
            error instanceof Error ? error : new Error("Invalid message"),
          );
        }
      },
      onError,
    );
  };
  return {
    createMessage,
    updateMessageText,
    deleteMessage,
    subscribeToRoomMessages,
  };
}
