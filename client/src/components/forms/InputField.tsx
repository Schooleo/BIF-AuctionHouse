import type { FormField } from "@interfaces/ui";

const InputField: React.FC<FormField> = ({
  label,
  type = "text",
  className = "",
  isRequired = false,
  error = "",
  disabled = false,
  ...rest
}) => {
  return (
    <div className="flex flex-col w-full">
      <input
        type={type}
        disabled={disabled}
        className={`
            rounded-md px-4 py-2 border 
            transition-all duration-200
            focus:outline-none 
            focus:ring-2 focus:ring-blue-500
            ${error ? "border-red-500" : "border-gray-300 focus:border-blue-500"}
            disabled:bg-gray-100 disabled:cursor-not-allowed
            ${className}
          `}
        {...rest}
        placeholder={`${label}` + (isRequired ? " *" : "")}
      />
      {error && <div className="mt-1 text-xs text-red-500">{error}</div>}
    </div>
  );
};

export default InputField;
