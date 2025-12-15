export const validateEmail = (email: string) => {
  if (!email) return "Email is required";
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) return "Invalid email format";
  return null;
};

export const validatePassword = (password: string) => {
  if (!password) return "Password is required";
  if (password.length < 8) return "Password must be at least 8 characters";
  if (password.length > 128) return "Password must be less than 128 characters";
  if (/\s/.test(password)) return "Password cannot contain spaces";
  if (!/(?=.*[a-z])/.test(password))
    return "Password must contain at least one lowercase letter";
  if (!/(?=.*[A-Z])/.test(password))
    return "Password must contain at least one uppercase letter";
  if (!/(?=.*\d)/.test(password))
    return "Password must contain at least one number";
  if (!/(?=.*[!@#$%^&*(),.?":{}|<>])/.test(password))
    return "Password must contain at least one special character";
  return null;
};

export const validateUsername = (name: string) => {
  if (!name) return "Username is required";
  if (name.length < 3) return "Username must be at least 3 characters";
  if (name.length > 15) return "Username must be less than 15 characters";
  if (!/^[a-zA-Z0-9]+$/.test(name))
    return "Username can only contain letters and numbers (no spaces)";
  return null;
};

export const validateAddress = (
  address: string,
  isRequired: boolean = false
) => {
  if (!address) {
    return isRequired ? "Address is required" : null;
  }
  if (address.length < 10) return "Address must be at least 10 characters";
  if (address.length > 200) return "Address must be less than 200 characters";
  return null;
};

export const validateOtp = (otp: string) => {
  if (!otp) return "OTP is required";
  if (!/^\d{6}$/.test(otp)) return "OTP must be 6 digits";
  return null;
};
