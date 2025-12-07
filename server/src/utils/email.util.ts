import axios from "axios";
import { env } from "../config/env";

export const sendOTPEmail = async (to: string, otp: string) => {
  if (env.EMAIL_WEBHOOK_URL.length === 0) {
    throw new Error("Email webhook URL is not configured");
  }

  const htmlBody = `
    <p>Hello,</p>
    <p>Your One-Time Password (OTP) for BIF Auction House is:</p>

    <h2>${otp}</h2>

    <p>This OTP is valid for the next 5 minutes. Please do not share it with anyone.</p>
    <p>If you did not request this OTP, plsease ignore this email.</p>
    <p>Thanks,<br/>The BIF Auction House Team</p>
  `;

  await axios.post(env.EMAIL_WEBHOOK_URL, {
    to,
    subject: "Your OTP for BIF Auction House",
    htmlBody,
  });
};

export const sendPasswordResetOTPEmail = async (to: string, otp: string) => {
  if (env.EMAIL_WEBHOOK_URL.length === 0) {
    throw new Error("Email webhook URL is not configured");
  }

  const htmlBody = `
    <p>Hello,</p>
    <p>We received a request to reset your password. Use the One-Time Password (OTP) below to proceed:</p>

    <h2>${otp}</h2>

    <p>This OTP is valid for the next 5 minutes. Please do not share it with anyone.</p>
    <p>If you did not request a password reset, please ignore this email.</p>
    <p>Thanks,<br/>The BIF Auction House Team</p>
  `;

  await axios.post(env.EMAIL_WEBHOOK_URL, {
    to,
    subject: "Your Password Reset OTP for BIF Auction House",
    htmlBody,
  });
};

export const sendQuestionEmail = async (
  to: string,
  sellerName: string,
  productName: string,
  productId: string,
  bidderName: string,
  question: string
) => {
  if (env.EMAIL_WEBHOOK_URL.length === 0) {
    throw new Error("Email webhook URL is not configured");
  }

  const productUrl = `${env.FRONTEND_URL}/products/${productId}`;

  const htmlBody = `
    <p>Hello ${sellerName},</p>
    <p>You have received a new question about your product <strong>${productName}</strong>.</p>

    <p><strong>Question from ${bidderName}:</strong></p>
    <blockquote style="border-left: 4px solid #ccc; padding-left: 10px; margin: 10px 0;">
      ${question}
    </blockquote>

    <p>Click the link below to view the product and answer the question:</p>
    <p><a href="${productUrl}" style="display: inline-block; padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px;">View Product Details</a></p>

    <p>Thanks,<br/>The BIF Auction House Team</p>
  `;

  await axios.post(env.EMAIL_WEBHOOK_URL, {
    to,
    subject: `New Question About Your Product: ${productName}`,
    htmlBody,
  });
};

export const sendBidNotificationToSeller = async (
  to: string,
  sellerName: string,
  productName: string,
  productId: string,
  bidderName: string, // Tên bidder (đã mask)
  newPrice: number,
  currentHighestPrice: number
) => {
  if (env.EMAIL_WEBHOOK_URL.length === 0) {
    throw new Error("Email webhook URL is not configured");
  }

  const productUrl = `${env.FRONTEND_URL}/products/${productId}`;

  const htmlBody = `
    <p>Hello ${sellerName},</p>
    <p>Good news! Someone just placed a bid on your product <strong>${productName}</strong>.</p>

    <div style="background-color: #f0f8ff; padding: 15px; border-radius: 5px; margin: 15px 0;">
      <p style="margin: 5px 0;"><strong>Bidder:</strong> ${bidderName}</p>
      <p style="margin: 5px 0;"><strong>New Bid Price:</strong> ${newPrice.toLocaleString(
        "vi-VN"
      )} VND</p>
      <p style="margin: 5px 0;"><strong>Current Highest Price:</strong> ${currentHighestPrice.toLocaleString(
        "vi-VN"
      )} VND</p>
    </div>

    <p>Click the link below to view the product details:</p>
    <p><a href="${productUrl}" style="display: inline-block; padding: 10px 20px; background-color: #28a745; color: white; text-decoration: none; border-radius: 5px;">View Product Details</a></p>

    <p>Thanks,<br/>The BIF Auction House Team</p>
  `;

  await axios.post(env.EMAIL_WEBHOOK_URL, {
    to,
    subject: `New Bid on Your Product: ${productName}`,
    htmlBody,
  });
};

