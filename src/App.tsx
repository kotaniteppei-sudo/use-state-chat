import { useState } from "react";
import "./App.css";
import type { ChatMessage } from "./types/chat";
import { MessageForm } from "./components/MessageForm";
import { MessageList } from "./components/MessageList";
import { useStoredMessages } from "./hooks/useStoredMessages";
import type { VersionRecord } from "./storage/chatStorage";

export default function App() {
  const [draftMessage, setDraftMessage] = useState<string>("");
  const { storageData, setStorageData, saveFailed } = useStoredMessages();

  function handleSend(): boolean {
    const newMessage: ChatMessage = {
      id: Math.random().toString(36).substring(2, 7),
      text: draftMessage.trim(),
      sentAt: new Date().toISOString(),
    };

    function updateStorageData() {
      const nextVersion = storageData ? storageData.currentVersion + 1 : 1;

      const lastRecord =
        storageData && storageData.versions.length > 0
          ? storageData.versions[storageData.versions.length - 1]
          : null;

      const currentMessages = lastRecord ? lastRecord.messages : [];

      const newVersionRecord: VersionRecord = {
        version: nextVersion,
        updateAt: new Date().toISOString(),
        messages: [...currentMessages, newMessage],
      };

      const prevVersions = storageData ? storageData.versions : [];

      return {
        currentVersion: nextVersion,
        versions: [...prevVersions, newVersionRecord],
      };
    }

    setStorageData(updateStorageData);
    setDraftMessage("");
    return true;
  }

  return (
    <>
      <main className="chat-app">
        {saveFailed && (
          <p className="error-banner" role="alert">
            メッセージの保存に失敗しました。
          </p>
        )}
        <MessageList storageData={storageData} />
        <MessageForm
          draftMessage={draftMessage}
          onDraftMessageChange={setDraftMessage}
          onSend={handleSend}
        />
      </main>
    </>
  );
}
