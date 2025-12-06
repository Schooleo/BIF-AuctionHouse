interface TimeRemainingInfo {
  text: string;
  isEnded: boolean;
  isUrgent: boolean;
  totalMs: number;
}

export const getRelativeTime = (endTime: string): string => {
  const now = new Date();
  const end = new Date(endTime);
  const diff = end.getTime() - now.getTime();

  if (diff <= 0) return "Ended";

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days} day${days > 1 ? "s" : ""} remaining`;
  if (hours > 0) return `${hours} hour${hours > 1 ? "s" : ""} remaining`;
  if (minutes > 0)
    return `${minutes} minute${minutes > 1 ? "s" : ""} remaining`;
  return `${seconds} second${seconds > 1 ? "s" : ""} remaining`;
};

export const formatDateTime = (date: Date | string): string => {
  const d = new Date(date);
  return (
    d.toLocaleDateString("en-US", {
      month: "numeric",
      day: "numeric",
      year: "numeric",
    }) +
    ", " +
    d.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    })
  );
};

// Format time: "2 minutes ago" hoặc "Dec 1, 2025 10:30 AM"
export const formatBidTime = (isoTime: string): string => {
  const date = new Date(isoTime);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? "s" : ""} ago`;
  if (diffMins < 1440) {
    const hours = Math.floor(diffMins / 60);
    return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  }
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
};

export const getTimeRemaining = (endTime: string | Date): TimeRemainingInfo => {
  const end = new Date(endTime).getTime();
  const now = Date.now();
  const diff = end - now;

  // Ended
  if (diff <= 0) {
    return {
      text: "Ended",
      isEnded: true,
      isUrgent: false,
      totalMs: 0,
    };
  }

  // Calculate components
  const totalSeconds = Math.floor(diff / 1000);
  const days = Math.floor(totalSeconds / (60 * 60 * 24));
  const hours = Math.floor((totalSeconds % (60 * 60 * 24)) / (60 * 60));
  const minutes = Math.floor((totalSeconds % (60 * 60)) / 60);
  const seconds = totalSeconds % 60;

  // Build time string
  let timeString = "";
  if (days > 0) timeString += `${days}d `;
  if (hours > 0 || days > 0) timeString += `${hours}h `;
  if (minutes > 0 || hours > 0 || days > 0) timeString += `${minutes}m `;
  timeString += `${seconds}s`;

  // Check urgent (< 1 hour)
  const isUrgent = diff < 60 * 60 * 1000;

  return {
    text: timeString.trim(),
    isEnded: false,
    isUrgent,
    totalMs: diff,
  };
};