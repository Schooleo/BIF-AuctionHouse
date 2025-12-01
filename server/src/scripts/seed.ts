import mongoose from "mongoose";
import dotenv from "dotenv";
import { User } from "../models/user.model";
import { Category } from "../models/category.model";
import { Product } from "../models/product.model";
import { Bid } from "../models/bid.model";
import { Rating } from "../models/rating.model";
import { SystemConfig } from "../models/systemConfig.model";

dotenv.config();

let uri = process.env.MONGO_URI || "mongodb://localhost:27017/auction_db";
if (uri.includes("mongo:")) {
  uri = uri.replace("mongo:", "localhost:");
}

// --- CONFIGURATION ---
const MONGO_URI = uri;
const NUM_BIDDERS = 5;

// --- DATA SETS ---
const TECH_SUB_IMAGES = [
  "https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=800&q=80",
  "https://picsum.photos/id/0/500/333",
  "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800&q=80",
];

const FASHION_SUB_IMAGES = [
  "https://images.unsplash.com/photo-1445205170230-053b83016050?w=800&q=80",
  "https://images.unsplash.com/photo-1515955656352-a1fa3ffcd111?w=800&q=80",
  "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=800&q=80",
];

// Danh sách sản phẩm mẫu theo Category
const PRODUCT_CATALOG: Record<string, any[]> = {
  Phones: [
    {
      name: "iPhone 15 Pro Max Titanium",
      price: 25000000,
      img: "https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=800&q=80",
    },
    {
      name: "Samsung Galaxy S24 Ultra",
      price: 23000000,
      img: "https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=800&q=80",
    },
    {
      name: "Google Pixel 8 Pro",
      price: 18000000,
      img: "https://images.unsplash.com/photo-1732386650203-d8db284edeb7?w=800&q=80",
    },
    {
      name: "Xiaomi 14 Ultra",
      price: 16000000,
      img: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&q=80",
    },
  ],
  Laptops: [
    {
      name: "MacBook Air M2 13-inch",
      price: 19000000,
      img: "https://images.unsplash.com/photo-1593642634315-48f5414c3ad9?w=800&q=80",
    },
    {
      name: "Dell XPS 13 Plus",
      price: 22000000,
      img: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&q=80",
    },
    {
      name: "Asus ROG Zephyrus G14",
      price: 28000000,
      img: "https://images.unsplash.com/photo-1630794180018-433d915c34ac?w=800&q=80",
    },
    {
      name: "Lenovo ThinkPad X1 Carbon",
      price: 24000000,
      img: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800&q=80",
    },
  ],
  Shoes: [
    {
      name: "Nike Air Jordan 1 High",
      price: 4000000,
      img: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=80",
    },
    {
      name: "Adidas Yeezy Boost 350",
      price: 5500000,
      img: "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=800&q=80",
    },
    {
      name: "Converse Chuck 70 High",
      price: 1200000,
      img: "https://images.unsplash.com/photo-1607522370275-f14206abe5d3?w=800&q=80",
    },
    {
      name: "New Balance 550 White",
      price: 2500000,
      img: "https://images.unsplash.com/photo-1551107696-a4b0c5a0d9a2?w=800&q=80",
    },
  ],
  Watches: [
    {
      name: "Rolex Submariner Date",
      price: 250000000,
      img: "https://images.unsplash.com/photo-1523170335258-f5ed11844a49?w=800&q=80",
    },
    {
      name: "Casio G-Shock GA-2100",
      price: 3000000,
      img: "https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=800&q=80",
    },
    {
      name: "Apple Watch Ultra 2",
      price: 18000000,
      img: "https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=800&q=80",
    },
    {
      name: "Seiko 5 Sports Automatic",
      price: 6000000,
      img: "https://images.unsplash.com/photo-1614164185128-e4ec99c436d7?w=800&q=80",
    },
  ],
  Furniture: [
    {
      name: "Herman Miller Aeron Chair",
      price: 20000000,
      img: "https://images.unsplash.com/photo-1505843490538-5133c6c7d0e1?w=800&q=80",
    },
    {
      name: "IKEA Sofa Landskrona",
      price: 12000000,
      img: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&q=80",
    },
    {
      name: "Minimalist Oak Desk",
      price: 5000000,
      img: "https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?w=800&q=80",
    },
    {
      name: "Vintage Standing Lamp",
      price: 1500000,
      img: "https://images.unsplash.com/photo-1555488205-d5e67846cf40?w=800&q=80",
    },
  ],
};

