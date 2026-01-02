export interface UpdateProfileDto {
  name?: string;
  contactEmail?: string;
  avatar?: string;
  address?: string;
  dateOfBirth?: string;
}

export interface ChangePasswordDto {
  currentPassword: string;
  newPassword: string;
}
