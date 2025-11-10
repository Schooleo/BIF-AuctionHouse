export interface FormField {
  label: string;
  value: string;
  error?: string;
  placeholder?: string;
  type?: string; // text, password, email
}

export interface ButtonProps {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}