// --- HELPER FUNCTIONS ---

const generateDescription = (name: string, category: string) => {
  return `
${name}

Experience the ultimate in ${category} with the ${name}. Designed for performance and style, this item is a must-have for enthusiasts.

Key Features:
- Premium Build: Crafted with high-quality materials for durability and elegance.
- High Performance: Optimized for the best user experience in its class.
- Modern Design: Sleek and contemporary look that fits any setting.
- Warranty: Comes with a standard 1-year manufacturer warranty.

Condition:
This item is in Like New condition. It has been inspected and tested to ensure full functionality. Original packaging and accessories are included.

Shipping & Returns:
Fast shipping available worldwide. 30-day return policy if the item does not match the description.
  `;
};

const randomInt = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;
const randomDate = (start: Date, end: Date) =>
  new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));

const connectDB = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("✅ Connected to MongoDB");
  } catch (error) {
    console.error("❌ MongoDB connection failed", error);
    process.exit(1);
  }
};

const seed = async () => {
  await connectDB();

  console.log("🧹 Cleaning Database...");
  await User.deleteMany({});
  await Category.deleteMany({});
  await Product.deleteMany({});
  await Bid.deleteMany({});
  await Rating.deleteMany({});
  await SystemConfig.deleteMany({});

  console.log("⚙️ Creating System Config...");
  await SystemConfig.create({
    auctionExtensionWindow: 5,
    auctionExtensionTime: 10,
  });

  console.log("👤 Creating Users...");
  const commonPassword = "12345678";

  const adminId = new mongoose.Types.ObjectId("64b0f1a9e1b9b1a2b3c4d5e6");
  const seller1Id = new mongoose.Types.ObjectId("64b0f1a9e1b9b1a2b3c4d5e7");
  const seller2Id = new mongoose.Types.ObjectId("64b0f1a9e1b9b1a2b3c4d5e8");

  const admin = await User.create({
    _id: adminId,
    name: "System Admin",
    email: "admin@gmail.com",
    password: commonPassword,
    role: "admin",
    address: "Admin HQ",
  });

  const seller1 = await User.create({
    _id: seller1Id,
    name: "Tech World Seller",
    email: "seller1@gmail.com",
    password: commonPassword,
    role: "seller",
    address: "Hanoi, Vietnam",
    positiveRatings: 10,
    negativeRatings: 1,
  });

  const seller2 = await User.create({
    _id: seller2Id,
    name: "Fashion Boutique",
    email: "seller2@gmail.com",
    password: commonPassword,
    role: "seller",
    address: "HCMC, Vietnam",
    positiveRatings: 50,
    negativeRatings: 0,
  });

  // Create Bidders
  let bidders = [];
  for (let i = 1; i <= NUM_BIDDERS; i++) {
    // Generate deterministic IDs for bidders based on index
    // Using a base hex string and replacing the last char
    const hex = `64b0f1a9e1b9b1a2b3c4d5f${i}`;
    const bidderId = new mongoose.Types.ObjectId(hex);

    const bidder = await User.create({
      _id: bidderId,
      name: `Bidder ${String.fromCharCode(64 + i)}`, // Bidder A, B, C...
      email: `bidder${i}@gmail.com`,
      password: commonPassword,
      role: "bidder",
      address: `Street ${i}, City`,
      positiveRatings: randomInt(0, 5),
      negativeRatings: randomInt(0, 1),
    });
    bidders.push(bidder);
  }

  console.log("📂 Creating Categories...");
  // Level 1
  const electronics = await Category.create({ name: "Electronics" });
  const fashion = await Category.create({ name: "Fashion" });
  const home = await Category.create({ name: "Home & Living" });
  const sports = await Category.create({ name: "Sports" }); // Empty cat to test empty state

  // Level 2
  const phones = await Category.create({
    name: "Mobile Phones",
    parent: electronics._id,
  });
  const laptops = await Category.create({
    name: "Laptops",
    parent: electronics._id,
  });
  const shoes = await Category.create({ name: "Shoes", parent: fashion._id });
  const watches = await Category.create({
    name: "Watches",
    parent: fashion._id,
  });
  const furniture = await Category.create({
    name: "Furniture",
    parent: home._id,
  });

  // Map category names to IDs for easy lookup
  const catMap: Record<string, any> = {
    Phones: phones._id,
    Laptops: laptops._id,
    Shoes: shoes._id,
    Watches: watches._id,
    Furniture: furniture._id,
  };

  console.log("📦 Creating Products & Bids...");

  let totalProducts = 0;
  let totalBids = 0;

  // Helper to process catalog
  const processCatalog = async (catKey: string, sellerId: any) => {
    const items = PRODUCT_CATALOG[catKey];
    if (!items) return;

    const isTech = ["Phones", "Laptops"].includes(catKey);
    const subImages = isTech ? TECH_SUB_IMAGES : FASHION_SUB_IMAGES;

    for (const item of items) {
      // Setup time:
      // Some ending very soon (minutes), some in days.
      // Some started days ago.
      const now = new Date();
      const isEndingSoon = Math.random() > 0.7; // 30% chance ending soon

      const startTime = new Date(
        now.getTime() - randomInt(1, 5) * 24 * 60 * 60 * 1000
      ); // Started 1-5 days ago

      let endTime;
      if (isEndingSoon) {
        endTime = new Date(now.getTime() + randomInt(10, 180) * 60 * 1000); // Ends in 10-180 mins
      } else {
        endTime = new Date(
          now.getTime() + randomInt(1, 7) * 24 * 60 * 60 * 1000
        ); // Ends in 1-7 days
      }

      // Step price logic (e.g., 5-10% of starting price rounded)
      const stepPrice = Math.ceil((item.price * 0.05) / 1000) * 1000;

      // Create Product Initial
      const product = new Product({
        name: item.name,
        category: catMap[catKey],
        seller: sellerId,
        mainImage: item.img, // Use reliable placeholder with text
        subImages: subImages,
        description: generateDescription(item.name, catKey),
        startTime: startTime,
        endTime: endTime,
        startingPrice: item.price,
        stepPrice: stepPrice,
        buyNowPrice: item.price * 1.5, // Optional buy now
        autoExtends: true,
        currentPrice: item.price, // Will be updated by bids
        bidCount: 0,
      });

      await product.save();
      totalProducts++;

      // --- GENERATE BIDS ---
      // Randomly decide how many bids (min 3 as requested)
      const bidCount = randomInt(3, 8);
      let currentPrice = item.price;
      let lastBidder = null;
      let lastBidTime = startTime;

      for (let k = 0; k < bidCount; k++) {
        // Pick random bidder
        const bidder = bidders[randomInt(0, bidders.length - 1)]!;

        // Increase price by step + random small amount
        const increment = stepPrice + randomInt(0, 5) * 10000;
        currentPrice += increment;

        // Ensure bid time is ascending but before now
        const nextTime = new Date(
          lastBidTime.getTime() + randomInt(10, 60) * 60 * 1000
        );
        if (nextTime > now) break; // Don't bid in the future
        lastBidTime = nextTime;

        await Bid.create({
          product: product._id,
          bidder: bidder._id,
          price: currentPrice,
          createdAt: lastBidTime,
        });

        lastBidder = bidder;
        totalBids++;
      }

      // Update Product with final bid info
      product.currentPrice = currentPrice;
      product.currentBidder = (lastBidder ? lastBidder._id : undefined) as any;
      product.bidCount = bidCount;

      // Randomly add questions to some products
      if (Math.random() > 0.5) {
        product.questions.push({
          question: "Is this item authentic?",
          questioner: bidders[0]!._id,
          askedAt: new Date(startTime.getTime() + 100000),
          answer: "Yes, 100% authentic with receipt.",
          answeredAt: new Date(startTime.getTime() + 200000),
        } as any);
      }

      await product.save();
    }
  };

  // Run catalog processing
  await processCatalog("Phones", seller1._id);
  await processCatalog("Laptops", seller1._id);
  await processCatalog("Shoes", seller2._id);
  await processCatalog("Watches", seller2._id);
  await processCatalog("Furniture", seller2._id);

  console.log("-----------------------------------------");
  console.log(`✅ Seeding Complete!`);
  console.log(`📊 Stats:`);
  console.log(`   - Users: ${3 + NUM_BIDDERS}`);
  console.log(`   - Categories: 9`);
  console.log(`   - Products: ${totalProducts}`);
  console.log(`   - Bids: ${totalBids}`);
  console.log("-----------------------------------------");

  process.exit(0);
};

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
