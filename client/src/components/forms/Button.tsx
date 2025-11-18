import type { ButtonProps } from "@interfaces/ui";

const baseStyles =
  "bg-[#003366] text-white rounded-full p-3 font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus:ring-2 focus:outline-none focus:ring-blue-500 hover:cursor-pointer";

const Button: React.FC<ButtonProps> = ({
  label = "Button",
  disabled = false,
  variant = "primary",
  className = "",
  onClick,
  ...rest
}) => {
  const Styles = {
    primary: `${baseStyles} hover:bg-[#003333]`,
    secondary: `${baseStyles} bg-[#00336660] hover:bg-[#00336690]`,
  }[variant];
  return (
    <button
      onClick={onClick}
      className={`${Styles} ${className}`}
      disabled={disabled}
      {...rest}
    >
      {label}
    </button>
  );
};

export default Button;
