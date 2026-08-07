import { useState, useEffect } from "react";
import type { StorageData } from "../storage/chatStorage";
import { loadStorageData, saveStorageData } from "../storage/chatStorage";

export function useStoredMessages() {
  const [storageData, setStorageData] = useState<StorageData | null>(
    loadStorageData,
  );
  const [saveFailed, setSaveFailed] = useState(false);

  useEffect(() => {
    if (storageData === null) return;
    const isSuccess = saveStorageData(storageData);
    setSaveFailed(!isSuccess);
  }, [storageData]);

  return { storageData, setStorageData, saveFailed };
}
