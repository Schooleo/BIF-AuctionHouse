import mongoose from "mongoose";
import dotenv from "dotenv";
import { User } from "../models/user.model";
import { Category } from "../models/category.model";
import { Product } from "../models/product.model";
import { Bid } from "../models/bid.model";
import { Rating } from "../models/rating.model";
import { SystemConfig } from "../models/systemConfig.model";
import { Order, OrderStatus } from "../models/order.model";
import { Chat } from "../models/chat.model";
import { AutoBid } from "../models/autoBid.model";
import { connectDB } from "../config/db";
import { Watchlist } from "../models/watchlist.model";

dotenv.config();

// --- CONFIGURATION ---
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
      img: "https://images.unsplash.com/photo-1727013884184-b313982327f3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4MzU4Mzl8MHwxfHNlYXJjaHwxfHxTbWFydHBob25lJTIwVGl0YW5pdW18ZW58MHx8fHwxNzY3NDMzOTI5fDA&ixlib=rb-4.1.0&q=80&w=1080",
      subImages: [
        "https://images.unsplash.com/photo-1697630725330-d4f458260399?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4MzU4Mzl8MHwxfHNlYXJjaHwyfHxTbWFydHBob25lJTIwVGl0YW5pdW18ZW58MHx8fHwxNzY3NDMzOTI5fDA&ixlib=rb-4.1.0&q=80&w=400",
        "https://images.unsplash.com/photo-1697630725124-3fcce8e3c6f3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4MzU4Mzl8MHwxfHNlYXJjaHwzfHxTbWFydHBob25lJTIwVGl0YW5pdW18ZW58MHx8fHwxNzY3NDMzOTI5fDA&ixlib=rb-4.1.0&q=80&w=400",
        "https://images.unsplash.com/photo-1726592222670-ba7a65748d5a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4MzU4Mzl8MHwxfHNlYXJjaHw0fHxTbWFydHBob25lJTIwVGl0YW5pdW18ZW58MHx8fHwxNzY3NDMzOTI5fDA&ixlib=rb-4.1.0&q=80&w=400",
      ],
    },
    {
      name: "Samsung Galaxy S24 Ultra",
      price: 23000000,
      img: "https://images.unsplash.com/photo-1696041756125-257354c459a9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4MzU4Mzl8MHwxfHNlYXJjaHwxfHxTYW1zdW5nJTIwR2FsYXh5JTIwUyUyMFVsdHJhfGVufDB8fHx8MTc2NzQzMzkzNHww&ixlib=rb-4.1.0&q=80&w=1080",
      subImages: [
        "https://images.unsplash.com/photo-1722150635400-781fa4b5f40e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4MzU4Mzl8MHwxfHNlYXJjaHwyfHxTYW1zdW5nJTIwR2FsYXh5JTIwUyUyMFVsdHJhfGVufDB8fHx8MTc2NzQzMzkzNHww&ixlib=rb-4.1.0&q=80&w=400",
        "https://images.unsplash.com/photo-1590459963567-1bf6b8595be1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4MzU4Mzl8MHwxfHNlYXJjaHwzfHxTYW1zdW5nJTIwR2FsYXh5JTIwUyUyMFVsdHJhfGVufDB8fHx8MTc2NzQzMzkzNHww&ixlib=rb-4.1.0&q=80&w=400",
        "https://images.unsplash.com/photo-1662561466246-296d8d096200?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4MzU4Mzl8MHwxfHNlYXJjaHw0fHxTYW1zdW5nJTIwR2FsYXh5JTIwUyUyMFVsdHJhfGVufDB8fHx8MTc2NzQzMzkzNHww&ixlib=rb-4.1.0&q=80&w=400",
      ],
    },
    {
      name: "Google Pixel 8 Pro",
      price: 18000000,
      img: "https://images.unsplash.com/photo-1636633484288-ba18d16271a0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4MzU4Mzl8MHwxfHNlYXJjaHwxfHxQaXhlbCUyMFNtYXJ0cGhvbmV8ZW58MHx8fHwxNzY3NDMzOTQwfDA&ixlib=rb-4.1.0&q=80&w=1080",
      subImages: [
        "https://images.unsplash.com/photo-1657551422606-38f23d85849a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4MzU4Mzl8MHwxfHNlYXJjaHwyfHxQaXhlbCUyMFNtYXJ0cGhvbmV8ZW58MHx8fHwxNzY3NDMzOTQwfDA&ixlib=rb-4.1.0&q=80&w=400",
        "https://images.unsplash.com/photo-1657551422691-11577a77a361?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4MzU4Mzl8MHwxfHNlYXJjaHwzfHxQaXhlbCUyMFNtYXJ0cGhvbmV8ZW58MHx8fHwxNzY3NDMzOTQwfDA&ixlib=rb-4.1.0&q=80&w=400",
        "https://images.unsplash.com/photo-1657551423316-5af2697407c9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4MzU4Mzl8MHwxfHNlYXJjaHw0fHxQaXhlbCUyMFNtYXJ0cGhvbmV8ZW58MHx8fHwxNzY3NDMzOTQwfDA&ixlib=rb-4.1.0&q=80&w=400",
      ],
    },
    {
      name: "Xiaomi 14 Ultra",
      price: 16000000,
      img: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&q=80",
      subImages: [
        "https://images.unsplash.com/photo-1598327105666-5b89351aff23?w=800&q=80",
        "https://images.unsplash.com/photo-1550029402-226113178946?w=800&q=80",
        "https://images.unsplash.com/photo-1598327105666-5b89351aff23?w=800&q=80",
      ],
    },
  ],
  Laptops: [
    {
      name: "MacBook Air M2 13-inch",
      price: 19000000,
      img: "https://images.unsplash.com/photo-1667940903819-9319fe82949f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4MzU4Mzl8MHwxfHNlYXJjaHwxfHxNYWNCb29rJTIwQWlyJTIwTGFwdG9wfGVufDB8fHx8MTc2NzQzMzk0Nnww&ixlib=rb-4.1.0&q=80&w=1080",
      subImages: [
        "https://images.unsplash.com/photo-1665115220063-1a524cf412f1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4MzU4Mzl8MHwxfHNlYXJjaHwyfHxNYWNCb29rJTIwQWlyJTIwTGFwdG9wfGVufDB8fHx8MTc2NzQzMzk0Nnww&ixlib=rb-4.1.0&q=80&w=400",
        "https://images.unsplash.com/photo-1625766763788-95dcce9bf5ac?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4MzU4Mzl8MHwxfHNlYXJjaHwzfHxNYWNCb29rJTIwQWlyJTIwTGFwdG9wfGVufDB8fHx8MTc2NzQzMzk0Nnww&ixlib=rb-4.1.0&q=80&w=400",
        "https://images.unsplash.com/photo-1585645982492-639c028b8a10?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4MzU4Mzl8MHwxfHNlYXJjaHw0fHxNYWNCb29rJTIwQWlyJTIwTGFwdG9wfGVufDB8fHx8MTc2NzQzMzk0Nnww&ixlib=rb-4.1.0&q=80&w=400",
      ],
    },
    {
      name: "Dell XPS 13 Plus",
      price: 22000000,
      img: "https://images.unsplash.com/photo-1622286346003-c5c7e63b1088?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4MzU4Mzl8MHwxfHNlYXJjaHwxfHxEZWxsJTIwWFBTJTIwTGFwdG9wfGVufDB8fHx8MTc2NzQzMzk1MXww&ixlib=rb-4.1.0&q=80&w=1080",
      subImages: [
        "https://images.unsplash.com/photo-1720556405438-d67f0f9ecd44?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4MzU4Mzl8MHwxfHNlYXJjaHwyfHxEZWxsJTIwWFBTJTIwTGFwdG9wfGVufDB8fHx8MTc2NzQzMzk1MXww&ixlib=rb-4.1.0&q=80&w=400",
        "https://images.unsplash.com/photo-1637280637835-e953aedaba6c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4MzU4Mzl8MHwxfHNlYXJjaHwzfHxEZWxsJTIwWFBTJTIwTGFwdG9wfGVufDB8fHx8MTc2NzQzMzk1MXww&ixlib=rb-4.1.0&q=80&w=400",
        "https://images.unsplash.com/photo-1575320854760-bfffc3550640?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4MzU4Mzl8MHwxfHNlYXJjaHw0fHxEZWxsJTIwWFBTJTIwTGFwdG9wfGVufDB8fHx8MTc2NzQzMzk1MXww&ixlib=rb-4.1.0&q=80&w=400",
      ],
    },
    {
      name: "Asus ROG Zephyrus G14",
      price: 28000000,
      img: "https://images.unsplash.com/photo-1632603093711-0d93a0bcc6cc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4MzU4Mzl8MHwxfHNlYXJjaHwxfHxHYW1pbmclMjBMYXB0b3AlMjBSR0J8ZW58MHx8fHwxNzY3NDMzOTU3fDA&ixlib=rb-4.1.0&q=80&w=1080",
      subImages: [
        "https://images.unsplash.com/photo-1590126698754-510069860d27?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4MzU4Mzl8MHwxfHNlYXJjaHwyfHxHYW1pbmclMjBMYXB0b3AlMjBSR0J8ZW58MHx8fHwxNzY3NDMzOTU3fDA&ixlib=rb-4.1.0&q=80&w=400",
        "https://images.unsplash.com/photo-1605134513573-384dcf99a44c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4MzU4Mzl8MHwxfHNlYXJjaHwzfHxHYW1pbmclMjBMYXB0b3AlMjBSR0J8ZW58MHx8fHwxNzY3NDMzOTU3fDA&ixlib=rb-4.1.0&q=80&w=400",
        "https://images.unsplash.com/photo-1684127987312-43455fd95925?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4MzU4Mzl8MHwxfHNlYXJjaHw0fHxHYW1pbmclMjBMYXB0b3AlMjBSR0J8ZW58MHx8fHwxNzY3NDMzOTU3fDA&ixlib=rb-4.1.0&q=80&w=400",
      ],
    },
    {
      name: "Lenovo ThinkPad X1 Carbon",
      price: 24000000,
      img: "https://images.unsplash.com/photo-1763162410742-1d0097cea556?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4MzU4Mzl8MHwxfHNlYXJjaHwxfHxUaGlua1BhZCUyMEJ1c2luZXNzJTIwTGFwdG9wfGVufDB8fHx8MTc2NzQzMzk2M3ww&ixlib=rb-4.1.0&q=80&w=1080",
      subImages: [
        "https://images.unsplash.com/photo-1620233383573-b51d099bb075?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4MzU4Mzl8MHwxfHNlYXJjaHwyfHxUaGlua1BhZCUyMEJ1c2luZXNzJTIwTGFwdG9wfGVufDB8fHx8MTc2NzQzMzk2M3ww&ixlib=rb-4.1.0&q=80&w=400",
        "https://images.unsplash.com/photo-1509252086397-bc63a98646b1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4MzU4Mzl8MHwxfHNlYXJjaHwzfHxUaGlua1BhZCUyMEJ1c2luZXNzJTIwTGFwdG9wfGVufDB8fHx8MTc2NzQzMzk2M3ww&ixlib=rb-4.1.0&q=80&w=400",
        "https://images.unsplash.com/photo-1740721455292-e5cd29544381?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4MzU4Mzl8MHwxfHNlYXJjaHw0fHxUaGlua1BhZCUyMEJ1c2luZXNzJTIwTGFwdG9wfGVufDB8fHx8MTc2NzQzMzk2M3ww&ixlib=rb-4.1.0&q=80&w=400",
      ],
    },
  ],
  Cameras: [
    {
      name: "Leica Camera",
      price: 85000000,
      img: "https://images.unsplash.com/photo-1683309137841-9965913e78e4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4MzU4Mzl8MHwxfHNlYXJjaHwxfHxMZWljYSUyMENhbWVyYXxlbnwwfHx8fDE3Njc0MzE5MjV8MA&ixlib=rb-4.1.0&q=80&w=1080",
      subImages: [
        "https://images.unsplash.com/photo-1668696678286-3070fd9225bd?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4MzU4Mzl8MHwxfHNlYXJjaHwyfHxMZWljYSUyMENhbWVyYXxlbnwwfHx8fDE3Njc0MzE5MjV8MA&ixlib=rb-4.1.0&q=80&w=400",
        "https://images.unsplash.com/photo-1702471897816-4156a0a302f4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4MzU4Mzl8MHwxfHNlYXJjaHwzfHxMZWljYSUyMENhbWVyYXxlbnwwfHx8fDE3Njc0MzE5MjV8MA&ixlib=rb-4.1.0&q=80&w=400",
        "https://images.unsplash.com/photo-1594470760093-c02cf339ad45?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4MzU4Mzl8MHwxfHNlYXJjaHw0fHxMZWljYSUyMENhbWVyYXxlbnwwfHx8fDE3Njc0MzE5MjV8MA&ixlib=rb-4.1.0&q=80&w=400",
      ],
    },
    {
      name: "Sony Alpha 7 IV",
      price: 60000000,
      img: "https://images.unsplash.com/photo-1711322353001-6faf2c9110e1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4MzU4Mzl8MHwxfHNlYXJjaHwxfHxTb255JTIwQWxwaGElMjA3JTIwSVZ8ZW58MHx8fHwxNzY3NDM1NTc0fDA&ixlib=rb-4.1.0&q=80&w=1080",
      subImages: [
        "https://images.unsplash.com/photo-1758118107816-ddddfa3a1f44?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4MzU4Mzl8MHwxfHNlYXJjaHwyfHxTb255JTIwQWxwaGElMjA3JTIwSVZ8ZW58MHx8fHwxNzY3NDM1NTc0fDA&ixlib=rb-4.1.0&q=80&w=400",
        "https://images.unsplash.com/photo-1696041760231-dc91e0046a09?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4MzU4Mzl8MHwxfHNlYXJjaHwzfHxTb255JTIwQWxwaGElMjA3JTIwSVZ8ZW58MHx8fHwxNzY3NDM1NTc0fDA&ixlib=rb-4.1.0&q=80&w=400",
        "https://images.unsplash.com/photo-1642884422166-256f19bcbd85?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4MzU4Mzl8MHwxfHNlYXJjaHw0fHxTb255JTIwQWxwaGElMjA3JTIwSVZ8ZW58MHx8fHwxNzY3NDM1NTc0fDA&ixlib=rb-4.1.0&q=80&w=400",
      ],
    },
    {
      name: "Fujifilm X-T5",
      price: 45000000,
      img: "https://images.unsplash.com/photo-1749016888524-967635aa2c6f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4MzU4Mzl8MHwxfHNlYXJjaHwxfHxGdWppZmlsbSUyMFgtVDUlMjBDYW1lcmF8ZW58MHx8fHwxNzY3NDM1NTgwfDA&ixlib=rb-4.1.0&q=80&w=1080",
      subImages: [
        "https://images.unsplash.com/photo-1713846511721-78302c72c79a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4MzU4Mzl8MHwxfHNlYXJjaHwyfHxGdWppZmlsbSUyMFgtVDUlMjBDYW1lcmF8ZW58MHx8fHwxNzY3NDM1NTgwfDA&ixlib=rb-4.1.0&q=80&w=400",
        "https://images.unsplash.com/photo-1655904174259-5514f4a37fd1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4MzU4Mzl8MHwxfHNlYXJjaHwzfHxGdWppZmlsbSUyMFgtVDUlMjBDYW1lcmF8ZW58MHx8fHwxNzY3NDM1NTgwfDA&ixlib=rb-4.1.0&q=80&w=400",
        "https://images.unsplash.com/photo-1655904174535-8faeb14e70e1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4MzU4Mzl8MHwxfHNlYXJjaHw0fHxGdWppZmlsbSUyMFgtVDUlMjBDYW1lcmF8ZW58MHx8fHwxNzY3NDM1NTgwfDA&ixlib=rb-4.1.0&q=80&w=400",
      ],
    },
    {
      name: "Canon EOS R5",
      price: 90000000,
      img: "https://images.unsplash.com/photo-1648781329670-5f00c1b37404?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4MzU4Mzl8MHwxfHNlYXJjaHwxfHxDYW5vbiUyMEVPUyUyMFI1fGVufDB8fHx8MTc2NzQzNTU4Nnww&ixlib=rb-4.1.0&q=80&w=1080",
      subImages: [
        "https://images.unsplash.com/photo-1698429772559-46b6fcf69513?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4MzU4Mzl8MHwxfHNlYXJjaHwyfHxDYW5vbiUyMEVPUyUyMFI1fGVufDB8fHx8MTc2NzQzNTU4Nnww&ixlib=rb-4.1.0&q=80&w=400",
        "https://images.unsplash.com/photo-1698429772375-e15d1dfe023f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4MzU4Mzl8MHwxfHNlYXJjaHwzfHxDYW5vbiUyMEVPUyUyMFI1fGVufDB8fHx8MTc2NzQzNTU4Nnww&ixlib=rb-4.1.0&q=80&w=400",
        "https://images.unsplash.com/photo-1628682993915-d7a90eddd2db?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4MzU4Mzl8MHwxfHNlYXJjaHw0fHxDYW5vbiUyMEVPUyUyMFI1fGVufDB8fHx8MTc2NzQzNTU4Nnww&ixlib=rb-4.1.0&q=80&w=400",
      ],
    },
  ],
  Audio: [
    {
      name: "High-End Headphones",
      price: 12000000,
      img: "https://images.unsplash.com/photo-1471174569907-e911cbbd6d5f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4MzU4Mzl8MHwxfHNlYXJjaHwxfHxIaWdoLUVuZCUyMEhlYWRwaG9uZXN8ZW58MHx8fHwxNzY3NDMxOTcwfDA&ixlib=rb-4.1.0&q=80&w=1080",
      subImages: [
        "https://images.unsplash.com/photo-1571081607311-066958b1deba?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4MzU4Mzl8MHwxfHNlYXJjaHwyfHxIaWdoLUVuZCUyMEhlYWRwaG9uZXN8ZW58MHx8fHwxNzY3NDMxOTcwfDA&ixlib=rb-4.1.0&q=80&w=400",
        "https://images.unsplash.com/photo-1615554851544-e6249b92a492?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4MzU4Mzl8MHwxfHNlYXJjaHwzfHxIaWdoLUVuZCUyMEhlYWRwaG9uZXN8ZW58MHx8fHwxNzY3NDMxOTcwfDA&ixlib=rb-4.1.0&q=80&w=400",
        "https://images.unsplash.com/photo-1505739718967-6df30ff369c7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4MzU4Mzl8MHwxfHNlYXJjaHw0fHxIaWdoLUVuZCUyMEhlYWRwaG9uZXN8ZW58MHx8fHwxNzY3NDMxOTcwfDA&ixlib=rb-4.1.0&q=80&w=400",
      ],
    },
    {
      name: "Sonos Era 300",
      price: 12000000,
      img: "https://images.unsplash.com/photo-1586855114963-c90b5ea55408?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4MzU4Mzl8MHwxfHNlYXJjaHwxfHxTb25vcyUyMEVyYSUyMDMwMCUyMFNwZWFrZXJ8ZW58MHx8fHwxNzY3NDM1NTkxfDA&ixlib=rb-4.1.0&q=80&w=1080",
      subImages: [
        "https://images.unsplash.com/photo-1743521442683-08ffd8ac9e14?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4MzU4Mzl8MHwxfHNlYXJjaHwyfHxTb25vcyUyMEVyYSUyMDMwMCUyMFNwZWFrZXJ8ZW58MHx8fHwxNzY3NDM1NTkxfDA&ixlib=rb-4.1.0&q=80&w=400",
        "https://images.unsplash.com/photo-1711127093141-caea1718c784?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4MzU4Mzl8MHwxfHNlYXJjaHwzfHxTb25vcyUyMEVyYSUyMDMwMCUyMFNwZWFrZXJ8ZW58MHx8fHwxNzY3NDM1NTkxfDA&ixlib=rb-4.1.0&q=80&w=400",
        "https://images.unsplash.com/photo-1591452706295-06d0d6abc3aa?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4MzU4Mzl8MHwxfHNlYXJjaHw0fHxTb25vcyUyMEVyYSUyMDMwMCUyMFNwZWFrZXJ8ZW58MHx8fHwxNzY3NDM1NTkxfDA&ixlib=rb-4.1.0&q=80&w=400",
      ],
    },
    {
      name: "Bose QuietComfort Headphones",
      price: 8500000,
      img: "https://images.unsplash.com/photo-1623318993015-4bb0490764bf?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4MzU4Mzl8MHwxfHNlYXJjaHwxfHxCb3NlJTIwUXVpZXRDb21mb3J0JTIwSGVhZHBob25lc3xlbnwwfHx8fDE3Njc0MzU1OTd8MA&ixlib=rb-4.1.0&q=80&w=1080",
      subImages: [
        "https://images.unsplash.com/photo-1640300065113-738f2abb8ba6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4MzU4Mzl8MHwxfHNlYXJjaHwyfHxCb3NlJTIwUXVpZXRDb21mb3J0JTIwSGVhZHBob25lc3xlbnwwfHx8fDE3Njc0MzU1OTd8MA&ixlib=rb-4.1.0&q=80&w=400",
        "https://images.unsplash.com/photo-1570132251442-d38a55360c44?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4MzU4Mzl8MHwxfHNlYXJjaHwzfHxCb3NlJTIwUXVpZXRDb21mb3J0JTIwSGVhZHBob25lc3xlbnwwfHx8fDE3Njc0MzU1OTd8MA&ixlib=rb-4.1.0&q=80&w=400",
        "https://images.unsplash.com/photo-1657223143933-33ceab36ecb9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4MzU4Mzl8MHwxfHNlYXJjaHw0fHxCb3NlJTIwUXVpZXRDb21mb3J0JTIwSGVhZHBob25lc3xlbnwwfHx8fDE3Njc0MzU1OTd8MA&ixlib=rb-4.1.0&q=80&w=400",
      ],
    },
    {
      name: "Vintage Turntable",
      price: 15000000,
      img: "https://images.unsplash.com/photo-1698074890098-63d01b33ccfd?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4MzU4Mzl8MHwxfHNlYXJjaHwxfHxWaW50YWdlJTIwVHVybnRhYmxlJTIwUmVjb3JkJTIwUGxheWVyfGVufDB8fHx8MTc2NzQzNTYwM3ww&ixlib=rb-4.1.0&q=80&w=1080",
      subImages: [
        "https://images.unsplash.com/photo-1616587998810-6e2a4a270866?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4MzU4Mzl8MHwxfHNlYXJjaHwyfHxWaW50YWdlJTIwVHVybnRhYmxlJTIwUmVjb3JkJTIwUGxheWVyfGVufDB8fHx8MTc2NzQzNTYwM3ww&ixlib=rb-4.1.0&q=80&w=400",
        "https://images.unsplash.com/photo-1766353861243-71e5607a13eb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4MzU4Mzl8MHwxfHNlYXJjaHwzfHxWaW50YWdlJTIwVHVybnRhYmxlJTIwUmVjb3JkJTIwUGxheWVyfGVufDB8fHx8MTc2NzQzNTYwM3ww&ixlib=rb-4.1.0&q=80&w=400",
        "https://images.unsplash.com/photo-1758941853341-4e431b9693b7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4MzU4Mzl8MHwxfHNlYXJjaHw0fHxWaW50YWdlJTIwVHVybnRhYmxlJTIwUmVjb3JkJTIwUGxheWVyfGVufDB8fHx8MTc2NzQzNTYwM3ww&ixlib=rb-4.1.0&q=80&w=400",
      ],
    },
  ],
  Gadgets: [
    {
      name: "Holographic Display",
      price: 25000000,
      img: "https://images.unsplash.com/photo-1758793046342-4c80854ae87e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4MzU4Mzl8MHwxfHNlYXJjaHwxfHxIb2xvZ3JhcGhpYyUyMERpc3BsYXl8ZW58MHx8fHwxNzY3NDMxOTk0fDA&ixlib=rb-4.1.0&q=80&w=1080",
      subImages: [
        "https://images.unsplash.com/photo-1692791754463-c4782e14e367?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4MzU4Mzl8MHwxfHNlYXJjaHwyfHxIb2xvZ3JhcGhpYyUyMERpc3BsYXl8ZW58MHx8fHwxNzY3NDMxOTk0fDA&ixlib=rb-4.1.0&q=80&w=400",
        "https://images.unsplash.com/photo-1574272795246-9eeaf77fc22a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4MzU4Mzl8MHwxfHNlYXJjaHwzfHxIb2xvZ3JhcGhpYyUyMERpc3BsYXl8ZW58MHx8fHwxNzY3NDMxOTk0fDA&ixlib=rb-4.1.0&q=80&w=400",
        "https://images.unsplash.com/photo-1565928472362-fe784a95fe7c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4MzU4Mzl8MHwxfHNlYXJjaHw0fHxIb2xvZ3JhcGhpYyUyMERpc3BsYXl8ZW58MHx8fHwxNzY3NDMxOTk0fDA&ixlib=rb-4.1.0&q=80&w=400",
      ],
    },
    {
      name: "Professional Drone",
      price: 18000000,
      img: "https://images.unsplash.com/photo-1616835086395-d5cc15e93b22?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4MzU4Mzl8MHwxfHNlYXJjaHwxfHxQcm9mZXNzaW9uYWwlMjBEcm9uZXxlbnwwfHx8fDE3Njc0MzIwMTd8MA&ixlib=rb-4.1.0&q=80&w=1080",
      subImages: [
        "https://images.unsplash.com/photo-1624274362324-1b8342495edb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4MzU4Mzl8MHwxfHNlYXJjaHwyfHxQcm9mZXNzaW9uYWwlMjBEcm9uZXxlbnwwfHx8fDE3Njc0MzIwMTd8MA&ixlib=rb-4.1.0&q=80&w=400",
        "https://images.unsplash.com/photo-1664205494007-e80cb2facda8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4MzU4Mzl8MHwxfHNlYXJjaHwzfHxQcm9mZXNzaW9uYWwlMjBEcm9uZXxlbnwwfHx8fDE3Njc0MzIwMTd8MA&ixlib=rb-4.1.0&q=80&w=400",
        "https://images.unsplash.com/photo-1511204579483-e5c2b1d69acd?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4MzU4Mzl8MHwxfHNlYXJjaHw0fHxQcm9mZXNzaW9uYWwlMjBEcm9uZXxlbnwwfHx8fDE3Njc0MzIwMTd8MA&ixlib=rb-4.1.0&q=80&w=400",
      ],
    },
    {
      name: "VR Headset Meta Quest",
      price: 12000000,
      img: "https://images.unsplash.com/photo-1741770067276-a10e15ff5197?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4MzU4Mzl8MHwxfHNlYXJjaHwxfHxWUiUyMEhlYWRzZXQlMjBNZXRhJTIwUXVlc3R8ZW58MHx8fHwxNzY3NDM1NjA4fDA&ixlib=rb-4.1.0&q=80&w=1080",
      subImages: [
        "https://images.unsplash.com/photo-1712369448819-2ca1105339cf?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4MzU4Mzl8MHwxfHNlYXJjaHwyfHxWUiUyMEhlYWRzZXQlMjBNZXRhJTIwUXVlc3R8ZW58MHx8fHwxNzY3NDM1NjA4fDA&ixlib=rb-4.1.0&q=80&w=400",
        "https://images.unsplash.com/photo-1713801129175-8e60c67e0412?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4MzU4Mzl8MHwxfHNlYXJjaHwzfHxWUiUyMEhlYWRzZXQlMjBNZXRhJTIwUXVlc3R8ZW58MHx8fHwxNzY3NDM1NjA4fDA&ixlib=rb-4.1.0&q=80&w=400",
        "https://images.unsplash.com/photo-1641576039236-4c9b4cf846b0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4MzU4Mzl8MHwxfHNlYXJjaHw0fHxWUiUyMEhlYWRzZXQlMjBNZXRhJTIwUXVlc3R8ZW58MHx8fHwxNzY3NDM1NjA4fDA&ixlib=rb-4.1.0&q=80&w=400",
      ],
    },
    {
      name: "Smart Home Hub",
      price: 4500000,
      img: "https://images.unsplash.com/photo-1571251455684-2eb131fdb294?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4MzU4Mzl8MHwxfHNlYXJjaHwxfHxTbWFydCUyMEhvbWUlMjBIdWIlMjBEaXNwbGF5fGVufDB8fHx8MTc2NzQzNTYxNHww&ixlib=rb-4.1.0&q=80&w=1080",
      subImages: [
        "https://images.unsplash.com/photo-1650682009477-52fd77302b78?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4MzU4Mzl8MHwxfHNlYXJjaHwyfHxTbWFydCUyMEhvbWUlMjBIdWIlMjBEaXNwbGF5fGVufDB8fHx8MTc2NzQzNTYxNHww&ixlib=rb-4.1.0&q=80&w=400",
        "https://images.unsplash.com/photo-1758577515339-93872db0d37e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4MzU4Mzl8MHwxfHNlYXJjaHwzfHxTbWFydCUyMEhvbWUlMjBIdWIlMjBEaXNwbGF5fGVufDB8fHx8MTc2NzQzNTYxNHww&ixlib=rb-4.1.0&q=80&w=400",
        "https://images.unsplash.com/photo-1767355272538-e7177d16f979?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4MzU4Mzl8MHwxfHNlYXJjaHw0fHxTbWFydCUyMEhvbWUlMjBIdWIlMjBEaXNwbGF5fGVufDB8fHx8MTc2NzQzNTYxNHww&ixlib=rb-4.1.0&q=80&w=400",
      ],
    },
    {
      name: "Kindle E-reader",
      price: 3800000,
      img: "https://images.unsplash.com/photo-1643913398973-f8e24bf6d1c1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4MzU4Mzl8MHwxfHNlYXJjaHwxfHxLaW5kbGUlMjBFLXJlYWRlcnxlbnwwfHx8fDE3Njc0MzU2MTl8MA&ixlib=rb-4.1.0&q=80&w=1080",
      subImages: [
        "https://images.unsplash.com/photo-1591719675150-a9302a9cb467?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4MzU4Mzl8MHwxfHNlYXJjaHwyfHxLaW5kbGUlMjBFLXJlYWRlcnxlbnwwfHx8fDE3Njc0MzU2MTl8MA&ixlib=rb-4.1.0&q=80&w=400",
        "https://images.unsplash.com/photo-1506953752663-add60014e80e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4MzU4Mzl8MHwxfHNlYXJjaHwzfHxLaW5kbGUlMjBFLXJlYWRlcnxlbnwwfHx8fDE3Njc0MzU2MTl8MA&ixlib=rb-4.1.0&q=80&w=400",
        "https://images.unsplash.com/photo-1747347643676-55ff6873cd51?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4MzU4Mzl8MHwxfHNlYXJjaHw0fHxLaW5kbGUlMjBFLXJlYWRlcnxlbnwwfHx8fDE3Njc0MzU2MTl8MA&ixlib=rb-4.1.0&q=80&w=400",
      ],
    },
  ],
  Gaming: [
    {
      name: "Retro Arcade Machine",
      price: 15000000,
      img: "https://images.unsplash.com/photo-1635187834534-d1fa994fcabb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4MzU4Mzl8MHwxfHNlYXJjaHwxfHxSZXRybyUyMEFyY2FkZSUyME1hY2hpbmV8ZW58MHx8fHwxNzY3NDMxOTAzfDA&ixlib=rb-4.1.0&q=80&w=1080",
      subImages: [
        "https://images.unsplash.com/photo-1563277267-0e9f2dabb9ba?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4MzU4Mzl8MHwxfHNlYXJjaHwyfHxSZXRybyUyMEFyY2FkZSUyME1hY2hpbmV8ZW58MHx8fHwxNzY3NDMxOTAzfDA&ixlib=rb-4.1.0&q=80&w=400",
        "https://images.unsplash.com/photo-1632765743329-3b257fe779a6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4MzU4Mzl8MHwxfHNlYXJjaHwzfHxSZXRybyUyMEFyY2FkZSUyME1hY2hpbmV8ZW58MHx8fHwxNzY3NDMxOTAzfDA&ixlib=rb-4.1.0&q=80&w=400",
        "https://images.unsplash.com/photo-1640301133815-4bec64fca33f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4MzU4Mzl8MHwxfHNlYXJjaHw0fHxSZXRybyUyMEFyY2FkZSUyME1hY2hpbmV8ZW58MHx8fHwxNzY3NDMxOTAzfDA&ixlib=rb-4.1.0&q=80&w=400",
      ],
    },
    {
      name: "Nintendo Switch OLED",
      price: 8500000,
      img: "https://images.unsplash.com/photo-1680007966627-d49ae18dbbae?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4MzU4Mzl8MHwxfHNlYXJjaHwxfHxOaW50ZW5kbyUyMFN3aXRjaCUyME9MRUR8ZW58MHx8fHwxNzY3NDM1NjI1fDA&ixlib=rb-4.1.0&q=80&w=1080",
      subImages: [
        "https://images.unsplash.com/photo-1715081406782-d605bd2d39a8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4MzU4Mzl8MHwxfHNlYXJjaHwyfHxOaW50ZW5kbyUyMFN3aXRjaCUyME9MRUR8ZW58MHx8fHwxNzY3NDM1NjI1fDA&ixlib=rb-4.1.0&q=80&w=400",
        "https://images.unsplash.com/photo-1665042003944-bc86d2efb0bf?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4MzU4Mzl8MHwxfHNlYXJjaHwzfHxOaW50ZW5kbyUyMFN3aXRjaCUyME9MRUR8ZW58MHx8fHwxNzY3NDM1NjI1fDA&ixlib=rb-4.1.0&q=80&w=400",
        "https://images.unsplash.com/photo-1737055056934-0d274175b161?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4MzU4Mzl8MHwxfHNlYXJjaHw0fHxOaW50ZW5kbyUyMFN3aXRjaCUyME9MRUR8ZW58MHx8fHwxNzY3NDM1NjI1fDA&ixlib=rb-4.1.0&q=80&w=400",
      ],
    },
    {
      name: "PlayStation 5",
      price: 14000000,
      img: "https://images.unsplash.com/photo-1622979138084-c03ae28968ed?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4MzU4Mzl8MHwxfHNlYXJjaHwxfHxQbGF5U3RhdGlvbiUyMDUlMjBDb25zb2xlfGVufDB8fHx8MTc2NzQzNTYzMXww&ixlib=rb-4.1.0&q=80&w=1080",
      subImages: [
        "https://images.unsplash.com/photo-1606813907291-d86efa9b94db?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4MzU4Mzl8MHwxfHNlYXJjaHwyfHxQbGF5U3RhdGlvbiUyMDUlMjBDb25zb2xlfGVufDB8fHx8MTc2NzQzNTYzMXww&ixlib=rb-4.1.0&q=80&w=400",
        "https://images.unsplash.com/photo-1665041974623-d398d035023e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4MzU4Mzl8MHwxfHNlYXJjaHwzfHxQbGF5U3RhdGlvbiUyMDUlMjBDb25zb2xlfGVufDB8fHx8MTc2NzQzNTYzMXww&ixlib=rb-4.1.0&q=80&w=400",
        "https://images.unsplash.com/photo-1632254219709-95d444c41189?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4MzU4Mzl8MHwxfHNlYXJjaHw0fHxQbGF5U3RhdGlvbiUyMDUlMjBDb25zb2xlfGVufDB8fHx8MTc2NzQzNTYzMXww&ixlib=rb-4.1.0&q=80&w=400",
      ],
    },
    {
      name: "Xbox Series X",
      price: 13500000,
      img: "https://images.unsplash.com/photo-1607853827120-6847830b38b0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4MzU4Mzl8MHwxfHNlYXJjaHwxfHxYYm94JTIwU2VyaWVzJTIwWCUyMENvbnNvbGV8ZW58MHx8fHwxNzY3NDM1NjM3fDA&ixlib=rb-4.1.0&q=80&w=1080",
      subImages: [
        "https://images.unsplash.com/photo-1683823363266-efa8cedec4d4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4MzU4Mzl8MHwxfHNlYXJjaHwyfHxYYm94JTIwU2VyaWVzJTIwWCUyMENvbnNvbGV8ZW58MHx8fHwxNzY3NDM1NjM3fDA&ixlib=rb-4.1.0&q=80&w=400",
        "https://images.unsplash.com/photo-1620815023653-f65690227267?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4MzU4Mzl8MHwxfHNlYXJjaHwzfHxYYm94JTIwU2VyaWVzJTIwWCUyMENvbnNvbGV8ZW58MHx8fHwxNzY3NDM1NjM3fDA&ixlib=rb-4.1.0&q=80&w=400",
        "https://images.unsplash.com/photo-1620815023675-c9ed9927536b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4MzU4Mzl8MHwxfHNlYXJjaHw0fHxYYm94JTIwU2VyaWVzJTIwWCUyMENvbnNvbGV8ZW58MHx8fHwxNzY3NDM1NjM3fDA&ixlib=rb-4.1.0&q=80&w=400",
      ],
    },
  ],
  TechAccessories: [
    {
      name: "Mechanical Keyboard",
      price: 4000000,
      img: "https://images.unsplash.com/photo-1626958390898-162d3577f293?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4MzU4Mzl8MHwxfHNlYXJjaHwxfHxNZWNoYW5pY2FsJTIwS2V5Ym9hcmR8ZW58MHx8fHwxNzY3NDMxOTQ4fDA&ixlib=rb-4.1.0&q=80&w=1080",
      subImages: [
        "https://images.unsplash.com/photo-1558050032-160f36233a07?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4MzU4Mzl8MHwxfHNlYXJjaHwyfHxNZWNoYW5pY2FsJTIwS2V5Ym9hcmR8ZW58MHx8fHwxNzY3NDMxOTQ4fDA&ixlib=rb-4.1.0&q=80&w=400",
        "https://images.unsplash.com/photo-1602025882379-e01cf08baa51?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4MzU4Mzl8MHwxfHNlYXJjaHwzfHxNZWNoYW5pY2FsJTIwS2V5Ym9hcmR8ZW58MHx8fHwxNzY3NDMxOTQ4fDA&ixlib=rb-4.1.0&q=80&w=400",
        "https://images.unsplash.com/photo-1625130694338-4110ba634e59?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4MzU4Mzl8MHwxfHNlYXJjaHw0fHxNZWNoYW5pY2FsJTIwS2V5Ym9hcmR8ZW58MHx8fHwxNzY3NDMxOTQ4fDA&ixlib=rb-4.1.0&q=80&w=400",
      ],
    },
    {
      name: "MX Master 3S Mouse",
      price: 2500000,
      img: "https://images.unsplash.com/photo-1611846199341-e68b0da801eb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4MzU4Mzl8MHwxfHNlYXJjaHwxfHxMb2dpdGVjaCUyME1YJTIwTWFzdGVyJTIwTW91c2V8ZW58MHx8fHwxNzY3NDM1NjQyfDA&ixlib=rb-4.1.0&q=80&w=1080",
      subImages: [
        "https://images.unsplash.com/photo-1722682810978-98d5a0412546?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4MzU4Mzl8MHwxfHNlYXJjaHwyfHxMb2dpdGVjaCUyME1YJTIwTWFzdGVyJTIwTW91c2V8ZW58MHx8fHwxNzY3NDM1NjQyfDA&ixlib=rb-4.1.0&q=80&w=400",
        "https://images.unsplash.com/photo-1722682811175-5df0b444d659?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4MzU4Mzl8MHwxfHNlYXJjaHwzfHxMb2dpdGVjaCUyME1YJTIwTWFzdGVyJTIwTW91c2V8ZW58MHx8fHwxNzY3NDM1NjQyfDA&ixlib=rb-4.1.0&q=80&w=400",
        "https://images.unsplash.com/photo-1722682810969-06dfc9c9d517?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4MzU4Mzl8MHwxfHNlYXJjaHw0fHxMb2dpdGVjaCUyME1YJTIwTWFzdGVyJTIwTW91c2V8ZW58MHx8fHwxNzY3NDM1NjQyfDA&ixlib=rb-4.1.0&q=80&w=400",
      ],
    },
    {
      name: "Anker Power Bank",
      price: 1500000,
      img: "https://images.unsplash.com/photo-1632156752304-8b3db7a7bab4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4MzU4Mzl8MHwxfHNlYXJjaHwxfHxBbmtlciUyMFBvd2VyJTIwQmFua3xlbnwwfHx8fDE3Njc0MzU2NDh8MA&ixlib=rb-4.1.0&q=80&w=1080",
      subImages: [
        "https://images.unsplash.com/photo-1676116777245-1cc40079cd38?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4MzU4Mzl8MHwxfHNlYXJjaHwyfHxBbmtlciUyMFBvd2VyJTIwQmFua3xlbnwwfHx8fDE3Njc0MzU2NDh8MA&ixlib=rb-4.1.0&q=80&w=400",
        "https://images.unsplash.com/photo-1632156752398-2b2cb4e6c907?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4MzU4Mzl8MHwxfHNlYXJjaHwzfHxBbmtlciUyMFBvd2VyJTIwQmFua3xlbnwwfHx8fDE3Njc0MzU2NDh8MA&ixlib=rb-4.1.0&q=80&w=400",
        "https://images.unsplash.com/photo-1632156752251-e3759ed58466?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4MzU4Mzl8MHwxfHNlYXJjaHw0fHxBbmtlciUyMFBvd2VyJTIwQmFua3xlbnwwfHx8fDE3Njc0MzU2NDh8MA&ixlib=rb-4.1.0&q=80&w=400",
      ],
    },
    {
      name: "Apple AirPods Max",
      price: 13000000,
      img: "https://images.unsplash.com/photo-1612116454817-2b0841e30eaf?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4MzU4Mzl8MHwxfHNlYXJjaHwxfHxBcHBsZSUyMEFpclBvZHMlMjBNYXh8ZW58MHx8fHwxNzY3NDM1NjUzfDA&ixlib=rb-4.1.0&q=80&w=1080",
      subImages: [
        "https://images.unsplash.com/photo-1616661318204-51ededbdf7a8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4MzU4Mzl8MHwxfHNlYXJjaHwyfHxBcHBsZSUyMEFpclBvZHMlMjBNYXh8ZW58MHx8fHwxNzY3NDM1NjUzfDA&ixlib=rb-4.1.0&q=80&w=400",
        "https://images.unsplash.com/photo-1628329567705-f8f7150c3cff?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4MzU4Mzl8MHwxfHNlYXJjaHwzfHxBcHBsZSUyMEFpclBvZHMlMjBNYXh8ZW58MHx8fHwxNzY3NDM1NjUzfDA&ixlib=rb-4.1.0&q=80&w=400",
        "https://images.unsplash.com/photo-1625245488459-ee9051a7030f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4MzU4Mzl8MHwxfHNlYXJjaHw0fHxBcHBsZSUyMEFpclBvZHMlMjBNYXh8ZW58MHx8fHwxNzY3NDM1NjUzfDA&ixlib=rb-4.1.0&q=80&w=400",
      ],
    },
  ],
  Shoes: [
    {
      name: "Nike Air Jordan 1 High",
      price: 4000000,
      img: "https://images.unsplash.com/photo-1515955656352-a1fa3ffcd111?w=800&q=80",
      subImages: [
        "https://images.unsplash.com/photo-1552346154-21d32810dbc3?w=800&q=80",
        "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=800&q=80",
        "https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?w=800&q=80",
      ],
    },
    {
      name: "Dr Martens Boots",
      price: 4500000,
      img: "https://images.unsplash.com/photo-1747083996241-3d86d9dbab11?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4MzU4Mzl8MHwxfHNlYXJjaHwxfHxEciUyME1hcnRlbnMlMjBCb290c3xlbnwwfHx8fDE3Njc0MzU2NTl8MA&ixlib=rb-4.1.0&q=80&w=1080",
      subImages: [
        "https://images.unsplash.com/photo-1551109988-2387d9439af7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4MzU4Mzl8MHwxfHNlYXJjaHwyfHxEciUyME1hcnRlbnMlMjBCb290c3xlbnwwfHx8fDE3Njc0MzU2NTl8MA&ixlib=rb-4.1.0&q=80&w=400",
        "https://images.unsplash.com/photo-1548768707-d1fc5712d7fc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4MzU4Mzl8MHwxfHNlYXJjaHwzfHxEciUyME1hcnRlbnMlMjBCb290c3xlbnwwfHx8fDE3Njc0MzU2NTl8MA&ixlib=rb-4.1.0&q=80&w=400",
        "https://images.unsplash.com/photo-1583238620298-25dd9fa7f5cf?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4MzU4Mzl8MHwxfHNlYXJjaHw0fHxEciUyME1hcnRlbnMlMjBCb290c3xlbnwwfHx8fDE3Njc0MzU2NTl8MA&ixlib=rb-4.1.0&q=80&w=400",
      ],
    },
    {
      name: "Loafers Leather Shoes",
      price: 3500000,
      img: "https://images.unsplash.com/photo-1616406432452-07bc5938759d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4MzU4Mzl8MHwxfHNlYXJjaHwxfHxMb2FmZXJzJTIwTGVhdGhlciUyMFNob2VzfGVufDB8fHx8MTc2NzQzNTY2NHww&ixlib=rb-4.1.0&q=80&w=1080",
      subImages: [
        "https://images.unsplash.com/photo-1576792741377-eb0f4f6d1a47?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4MzU4Mzl8MHwxfHNlYXJjaHwyfHxMb2FmZXJzJTIwTGVhdGhlciUyMFNob2VzfGVufDB8fHx8MTc2NzQzNTY2NHww&ixlib=rb-4.1.0&q=80&w=400",
        "https://images.unsplash.com/photo-1569844913922-54a682be698b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4MzU4Mzl8MHwxfHNlYXJjaHwzfHxMb2FmZXJzJTIwTGVhdGhlciUyMFNob2VzfGVufDB8fHx8MTc2NzQzNTY2NHww&ixlib=rb-4.1.0&q=80&w=400",
        "https://images.unsplash.com/photo-1760616172899-0681b97a2de3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4MzU4Mzl8MHwxfHNlYXJjaHw0fHxMb2FmZXJzJTIwTGVhdGhlciUyMFNob2VzfGVufDB8fHx8MTc2NzQzNTY2NHww&ixlib=rb-4.1.0&q=80&w=400",
      ],
    },
    {
      name: "Converse Chuck 70",
      price: 1800000,
      img: "https://images.unsplash.com/photo-1607522370275-f14206abe5d3?w=800&q=80",
      subImages: [
        "https://images.unsplash.com/photo-1494496195158-c31bda6741d8?w=800&q=80",
        "https://images.unsplash.com/photo-1460353581641-37baddab0fa2?w=800&q=80",
        "https://images.unsplash.com/photo-1494496195158-c31bda6741d8?w=800&q=80",
      ],
    },
  ],
  Watches: [
    {
      name: "Rolex Submariner Date",
      price: 250000000,
      img: "https://images.unsplash.com/photo-1523170335258-f5ed11844a49?w=800&q=80",
      subImages: [
        "https://images.unsplash.com/photo-1614164185128-e4ec99c436d7?w=800&q=80",
        "https://images.unsplash.com/photo-1587836374828-4dbafa94cf0e?w=800&q=80",
        "https://images.unsplash.com/photo-1622434641406-a158105c91d3?w=800&q=80",
      ],
    },
    {
      name: "Casio G-Shock GA-2100",
      price: 3000000,
      img: "https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=800&q=80",
      subImages: [
        "https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=800&q=80",
        "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=800&q=80",
        "https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=800&q=80",
      ],
    },
    {
      name: "Apple Watch Ultra 2",
      price: 18000000,
      img: "https://images.unsplash.com/photo-1713056878930-c5604da9acfd?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4MzU4Mzl8MHwxfHNlYXJjaHwxfHxBcHBsZSUyMFdhdGNoJTIwVWx0cmF8ZW58MHx8fHwxNzY3NDMzOTY4fDA&ixlib=rb-4.1.0&q=80&w=1080",
      subImages: [
        "https://images.unsplash.com/photo-1679436204470-87dc7da1e8be?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4MzU4Mzl8MHwxfHNlYXJjaHwyfHxBcHBsZSUyMFdhdGNoJTIwVWx0cmF8ZW58MHx8fHwxNzY3NDMzOTY4fDA&ixlib=rb-4.1.0&q=80&w=400",
        "https://images.unsplash.com/photo-1707739148809-20c1198ef0d7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4MzU4Mzl8MHwxfHNlYXJjaHwzfHxBcHBsZSUyMFdhdGNoJTIwVWx0cmF8ZW58MHx8fHwxNzY3NDMzOTY4fDA&ixlib=rb-4.1.0&q=80&w=400",
        "https://images.unsplash.com/photo-1664610225312-ba25cd8dbe5f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4MzU4Mzl8MHwxfHNlYXJjaHw0fHxBcHBsZSUyMFdhdGNoJTIwVWx0cmF8ZW58MHx8fHwxNzY3NDMzOTY4fDA&ixlib=rb-4.1.0&q=80&w=400",
      ],
    },
    {
      name: "Seiko 5 Sports Automatic",
      price: 6000000,
      img: "https://images.unsplash.com/photo-1614164185128-e4ec99c436d7?w=800&q=80",
      subImages: [
        "https://images.unsplash.com/photo-1619623861805-7798b0492cb4?w=800&q=80",
        "https://images.unsplash.com/photo-1522312346375-d1a52e2b99b3?w=800&q=80",
        "https://images.unsplash.com/photo-1619623861805-7798b0492cb4?w=800&q=80",
      ],
    },
    {
      name: "Rolex Submariner (New)",
      price: 250000000,
      img: "https://images.unsplash.com/photo-1670404160620-a3a86428560e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4MzU4Mzl8MHwxfHNlYXJjaHwxfHxSb2xleCUyMFN1Ym1hcmluZXJ8ZW58MHx8fHwxNzY3NDMxODk2fDA&ixlib=rb-4.1.0&q=80&w=1080",
      subImages: [
        "https://images.unsplash.com/photo-1662384197911-e82189f4dc60?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4MzU4Mzl8MHwxfHNlYXJjaHwyfHxSb2xleCUyMFN1Ym1hcmluZXJ8ZW58MHx8fHwxNzY3NDMxODk2fDA&ixlib=rb-4.1.0&q=80&w=400",
        "https://images.unsplash.com/photo-1730757679771-b53e798846cf?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4MzU4Mzl8MHwxfHNlYXJjaHwzfHxSb2xleCUyMFN1Ym1hcmluZXJ8ZW58MHx8fHwxNzY3NDMxODk2fDA&ixlib=rb-4.1.0&q=80&w=400",
        "https://images.unsplash.com/photo-1662384205880-2c7a9879cc0c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4MzU4Mzl8MHwxfHNlYXJjaHw0fHxSb2xleCUyMFN1Ym1hcmluZXJ8ZW58MHx8fHwxNzY3NDMxODk2fDA&ixlib=rb-4.1.0&q=80&w=400",
      ],
    },
    {
      name: "Gold Pocket Watch",
      price: 15000000,
      img: "https://images.unsplash.com/photo-1703925154183-772704bc6810?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4MzU4Mzl8MHwxfHNlYXJjaHwxfHxHb2xkJTIwUG9ja2V0JTIwV2F0Y2h8ZW58MHx8fHwxNzY3NDMxOTU5fDA&ixlib=rb-4.1.0&q=80&w=1080",
      subImages: [
        "https://images.unsplash.com/photo-1763336313779-d985d1a8f6b1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4MzU4Mzl8MHwxfHNlYXJjaHwyfHxHb2xkJTIwUG9ja2V0JTIwV2F0Y2h8ZW58MHx8fHwxNzY3NDMxOTU5fDA&ixlib=rb-4.1.0&q=80&w=400",
        "https://images.unsplash.com/photo-1763189851330-23f36450bbde?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4MzU4Mzl8MHwxfHNlYXJjaHwzfHxHb2xkJTIwUG9ja2V0JTIwV2F0Y2h8ZW58MHx8fHwxNzY3NDMxOTU5fDA&ixlib=rb-4.1.0&q=80&w=400",
        "https://images.unsplash.com/photo-1763392293665-56b9a35e4420?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4MzU4Mzl8MHwxfHNlYXJjaHw0fHxHb2xkJTIwUG9ja2V0JTIwV2F0Y2h8ZW58MHx8fHwxNzY3NDMxOTU5fDA&ixlib=rb-4.1.0&q=80&w=400",
      ],
    },
  ],
  Jewelry: [
    {
      name: "Diamond Necklace",
      price: 45000000,
      img: "https://images.unsplash.com/photo-1589128777073-263566ae5e4d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4MzU4Mzl8MHwxfHNlYXJjaHwxfHxEaWFtb25kJTIwTmVja2xhY2V8ZW58MHx8fHwxNzY3NDMxOTE0fDA&ixlib=rb-4.1.0&q=80&w=1080",
      subImages: [
        "https://images.unsplash.com/photo-1673178875233-a1f2e0124b7e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4MzU4Mzl8MHwxfHNlYXJjaHwyfHxEaWFtb25kJTIwTmVja2xhY2V8ZW58MHx8fHwxNzY3NDMxOTE0fDA&ixlib=rb-4.1.0&q=80&w=400",
        "https://images.unsplash.com/photo-1743264385411-57c883bdc0ea?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4MzU4Mzl8MHwxfHNlYXJjaHwzfHxEaWFtb25kJTIwTmVja2xhY2V8ZW58MHx8fHwxNzY3NDMxOTE0fDA&ixlib=rb-4.1.0&q=80&w=400",
        "https://images.unsplash.com/photo-1598560917505-59a3ad559071?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4MzU4Mzl8MHwxfHNlYXJjaHw0fHxEaWFtb25kJTIwTmVja2xhY2V8ZW58MHx8fHwxNzY3NDMxOTE0fDA&ixlib=rb-4.1.0&q=80&w=400",
      ],
    },
    {
      name: "Sapphire Ring",
      price: 35000000,
      img: "https://images.unsplash.com/photo-1605553961508-6184942495b9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4MzU4Mzl8MHwxfHNlYXJjaHwxfHxTYXBwaGlyZSUyMFJpbmd8ZW58MHx8fHwxNzY3NDMyMDA1fDA&ixlib=rb-4.1.0&q=80&w=1080",
      subImages: [
        "https://images.unsplash.com/photo-1603561593143-2d9242789dfb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4MzU4Mzl8MHwxfHNlYXJjaHwyfHxTYXBwaGlyZSUyMFJpbmd8ZW58MHx8fHwxNzY3NDMyMDA1fDA&ixlib=rb-4.1.0&q=80&w=400",
        "https://images.unsplash.com/photo-1605553961482-818a48382ad4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4MzU4Mzl8MHwxfHNlYXJjaHwzfHxTYXBwaGlyZSUyMFJpbmd8ZW58MHx8fHwxNzY3NDMyMDA1fDA&ixlib=rb-4.1.0&q=80&w=400",
        "https://images.unsplash.com/photo-1603561596112-0a132b757442?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4MzU4Mzl8MHwxfHNlYXJjaHw0fHxTYXBwaGlyZSUyMFJpbmd8ZW58MHx8fHwxNzY3NDMyMDA1fDA&ixlib=rb-4.1.0&q=80&w=400",
      ],
    },
  ],
  FashionAccessories: [
    {
      name: "Designer Handbag",
      price: 50000000,
      img: "https://images.unsplash.com/photo-1601924928357-22d3b3abfcfb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4MzU4Mzl8MHwxfHNlYXJjaHwxfHxEZXNpZ25lciUyMEhhbmRiYWd8ZW58MHx8fHwxNzY3NDMxOTM2fDA&ixlib=rb-4.1.0&q=80&w=1080",
      subImages: [
        "https://images.unsplash.com/photo-1601924921557-45e6dea0a157?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4MzU4Mzl8MHwxfHNlYXJjaHwyfHxEZXNpZ25lciUyMEhhbmRiYWd8ZW58MHx8fHwxNzY3NDMxOTM2fDA&ixlib=rb-4.1.0&q=80&w=400",
        "https://images.unsplash.com/photo-1758171692659-024183c2c272?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4MzU4Mzl8MHwxfHNlYXJjaHwzfHxEZXNpZ25lciUyMEhhbmRiYWd8ZW58MHx8fHwxNzY3NDMxOTM2fDA&ixlib=rb-4.1.0&q=80&w=400",
        "https://images.unsplash.com/photo-1761646238238-361790889104?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4MzU4Mzl8MHwxfHNlYXJjaHw0fHxEZXNpZ25lciUyMEhhbmRiYWd8ZW58MHx8fHwxNzY3NDMxOTM2fDA&ixlib=rb-4.1.0&q=80&w=400",
      ],
    },
    {
      name: "Silk Scarf",
      price: 2500000,
      img: "https://images.unsplash.com/photo-1677478863154-55ecce8c7536?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4MzU4Mzl8MHwxfHNlYXJjaHwxfHxTaWxrJTIwU2NhcmZ8ZW58MHx8fHwxNzY3NDMxOTgyfDA&ixlib=rb-4.1.0&q=80&w=1080",
      subImages: [
        "https://images.unsplash.com/photo-1566534335938-05f1f2949435?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4MzU4Mzl8MHwxfHNlYXJjaHwyfHxTaWxrJTIwU2NhcmZ8ZW58MHx8fHwxNzY3NDMxOTgyfDA&ixlib=rb-4.1.0&q=80&w=400",
        "https://images.unsplash.com/photo-1517472292914-9570a594783b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4MzU4Mzl8MHwxfHNlYXJjaHwzfHxTaWxrJTIwU2NhcmZ8ZW58MHx8fHwxNzY3NDMxOTgyfDA&ixlib=rb-4.1.0&q=80&w=400",
        "https://images.unsplash.com/photo-1551028442-ee84b4d3a50a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4MzU4Mzl8MHwxfHNlYXJjaHw0fHxTaWxrJTIwU2NhcmZ8ZW58MHx8fHwxNzY3NDMxOTgyfDA&ixlib=rb-4.1.0&q=80&w=400",
      ],
    },
  ],
  Clothing: [
    {
      name: "Evening Gown",
      price: 8000000,
      img: "https://images.unsplash.com/photo-1682183948920-16d882bd786d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4MzU4Mzl8MHwxfHNlYXJjaHwxfHxFdmVuaW5nJTIwR293bnxlbnwwfHx8fDE3Njc0MzIwNDV8MA&ixlib=rb-4.1.0&q=80&w=1080",
      subImages: [
        "https://images.unsplash.com/photo-1710023132784-e1b8538d4fb9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4MzU4Mzl8MHwxfHNlYXJjaHwyfHxFdmVuaW5nJTIwR293bnxlbnwwfHx8fDE3Njc0MzIwNDV8MA&ixlib=rb-4.1.0&q=80&w=400",
        "https://images.unsplash.com/photo-1710023141893-5ccbe1c4ae6d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4MzU4Mzl8MHwxfHNlYXJjaHwzfHxFdmVuaW5nJTIwR293bnxlbnwwfHx8fDE3Njc0MzIwNDV8MA&ixlib=rb-4.1.0&q=80&w=400",
        "https://images.unsplash.com/photo-1710023209229-ec9877bbb95b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4MzU4Mzl8MHwxfHNlYXJjaHw0fHxFdmVuaW5nJTIwR293bnxlbnwwfHx8fDE3Njc0MzIwNDV8MA&ixlib=rb-4.1.0&q=80&w=400",
      ],
    },
    {
      name: "Men Suit Jacket",
      price: 6000000,
      img: "https://images.unsplash.com/photo-1598915850252-fb07ad1e6768?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4MzU4Mzl8MHwxfHNlYXJjaHwxfHxNZW4lMjBTdWl0JTIwSmFja2V0fGVufDB8fHx8MTc2NzQzNTY3MHww&ixlib=rb-4.1.0&q=80&w=1080",
      subImages: [
        "https://images.unsplash.com/photo-1631858493688-689ab2d0c6bb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4MzU4Mzl8MHwxfHNlYXJjaHwyfHxNZW4lMjBTdWl0JTIwSmFja2V0fGVufDB8fHx8MTc2NzQzNTY3MHww&ixlib=rb-4.1.0&q=80&w=400",
        "https://images.unsplash.com/photo-1631858494345-830b475551fa?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4MzU4Mzl8MHwxfHNlYXJjaHwzfHxNZW4lMjBTdWl0JTIwSmFja2V0fGVufDB8fHx8MTc2NzQzNTY3MHww&ixlib=rb-4.1.0&q=80&w=400",
        "https://images.unsplash.com/photo-1631858493688-107c103ce289?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4MzU4Mzl8MHwxfHNlYXJjaHw0fHxNZW4lMjBTdWl0JTIwSmFja2V0fGVufDB8fHx8MTc2NzQzNTY3MHww&ixlib=rb-4.1.0&q=80&w=400",
      ],
    },
    {
      name: "Vintage Leather Jacket",
      price: 12000000,
      img: "https://images.unsplash.com/photo-1606163015906-ad3c68002dcb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4MzU4Mzl8MHwxfHNlYXJjaHwxfHxWaW50YWdlJTIwTGVhdGhlciUyMEphY2tldHxlbnwwfHx8fDE3Njc0MzU2NzZ8MA&ixlib=rb-4.1.0&q=80&w=1080",
      subImages: [
        "https://images.unsplash.com/photo-1575531278801-9cafa590a2f2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4MzU4Mzl8MHwxfHNlYXJjaHwyfHxWaW50YWdlJTIwTGVhdGhlciUyMEphY2tldHxlbnwwfHx8fDE3Njc0MzU2NzZ8MA&ixlib=rb-4.1.0&q=80&w=400",
        "https://images.unsplash.com/photo-1699462654889-1c42a57f2ed6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4MzU4Mzl8MHwxfHNlYXJjaHwzfHxWaW50YWdlJTIwTGVhdGhlciUyMEphY2tldHxlbnwwfHx8fDE3Njc0MzU2NzZ8MA&ixlib=rb-4.1.0&q=80&w=400",
        "https://images.unsplash.com/photo-1760533091973-1262bf57d244?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4MzU4Mzl8MHwxfHNlYXJjaHw0fHxWaW50YWdlJTIwTGVhdGhlciUyMEphY2tldHxlbnwwfHx8fDE3Njc0MzU2NzZ8MA&ixlib=rb-4.1.0&q=80&w=400",
      ],
    },
    {
      name: "Summer Floral Dress",
      price: 2500000,
      img: "https://images.unsplash.com/photo-1704806100524-faf9aa4f7cf9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4MzU4Mzl8MHwxfHNlYXJjaHwxfHxTdW1tZXIlMjBGbG9yYWwlMjBEcmVzc3xlbnwwfHx8fDE3Njc0MzU2ODF8MA&ixlib=rb-4.1.0&q=80&w=1080",
      subImages: [
        "https://images.unsplash.com/photo-1624969709134-8dee89a7adb0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4MzU4Mzl8MHwxfHNlYXJjaHwyfHxTdW1tZXIlMjBGbG9yYWwlMjBEcmVzc3xlbnwwfHx8fDE3Njc0MzU2ODF8MA&ixlib=rb-4.1.0&q=80&w=400",
        "https://images.unsplash.com/photo-1624902810049-8ea0199d32ff?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4MzU4Mzl8MHwxfHNlYXJjaHwzfHxTdW1tZXIlMjBGbG9yYWwlMjBEcmVzc3xlbnwwfHx8fDE3Njc0MzU2ODF8MA&ixlib=rb-4.1.0&q=80&w=400",
        "https://images.unsplash.com/photo-1650468954888-f54920c1cce6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4MzU4Mzl8MHwxfHNlYXJjaHw0fHxTdW1tZXIlMjBGbG9yYWwlMjBEcmVzc3xlbnwwfHx8fDE3Njc0MzU2ODF8MA&ixlib=rb-4.1.0&q=80&w=400",
      ],
    },
  ],
  Beauty: [
    {
      name: "Luxury Perfume",
      price: 3500000,
      img: "https://images.unsplash.com/photo-1615160460367-dcccd27e11ad?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4MzU4Mzl8MHwxfHNlYXJjaHwxfHxMdXh1cnklMjBQZXJmdW1lfGVufDB8fHx8MTc2NzQzMjAwNXww&ixlib=rb-4.1.0&q=80&w=1080",
      subImages: [
        "https://images.unsplash.com/photo-1680503504111-1bbc7fc2103e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4MzU4Mzl8MHwxfHNlYXJjaHwyfHxMdXh1cnklMjBQZXJmdW1lfGVufDB8fHx8MTc2NzQzMjAwNXww&ixlib=rb-4.1.0&q=80&w=400",
        "https://images.unsplash.com/photo-1724732678052-1437962cbbab?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4MzU4Mzl8MHwxfHNlYXJjaHwzfHxMdXh1cnklMjBQZXJmdW1lfGVufDB8fHx8MTc2NzQzMjAwNXww&ixlib=rb-4.1.0&q=80&w=400",
        "https://images.unsplash.com/photo-1605463967516-b73a52062ab0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4MzU4Mzl8MHwxfHNlYXJjaHw0fHxMdXh1cnklMjBQZXJmdW1lfGVufDB8fHx8MTc2NzQzMjAwNXww&ixlib=rb-4.1.0&q=80&w=400",
      ],
    },
    {
      name: "Dyson Airwrap",
      price: 13000000,
      img: "https://images.unsplash.com/photo-1732057401307-d359adf8ab83?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4MzU4Mzl8MHwxfHNlYXJjaHwxfHxEeXNvbiUyMEFpcndyYXB8ZW58MHx8fHwxNzY3NDM1Njg3fDA&ixlib=rb-4.1.0&q=80&w=1080",
      subImages: [
        "https://images.unsplash.com/photo-1694610882150-4de206edf95a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4MzU4Mzl8MHwxfHNlYXJjaHwyfHxEeXNvbiUyMEFpcndyYXB8ZW58MHx8fHwxNzY3NDM1Njg3fDA&ixlib=rb-4.1.0&q=80&w=400",
        "https://images.unsplash.com/photo-1660760144156-283959017370?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4MzU4Mzl8MHwxfHNlYXJjaHwzfHxEeXNvbiUyMEFpcndyYXB8ZW58MHx8fHwxNzY3NDM1Njg3fDA&ixlib=rb-4.1.0&q=80&w=400",
        "https://images.unsplash.com/photo-1716224431482-172eed7206bf?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4MzU4Mzl8MHwxfHNlYXJjaHw0fHxEeXNvbiUyMEFpcndyYXB8ZW58MHx8fHwxNzY3NDM1Njg3fDA&ixlib=rb-4.1.0&q=80&w=400",
      ],
    },
    {
      name: "Chanel Lipstick",
      price: 1500000,
      img: "https://images.unsplash.com/photo-1606390791565-d8f927109029?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4MzU4Mzl8MHwxfHNlYXJjaHwxfHxDaGFuZWwlMjBMaXBzdGlja3xlbnwwfHx8fDE3Njc0MzU2OTN8MA&ixlib=rb-4.1.0&q=80&w=1080",
      subImages: [
        "https://images.unsplash.com/photo-1590156221350-bbf9f89cd368?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4MzU4Mzl8MHwxfHNlYXJjaHwyfHxDaGFuZWwlMjBMaXBzdGlja3xlbnwwfHx8fDE3Njc0MzU2OTN8MA&ixlib=rb-4.1.0&q=80&w=400",
        "https://images.unsplash.com/photo-1590156117763-d5909f5ccbc8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4MzU4Mzl8MHwxfHNlYXJjaHwzfHxDaGFuZWwlMjBMaXBzdGlja3xlbnwwfHx8fDE3Njc0MzU2OTN8MA&ixlib=rb-4.1.0&q=80&w=400",
        "https://images.unsplash.com/photo-1590156221187-1710315f710b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4MzU4Mzl8MHwxfHNlYXJjaHw0fHxDaGFuZWwlMjBMaXBzdGlja3xlbnwwfHx8fDE3Njc0MzU2OTN8MA&ixlib=rb-4.1.0&q=80&w=400",
      ],
    },
    {
      name: "Skincare Serum",
      price: 2000000,
      img: "https://images.unsplash.com/photo-1643379850623-7eb6442cd262?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4MzU4Mzl8MHwxfHNlYXJjaHwxfHxTa2luY2FyZSUyMFNlcnVtJTIwQm90dGxlfGVufDB8fHx8MTc2NzQzNTY5OHww&ixlib=rb-4.1.0&q=80&w=1080",
      subImages: [
        "https://images.unsplash.com/photo-1643379852776-308d9bbf8645?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4MzU4Mzl8MHwxfHNlYXJjaHwyfHxTa2luY2FyZSUyMFNlcnVtJTIwQm90dGxlfGVufDB8fHx8MTc2NzQzNTY5OHww&ixlib=rb-4.1.0&q=80&w=400",
        "https://images.unsplash.com/photo-1643379850274-77d2e3703ef9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4MzU4Mzl8MHwxfHNlYXJjaHwzfHxTa2luY2FyZSUyMFNlcnVtJTIwQm90dGxlfGVufDB8fHx8MTc2NzQzNTY5OHww&ixlib=rb-4.1.0&q=80&w=400",
        "https://images.unsplash.com/photo-1638301868496-43577744a46c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4MzU4Mzl8MHwxfHNlYXJjaHw0fHxTa2luY2FyZSUyMFNlcnVtJTIwQm90dGxlfGVufDB8fHx8MTc2NzQzNTY5OHww&ixlib=rb-4.1.0&q=80&w=400",
      ],
    },
  ],
  Furniture: [
    {
      name: "Herman Miller Aeron Chair",
      price: 20000000,
      img: "https://images.unsplash.com/photo-1505843490538-5133c6c7d0e1?w=800&q=80",
      subImages: [
        "https://images.unsplash.com/photo-1592078615290-033ee584e267?w=800&q=80",
        "https://images.unsplash.com/photo-1580480055273-228ff5388ef8?w=800&q=80",
        "https://images.unsplash.com/photo-1592078615290-033ee584e267?w=800&q=80",
      ],
    },
    {
      name: "IKEA Sofa Landskrona",
      price: 12000000,
      img: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&q=80",
      subImages: [
        "https://images.unsplash.com/photo-1493666438817-866a91353ca9?w=800&q=80",
        "https://images.unsplash.com/photo-1540574163026-643ea20ade25?w=800&q=80",
        "https://images.unsplash.com/photo-1493666438817-866a91353ca9?w=800&q=80",
      ],
    },
    {
      name: "Minimalist Oak Desk",
      price: 5000000,
      img: "https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?w=800&q=80",
      subImages: [
        "https://images.unsplash.com/photo-1499933374294-4584851497cc?w=800&q=80",
        "https://images.unsplash.com/photo-1489269637500-aa0e75768394?w=800&q=80",
        "https://images.unsplash.com/photo-1499933374294-4584851497cc?w=800&q=80",
      ],
    },
    {
      name: "Vintage Standing Lamp",
      price: 1500000,
      img: "https://images.unsplash.com/photo-1555488205-d5e67846cf40?w=800&q=80",
      subImages: [
        "https://images.unsplash.com/photo-1513506003011-3b0312457a43?w=800&q=80",
        "https://images.unsplash.com/photo-1507473888900-52e1adadbf08?w=800&q=80",
        "https://images.unsplash.com/photo-1513506003011-3b0312457a43?w=800&q=80",
      ],
    },
    {
      name: "Writing Desk",
      price: 5000000,
      img: "https://images.unsplash.com/photo-1488190211105-8b0e65b80b4e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4MzU4Mzl8MHwxfHNlYXJjaHwxfHxXcml0aW5nJTIwRGVza3xlbnwwfHx8fDE3Njc0MzIwMzl8MA&ixlib=rb-4.1.0&q=80&w=1080",
      subImages: [
        "https://images.unsplash.com/photo-1505330622279-bf7d7fc918f4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4MzU4Mzl8MHwxfHNlYXJjaHwyfHxXcml0aW5nJTIwRGVza3xlbnwwfHx8fDE3Njc0MzIwMzl8MA&ixlib=rb-4.1.0&q=80&w=400",
        "https://images.unsplash.com/photo-1654356709115-3f68998bead4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4MzU4Mzl8MHwxfHNlYXJjaHwzfHxXcml0aW5nJTIwRGVza3xlbnwwfHx8fDE3Njc0MzIwMzl8MA&ixlib=rb-4.1.0&q=80&w=400",
        "https://images.unsplash.com/photo-1526566762798-8fac9c07aa98?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4MzU4Mzl8MHwxfHNlYXJjaHw0fHxXcml0aW5nJTIwRGVza3xlbnwwfHx8fDE3Njc0MzIwMzl8MA&ixlib=rb-4.1.0&q=80&w=400",
      ],
    },
  ],
  Decor: [
    {
      name: "Ceramic Vase",
      price: 1500000,
      img: "https://images.unsplash.com/photo-1597696929736-6d13bed8e6a8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4MzU4Mzl8MHwxfHNlYXJjaHwxfHxDZXJhbWljJTIwVmFzZXxlbnwwfHx8fDE3Njc0MzE5NzZ8MA&ixlib=rb-4.1.0&q=80&w=1080",
      subImages: [
        "https://images.unsplash.com/photo-1660721671073-e139688fa3cf?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4MzU4Mzl8MHwxfHNlYXJjaHwyfHxDZXJhbWljJTIwVmFzZXxlbnwwfHx8fDE3Njc0MzE5NzZ8MA&ixlib=rb-4.1.0&q=80&w=400",
        "https://images.unsplash.com/photo-1631125915902-d8abe9225ff2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4MzU4Mzl8MHwxfHNlYXJjaHwzfHxDZXJhbWljJTIwVmFzZXxlbnwwfHx8fDE3Njc0MzE5NzZ8MA&ixlib=rb-4.1.0&q=80&w=400",
        "https://images.unsplash.com/photo-1665512594386-051aad8b9f68?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4MzU4Mzl8MHwxfHNlYXJjaHw0fHxDZXJhbWljJTIwVmFzZXxlbnwwfHx8fDE3Njc0MzE5Nzd8MA&ixlib=rb-4.1.0&q=80&w=400",
      ],
    },
    {
      name: "Persian Rug",
      price: 10000000,
      img: "https://images.unsplash.com/photo-1660394585016-508f949df960?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4MzU4Mzl8MHwxfHNlYXJjaHwxfHxQZXJzaWFuJTIwUnVnfGVufDB8fHx8MTc2NzQzMTkzMXww&ixlib=rb-4.1.0&q=80&w=1080",
      subImages: [
        "https://images.unsplash.com/photo-1652634213812-f0deeb1de78e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4MzU4Mzl8MHwxfHNlYXJjaHwyfHxQZXJzaWFuJTIwUnVnfGVufDB8fHx8MTc2NzQzMTkzMXww&ixlib=rb-4.1.0&q=80&w=400",
        "https://images.unsplash.com/photo-1572123979839-3749e9973aba?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4MzU4Mzl8MHwxfHNlYXJjaHwzfHxQZXJzaWFuJTIwUnVnfGVufDB8fHx8MTc2NzQzMTkzMXww&ixlib=rb-4.1.0&q=80&w=400",
        "https://images.unsplash.com/photo-1531162805941-58330188d75c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4MzU4Mzl8MHwxfHNlYXJjaHw0fHxQZXJzaWFuJTIwUnVnfGVufDB8fHx8MTc2NzQzMTkzMXww&ixlib=rb-4.1.0&q=80&w=400",
      ],
    },
    {
      name: "Antique Clock",
      price: 8500000,
      img: "https://images.unsplash.com/photo-1604151967142-db7ed696081f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4MzU4Mzl8MHwxfHNlYXJjaHwxfHxBbnRpcXVlJTIwQ2xvY2t8ZW58MHx8fHwxNzY3NDMxOTUzfDA&ixlib=rb-4.1.0&q=80&w=1080",
      subImages: [
        "https://images.unsplash.com/photo-1647633783533-de8d1722888e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4MzU4Mzl8MHwxfHNlYXJjaHwyfHxBbnRpcXVlJTIwQ2xvY2t8ZW58MHx8fHwxNzY3NDMxOTUzfDA&ixlib=rb-4.1.0&q=80&w=400",
        "https://images.unsplash.com/photo-1719404363194-dc169ee1bc75?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4MzU4Mzl8MHwxfHNlYXJjaHwzfHxBbnRpcXVlJTIwQ2xvY2t8ZW58MHx8fHwxNzY3NDMxOTUzfDA&ixlib=rb-4.1.0&q=80&w=400",
        "https://images.unsplash.com/photo-1627307284579-327ea0c7de14?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4MzU4Mzl8MHwxfHNlYXJjaHw0fHxBbnRpcXVlJTIwQ2xvY2t8ZW58MHx8fHwxNzY3NDMxOTUzfDA&ixlib=rb-4.1.0&q=80&w=400",
      ],
    },
  ],
  Art: [
    {
      name: "Oil Painting",
      price: 5000000,
      img: "https://images.unsplash.com/photo-1578926375605-eaf7559b1458?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4MzU4Mzl8MHwxfHNlYXJjaHwxfHxPaWwlMjBQYWludGluZ3xlbnwwfHx8fDE3Njc0MzE4ODV8MA&ixlib=rb-4.1.0&q=80&w=1080",
      subImages: [
        "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4MzU4Mzl8MHwxfHNlYXJjaHwyfHxPaWwlMjBQYWludGluZ3xlbnwwfHx8fDE3Njc0MzE4ODV8MA&ixlib=rb-4.1.0&q=80&w=400",
        "https://images.unsplash.com/photo-1578301996581-bf7caec556c0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4MzU4Mzl8MHwxfHNlYXJjaHwzfHxPaWwlMjBQYWludGluZ3xlbnwwfHx8fDE3Njc0MzE4ODV8MA&ixlib=rb-4.1.0&q=80&w=400",
        "https://images.unsplash.com/photo-1582561424760-0321d75e81fa?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4MzU4Mzl8MHwxfHNlYXJjaHw0fHxPaWwlMjBQYWludGluZ3xlbnwwfHx8fDE3Njc0MzE4ODV8MA&ixlib=rb-4.1.0&q=80&w=400",
      ],
    },
    {
      name: "Marble Statue",
      price: 12000000,
      img: "https://images.unsplash.com/photo-1601887389937-0b02c26b602c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4MzU4Mzl8MHwxfHNlYXJjaHwxfHxNYXJibGUlMjBTdGF0dWV8ZW58MHx8fHwxNzY3NDMxOTA4fDA&ixlib=rb-4.1.0&q=80&w=1080",
      subImages: [
        "https://images.unsplash.com/photo-1597011652683-a9cec37b3bc8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4MzU4Mzl8MHwxfHNlYXJjaHwyfHxNYXJibGUlMjBTdGF0dWV8ZW58MHx8fHwxNzY3NDMxOTA4fDA&ixlib=rb-4.1.0&q=80&w=400",
        "https://images.unsplash.com/photo-1662808141421-54240cbfd45f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4MzU4Mzl8MHwxfHNlYXJjaHwzfHxNYXJibGUlMjBTdGF0dWV8ZW58MHx8fHwxNzY3NDMxOTA4fDA&ixlib=rb-4.1.0&q=80&w=400",
        "https://images.unsplash.com/photo-1615497994569-db84b0f1dd55?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4MzU4Mzl8MHwxfHNlYXJjaHw0fHxNYXJibGUlMjBTdGF0dWV8ZW58MHx8fHwxNzY3NDMxOTA4fDA&ixlib=rb-4.1.0&q=80&w=400",
      ],
    },
  ],
  Comics: [
    {
      name: "Rare Comic Book",
      price: 2500000,
      img: "https://images.unsplash.com/photo-1680016790208-756cd493c1a1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4MzU4Mzl8MHwxfHNlYXJjaHwxfHxSYXJlJTIwQ29taWMlMjBCb29rfGVufDB8fHx8MTc2NzQzMTg5MXww&ixlib=rb-4.1.0&q=80&w=1080",
      subImages: [
        "https://images.unsplash.com/photo-1628426912481-b66c067fdf7a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4MzU4Mzl8MHwxfHNlYXJjaHwyfHxSYXJlJTIwQ29taWMlMjBCb29rfGVufDB8fHx8MTc2NzQzMTg5MXww&ixlib=rb-4.1.0&q=80&w=400",
        "https://images.unsplash.com/photo-1620075266917-2c5791f6737b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4MzU4Mzl8MHwxfHNlYXJjaHwzfHxSYXJlJTIwQ29taWMlMjBCb29rfGVufDB8fHx8MTc2NzQzMTg5MXww&ixlib=rb-4.1.0&q=80&w=400",
        "https://images.unsplash.com/photo-1608152167294-fde68cd9be96?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4MzU4Mzl8MHwxfHNlYXJjaHw0fHxSYXJlJTIwQ29taWMlMjBCb29rfGVufDB8fHx8MTc2NzQzMTg5MXww&ixlib=rb-4.1.0&q=80&w=400",
      ],
    },
    {
      name: "Spiderman Comic Vintage",
      price: 5000000,
      img: "https://images.unsplash.com/photo-1611443595494-aa7aa8b0e741?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4MzU4Mzl8MHwxfHNlYXJjaHwxfHxTcGlkZXJtYW4lMjBDb21pYyUyMEJvb2slMjBWaW50YWdlfGVufDB8fHx8MTc2NzQzNTcwNHww&ixlib=rb-4.1.0&q=80&w=1080",
      subImages: [
        "https://images.unsplash.com/photo-1680016790208-756cd493c1a1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4MzU4Mzl8MHwxfHNlYXJjaHwyfHxTcGlkZXJtYW4lMjBDb21pYyUyMEJvb2slMjBWaW50YWdlfGVufDB8fHx8MTc2NzQzNTcwNHww&ixlib=rb-4.1.0&q=80&w=400",
        "https://images.unsplash.com/photo-1612036782180-6f0b6cd846fe?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4MzU4Mzl8MHwxfHNlYXJjaHwzfHxTcGlkZXJtYW4lMjBDb21pYyUyMEJvb2slMjBWaW50YWdlfGVufDB8fHx8MTc2NzQzNTcwNHww&ixlib=rb-4.1.0&q=80&w=400",
        "https://images.unsplash.com/photo-1628426912206-d88e22da5c76?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4MzU4Mzl8MHwxfHNlYXJjaHw0fHxTcGlkZXJtYW4lMjBDb21pYyUyMEJvb2slMjBWaW50YWdlfGVufDB8fHx8MTc2NzQzNTcwNHww&ixlib=rb-4.1.0&q=80&w=400",
      ],
    },
    {
      name: "Batman Comic 1st Ed",
      price: 8000000,
      img: "https://images.unsplash.com/photo-1601645191163-3fc0d5d64e35?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4MzU4Mzl8MHwxfHNlYXJjaHwxfHxCYXRtYW4lMjBDb21pYyUyMEJvb2slMjBGaXJzdCUyMEVkaXRpb258ZW58MHx8fHwxNzY3NDM1NzEwfDA&ixlib=rb-4.1.0&q=80&w=1080",
      subImages: [
        "https://images.unsplash.com/photo-1628426912206-d88e22da5c76?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4MzU4Mzl8MHwxfHNlYXJjaHwyfHxCYXRtYW4lMjBDb21pYyUyMEJvb2slMjBGaXJzdCUyMEVkaXRpb258ZW58MHx8fHwxNzY3NDM1NzEwfDA&ixlib=rb-4.1.0&q=80&w=400",
        "https://images.unsplash.com/photo-1628426912481-b66c067fdf7a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4MzU4Mzl8MHwxfHNlYXJjaHwzfHxCYXRtYW4lMjBDb21pYyUyMEJvb2slMjBGaXJzdCUyMEVkaXRpb258ZW58MHx8fHwxNzY3NDM1NzEwfDA&ixlib=rb-4.1.0&q=80&w=400",
        "https://images.unsplash.com/photo-1593345216067-47a359874578?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4MzU4Mzl8MHwxfHNlYXJjaHw0fHxCYXRtYW4lMjBDb21pYyUyMEJvb2slMjBGaXJzdCUyMEVkaXRpb258ZW58MHx8fHwxNzY3NDM1NzEwfDA&ixlib=rb-4.1.0&q=80&w=400",
      ],
    },
  ],
  Cards: [
    {
      name: "Rare Pokémon Card",
      price: 8000000,
      img: "https://images.unsplash.com/photo-1611931969235-9ad843243189?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4MzU4Mzl8MHwxfHNlYXJjaHwxfHxSYXJlJTIwUG9rJUMzJUE5bW9uJTIwQ2FyZHxlbnwwfHx8fDE3Njc0MzE5NjV8MA&ixlib=rb-4.1.0&q=80&w=1080",
      subImages: [
        "https://images.unsplash.com/photo-1647893977174-d1a0d4bd93e4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4MzU4Mzl8MHwxfHNlYXJjaHwyfHxSYXJlJTIwUG9rJUMzJUE5bW9uJTIwQ2FyZHxlbnwwfHx8fDE3Njc0MzE5NjV8MA&ixlib=rb-4.1.0&q=80&w=400",
        "https://images.unsplash.com/photo-1685570436942-974c06113586?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4MzU4Mzl8MHwxfHNlYXJjaHwzfHxSYXJlJTIwUG9rJUMzJUE5bW9uJTIwQ2FyZHxlbnwwfHx8fDE3Njc0MzE5NjV8MA&ixlib=rb-4.1.0&q=80&w=400",
        "https://images.unsplash.com/photo-1613771404738-65d22f979710?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4MzU4Mzl8MHwxfHNlYXJjaHw0fHxSYXJlJTIwUG9rJUMzJUE5bW9uJTIwQ2FyZHxlbnwwfHx8fDE3Njc0MzE5NjV8MA&ixlib=rb-4.1.0&q=80&w=400",
      ],
    },
    {
      name: "MTG Card Rare",
      price: 15000000,
      img: "https://images.unsplash.com/photo-1746572651436-7da5d437ebca?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4MzU4Mzl8MHwxfHNlYXJjaHwxfHxNYWdpYyUyMFRoZSUyMEdhdGhlcmluZyUyMENhcmQlMjBSYXJlfGVufDB8fHx8MTc2NzQzNTcxNXww&ixlib=rb-4.1.0&q=80&w=1080",
      subImages: [
        "https://images.unsplash.com/photo-1628508006164-997f40c7ecce?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4MzU4Mzl8MHwxfHNlYXJjaHwyfHxNYWdpYyUyMFRoZSUyMEdhdGhlcmluZyUyMENhcmQlMjBSYXJlfGVufDB8fHx8MTc2NzQzNTcxNXww&ixlib=rb-4.1.0&q=80&w=400",
        "https://images.unsplash.com/photo-1644007824843-37e9069834bd?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4MzU4Mzl8MHwxfHNlYXJjaHwzfHxNYWdpYyUyMFRoZSUyMEdhdGhlcmluZyUyMENhcmQlMjBSYXJlfGVufDB8fHx8MTc2NzQzNTcxNXww&ixlib=rb-4.1.0&q=80&w=400",
        "https://images.unsplash.com/photo-1736988957201-c3f057b82f5b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4MzU4Mzl8MHwxfHNlYXJjaHw0fHxNYWdpYyUyMFRoZSUyMEdhdGhlcmluZyUyMENhcmQlMjBSYXJlfGVufDB8fHx8MTc2NzQzNTcxNXww&ixlib=rb-4.1.0&q=80&w=400",
      ],
    },
    {
      name: "YuGiOh Card Holo",
      price: 3000000,
      img: "https://images.unsplash.com/photo-1630345269467-59efe8aaecec?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4MzU4Mzl8MHwxfHNlYXJjaHwxfHxZdUd1T2glMjBDYXJkJTIwSG9sb3xlbnwwfHx8fDE3Njc0MzU3MjF8MA&ixlib=rb-4.1.0&q=80&w=1080",
      subImages: [
        "https://images.unsplash.com/photo-1728165932410-4238dd745af2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4MzU4Mzl8MHwxfHNlYXJjaHwyfHxZdUd1T2glMjBDYXJkJTIwSG9sb3xlbnwwfHx8fDE3Njc0MzU3MjF8MA&ixlib=rb-4.1.0&q=80&w=400",
        "https://images.unsplash.com/photo-1609437737562-c7c4989f6b0d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4MzU4Mzl8MHwxfHNlYXJjaHwzfHxZdUd1T2glMjBDYXJkJTIwSG9sb3xlbnwwfHx8fDE3Njc0MzU3MjF8MA&ixlib=rb-4.1.0&q=80&w=400",
        "https://images.unsplash.com/photo-1590708038645-ab70b69c6609?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4MzU4Mzl8MHwxfHNlYXJjaHw0fHxZdUd1T2glMjBDYXJkJTIwSG9sb3xlbnwwfHx8fDE3Njc0MzU3MjF8MA&ixlib=rb-4.1.0&q=80&w=400",
      ],
    },
  ],
  Stamps: [
    {
      name: "Stamp Collection",
      price: 1500000,
      img: "https://images.unsplash.com/photo-1688125293662-51664e9ee4e4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4MzU4Mzl8MHwxfHNlYXJjaHwxfHxTdGFtcCUyMENvbGxlY3Rpb258ZW58MHx8fHwxNzY3NDMyMDM0fDA&ixlib=rb-4.1.0&q=80&w=1080",
      subImages: [
        "https://images.unsplash.com/photo-1766851265145-5bca680e81ad?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4MzU4Mzl8MHwxfHNlYXJjaHwyfHxTdGFtcCUyMENvbGxlY3Rpb258ZW58MHx8fHwxNzY3NDMyMDM0fDA&ixlib=rb-4.1.0&q=80&w=400",
        "https://images.unsplash.com/photo-1579279263245-bbf82b50092f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4MzU4Mzl8MHwxfHNlYXJjaHwzfHxTdGFtcCUyMENvbGxlY3Rpb258ZW58MHx8fHwxNzY3NDMyMDM0fDA&ixlib=rb-4.1.0&q=80&w=400",
        "https://images.unsplash.com/photo-1767226633814-2e78c54c61b2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4MzU4Mzl8MHwxfHNlYXJjaHw0fHxTdGFtcCUyMENvbGxlY3Rpb258ZW58MHx8fHwxNzY3NDMyMDM0fDA&ixlib=rb-4.1.0&q=80&w=400",
      ],
    },
    {
      name: "Rare Penny Black Stamp",
      price: 25000000,
      img: "https://images.unsplash.com/photo-1585848777174-84381285215c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4MzU4Mzl8MHwxfHNlYXJjaHwxfHxQZW5ueSUyMEJsYWNrJTIwU3RhbXB8ZW58MHx8fHwxNzY3NDM1NzI2fDA&ixlib=rb-4.1.0&q=80&w=1080",
      subImages: [
        "https://images.unsplash.com/photo-1628155930542-3c7a64e2c833?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4MzU4Mzl8MHwxfHNlYXJjaHwyfHxQZW5ueSUyMEJsYWNrJTIwU3RhbXB8ZW58MHx8fHwxNzY3NDM1NzI2fDA&ixlib=rb-4.1.0&q=80&w=400",
        "https://images.unsplash.com/photo-1502092120021-0a373b759600?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4MzU4Mzl8MHwxfHNlYXJjaHwzfHxQZW5ueSUyMEJsYWNrJTIwU3RhbXB8ZW58MHx8fHwxNzY3NDM1NzI2fDA&ixlib=rb-4.1.0&q=80&w=400",
        "https://images.unsplash.com/photo-1628155930810-721448b375b0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4MzU4Mzl8MHwxfHNlYXJjaHw0fHxQZW5ueSUyMEJsYWNrJTIwU3RhbXB8ZW58MHx8fHwxNzY3NDM1NzI2fDA&ixlib=rb-4.1.0&q=80&w=400",
      ],
    },
    {
      name: "Vintage Airmail Stamp",
      price: 4500000,
      img: "https://images.unsplash.com/photo-1688125293662-51664e9ee4e4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4MzU4Mzl8MHwxfHNlYXJjaHwxfHxTdGFtcCUyMENvbGxlY3Rpb258ZW58MHx8fHwxNzY3NDMyMDM0fDA&ixlib=rb-4.1.0&q=80&w=1080",
      subImages: [
        "https://images.unsplash.com/photo-1766851265145-5bca680e81ad?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4MzU4Mzl8MHwxfHNlYXJjaHwyfHxTdGFtcCUyMENvbGxlY3Rpb258ZW58MHx8fHwxNzY3NDMyMDM0fDA&ixlib=rb-4.1.0&q=80&w=400",
        "https://images.unsplash.com/photo-1579279263245-bbf82b50092f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4MzU4Mzl8MHwxfHNlYXJjaHwzfHxTdGFtcCUyMENvbGxlY3Rpb258ZW58MHx8fHwxNzY3NDMyMDM0fDA&ixlib=rb-4.1.0&q=80&w=400",
        "https://images.unsplash.com/photo-1767226633814-2e78c54c61b2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4MzU4Mzl8MHwxfHNlYXJjaHw0fHxTdGFtcCUyMENvbGxlY3Rpb258ZW58MHx8fHwxNzY3NDMyMDM0fDA&ixlib=rb-4.1.0&q=80&w=400",
      ],
    },
  ],
  Coins: [
    {
      name: "Ancient Coin",
      price: 4000000,
      img: "https://images.unsplash.com/photo-1657214005798-86b35114fc0b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4MzU4Mzl8MHwxfHNlYXJjaHwxfHxBbmNpZW50JTIwQ29pbnxlbnwwfHx8fDE3Njc0MzIwMjN8MA&ixlib=rb-4.1.0&q=80&w=1080",
      subImages: [
        "https://images.unsplash.com/photo-1688867380908-1882c61add8f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4MzU4Mzl8MHwxfHNlYXJjaHwyfHxBbmNpZW50JTIwQ29pbnxlbnwwfHx8fDE3Njc0MzIwMjN8MA&ixlib=rb-4.1.0&q=80&w=400",
        "https://images.unsplash.com/photo-1738460340635-101f1e8d2856?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4MzU4Mzl8MHwxfHNlYXJjaHwzfHxBbmNpZW50JTIwQ29pbnxlbnwwfHx8fDE3Njc0MzIwMjN8MA&ixlib=rb-4.1.0&q=80&w=400",
        "https://images.unsplash.com/photo-1663888674098-38c8d5bcca28?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4MzU4Mzl8MHwxfHNlYXJjaHw0fHxBbmNpZW50JTIwQ29pbnxlbnwwfHx8fDE3Njc0MzIwMjN8MA&ixlib=rb-4.1.0&q=80&w=400",
      ],
    },
    {
      name: "Gold Doubloon Real",
      price: 25000000,
      img: "https://images.unsplash.com/photo-1620288627223-53302f4e8c74?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4MzU4Mzl8MHwxfHNlYXJjaHwxfHxHb2xkJTIwRG91Ymxvb258ZW58MHx8fHwxNzY3NDM1NzQyfDA&ixlib=rb-4.1.0&q=80&w=1080",
      subImages: [
        "https://images.unsplash.com/photo-1610375461246-83c485099759?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4MzU4Mzl8MHwxfHNlYXJjaHwyfHxHb2xkJTIwRG91Ymxvb258ZW58MHx8fHwxNzY3NDM1NzQyfDA&ixlib=rb-4.1.0&q=80&w=400",
        "https://images.unsplash.com/photo-1610375461369-d612b1238d2a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4MzU4Mzl8MHwxfHNlYXJjaHwzfHxHb2xkJTIwRG91Ymxvb258ZW58MHx8fHwxNzY3NDM1NzQyfDA&ixlib=rb-4.1.0&q=80&w=400",
        "https://images.unsplash.com/photo-1620288627192-35805d762955?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4MzU4Mzl8MHwxfHNlYXJjaHw0fHxHb2xkJTIwRG91Ymxvb258ZW58MHx8fHwxNzY3NDM1NzQyfDA&ixlib=rb-4.1.0&q=80&w=400",
      ],
    },
    {
      name: "Silver Dollar Morgan",
      price: 6000000,
      img: "https://images.unsplash.com/photo-1605792657660-596af9009e82?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4MzU4Mzl8MHwxfHNlYXJjaHwxfHxTaWx2ZXIlMjBEb2xsYXIlMjBNb3JnYW58ZW58MHx8fHwxNzY3NDM1NzQ3fDA&ixlib=rb-4.1.0&q=80&w=1080",
      subImages: [
        "https://images.unsplash.com/photo-1629910549247-f3d2f9d18c39?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4MzU4Mzl8MHwxfHNlYXJjaHwyfHxTaWx2ZXIlMjBEb2xsYXIlMjBNb3JnYW58ZW58MHx8fHwxNzY3NDM1NzQ3fDA&ixlib=rb-4.1.0&q=80&w=400",
        "https://images.unsplash.com/photo-1624823183570-58c9735a266a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4MzU4Mzl8MHwxfHNlYXJjaHwzfHxTaWx2ZXIlMjBEb2xsYXIlMjBNb3JnYW58ZW58MHx8fHwxNzY3NDM1NzQ3fDA&ixlib=rb-4.1.0&q=80&w=400",
        "https://images.unsplash.com/photo-1658428131600-482208e925cc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4MzU4Mzl8MHwxfHNlYXJjaHw0fHxTaWx2ZXIlMjBEb2xsYXIlMjBNb3JnYW58ZW58MHx8fHwxNzY3NDM1NzQ3fDA&ixlib=rb-4.1.0&q=80&w=400",
      ],
    },
  ],
  Memorabilia: [
    {
      name: "Medieval Sword",
      price: 15000000,
      img: "https://images.unsplash.com/photo-1440711085503-89d8ec455791?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4MzU4Mzl8MHwxfHNlYXJjaHwxfHxNZWRpZXZhbCUyMFN3b3JkfGVufDB8fHx8MTc2NzQzMjAwMHww&ixlib=rb-4.1.0&q=80&w=1080",
      subImages: [
        "https://images.unsplash.com/photo-1559499225-6862de52e2a9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4MzU4Mzl8MHwxfHNlYXJjaHwyfHxNZWRpZXZhbCUyMFN3b3JkfGVufDB8fHx8MTc2NzQzMjAwMHww&ixlib=rb-4.1.0&q=80&w=400",
        "https://images.unsplash.com/photo-1757083840090-17a7bfca08c0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4MzU4Mzl8MHwxfHNlYXJjaHwzfHxNZWRpZXZhbCUyMFN3b3JkfGVufDB8fHx8MTc2NzQzMjAwMHww&ixlib=rb-4.1.0&q=80&w=400",
        "https://images.unsplash.com/photo-1613477757272-96c69d8a64de?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4MzU4Mzl8MHwxfHNlYXJjaHw0fHxNZWRpZXZhbCUyMFN3b3JkfGVufDB8fHx8MTc2NzQzMjAwMHww&ixlib=rb-4.1.0&q=80&w=400",
      ],
    },
    {
      name: "Vintage Movie Poster",
      price: 3000000,
      img: "https://images.unsplash.com/photo-1759547020777-14a1ca4c3fdf?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4MzU4Mzl8MHwxfHNlYXJjaHwxfHxWaW50YWdlJTIwTW92aWUlMjBQb3N0ZXJ8ZW58MHx8fHwxNzY3NDMyMDExfDA&ixlib=rb-4.1.0&q=80&w=1080",
      subImages: [
        "https://images.unsplash.com/photo-1761948245703-cbf27a3e7502?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4MzU4Mzl8MHwxfHNlYXJjaHwyfHxWaW50YWdlJTIwTW92aWUlMjBQb3N0ZXJ8ZW58MHx8fHwxNzY3NDMyMDExfDA&ixlib=rb-4.1.0&q=80&w=400",
        "https://images.unsplash.com/photo-1631805249874-3f546d176de4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4MzU4Mzl8MHwxfHNlYXJjaHwzfHxWaW50YWdlJTIwTW92aWUlMjBQb3N0ZXJ8ZW58MHx8fHwxNzY3NDMyMDExfDA&ixlib=rb-4.1.0&q=80&w=400",
        "https://images.unsplash.com/photo-1733232073397-80fb13ef3212?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4MzU4Mzl8MHwxfHNlYXJjaHw0fHxWaW50YWdlJTIwTW92aWUlMjBQb3N0ZXJ8ZW58MHx8fHwxNzY3NDMyMDExfDA&ixlib=rb-4.1.0&q=80&w=400",
      ],
    },
    {
      name: "Action Figure",
      price: 1200000,
      img: "https://images.unsplash.com/photo-1606663889134-b1dedb5ed8b7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4MzU4Mzl8MHwxfHNlYXJjaHwxfHxBY3Rpb24lMjBGaWd1cmV8ZW58MHx8fHwxNzY3NDMyMDUxfDA&ixlib=rb-4.1.0&q=80&w=1080",
      subImages: [
        "https://images.unsplash.com/photo-1608278047522-58806a6ac85b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4MzU4Mzl8MHwxfHNlYXJjaHwyfHxBY3Rpb24lMjBGaWd1cmV8ZW58MHx8fHwxNzY3NDMyMDUxfDA&ixlib=rb-4.1.0&q=80&w=400",
        "https://images.unsplash.com/photo-1702138129409-7b4ff859ae5d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4MzU4Mzl8MHwxfHNlYXJjaHwzfHxBY3Rpb24lMjBGaWd1cmV8ZW58MHx8fHwxNzY3NDMyMDUxfDA&ixlib=rb-4.1.0&q=80&w=400",
        "https://images.unsplash.com/photo-1702138129392-364adea0ad00?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4MzU4Mzl8MHwxfHNlYXJjaHw0fHxBY3Rpb24lMjBGaWd1cmV8ZW58MHx8fHwxNzY3NDMyMDUxfDA&ixlib=rb-4.1.0&q=80&w=400",
      ],
    },
    {
      name: "Vintage Vinyl Record",
      price: 1800000,
      img: "https://images.unsplash.com/photo-1635135449992-c3438898371b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4MzU4Mzl8MHwxfHNlYXJjaHwxfHxWaW50YWdlJTIwVmlueWwlMjBSZWNvcmR8ZW58MHx8fHwxNzY3NDMxOTIwfDA&ixlib=rb-4.1.0&q=80&w=1080",
      subImages: [
        "https://images.unsplash.com/photo-1619078515294-84ddc3ff04f9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4MzU4Mzl8MHwxfHNlYXJjaHwyfHxWaW50YWdlJTIwVmlueWwlMjBSZWNvcmR8ZW58MHx8fHwxNzY3NDMxOTIwfDA&ixlib=rb-4.1.0&q=80&w=400",
        "https://images.unsplash.com/photo-1687359927083-cdaaa019accf?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4MzU4Mzl8MHwxfHNlYXJjaHwzfHxWaW50YWdlJTIwVmlueWwlMjBSZWNvcmR8ZW58MHx8fHwxNzY3NDMxOTIwfDA&ixlib=rb-4.1.0&q=80&w=400",
        "https://images.unsplash.com/photo-1629574893835-c4878dad7f79?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4MzU4Mzl8MHwxfHNlYXJjaHw0fHxWaW50YWdlJTIwVmlueWwlMjBSZWNvcmR8ZW58MHx8fHwxNzY3NDMxOTIwfDA&ixlib=rb-4.1.0&q=80&w=400",
      ],
    },
  ],
  SportsMemorabilia: [
    {
      name: "Signed Baseball",
      price: 5000000,
      img: "https://images.unsplash.com/photo-1650655800275-90f748afd4ef?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4MzU4Mzl8MHwxfHNlYXJjaHwxfHxTaWduZWQlMjBCYXNlYmFsbHxlbnwwfHx8fDE3Njc0MzE5NDJ8MA&ixlib=rb-4.1.0&q=80&w=1080",
      subImages: [
        "https://images.unsplash.com/photo-1708724326817-c1c2c488e33c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4MzU4Mzl8MHwxfHNlYXJjaHwyfHxTaWduZWQlMjBCYXNlYmFsbHxlbnwwfHx8fDE3Njc0MzE5NDJ8MA&ixlib=rb-4.1.0&q=80&w=400",
        "https://images.unsplash.com/photo-1755632112479-51dd6cb3f9ec?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4MzU4Mzl8MHwxfHNlYXJjaHwzfHxTaWduZWQlMjBCYXNlYmFsbHxlbnwwfHx8fDE3Njc0MzE5NDJ8MA&ixlib=rb-4.1.0&q=80&w=400",
        "https://images.unsplash.com/photo-1615356696487-af36a68f358a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4MzU4Mzl8MHwxfHNlYXJjaHw0fHxTaWduZWQlMjBCYXNlYmFsbHxlbnwwfHx8fDE3Njc0MzE5NDJ8MA&ixlib=rb-4.1.0&q=80&w=400",
      ],
    },
    {
      name: "Basketball Jersey Vintage",
      price: 8000000,
      img: "https://images.unsplash.com/photo-1515523110800-9415d13b84a8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4MzU4Mzl8MHwxfHNlYXJjaHwxfHxCYXNrZXRiYWxsJTIwSmVyc2V5JTIwVmludGFnZXxlbnwwfHx8fDE3Njc0MzU3NTN8MA&ixlib=rb-4.1.0&q=80&w=1080",
      subImages: [
        "https://images.unsplash.com/photo-1515523110800-9415d13b84a8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4MzU4Mzl8MHwxfHNlYXJjaHwxfHxCYXNrZXRiYWxsJTIwSmVyc2V5JTIwVmludGFnZXxlbnwwfHx8fDE3Njc0MzU3NTN8MA&ixlib=rb-4.1.0&q=80&w=400",
        "https://images.unsplash.com/photo-1515523110800-9415d13b84a8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4MzU4Mzl8MHwxfHNlYXJjaHwxfHxCYXNrZXRiYWxsJTIwSmVyc2V5JTIwVmludGFnZXxlbnwwfHx8fDE3Njc0MzU3NTN8MA&ixlib=rb-4.1.0&q=80&w=400",
        "https://images.unsplash.com/photo-1515523110800-9415d13b84a8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4MzU4Mzl8MHwxfHNlYXJjaHwxfHxCYXNrZXRiYWxsJTIwSmVyc2V5JTIwVmludGFnZXxlbnwwfHx8fDE3Njc0MzU3NTN8MA&ixlib=rb-4.1.0&q=80&w=400",
      ],
    },
    {
      name: "Football Helmet Signed",
      price: 12000000,
      img: "https://images.unsplash.com/photo-1615460549969-36fa19521a4f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4MzU4Mzl8MHwxfHNlYXJjaHwxfHxGb290YmFsbCUyMEhlbG1ldCUyMFNpZ25lZHxlbnwwfHx8fDE3Njc0MzU3NTh8MA&ixlib=rb-4.1.0&q=80&w=1080",
      subImages: [
        "https://images.unsplash.com/photo-1615460549969-36fa19521a4f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4MzU4Mzl8MHwxfHNlYXJjaHwxfHxGb290YmFsbCUyMEhlbG1ldCUyMFNpZ25lZHxlbnwwfHx8fDE3Njc0MzU3NTh8MA&ixlib=rb-4.1.0&q=80&w=400",
        "https://images.unsplash.com/photo-1615460549969-36fa19521a4f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4MzU4Mzl8MHwxfHNlYXJjaHwxfHxGb290YmFsbCUyMEhlbG1ldCUyMFNpZ25lZHxlbnwwfHx8fDE3Njc0MzU3NTh8MA&ixlib=rb-4.1.0&q=80&w=400",
        "https://images.unsplash.com/photo-1615460549969-36fa19521a4f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4MzU4Mzl8MHwxfHNlYXJjaHwxfHxGb290YmFsbCUyMEhlbG1ldCUyMFNpZ25lZHxlbnwwfHx8fDE3Njc0MzU3NTh8MA&ixlib=rb-4.1.0&q=80&w=400",
      ],
    },
    {
      name: "Boxing Gloves Muhammad Ali",
      price: 50000000,
      img: "https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4MzU4Mzl8MHwxfHNlYXJjaHwxfHxCb3hpbmclMjBHbG92ZXMlMjBWaW50YWdlfGVufDB8fHx8MTc2NzQzNTc2M3ww&ixlib=rb-4.1.0&q=80&w=1080",
      subImages: [
        "https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4MzU4Mzl8MHwxfHNlYXJjaHwxfHxCb3hpbmclMjBHbG92ZXMlMjBWaW50YWdlfGVufDB8fHx8MTc2NzQzNTc2M3ww&ixlib=rb-4.1.0&q=80&w=400",
        "https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4MzU4Mzl8MHwxfHNlYXJjaHwxfHxCb3hpbmclMjBHbG92ZXMlMjBWaW50YWdlfGVufDB8fHx8MTc2NzQzNTc2M3ww&ixlib=rb-4.1.0&q=80&w=400",
        "https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4MzU4Mzl8MHwxfHNlYXJjaHwxfHxCb3hpbmclMjBHbG92ZXMlMjBWaW50YWdlfGVufDB8fHx8MTc2NzQzNTc2M3ww&ixlib=rb-4.1.0&q=80&w=400",
      ],
    },
  ],
};

