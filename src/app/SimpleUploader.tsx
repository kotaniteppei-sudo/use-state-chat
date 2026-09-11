"use client";

import {
  useAttachmentUpload,
  createFirebaseUploadAdapter,
  AttachmentUploadAdapter,
  RunningAttachmentUpload,
} from "../attachments/useAttachmentUpload";
import type { AttachmentContentType } from "../contracts/attachment";

// 本物の createFirebaseUploadAdapter の代わりになるダミー関数
function createMockUploadAdapter(): AttachmentUploadAdapter {
  return {
    start(fullPath, file, callbacks): RunningAttachmentUpload {
      let progress = 0;
      let isCancelled = false;

      // 0.5秒ごとに進捗を20%ずつ進める擬似タイマー
      const timer = setInterval(() => {
        if (isCancelled) return;

        progress += 0.2;

        if (progress >= 1) {
          clearInterval(timer);
          callbacks.progress(1);
          // 100%になったら成功データを返す
          callbacks.complete({
            fullPath,
            contentType: file.type as AttachmentContentType,
            size: file.size,
            displayName: file.name,
          });
        } else {
          // まだ途中なら進捗率を報告
          callbacks.progress(progress);
        }
      }, 500);

      // キャンセルボタンが押された時の処理
      return {
        cancel: () => {
          isCancelled = true;
          clearInterval(timer);
          callbacks.error("storage/canceled"); // キャンセル扱いとしてエラー報告
          return true;
        },
        unsubscribe: () => {
          clearInterval(timer);
        },
      };
    },
  };
}
// 1. 本物のFirebaseと通信する「アダプター」を準備
const adapter = createMockUploadAdapter();

export function SimpleUploader() {
  // 2. 先ほど作ったフックにアダプターを渡し、状態と操作ボタンを受け取る
  const { state, start, cancel } = useAttachmentUpload(adapter);

  // 3. ファイルが選択された時の処理
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // ※本来は現在のルームIDとログイン中のユーザーIDを渡します
      start("dummy-room-id", "dummy-user-id", file);
    }
  };

  return (
    <div style={{ padding: "20px", border: "1px solid #ccc" }}>
      <h3>簡易アップローダー</h3>

      {/* ----- 待機中・エラー・キャンセル時はファイル選択を表示 ----- */}
      {state.status !== "uploading" && state.status !== "success" && (
        <input
          type="file"
          onChange={handleFileChange}
          accept="image/jpeg, image/png, application/pdf"
        />
      )}

      {/* ----- アップロード中の表示 ----- */}
      {state.status === "uploading" && (
        <div>
          {/* state.progress は 0.5 などの少数なので 100 を掛けて % にする */}
          <p>アップロード中... {Math.round(state.progress * 100)}%</p>

          {/* フックから受け取った cancel 関数をボタンに割り当てる */}
          <button onClick={cancel}>キャンセル</button>
        </div>
      )}

      {/* ----- 成功時の表示 ----- */}
      {state.status === "success" && (
        <div style={{ color: "green" }}>
          <p>アップロード成功！</p>
          <p>保存されたファイル: {state.attachment.displayName}</p>
        </div>
      )}

      {/* ----- エラー時の表示 ----- */}
      {state.status === "error" && (
        <div style={{ color: "red" }}>
          <p>エラー発生: {state.message}</p>
        </div>
      )}

      {/* ----- キャンセル時の表示 ----- */}
      {state.status === "canceled" && <p>アップロードを中止しました。</p>}
    </div>
  );
}
