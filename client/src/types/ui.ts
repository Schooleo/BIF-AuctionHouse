export interface FormField extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  isRequired?: boolean;
  className?: string;
  type?: 'password' | 'text' | 'email' | 'number';
  error?: string;
  disabled?: boolean;
}

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary';
  label?: string;
  disabled?: boolean;
  className?: string;
}

export interface FormCardProps {
  title?: string;
  fields?: FormField[];
  buttonProps?: ButtonProps;
  className?: string;
  onSubmit?: () => void;
  children?: React.ReactNode;
}