const SAMPLE_COMMENTS = {
  positive: [
    "Great product, fast shipping!",
    "Seller was very communicated. Highly recommended.",
    "Excellent quality, better than described.",
    "Smooth transaction. A+ seller.",
    "Item arrived safely and on time. Thanks!",
    "Very happy with my purchase.",
    "Honest bidder, prompt payment.",
    "Great buyer, fast payment.",
    "Pleasure doing business with.",
    "Recommended!",
  ],
  negative: [
    "Item was not as described.",
    "Shipping took way too long.",
    "Seller stopped responding after payment.",
    "Product arrived damaged.",
    "Buyer never paid.",
  ],
};

// --- HELPER FUNCTIONS ---

const generateDescription = (name: string, category: string) => {
  return `
<h2><strong>${name}</strong></h2>

<p>Experience the <em>ultimate</em> in <strong>${category}</strong> with the <strong>${name}</strong>. Designed for <u>performance</u> and <em>style</em>, this item is a must-have for enthusiasts.</p>

<h3>Key Features:</h3>
<ul>
  <li><strong>Premium Build:</strong> Crafted with high-quality materials for <em>durability</em> and <em>elegance</em>.</li>
  <li><strong>High Performance:</strong> Optimized for the <u>best user experience</u> in its class.</li>
  <li><strong>Modern Design:</strong> Sleek and contemporary look that fits any setting.</li>
  <li><strong>Warranty:</strong> Comes with a standard <strong>1-year</strong> manufacturer warranty.</li>
</ul>

<h3>Condition:</h3>
<p>This item is in <strong><em>Like New</em></strong> condition. It has been <u>inspected and tested</u> to ensure full functionality. Original packaging and accessories are included.</p>

<h3>Shipping & Returns:</h3>
<p><strong>Fast shipping</strong> available worldwide. <em>30-day return policy</em> if the item does not match the description.</p>

<blockquote>
  <p>"Quality you can trust, service you can rely on."</p>
</blockquote>
  `;
};

