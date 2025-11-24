import type {
  QuestionAnswer,
  Product,
  Bid,
  UserSummary,
  FetchProductsDto,
} from "@interfaces/product";
import type { IPaginatedResponse } from "@interfaces/ui";

const mockUsers: UserSummary[] = [
  { _id: "u1", name: "Alice", rating: 5 },
  { _id: "u2", name: "Bob", rating: 4 },
  { _id: "u3", name: "Charlie", rating: 3 },
];

const generateMockQnA = (): QuestionAnswer[] => {
  return Array.from({ length: 5 }).map((_, i) => ({
    _id: `q-${Math.random().toString(36).substr(2, 9)}`,
    question: `Question ${i + 1} about this product?`,
    questioner: mockUsers[i % mockUsers.length],
    askedAt: new Date(Date.now() - i * 60 * 60 * 1000).toISOString(), // i hours ago
    answer: `Answer to question ${i + 1}`,
    answeredAt: new Date(Date.now() - (i - 0.5) * 60 * 60 * 1000).toISOString(), // i-0.5 hours ago
  }));
};

const maxImages = 15;
const productImages: string[] = Array.from({ length: maxImages }, (_, i) => {
  return `/product/${i + 1}.jpg`;
});

export const generateMockProduct = (
  id: string,
  basePrice: number,
  bids: number,
  timeToEndHours: number,
  selectedImage?: number
): Product => {
  const now = Date.now();
  const startTime = new Date(
    now - Math.random() * 2 * 24 * 60 * 60 * 1000
  ).toISOString();
  const endTime = new Date(now + timeToEndHours * 60 * 60 * 1000).toISOString();

  if (selectedImage === undefined) {
    selectedImage = Math.floor(Math.random() * productImages.length);
  }
  const images = [
    productImages[selectedImage],
    productImages[(selectedImage + 1) % productImages.length],
    productImages[(selectedImage + 2) % productImages.length],
    productImages[(selectedImage + 3) % productImages.length],
    productImages[(selectedImage + 4) % productImages.length],
    productImages[(selectedImage + 5) % productImages.length],
  ];

  const mockBidders: Bid[] = Array.from({ length: bids }).map((_, index) => ({
    _id: `bid-${id}-${index}`,
    bidder: {
      _id: `bidder${index}`,
      name: `Bidder ${index + 1}`,
      rating: Math.floor(Math.random() * 5) + 1,
    },
    price: basePrice + index * 100_000,
    time: new Date().toISOString(),
  }));

  return {
    _id: `prod${id}`,
    name: `Product Name ${id}`,
    description: `Description for product ${id}. This is a very interesting item.`,
    images,
    startingPrice: basePrice,
    currentPrice:
      mockBidders.length > 0
        ? mockBidders[mockBidders.length - 1].price
        : basePrice,
    buyNowPrice: basePrice * 1.5,
    bidders: mockBidders,
    seller: {
      _id: "seller1",
      name: "Auction Seller",
      rating: 4.8,
    },
    category: { _id: "cat1", name: "Electronics" },
    startTime,
    endTime,

    // Add mock Q&A
    questions: generateMockQnA(),
  };
};

export const allMockProducts: Product[] = [
  generateMockProduct("A1", 100_000_000, 5, 2, 0),
  generateMockProduct("A2", 200_000_000, 7, 5, 1),
  generateMockProduct("A3", 50_000_000, 3, 1, 2),
  generateMockProduct("A4", 300_000_000, 8, 10, 3),
  generateMockProduct("A5", 150_000_000, 6, 24, 4),

  generateMockProduct("B1", 120_000_000, 15, 48, 5),
  generateMockProduct("B2", 80_000_000, 12, 72, 6),
  generateMockProduct("B3", 250_000_000, 20, 36, 7),
  generateMockProduct("B4", 90_000_000, 10, 60, 8),
  generateMockProduct("B5", 180_000_000, 18, 96, 9),

  generateMockProduct("C1", 500_000_000, 8, 12, 10),
  generateMockProduct("C2", 700_000_000, 6, 72, 11),
  generateMockProduct("C3", 600_000_000, 10, 24, 12),
  generateMockProduct("C4", 400_000_000, 7, 48, 13),
  generateMockProduct("C5", 800_000_000, 5, 96, 14),
];

