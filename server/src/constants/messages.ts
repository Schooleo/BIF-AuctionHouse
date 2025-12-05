export const AuthMessages = {
  MISSING_FIELDS: 'Missing required fields',
  INVALID_CREDENTIALS: 'Invalid credentials',
  USER_NOT_FOUND: 'User not found',
  EMAIL_REGISTERED: 'Email is already registered',
  EMAIL_INVALID: 'Invalid email',
  INVALID_OTP_CONTEXT: 'Invalid OTP context',
  RECAPTCHA_FAILED: 'reCAPTCHA verification failed',
  OTP_SENT: 'OTP has been sent to your email',
  OTP_INVALID: 'Invalid or expired OTP',
  PASSWORD_RESET_SUCCESS: 'Password has been reset successfully',
  PASSWORD_TOO_SHORT: 'Password must be at least 8 characters long',
  PASSWORD_RESET_EMAIL_SENT: 'Password reset OTP email sent',
  RESET_TOKEN_NOT_FOUND: 'Reset token not found',
  RESET_TOKEN_INVALID: 'Invalid or expired token',
};

export const WatchlistMessages = {
  ADDED_SUCCESS: 'Product added to watchlist successfully',
  PRODUCT_NOT_FOUND: 'Product not found',
  ALREADY_EXISTS: 'Product already exists in watchlist',
};

export const BidMessages = {
  BID_PLACED: 'Bid placed successfully',
  PRODUCT_NOT_FOUND: 'Product not found',
  REPUTATION_TOO_LOW: 'Your reputation score is too low to place a bid',
  UNRATED_NOT_ALLOWED: 'You must have at least one completed transaction to place a bid',
  BID_TOO_LOW: 'Your bid must be higher than the current highest bid',
  HISTORY_RETRIEVED: 'Bid history retrieved successfully',
  BIDDER_REJECTED: 'You are not allowed to bid on this product',
};

export const ProductMessages = {
  PRODUCT_NOT_FOUND: 'Product not found',
  QUESTION_SENT: 'Question sent successfully',
  QUESTION_REQUIRED: 'Question is required',
  BIDDER_NOT_FOUND: 'Bidder not found',
};

export const BidderMessages = {
  USER_NOT_FOUND: 'User not found',
  PROFILE_UPDATED: 'Profile updated successfully',
  PASSWORD_CHANGED: 'Password changed successfully. Please log in again.',
  INVALID_CURRENT_PASSWORD: 'Current password is incorrect',
  SELLER_NOT_FOUND: 'Seller not found',
  NOT_SELLER: 'This user is not a seller',
  NO_WON_AUCTION: 'You can only rate sellers for auctions you have won',
  RATING_CREATED: 'Rating created successfully',
  RATING_UPDATED: 'Rating updated successfully',
  RATING_DELETED: 'Rating deleted successfully',
  RATING_NOT_FOUND: 'Rating not found',
  RATING_NOT_FOUND_UPDATE: 'Rating not found for update',
  RATING_NOT_FOUND_DELETE: 'Rating not found for deletion',
  ALREADY_SELLER: 'You are already a seller',
  PENDING_REQUEST_EXISTS: 'You already have a pending request',
  MUST_WAIT_DAYS: 'You must wait {days} more days before submitting a new request',
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

export const SellerMessages = {
  PRODUCT_CREATED: 'Product created successfully',
  DESCRIPTION_APPENDED: 'Product description appended successfully',
  PRODUCTS_RETRIEVED: 'Seller products retrieved successfully',
  MISSING_REQUIRED_FIELDS: 'Missing required fields',
  DESCRIPTION_REQUIRED: 'Description content is required',
  PRODUCT_NOT_FOUND_OR_UNAUTHORIZED: 'Product not found or unauthorized',
  INVALID_PRODUCT_ID: 'Invalid product ID',
  BIDDER_REJECTED: 'Bidder rejected successfully',
  BIDDER_ALREADY_REJECTED: 'Bidder has already been rejected for this product',
  BIDDER_NOT_FOUND: 'Bidder not found',
  QUESTION_NOT_FOUND: 'Question not found',
  ANSWER_REQUIRED: 'Answer content is required',
  ANSWER_SUBMITTED: 'Answer submitted successfully',
  ANSWER_UPDATED: 'Answer updated successfully',
  WINNER_CONFIRMED: 'Winner confirmed successfully',
  WINNER_ALREADY_CONFIRMED: 'Winner has already been confirmed',
  AUCTION_NOT_ENDED: 'Cannot confirm winner before the auction ends',
  NO_ELIGIBLE_BIDDER: 'No eligible bidder available to confirm as winner',
};
