import type { FormCardProps } from "../../types/ui";
import InputField from "../forms/InputField";
import PasswordField from "../forms/PasswordField";
import Button from "../forms/Button";

const FormCard: React.FC<FormCardProps> = ({
  title = "Form Pattern",
  fields = [],
  className = "",
  buttonProps = {},
  onSubmit
}) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit && onSubmit();
  };

  return (
    <form onSubmit={handleSubmit}
      className={`
          bg-white p-8 rounded-xl shadow-lg flex flex-col gap-6
          transition-all duration-300 ease-in-out hover:scale-[1.01] hover:shadow-2xl
          ${className}
      `}
    >
      <h2 className="text-2xl font-semibold">{title}</h2>
        <div className="bg-white flex flex-col gap-10 mt-16">
          {fields.map((field, index) => (
            field.type == "password" ? (
              <PasswordField
                key={index}
              {...field}
            />
          ) : (
            <InputField
              key={index}
              {...field}
            />
          )
        ))}
          <Button className={'w-full mt-5'} {...buttonProps} />
        </div>
    </form>
  )
}

export default FormCard