export const getTopProducts = (
  products: Product[],
  type: "default" | "endingSoon" | "mostBidOn" | "highestPriced",
  limit: number = 5
): Product[] => {
  let sortedProducts = [...products];
  if (type === "endingSoon") {
    sortedProducts = sortedProducts
      .filter((p) => new Date(p.endTime).getTime() > Date.now())
      .sort(
        (a, b) => new Date(a.endTime).getTime() - new Date(b.endTime).getTime()
      );
  } else if (type === "mostBidOn") {
    sortedProducts = sortedProducts.sort(
      (a, b) => b.bidders.length - a.bidders.length
    );
  } else if (type === "highestPriced") {
    sortedProducts = sortedProducts.sort(
      (a, b) => b.currentPrice - a.currentPrice
    );
  } else {
    sortedProducts = sortedProducts.sort(
      (a, b) =>
        new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
    );
  }
  return sortedProducts.slice(0, limit);
};

export const timeRemaining = (endTime: string) => {
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

export const formatPrice = (price: number) => {
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

export const formatPostedTime = (date: string) => {
  return new Date(date)
    .toLocaleTimeString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    })
    .replace(",", " -"); // Output: Nov 10 2025 - 10:30 AM
};

export const maskName = (name: string) => {
  if (!name) return "";
  if (name.length <= 2) return name[0] + "*";
  return name[0] + "*".repeat(name.length - 2) + name[name.length - 1];
};

// Hàm lấy các sản phẩm liên quan
export const getRelatedProducts = (currentProduct: Product): Product[] => {
  const related: Product[] = [];

  const availableProducts = allMockProducts.filter(
    (p) => p._id !== currentProduct._id
  );

  // 1. Prioritize same category (up to 5 items)
  const sameCategory = availableProducts.filter(
    (p) => p.category._id === currentProduct.category._id
  );

  // 2. Add same category products
  related.push(...sameCategory.slice(0, 5));

  // 3. Fill remaining slots randomly if needed
  if (related.length < 5) {
    const needed = 5 - related.length;
    const existingIds = new Set(related.map((p) => p._id));

    // Filter out products already added (either same category or current product)
    const randomCandidates = availableProducts.filter(
      (p) => !existingIds.has(p._id)
    );

    // Simple shuffle (Fisher-Yates) for randomness
    for (let i = randomCandidates.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [randomCandidates[i], randomCandidates[j]] = [
        randomCandidates[j],
        randomCandidates[i],
      ];
    }

    related.push(...randomCandidates.slice(0, needed));
  }

  return related;
};

export const mockFetchProducts = async ({
  page,
  limit,
  search,
  categoryId,
}: FetchProductsDto): Promise<IPaginatedResponse<Product>> => {
  // Start with all products
  let filteredProducts = allMockProducts;

  if (search) {
    const lowerSearch = search.toLowerCase();
    filteredProducts = filteredProducts.filter(
      (p) =>
        p.name.toLowerCase().includes(lowerSearch) ||
        p.description.toLowerCase().includes(lowerSearch)
    );
  }
  if (categoryId) {
    filteredProducts = filteredProducts.filter(
      (p) => p.category._id === categoryId
    );
  }

  const totalItems = filteredProducts.length;
  const totalPages = Math.ceil(totalItems / limit);

  const currentPage = Math.min(Math.max(1, page), totalPages || 1);

  const skip = (currentPage - 1) * limit;
  const paginatedData = filteredProducts.slice(skip, skip + limit);

  const mockResponse: IPaginatedResponse<Product> = {
    data: paginatedData,
    pagination: {
      page: currentPage,
      limit: limit,
      totalItems: totalItems,
      totalPages: totalPages,
    },
  };

  return mockResponse;
};
