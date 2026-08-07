type FormAlertProps = {
  id?: string;
  message: string | null;
};

export function FormAlert({ id, message }: FormAlertProps) {
  if (!message) return null;

  return (
    <p id={id} className="form-error" role="alert">
      {message}
    </p>
  );
}