export const sendBidConfirmationToBidder = async (
  to: string,
  bidderName: string,
  productName: string,
  productId: string,
  bidPrice: number,
  nextMinPrice: number,
  productEndTime: Date
) => {
  if (env.EMAIL_WEBHOOK_URL.length === 0) {
    throw new Error("Email webhook URL is not configured");
  }

  const productUrl = `${env.FRONTEND_URL}/products/${productId}`;
  const endTimeFormatted = new Date(productEndTime).toLocaleString("vi-VN", {
    dateStyle: "long",
    timeStyle: "short",
  });

  const htmlBody = `
    <p>Hello ${bidderName},</p>
    <p>Your bid has been successfully placed!</p>

    <div style="background-color: #e8f5e9; padding: 15px; border-radius: 5px; margin: 15px 0;">
      <p style="margin: 5px 0;"><strong>Product:</strong> ${productName}</p>
      <p style="margin: 5px 0;"><strong>Your Bid Price:</strong> ${bidPrice.toLocaleString(
        "vi-VN"
      )} VND</p>
      <p style="margin: 5px 0;"><strong>Next Minimum Bid:</strong> ${nextMinPrice.toLocaleString(
        "vi-VN"
      )} VND</p>
      <p style="margin: 5px 0;"><strong>Auction Ends:</strong> ${endTimeFormatted}</p>
    </div>

    <p>You are currently the highest bidder. We will notify you if someone outbids you.</p>

    <p><a href="${productUrl}" style="display: inline-block; padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px;">Track Your Bid</a></p>

    <p>Good luck!<br/>The BIF Auction House Team</p>
  `;

  await axios.post(env.EMAIL_WEBHOOK_URL, {
    to,
    subject: `Bid Confirmation: ${productName}`,
    htmlBody,
  });
};

export const sendOutbidNotificationToBidders = async (
  bidders: Array<{ email: string; name: string }>,
  productName: string,
  productId: string,
  newPrice: number,
  nextMinPrice: number
) => {
  if (env.EMAIL_WEBHOOK_URL.length === 0) {
    throw new Error("Email webhook URL is not configured");
  }

  const productUrl = `${env.FRONTEND_URL}/products/${productId}`;

  // Gửi email cho từng bidder
  const emailPromises = bidders.map(async (bidder) => {
    const htmlBody = `
      <p>Hello ${bidder.name},</p>
      <p>Someone has placed a higher bid on <strong>${productName}</strong> that you were bidding on.</p>

      <div style="background-color: #fff3cd; padding: 15px; border-radius: 5px; margin: 15px 0;">
        <p style="margin: 5px 0;"><strong>Product:</strong> ${productName}</p>
        <p style="margin: 5px 0;"><strong>New Highest Bid:</strong> ${newPrice.toLocaleString(
          "vi-VN"
        )} VND</p>
        <p style="margin: 5px 0;"><strong>Minimum Bid to Compete:</strong> ${nextMinPrice.toLocaleString(
          "vi-VN"
        )} VND</p>
      </div>

      <p>Don't miss out! Place a higher bid to stay in the competition.</p>

      <p><a href="${productUrl}" style="display: inline-block; padding: 10px 20px; background-color: #ffc107; color: black; text-decoration: none; border-radius: 5px;">Place a Higher Bid</a></p>

      <p>Thanks,<br/>The BIF Auction House Team</p>
    `;

    return axios.post(env.EMAIL_WEBHOOK_URL, {
      to: bidder.email,
      subject: `You've Been Outbid: ${productName}`,
      htmlBody,
    });
  });

  // Gửi tất cả emails song song, không throw error nếu 1 email fail
  await Promise.allSettled(emailPromises);
};

export const sendBidRejectedEmail = async (
  to: string,
  bidderName: string,
  productName: string,
  productId: string,
  reason?: string
) => {
  if (env.EMAIL_WEBHOOK_URL.length === 0) return;

  const productUrl = `${env.FRONTEND_URL}/products/${productId}`;

  const htmlBody = `
    <p>Hello ${bidderName},</p>
    <p>Your bid on <strong>${productName}</strong> has been rejected by the seller.</p>
    
    ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ""}

    <p>This means you are no longer participating in this auction.</p>

    <p><a href="${productUrl}" style="display: inline-block; padding: 10px 20px; background-color: #dc3545; color: white; text-decoration: none; border-radius: 5px;">View Product</a></p>

    <p>Regards,<br/>The BIF Auction House Team</p>
  `;

  await axios.post(env.EMAIL_WEBHOOK_URL, {
    to,
    subject: `Bid Rejected: ${productName}`,
    htmlBody,
  });
};

export const sendAuctionEndedSellerEmail = async (
  to: string,
  sellerName: string,
  productName: string,
  productId: string,
  winnerName: string,
  finalPrice: number
) => {
  if (env.EMAIL_WEBHOOK_URL.length === 0) return;

  const productUrl = `${env.FRONTEND_URL}/products/${productId}`;

  const htmlBody = `
    <p>Hello ${sellerName},</p>
    <p>Congratulations! Your auction for <strong>${productName}</strong> has ended successfully.</p>

    <div style="background-color: #d4edda; padding: 15px; border-radius: 5px; margin: 15px 0;">
      <p style="margin: 5px 0;"><strong>Winner:</strong> ${winnerName}</p>
      <p style="margin: 5px 0;"><strong>Final Price:</strong> ${finalPrice.toLocaleString(
        "vi-VN"
      )} VND</p>
    </div>

    <p>Please proceed to contact the winner and arrange payment/shipping.</p>

    <p><a href="${productUrl}" style="display: inline-block; padding: 10px 20px; background-color: #28a745; color: white; text-decoration: none; border-radius: 5px;">Manage Transaction</a></p>

    <p>Regards,<br/>The BIF Auction House Team</p>
  `;

  await axios.post(env.EMAIL_WEBHOOK_URL, {
    to,
    subject: `Auction Ended: ${productName} Sold!`,
    htmlBody,
  });
};

