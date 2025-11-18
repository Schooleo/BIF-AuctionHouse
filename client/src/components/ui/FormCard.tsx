import type { FormCardProps, FormField } from "../../types/ui";
import InputField from "../forms/InputField";
import PasswordField from "../forms/PasswordField";
import Button from "../forms/Button";
import React from "react";

const FormCard: React.FC<FormCardProps> = ({
  title = "Form Pattern",
  fields = [],
  className = "",
  buttonProps = {},
  onSubmit,
  children = null,
}) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit && onSubmit();
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={`
          bg-white p-8 rounded-xl shadow-lg flex flex-col gap-4
          transition-all duration-300 ease-in-out hover:scale-[1.01] hover:shadow-2xl
          ${className}
      `}
    >
      <h2 className="text-2xl font-semibold">{title}</h2>
      <div className="bg-white flex flex-col gap-4">
        {fields.map((item, i) => {
          if (React.isValidElement(item)) return <div key={i}>{item}</div>;
          
          // Mặc định là FormField khi không phải là React element
          const field = item as FormField;
          return field.type === "password" ? (
            <PasswordField key={i} {...field} />
          ) : (
            <InputField key={i} {...field} />
          );
        })}
        {children && children}
        <Button className={"w-full mt-5"} {...buttonProps} />
      </div>
    </form>
  );
};

export default FormCard;
