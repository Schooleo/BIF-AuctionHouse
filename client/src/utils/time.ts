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
  
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
  if (diffMins < 1440) {
    const hours = Math.floor(diffMins / 60);
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  }
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
};