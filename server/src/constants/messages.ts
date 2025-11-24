export const AuthMessages = {
  MISSING_FIELDS: "Missing required fields",
  INVALID_CREDENTIALS: "Invalid credentials",
  USER_NOT_FOUND: "User not found",
  EMAIL_REGISTERED: "Email is already registered",
  EMAIL_INVALID: "Invalid email",
  INVALID_OTP_CONTEXT: "Invalid OTP context",
  RECAPTCHA_FAILED: "reCAPTCHA verification failed",
  OTP_SENT: "OTP has been sent to your email",
  OTP_INVALID: "Invalid or expired OTP",
  PASSWORD_RESET_SUCCESS: "Password has been reset successfully",
  PASSWORD_TOO_SHORT: "Password must be at least 8 characters long",
  PASSWORD_RESET_EMAIL_SENT: "Password reset OTP email sent",
  RESET_TOKEN_NOT_FOUND: "Reset token not found",
  RESET_TOKEN_INVALID: "Invalid or expired token",
};

export const WatchlistMessages = {
  ADDED_SUCCESS: "Product added to watchlist successfully",
  PRODUCT_NOT_FOUND: "Product not found",
  ALREADY_EXISTS: "Product already exists in watchlist",
};

export const BidMessages = {
  BID_PLACED: "Bid placed successfully",

  PRODUCT_NOT_FOUND: "Product not found",
  REPUTATION_TOO_LOW: "Your reputation score is too low to place a bid",
  UNRATED_NOT_ALLOWED: "You must have at least one completed transaction to place a bid",
  BID_TOO_LOW: "Your bid must be higher than the current highest bid",
  HISTORY_RETRIEVED: "Bid history retrieved successfully",
}

export const ProductMessages = {
  PRODUCT_NOT_FOUND: 'Product not found',
  QUESTION_SENT: 'Question sent successfully',
  QUESTION_REQUIRED: 'Question is required',
  BIDDER_NOT_FOUND: 'Bidder not found',
};

export const BidderMessages = {
  USER_NOT_FOUND: 'Không tìm thấy người dùng',
  PROFILE_UPDATED: 'Cập nhật hồ sơ thành công',
  PASSWORD_CHANGED: 'Đổi mật khẩu thành công. Vui lòng đăng nhập lại.',
  INVALID_CURRENT_PASSWORD: 'Mật khẩu hiện tại không đúng',
  SELLER_NOT_FOUND: 'Không tìm thấy người bán',
  NOT_SELLER: 'Người dùng này không phải là người bán',
  NO_WON_AUCTION: 'Bạn chỉ có thể đánh giá người bán mà bạn đã thắng đấu giá',
  RATING_CREATED: 'Đánh giá thành công',
  RATING_UPDATED: 'Cập nhật đánh giá thành công',
  RATING_DELETED: 'Xóa đánh giá thành công',
  RATING_NOT_FOUND: 'Không tìm thấy đánh giá',
  RATING_NOT_FOUND_UPDATE: 'Không tìm thấy đánh giá để cập nhật',
  RATING_NOT_FOUND_DELETE: 'Không tìm thấy đánh giá để xóa',
  ALREADY_SELLER: 'Bạn đã là seller rồi',
  PENDING_REQUEST_EXISTS: 'Bạn đã có yêu cầu đang chờ xử lý',
  MUST_WAIT_DAYS: 'Bạn phải đợi {days} ngày nữa mới có thể gửi yêu cầu lại',
};

export const UpgradeRequestMessages = {
  REQUEST_SENT: 'Upgrade request sent successfully',
  ALREADY_SELLER: 'You are already a seller',
  PENDING_REQUEST_EXISTS: 'You already have a pending upgrade request',
  MUST_WAIT_7_DAYS: 'You must wait 7 days after rejection to send a new request',
  REQUEST_NOT_FOUND: 'Upgrade request not found',
  REQUEST_ALREADY_PROCESSED: 'This request has already been processed',
  REQUEST_APPROVED: 'Upgrade request approved successfully',
  REQUEST_REJECTED: 'Upgrade request rejected successfully',
};
