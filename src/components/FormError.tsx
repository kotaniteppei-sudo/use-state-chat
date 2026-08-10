type FormErrorProps = {
  id?: string;
  children: string;
};

export function FormError({ id, children }: FormErrorProps) {
  return (
    <p id={id} className="form-error notice " role="alert">
      {children}
    </p>
  );
}