export const sendAuctionEndedNoBuyerEmail = async (
  to: string,
  sellerName: string,
  productName: string,
  productId: string
) => {
  if (env.EMAIL_WEBHOOK_URL.length === 0) return;

  const productUrl = `${env.FRONTEND_URL}/products/${productId}`;

  const htmlBody = `
    <p>Hello ${sellerName},</p>
    <p>Your auction for <strong>${productName}</strong> has ended, but unfortunately, there were no valid bids.</p>

    <p>You can choose to repost the item or keep it.</p>

    <p><a href="${productUrl}" style="display: inline-block; padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px;">View Product</a></p>

    <p>Regards,<br/>The BIF Auction House Team</p>
  `;

  await axios.post(env.EMAIL_WEBHOOK_URL, {
    to,
    subject: `Auction Ended (No Buyer): ${productName}`,
    htmlBody,
  });
};

export const sendAuctionWonEmail = async (
  to: string,
  winnerName: string,
  productName: string,
  productId: string,
  finalPrice: number
) => {
  if (env.EMAIL_WEBHOOK_URL.length === 0) return;

  const productUrl = `${env.FRONTEND_URL}/products/${productId}`;

  const htmlBody = `
    <p>Hello ${winnerName},</p>
    <p>Congratulations! You have won the auction for <strong>${productName}</strong>.</p>

    <div style="background-color: #d1ecf1; padding: 15px; border-radius: 5px; margin: 15px 0;">
      <p style="margin: 5px 0;"><strong>Final Price:</strong> ${finalPrice.toLocaleString(
        "vi-VN"
      )} VND</p>
    </div>

    <p>Please contact the seller to complete the transaction.</p>

    <p><a href="${productUrl}" style="display: inline-block; padding: 10px 20px; background-color: #17a2b8; color: white; text-decoration: none; border-radius: 5px;">View Details</a></p>

    <p>Regards,<br/>The BIF Auction House Team</p>
  `;

  await axios.post(env.EMAIL_WEBHOOK_URL, {
    to,
    subject: `You Won! ${productName}`,
    htmlBody,
  });
};

export const sendAnswerNotificationEmail = async (
  to: string, // Could be list BCC? For now single email per call logic implies looping caller or accepting array
  recipientName: string,
  productName: string,
  productId: string,
  question: string,
  answer: string
) => {
  if (env.EMAIL_WEBHOOK_URL.length === 0) return;

  const productUrl = `${env.FRONTEND_URL}/products/${productId}`;

  const htmlBody = `
    <p>Hello ${recipientName},</p>
    <p>The seller has answered a question on <strong>${productName}</strong>.</p>

    <div style="margin: 15px 0;">
       <p><strong>Q:</strong> ${question}</p>
       <p><strong>A:</strong> ${answer}</p>
    </div>

    <p><a href="${productUrl}" style="display: inline-block; padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px;">View Discussion</a></p>

    <p>Regards,<br/>The BIF Auction House Team</p>
  `;

  await axios.post(env.EMAIL_WEBHOOK_URL, {
    to,
    subject: `New Answer on: ${productName}`,
    htmlBody,
  });
};

export const sendRatingReceivedEmail = async (
  to: string,
  recipientName: string,
  productName: string,
  productId: string,
  raterName: string,
  score: number,
  comment: string
) => {
  if (env.EMAIL_WEBHOOK_URL.length === 0) return;

  const productUrl = `${env.FRONTEND_URL}/products/${productId}`;
  const ratingType = score === 1 ? "Positive" : "Negative";
  const ratingColor = score === 1 ? "#28a745" : "#dc3545";

  const htmlBody = `
    <p>Hello ${recipientName},</p>
    <p>You have received a new rating from <strong>${raterName}</strong> for the transaction <strong>${productName}</strong>.</p>

    <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 15px 0; border-left: 5px solid ${ratingColor};">
      <p style="margin: 5px 0;"><strong>Rating:</strong> <span style="color: ${ratingColor}; font-weight: bold;">${ratingType}</span></p>
      <p style="margin: 5px 0;"><strong>Comment:</strong> "${comment}"</p>
    </div>

    <p><a href="${productUrl}" style="display: inline-block; padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px;">View Transaction</a></p>

    <p>Regards,<br/>The BIF Auction House Team</p>
  `;

  await axios.post(env.EMAIL_WEBHOOK_URL, {
    to,
    subject: `New Rating Received: ${ratingType} from ${raterName}`,
    htmlBody,
  });
};
