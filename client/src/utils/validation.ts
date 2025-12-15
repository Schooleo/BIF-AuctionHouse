export const validateEmail = (email: string) => {
  if (!email) return "Email is required";
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) return "Invalid email format";
  return null;
};

export const validatePassword = (password: string) => {
  if (!password) return "Password is required";
  if (password.length < 8) return "Password must be at least 8 characters";
  if (!/[A-Z]/.test(password))
    return "Password must contain at least one uppercase letter";
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password))
    return "Password must contain at least one special character";
  return null;
};

export const validateUsername = (name: string) => {
  if (!name) return "Username is required";
  if (!/^[a-zA-Z0-9]+$/.test(name))
    return "Username must contain only letters and numbers";
  if (name.length < 3 || name.length > 15)
    return "Username must be between 3 and 15 characters";
  return null;
};

export const validateAddress = (address: string, isRequired: boolean = false) => {
  if (!address) {
    return isRequired ? "Address is required" : null;
  }
  if (address.length < 15) return "Address must be at least 15 characters long";
  return null;
};

export const validateOtp = (otp: string) => {
  if (!otp) return "OTP is required";
  if (!/^[0-9]+$/.test(otp)) return "OTP must be numeric";
  return null;
};
