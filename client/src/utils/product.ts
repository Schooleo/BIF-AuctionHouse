export const timeRemaining = (endTime: string | undefined) => {
  if (!endTime) {
    return "Auction Time Not Set";
  }

  const end = new Date(endTime).getTime();
  const now = Date.now();
  const diffMs = end - now;

  if (diffMs <= 0) return "Auction Ended";

  const diffSeconds = Math.floor(diffMs / 1000);
  const days = Math.floor(diffSeconds / (3600 * 24));
  const hours = Math.floor((diffSeconds % (3600 * 24)) / 3600);
  const minutes = Math.floor((diffSeconds % 3600) / 60);

  if (days >= 3) {
    return `${days} days ${hours} hours remaining`;
  } else if (days > 0) {
    return `${days} days ${hours} hours ${minutes} minutes remaining`;
  } else if (hours > 0) {
    return `${hours} hours ${minutes} minutes remaining`;
  } else if (minutes > 0) {
    return `${minutes} minutes remaining`;
  } else {
    return "Less than a minute remaining";
  }
};

export const formatPrice = (price: number | undefined) => {
  if (price === undefined || price === null || isNaN(price)) {
    return "N/A VND";
  }

  return (
    price
      .toLocaleString("vi-VN", {
        style: "currency",
        currency: "VND",
        minimumFractionDigits: 0,
      })
      .replace("₫", "") + " VND"
  );
};

export const formatPostedTime = (
  dateString: string | Date | undefined
): string => {
  if (!dateString) {
    return "N/A";
  }

  const d = new Date(dateString);
  if (isNaN(d.getTime())) {
    return "Invalid Date";
  }

  return d
    .toLocaleTimeString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    })
    .replace(",", " -");
};

export const maskName = (name: string) => {
  if (!name) return "";
  if (name.length <= 2) return name[0] + "*";
  return name[0] + "*".repeat(name.length - 2) + name[name.length - 1];
};
