export interface FormField extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  isRequired?: boolean;
  className?: string;
  type?: "password" | "text" | "email" | "number";
  error?: string;
  disabled?: boolean;
}

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary";
  label?: string;
  disabled?: boolean;
  className?: string;
}

type FieldItem = FormField | React.ReactNode;

export interface FormCardProps {
  title?: string;
  fields?: FieldItem[];
  buttonProps?: ButtonProps;
  className?: string;
  onSubmit?: () => void;
  children?: React.ReactNode;
}

export interface EmailCardProps {
  label?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  otpValue?: string;
  onOtpChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  disabled?: boolean;
  className?: string;
  sendOtpUrl?: string;
  emailError?: string;
  otpError?: string;
}