const randomInt = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

const getRandomElement = (arr: any[]) =>
  arr[Math.floor(Math.random() * arr.length)];

const seed = async () => {
  await connectDB();

  console.log("🧹 Cleaning Database...");
  await User.deleteMany({});
  await Category.deleteMany({});
  await Product.deleteMany({});
  await Bid.deleteMany({});
  await Rating.deleteMany({});
  await SystemConfig.deleteMany({});
  await Order.deleteMany({});
  await Chat.deleteMany({});
  await AutoBid.deleteMany({});
  await Watchlist.deleteMany({});

  console.log("⚙️ Creating System Config...");
  await SystemConfig.create({
    auctionExtensionWindow: 5,
    auctionExtensionTime: 10,
    autoBidDelay: 1000,
    bidEmailThrottlingWindow: 30,
    bidEmailCooldown: 6,
  });

  console.log("👤 Creating Users...");
  const commonPassword = "Password@123";

  const adminId = new mongoose.Types.ObjectId("64b0f1a9e1b9b1a2b3c4d5e6");
  const seller1Id = new mongoose.Types.ObjectId("64b0f1a9e1b9b1a2b3c4d5e7");
  const seller2Id = new mongoose.Types.ObjectId("64b0f1a9e1b9b1a2b3c4d5e8");
  const seller3Id = new mongoose.Types.ObjectId("64b0f1a9e1b9b1a2b3c4d5e9");
  const seller4Id = new mongoose.Types.ObjectId("64b0f1a9e1b9b1a2b3c4d5ea");
  const seller5Id = new mongoose.Types.ObjectId("64b0f1a9e1b9b1a2b3c4d5eb");
  const seller6Id = new mongoose.Types.ObjectId("64b0f1a9e1b9b1a2b3c4d5ec");
  
  // Low reputation bidder ID
  const lowRepBidderId = new mongoose.Types.ObjectId("64b0f1a9e1b9b1a2b3c4d5f0");

  await User.create({
    _id: adminId,
    name: "SystemAdmin",
    email: "admin@gmail.com",
    password: commonPassword,
    role: "admin",
    address: "Admin HQ",
    dateOfBirth: new Date("1985-01-15"),
    contactEmail: "admin.contact@gmail.com",
    status: "ACTIVE",
  });

  // Additional Admins
  const admin2Id = new mongoose.Types.ObjectId("64b0f1a9e1b9b1a2b3c4d5e1");
  const admin3Id = new mongoose.Types.ObjectId("64b0f1a9e1b9b1a2b3c4d5e2");

  await User.create({
    _id: admin2Id,
    name: "OperationsAdmin",
    email: "admin2@gmail.com",
    password: commonPassword,
    role: "admin",
    address: "Ops Branch",
    dateOfBirth: new Date("1990-03-22"),
    contactEmail: "ops.admin@gmail.com",
    status: "ACTIVE",
  });

  await User.create({
    _id: admin3Id,
    name: "SupportAdmin",
    email: "admin3@gmail.com",
    password: commonPassword,
    role: "admin",
    address: "Support Center",
    dateOfBirth: new Date("1995-11-05"),
    contactEmail: "support.admin@gmail.com",
    status: "ACTIVE",
  });

  const seller1 = await User.create({
    _id: seller1Id,
    name: "TechWorldSeller",
    email: "seller1@gmail.com",
    password: commonPassword,
    role: "seller",
    address: "Hanoi, Vietnam",
    dateOfBirth: new Date("1990-05-20"),
    contactEmail: "techworld.contact@gmail.com",
    positiveRatings: 0,
    negativeRatings: 0,
    status: "ACTIVE",
  });

  const seller2 = await User.create({
    _id: seller2Id,
    name: "FashionBoutique",
    email: "seller2@gmail.com",
    password: commonPassword,
    role: "seller",
    address: "HCMC, Vietnam",
    dateOfBirth: new Date("1988-08-10"),
    positiveRatings: 0,
    negativeRatings: 0,
    status: "ACTIVE",
  });

  const seller3 = await User.create({
    _id: seller3Id,
    name: "HomeComforts",
    email: "seller3@gmail.com",
    password: commonPassword,
    role: "seller",
    address: "Da Nang, Vietnam",
    dateOfBirth: new Date("1985-02-15"),
    contactEmail: "home.comforts@gmail.com",
    positiveRatings: 0,
    negativeRatings: 0,
    status: "ACTIVE",
  });

  const seller4 = await User.create({
    _id: seller4Id,
    name: "RetroCollectibles",
    email: "seller4@gmail.com",
    password: commonPassword,
    role: "seller",
    address: "Hue, Vietnam",
    dateOfBirth: new Date("1978-11-30"),
    contactEmail: "retro.collectibles@gmail.com",
    positiveRatings: 0,
    negativeRatings: 0,
    status: "ACTIVE",
  });

  const seller5 = await User.create({
    _id: seller5Id,
    name: "ArtGallery",
    email: "seller5@gmail.com",
    password: commonPassword,
    role: "seller",
    address: "Hanoi, Vietnam",
    dateOfBirth: new Date("1980-07-20"),
    contactEmail: "art.gallery@gmail.com",
    positiveRatings: 0,
    negativeRatings: 0,
    status: "ACTIVE",
  });

  const seller6 = await User.create({
    _id: seller6Id,
    name: "SportsLegends",
    email: "seller6@gmail.com",
    password: commonPassword,
    role: "seller",
    address: "HCMC, Vietnam",
    dateOfBirth: new Date("1992-04-12"),
    contactEmail: "sports.legends@gmail.com",
    positiveRatings: 0,
    negativeRatings: 0,
    status: "ACTIVE",
  });

  // Tạo Bidders (Existing 5 bidders)
  let bidders: any[] = [];
  for (let i = 1; i <= NUM_BIDDERS; i++) {
    const hex = `64b0f1a9e1b9b1a2b3c4d5f${i}`;
    const bidderId = new mongoose.Types.ObjectId(hex);

    const bidder = await User.create({
      _id: bidderId,
      name: `Bidder${String.fromCharCode(64 + i)}`,
      email: `bidder${i}@gmail.com`,
      password: commonPassword,
      role: "bidder",
      address: `Street ${i}, City`,
      dateOfBirth: new Date(1990 + i, i % 12, ((i * 5) % 28) + 1),
      contactEmail: i % 2 === 0 ? `bidder${i}.contact@gmail.com` : undefined,
      positiveRatings: 0,
      negativeRatings: 0,
      reputationScore: 0,
      status: "ACTIVE",
    });
    bidders.push(bidder);
  }

  // --- CREATE LOW REPUTATION BIDDER ---
  console.log("👎 Creating Low Reputation Bidder...");
  const lowRepBidder = await User.create({
    _id: lowRepBidderId,
    name: "UnreliableBidder",
    email: "lowreputation.bidder@gmail.com",
    password: commonPassword,
    role: "bidder",
    address: "Low Rep Street, Problem City",
    dateOfBirth: new Date("1995-06-15"),
    contactEmail: "unreliable.contact@gmail.com",
    positiveRatings: 0,
    negativeRatings: 0,
    reputationScore: 0,
    status: "ACTIVE",
  });
  bidders.push(lowRepBidder);

  // --- GENERATE FILLER USERS FOR PAGINATION ---
  console.log("👥 Creating Filler Users for Pagination...");
  const FILLER_COUNT = 30;
  for (let i = 1; i <= FILLER_COUNT; i++) {
    const isSeller = i % 5 === 0; // Every 5th user is a seller
    const role = isSeller ? "seller" : "bidder";
    const isBlocked = Math.random() < 0.1; // 10% chance of being blocked

    const user = await User.create({
      name: `AutoBidder${i}`,
      email: `bidder_auto_${i}@gmail.com`,
      password: commonPassword,
      role: role,
      address: `Auto Address ${i}`,
      status: isBlocked ? "BLOCKED" : "ACTIVE",
    });

    if (role === "bidder") {
      bidders.push(user);
    }
  }

  // --- DUMMY USERS FOR HISTORY ---
  console.log("👤 Creating Dummy Users for History...");
  const dummyPartners: any[] = [];
  for (let i = 1; i <= 20; i++) {
    const dummy = await User.create({
      name: `Partner${i}`,
      email: `dummy${i}@history.com`,
      password: commonPassword,
      role: i % 2 === 0 ? "seller" : "bidder",
      address: `History Lane ${i}`,
    });
    dummyPartners.push(dummy);
  }

  // --- CREATE RATINGS FOR LOW REPUTATION BIDDER ---
  console.log("⭐ Creating ratings for Low Reputation Bidder...");
  // Create 2 positive ratings
  for (let i = 0; i < 2; i++) {
    const seller = dummyPartners[i];
    await Rating.create({
      type: "bidder",
      rater: seller._id,
      ratee: lowRepBidder._id,
      product: new mongoose.Types.ObjectId(), // Dummy product ID
      score: 1,
      comment: SAMPLE_COMMENTS.positive[i % SAMPLE_COMMENTS.positive.length],
    });
  }
  // Create 8 negative ratings
  for (let i = 0; i < 8; i++) {
    const seller = dummyPartners[i + 2]; // Use different partners
    await Rating.create({
      type: "bidder",
      rater: seller._id,
      ratee: lowRepBidder._id,
      product: new mongoose.Types.ObjectId(), // Dummy product ID
      score: -1,
      comment: SAMPLE_COMMENTS.negative[i % SAMPLE_COMMENTS.negative.length],
    });
  }

  console.log("📂 Creating Categories...");
  // Level 1
  const electronics = await Category.create({ name: "Electronics" });
  const fashion = await Category.create({ name: "Fashion" });
  const home = await Category.create({ name: "Home & Living" });
  const sports = await Category.create({ name: "Sports" });
  const art = await Category.create({ name: "Art" });
  const collectibles = await Category.create({ name: "Collectibles" });

  // Level 2
  // Electronics
  const phones = await Category.create({
    name: "Mobile Phones",
    parent: electronics._id,
  });
  const laptops = await Category.create({
    name: "Laptops",
    parent: electronics._id,
  });
  const cameras = await Category.create({
    name: "Cameras",
    parent: electronics._id,
  });
  const audio = await Category.create({
    name: "Audio",
    parent: electronics._id,
  });
  const gadgets = await Category.create({
    name: "Gadgets",
    parent: electronics._id,
  });
  const gaming = await Category.create({
    name: "Gaming",
    parent: electronics._id,
  });
  const techAccessories = await Category.create({
    name: "Tech Accessories",
    parent: electronics._id,
  });

  // Fashion
  const shoes = await Category.create({ name: "Shoes", parent: fashion._id });
  const watches = await Category.create({
    name: "Watches",
    parent: fashion._id,
  });
  const jewelry = await Category.create({
    name: "Jewelry",
    parent: fashion._id,
  });
  const fashionAccessories = await Category.create({
    name: "Accessories",
    parent: fashion._id,
  });
  const clothing = await Category.create({
    name: "Clothing",
    parent: fashion._id,
  });
  const beauty = await Category.create({ name: "Beauty", parent: fashion._id });

  // Home
  const furniture = await Category.create({
    name: "Furniture",
    parent: home._id,
  });
  const decor = await Category.create({ name: "Decor", parent: home._id });

  // Collectibles
  const comics = await Category.create({
    name: "Comics & Books",
    parent: collectibles._id,
  });
  const cards = await Category.create({
    name: "Cards",
    parent: collectibles._id,
  });
  const stamps = await Category.create({
    name: "Stamps",
    parent: collectibles._id,
  });
  const coins = await Category.create({
    name: "Coins",
    parent: collectibles._id,
  });
  const memorabilia = await Category.create({
    name: "Memorabilia",
    parent: collectibles._id,
  });

  // Art (Direct mapping or subcats) - Let's use direct if needed, or subcats.
  // For consistency with catalog keys which map to IDs:
  const paintings = await Category.create({
    name: "Paintings",
    parent: art._id,
  });
  const fineArt = await Category.create({ name: "Fine Art", parent: art._id });

  // Sports
  const sportsMemorabilia = await Category.create({
    name: "Sports Memorabilia",
    parent: sports._id,
  });

  const catMap: Record<string, any> = {
    Phones: phones._id,
    Laptops: laptops._id,
    Cameras: cameras._id,
    Audio: audio._id,
    Gadgets: gadgets._id,
    Gaming: gaming._id,
    TechAccessories: techAccessories._id,

    Shoes: shoes._id,
    Watches: watches._id,
    Jewelry: jewelry._id,
    FashionAccessories: fashionAccessories._id,
    Clothing: clothing._id,
    Beauty: beauty._id,

    Furniture: furniture._id,
    Decor: decor._id,

    Comics: comics._id,
    Cards: cards._id,
    Stamps: stamps._id,
    Coins: coins._id,
    Memorabilia: memorabilia._id,

    Art: fineArt._id,
    SportsMemorabilia: sportsMemorabilia._id,
  };

  // --- GENERATE TRANSACTION HISTORY ---
  // Calculates rating and creates dummy products/orders to back it up
  const generateTransactionHistory = async (
    targetUser: any,
    targetRole: "seller" | "bidder", // Role of targetUser in this transaction
    count: number
  ) => {
    for (let i = 0; i < count; i++) {
      const partner = getRandomElement(dummyPartners);
      const isPositive = Math.random() > 0.1; // 90% positive

      const seller = targetRole === "seller" ? targetUser : partner;
      const bidder = targetRole === "bidder" ? targetUser : partner;

      // Create dummy product
      const catKeys = Object.keys(PRODUCT_CATALOG);
      const catKey = getRandomElement(catKeys);
      const item = getRandomElement(PRODUCT_CATALOG[catKey] ?? []);

      const endTime = new Date(Date.now() - randomInt(10, 90) * 24 * 60 * 60 * 1000); // 10-90 days ago
      const startTime = new Date(endTime.getTime() - randomInt(7, 14) * 24 * 60 * 60 * 1000); // 7-14 days before end

      const startingPrice = item.price;
      const stepPrice = Math.ceil((item.price * 0.05) / 1000) * 1000;
      const finalPrice = startingPrice + randomInt(1, 5) * stepPrice;

      const product = await Product.create({
        name: `Historical: ${item.name} Number ${randomInt(1000, 9999)}`,
        category: catMap[catKey],
        seller: seller._id,
        mainImage: item.img,
        subImages: ["Phones", "Laptops"].includes(catKey)
          ? TECH_SUB_IMAGES
          : FASHION_SUB_IMAGES,
        description: "Historical item for rating generation.",
        startTime: startTime,
        endTime: endTime,
        startingPrice: startingPrice,
        stepPrice: stepPrice,
        currentPrice: finalPrice,
        currentBidder: bidder._id,
        bidCount: randomInt(3, 8),
        winnerConfirmed: true,
        transactionCompleted: true,
        descriptionHistory: [],
        rejectedBidders: [],
        allowUnratedBidders: true,
      });

      // Create multiple bids to simulate auction activity
      const numBids = product.bidCount;
      let currentBidPrice = startingPrice;

      for (let bidIndex = 0; bidIndex < numBids; bidIndex++) {
        currentBidPrice += stepPrice;
        const bidTime = new Date(
          startTime.getTime() + 
          ((endTime.getTime() - startTime.getTime()) / numBids) * (bidIndex + 1)
        );

        // Alternate between bidder and other dummy bidders for realistic history
        const isFinalBid = bidIndex === numBids - 1;
        const bidderForThisBid = isFinalBid 
          ? bidder._id 
          : (Math.random() > 0.5 ? bidder._id : getRandomElement(dummyPartners)._id);

        await Bid.create({
          product: product._id,
          bidder: bidderForThisBid,
          price: currentBidPrice,
          createdAt: bidTime,
        });
      }

      // Create Order
      const order = await Order.create({
        product: product._id,
        seller: seller._id,
        buyer: bidder._id,
        amount: finalPrice,
        status: OrderStatus.COMPLETED,
        step: 4,
        createdAt: new Date(endTime.getTime() + 10000),
        updatedAt: new Date(endTime.getTime() + 100000),
      });

      // Create Chat for this order
      const chat = await Chat.create({
        participants: [bidder._id, seller._id],
        product: product._id,
        order: order._id,
        messages: [
          {
            sender: bidder._id,
            content: "I'm so happy I won this Item!",
            timestamp: new Date(endTime.getTime() + 20000),
          },
          {
            sender: seller._id,
            content: "Congratulations! I will ship it immediately.",
            timestamp: new Date(endTime.getTime() + 100000),
          },
        ],
      });

      order.chat = chat._id as any;
      await order.save();

      const score: 1 | -1 = isPositive ? 1 : -1;
      const comment = getRandomElement(
        isPositive ? SAMPLE_COMMENTS.positive : SAMPLE_COMMENTS.negative
      );

      // Create Rating linking to product
      // If target is seller, they receive rating from buyer (partner)
      // If target is bidder, they receive rating from seller (partner)
      const rater = partner;
      const ratee = targetUser;
      const type = targetRole === "seller" ? "seller" : "bidder"; // Type of rating received

      try {
        const rating = await Rating.create({
          rater: rater._id,
          ratee: ratee._id,
          product: product._id,
          type: type,
          score: score,
          comment: comment,
        });

        // Update Order with rating
        // Note: order.ratingByBuyer means 'Rating GIVEN BY Buyer'
        // If target is seller, partner is buyer. So partner gives ratingByBuyer.
        if (targetRole === "seller") {
          order.ratingByBuyer = {
            score: score,
            comment: comment,
            updatedAt: new Date(),
          };
        } else {
          // Target is bidder. Partner is seller. Partner gives ratingBySeller.
          order.ratingBySeller = {
            score: score,
            comment: comment,
            updatedAt: new Date(),
          };
        }
        await order.save();
      } catch (e) {
        // Ignore duplicate key errors if any random collisions
      }
    }
  };

  console.log("⭐ Generating Historical Ratings...");
  await generateTransactionHistory(seller1, "seller", 15);
  await generateTransactionHistory(seller2, "seller", 25);
  await generateTransactionHistory(seller3, "seller", 20); // HomeComforts
  await generateTransactionHistory(seller4, "seller", 20); // RetroCollectibles
  await generateTransactionHistory(seller5, "seller", 20); // ArtGallery
  await generateTransactionHistory(seller6, "seller", 20); // SportsLegends

  for (const b of bidders) {
    // Skip low reputation bidder - their ratings are manually set
    if (b._id.toString() === lowRepBidderId.toString()) continue;
    await generateTransactionHistory(b, "bidder", randomInt(3, 8));
  }

  console.log("📦 Creating Active Products & Bids...");

  let totalProducts = 0;
  let totalBids = 0;
  let totalOrders = 0;

  // Hàm tạo kịch bản sản phẩm (Helper)
  const createProductScenario = async (
    item: any,
    catKey: string,
    sellerId: any,
    idx: number,
    forcedScenario?: number
  ) => {
    // Determine suffix for name uniqueness
    const suffix = forcedScenario === 4 ? `Active ${idx}` : `Number ${idx}`;
    const productName = `${item.name} ${suffix}`;

    // Scenario logic
    let scenarioType = idx % 9;
    if (PRODUCT_CATALOG[catKey]!.length > 9) scenarioType = randomInt(0, 8);

    if (forcedScenario !== undefined) {
      scenarioType = forcedScenario;
    }

    const isEnded = scenarioType !== 4;
    const isEndingSoon = !isEnded && Math.random() > 0.5;
    const now = new Date();
    const startTime = new Date(
      now.getTime() - randomInt(2, 7) * 24 * 60 * 60 * 1000
    );

    let endTime;
    if (isEnded) {
      endTime = new Date(now.getTime() - randomInt(60, 24 * 60) * 60 * 1000);
    } else if (isEndingSoon) {
      endTime = new Date(now.getTime() + randomInt(10, 180) * 60 * 1000);
    } else {
      endTime = new Date(
        now.getTime() + randomInt(7, 60) * 24 * 60 * 60 * 1000
      );
    }

    // Logic bước giá
    const stepPrice = Math.ceil((item.price * 0.05) / 1000) * 1000;

    // Sub-images: Prefer specific ones, fallback to generic
    const isTech = ["Phones", "Laptops"].includes(catKey);
    const subImages =
      item.subImages || (isTech ? TECH_SUB_IMAGES : FASHION_SUB_IMAGES);

    // Tạo Sản phẩm ban đầu
    const product = new Product({
      name: productName,
      category: catMap[catKey],
      seller: sellerId,
      mainImage: item.img,
      subImages: subImages,
      description: generateDescription(item.name, catKey),
      startTime: startTime,
      endTime: endTime,
      startingPrice: item.price,
      stepPrice: stepPrice,
      buyNowPrice: item.price * 1.5,
      autoExtends: true,
      currentPrice: item.price,
      winnerConfirmed: false,
      bidCount: 0,
      descriptionHistory: [],
      rejectedBidders: [],
      allowUnratedBidders: true,
    });

    // Lịch sử mô tả (Ngẫu nhiên)
    if (Math.random() > 0.7) {
      product.descriptionHistory?.push({
        content: "Added details about the battery life.",
        updatedAt: new Date(startTime.getTime() + 24 * 60 * 60 * 1000),
      } as any);
    }

    await product.save();
    totalProducts++;

    const shouldHaveBids = scenarioType !== 0 && scenarioType !== 6;

    let bidCount = 0;
    let lastBidder: any = null;
    let secondToLastBidder = null;
    let lastBidTime = startTime;
    let currentPrice = item.price;

    if (shouldHaveBids) {
      // Chọn 2 bidder ngẫu nhiên (excluding low reputation bidder)
      const eligibleBidders = bidders.filter(
        (b) => b._id.toString() !== lowRepBidderId.toString()
      );
      const shuffledBidders = [...eligibleBidders].sort(() => 0.5 - Math.random());
      const participantBidders = shuffledBidders.slice(0, 2);

      if (participantBidders.length === 2) {
        const bidderA = participantBidders[0]!;
        const bidderB = participantBidders[1]!;

        // Đảm bảo giá cao nhất thấp hơn giá mua ngay
        const safeMax = item.price * 1.4;

        let maxPriceA = item.price + randomInt(10, 50) * stepPrice;
        if (maxPriceA >= safeMax) maxPriceA = safeMax;

        let maxPriceB = item.price + randomInt(5, 30) * stepPrice;
        if (maxPriceB >= maxPriceA) maxPriceB = maxPriceA - stepPrice;

        // Tạo AutoBid
        await AutoBid.create({
          user: bidderA._id,
          product: product._id,
          maxPrice: maxPriceA,
          stepPrice: 0,
          createdAt: startTime,
        });

        await AutoBid.create({
          user: bidderB._id,
          product: product._id,
          maxPrice: maxPriceB,
          stepPrice: 0,
          createdAt: startTime,
        });

        let currentBidPrice = item.price;
        let timeOffset = 0;

        // Bidder B bắt đầu
        currentBidPrice += stepPrice;
        await Bid.create({
          product: product._id,
          bidder: bidderB._id,
          price: currentBidPrice,
          createdAt: new Date(startTime.getTime() + (timeOffset += 10000)),
        });
        lastBidder = bidderB;

        // Vòng đấu giữa AutoBid
        while (currentBidPrice < maxPriceB) {
          // A counters
          if (currentBidPrice + stepPrice <= maxPriceA) {
            currentBidPrice += stepPrice;
            await Bid.create({
              product: product._id,
              bidder: bidderA._id,
              price: currentBidPrice,
              createdAt: new Date(startTime.getTime() + (timeOffset += 10000)),
            });
            lastBidder = bidderA;
          } else {
            break;
          }

          // B ra giá cao hơn
          if (currentBidPrice + stepPrice <= maxPriceB) {
            currentBidPrice += stepPrice;
            await Bid.create({
              product: product._id,
              bidder: bidderB._id,
              price: currentBidPrice,
              createdAt: new Date(startTime.getTime() + (timeOffset += 10000)),
            });
            lastBidder = bidderB;
          } else {
            break;
          }
        }

        // Cập nhật trạng thái hiện tại
        currentPrice = currentBidPrice;
        bidCount = Math.floor((currentBidPrice - item.price) / stepPrice);
        totalBids += bidCount;
      }

      product.currentPrice = currentPrice;
      product.currentBidder = (lastBidder ? lastBidder._id : undefined) as any;
      product.bidCount = bidCount;

      if (Math.random() > 0.5 && bidCount > 0) {
        product.questions.push({
          question: "Is this product authentic?",
          questioner: bidders[0]!._id,
          askedAt: new Date(startTime.getTime() + 100000),
          answer: "Yes, 100% authentic with invoice.",
          answeredAt: new Date(startTime.getTime() + 200000),
          answerer: sellerId,
        } as any);
      }
    }

    // Only process Orders if Ended
    if (isEnded && lastBidder) {
      if (scenarioType === 1) {
        // Không làm gì hết
      } else {
        product.winnerConfirmed = true;
        await product.save();

        if (scenarioType === 5 && Math.random() > 0.5 && secondToLastBidder) {
          product.rejectedBidders?.push(lastBidder._id as any);
          product.winnerConfirmed = false;
          product.currentBidder = (secondToLastBidder as any)._id as any;
          product.currentPrice -= stepPrice + randomInt(0, 2) * 10000;
          await product.save();
          console.log(`❌ Rejected Winner for Product ${productName}`);
          return;
        }

        const order = new Order({
          product: product._id,
          seller: sellerId,
          buyer: (lastBidder as any)._id,
          amount: product.currentPrice,
          status: OrderStatus.PENDING_PAYMENT,
          step: 1,
          createdAt: lastBidTime,
          updatedAt: lastBidTime,
        });

        const chat = await Chat.create({
          participants: [(lastBidder as any)._id, sellerId],
          product: product._id,
          order: order._id,
          messages: [
            {
              sender: (lastBidder as any)._id,
              content: "I have won the bid! When's the product being sent?",
              timestamp: new Date(lastBidTime.getTime() + 10000),
            },
            {
              sender: sellerId as any,
              content:
                "Congrats bro! I'll send it right away when payment is confirmed.",
              timestamp: new Date(lastBidTime.getTime() + 60000),
            },
          ],
        });

        order.chat = chat._id as any;

        if (scenarioType === 2) {
          if (Math.random() > 0.5) {
            order.status = OrderStatus.PAID_CONFIRMED;
            order.step = 2;
            order.shippingAddress = (lastBidder as any).address;
            order.paymentProof = "https://picsum.photos/300/600";
            chat.messages.push({
              sender: (lastBidder as any)._id,
              content: "I've paid the amount! Waiting for confirmation.",
              timestamp: new Date(lastBidTime.getTime() + 120000),
            });
            await chat.save();
          }
        }

        if (scenarioType === 3) {
          order.status = OrderStatus.COMPLETED;
          order.step = 4;
          product.transactionCompleted = true;

          const buyerScore: 1 | -1 = 1;
          order.ratingByBuyer = {
            score: buyerScore,
            comment: "This seller guy is awesome!",
            updatedAt: new Date(),
          };
          try {
            await Rating.create({
              rater: (lastBidder as any)._id,
              ratee: sellerId,
              product: product._id,
              type: "seller",
              score: buyerScore,
              comment: order.ratingByBuyer.comment,
            });
          } catch (error: any) {
            if (error.code !== 11000) {
              console.error("Failed to create buyer rating:", error);
            }
          }

          const sellerScore: 1 | -1 = 1;
          order.ratingBySeller = {
            score: sellerScore,
            comment: "This buyer guy is awesome with fast payment!",
            updatedAt: new Date(),
          };
          try {
            await Rating.create({
              rater: sellerId,
              ratee: (lastBidder as any)._id,
              product: product._id,
              type: "bidder",
              score: sellerScore,
              comment: order.ratingBySeller.comment,
            });
          } catch (error: any) {
            if (error.code !== 11000) {
              console.error("Failed to create seller rating:", error);
            }
          }
        }

        if (scenarioType === 7) {
          order.status = OrderStatus.SHIPPED;
          order.step = 3;
          order.shippingAddress = (lastBidder as any).address;
          order.paymentProof = "https://picsum.photos/300/600";
          order.shippingProof = "SHIPPING-CODE-123456";

          chat.messages.push({
            sender: (lastBidder as any)._id,
            content: "I've paid the amount! Waiting for confirmation.",
            timestamp: new Date(lastBidTime.getTime() + 120000),
          });
          chat.messages.push({
            sender: sellerId as any,
            content: "Confirmed! I've shipped your item. Tracking code: SHIPPING-CODE-123456",
            timestamp: new Date(lastBidTime.getTime() + 200000),
          });
          await chat.save();
        }

        if (scenarioType === 8) {
          order.status = OrderStatus.COMPLETED;
          order.step = 4;
          order.shippingAddress = (lastBidder as any).address;
          order.paymentProof = "https://picsum.photos/300/600";
          order.shippingProof = "SHIPPING-CODE-789012";

          chat.messages.push({
            sender: (lastBidder as any)._id,
            content: "I've paid the amount.",
            timestamp: new Date(lastBidTime.getTime() + 120000),
          });
          chat.messages.push({
            sender: sellerId as any,
            content: "Shipped!",
            timestamp: new Date(lastBidTime.getTime() + 200000),
          });
          chat.messages.push({
            sender: (lastBidder as any)._id,
            content: "I have received the package. Everything looks good!",
            timestamp: new Date(lastBidTime.getTime() + 400000),
          });
          await chat.save();
        }

        if (scenarioType === 5) {
          order.status = OrderStatus.CANCELLED;
          order.step = 0;
          chat.messages.push({
            sender: adminId as any,
            content: "Order cancelled by system.",
            timestamp: new Date(lastBidTime.getTime() + 200000),
            isAdmin: true,
          } as any);
          await chat.save();
        }

        await order.save();
        totalOrders++;
      }
    }

    // Save final product state
    await product.save();
  };

  // Hàm hỗ trợ xử lý catalog (Updated)
  const processCatalog = async (
    catKey: string,
    sellerId: any,
    activeCount: number = 3 // Default low
  ) => {
    const items = PRODUCT_CATALOG[catKey];
    if (!items) return;

    // 1. Existing Mixed Logic (10 items) -> Generates 1 Active item (idx % 9 == 4)
    const targetCount = 10;
    for (let i = 0; i < targetCount; i++) {
      await createProductScenario(
        items[i % items.length],
        catKey,
        sellerId,
        i + 1
      );
    }

    // 2. Additional Active Products Logic
    for (let i = 0; i < activeCount; i++) {
      // Use forcedScenario = 4 (Active)
      await createProductScenario(
        items[i % items.length],
        catKey,
        sellerId,
        i + 1,
        4 // Active
      );
    }
  };

  // Electronics (7 subcats): 7 * (1 + 3) = 28
  await processCatalog("Phones", seller1._id, 3);
  await processCatalog("Laptops", seller1._id, 3);
  await processCatalog("Cameras", seller1._id, 3);
  await processCatalog("Audio", seller1._id, 3);
  await processCatalog("Gadgets", seller1._id, 3);
  await processCatalog("Gaming", seller1._id, 3);
  await processCatalog("TechAccessories", seller1._id, 3);

  // Fashion (6 subcats): 6 * (1 + 3) = 24
  await processCatalog("Shoes", seller2._id, 3);
  await processCatalog("Watches", seller2._id, 3);
  await processCatalog("Jewelry", seller2._id, 3);
  await processCatalog("FashionAccessories", seller2._id, 3);
  await processCatalog("Clothing", seller2._id, 3);
  await processCatalog("Beauty", seller2._id, 3);

  // Home (2 subcats): 2 * (1 + 11) = 24
  await processCatalog("Furniture", seller3._id, 11);
  await processCatalog("Decor", seller3._id, 11);

  // Collectibles (5 subcats): 5 * (1 + 4) = 25
  await processCatalog("Comics", seller4._id, 4);
  await processCatalog("Cards", seller4._id, 4);
  await processCatalog("Stamps", seller4._id, 4);
  await processCatalog("Coins", seller4._id, 4);
  await processCatalog("Memorabilia", seller4._id, 4);

  // Art (1 subcat): 1 * (1 + 23) = 24
  await processCatalog("Art", seller5._id, 23);

  // Sports (1 subcat): 1 * (1 + 23) = 24
  await processCatalog("SportsMemorabilia", seller6._id, 23);

  try {
    console.log("🆕 Creating Zero-Bid Low-Step Products...");
    const zeroBidItems = [
      {
        item: PRODUCT_CATALOG.Watches![0], // Rolex
        cat: "Watches",
        seller: seller2Id,
        step: 50000,
      },
      {
        item: PRODUCT_CATALOG.Phones![0], // iPhone
        cat: "Phones",
        seller: seller1Id,
        step: 20000,
      },
      {
        item: PRODUCT_CATALOG.Shoes![0], // Nike
        cat: "Shoes",
        seller: seller2Id,
        step: 10000,
      },
    ];

    for (const { item, cat, seller, step } of zeroBidItems) {
      const productName = `${item.name} Number ZeroBid`;
      const isTech = ["Phones", "Laptops"].includes(cat);
      const subImages = isTech ? TECH_SUB_IMAGES : FASHION_SUB_IMAGES;

      const product = new Product({
        name: productName,
        category: catMap[cat],
        seller: seller,
        mainImage: item.img,
        subImages: subImages,
        description: generateDescription(item.name, cat),
        startTime: new Date(),
        endTime: new Date(Date.now() + randomInt(7, 60) * 24 * 60 * 60 * 1000),
        startingPrice: item.price,
        stepPrice: step, // Sản phẩm có bước giá thấp
        buyNowPrice: item.price * 1.5,
        autoExtends: true,
        currentPrice: item.price,
        winnerConfirmed: false,
        bidCount: 0,
        descriptionHistory: [],
        rejectedBidders: [],
        allowUnratedBidders: true,
      });

      await product.save();
      totalProducts++;
    }
  } catch (error) {
    console.error("❌ FAILED TO CREATE ZERO BID ITEMS:", error);
  }

  // --- UPDATE USER RATINGS ---
  console.log("📊 Updating User Ratings...");
  const allUsers = await User.find({});
  for (const user of allUsers) {
    const positiveCount = await Rating.countDocuments({
      ratee: user._id,
      score: 1,
    });
    const negativeCount = await Rating.countDocuments({
      ratee: user._id,
      score: -1,
    });

    const totalRatings = positiveCount + negativeCount;
    const reputationScore = totalRatings > 0 ? positiveCount / totalRatings : 0;

    user.positiveRatings = positiveCount;
    user.negativeRatings = negativeCount;
    user.reputationScore = reputationScore;
    await user.save();
  }

  console.log("-----------------------------------------");
  console.log(`✅ Seeding Complete!`);
  console.log(`📊 Stats:`);
  console.log(`   - Users: ${3 + NUM_BIDDERS + dummyPartners.length}`);
  console.log(`   - Categories: 9`);
  console.log(`   - Products: ${totalProducts}`);
  console.log(`   - Bids: ${totalBids}`);
  console.log(`   - Orders: ${totalOrders}`);
  console.log("-----------------------------------------");

  process.exit(0);
};

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
