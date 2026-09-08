import { FirebaseError } from "firebase/app";
export function toAuthErrorMessages(error: unknown): string {
  if (!(error instanceof FirebaseError)) {
    return "認証処理に失敗しました。時間を置いて再度お試しください。";
  }

  switch (error.code) {
    case "auth/email-already-in-use":
      return "このメールアドレスは既に登録されています。";
    case "auth/weak-password":
      return "パスワードの要件を満たしていません。";
    case "auth/invalid-email":
      return "メールアドレスの形式を確認してください。";
    case "auth/invalid-credential":
      return "メールアドレスまたはパスワードを確認してください。";
    case "auth/too-many-requests":
      return "試行回数が多すぎます。時間をおいて再度お試しください。";
    default:
      return "認証処理に失敗しました。時間をおいて再度お試しください。";
  }
}
