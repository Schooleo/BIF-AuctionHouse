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
      name: "Adidas Yeezy Boost 350",
      price: 5500000,
      img: "https://images.unsplash.com/photo-1581497396202-a94013084c83?w=800&q=80",
      subImages: [
        "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=800&q=80",
        "https://images.unsplash.com/photo-1516478177764-9fe5bd7e9717?w=800&q=80",
        "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=800&q=80",
      ],
    },
    {
      name: "Converse Chuck 70 High",
      price: 1200000,
      img: "https://images.unsplash.com/photo-1607522370275-f14206abe5d3?w=800&q=80",
      subImages: [
        "https://images.unsplash.com/photo-1494496195158-c31bda6741d8?w=800&q=80",
        "https://images.unsplash.com/photo-1460353581641-37baddab0fa2?w=800&q=80",
        "https://images.unsplash.com/photo-1494496195158-c31bda6741d8?w=800&q=80",
      ],
    },
    {
      name: "New Balance 550 White",
      price: 2500000,
      img: "https://images.unsplash.com/photo-1551107696-a4b0c5a0d9a2?w=800&q=80",
      subImages: [
        "https://images.unsplash.com/photo-1539185441755-769473a23570?w=800&q=80",
        "https://images.unsplash.com/photo-1597045566677-8cf032ed6634?w=800&q=80",
        "https://images.unsplash.com/photo-1539185441755-769473a23570?w=800&q=80",
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
      name: "First Edition Book",
      price: 6000000,
      img: "https://images.unsplash.com/photo-1569997851406-472ce7b75c6c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4MzU4Mzl8MHwxfHNlYXJjaHwxfHxGaXJzdCUyMEVkaXRpb24lMjBCb29rfGVufDB8fHx8MTc2NzQzMTk4OHww&ixlib=rb-4.1.0&q=80&w=1080",
      subImages: [
        "https://images.unsplash.com/photo-1547760916-b23a6eb6014d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4MzU4Mzl8MHwxfHNlYXJjaHwyfHxGaXJzdCUyMEVkaXRpb24lMjBCb29rfGVufDB8fHx8MTc2NzQzMTk4OHww&ixlib=rb-4.1.0&q=80&w=400",
        "https://images.unsplash.com/photo-1623314473757-006147a3daab?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4MzU4Mzl8MHwxfHNlYXJjaHwzfHxGaXJzdCUyMEVkaXRpb24lMjBCb29rfGVufDB8fHx8MTc2NzQzMTk4OHww&ixlib=rb-4.1.0&q=80&w=400",
        "https://images.unsplash.com/photo-1755545730104-3cb4545282b1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4MzU4Mzl8MHwxfHNlYXJjaHw0fHxGaXJzdCUyMEVkaXRpb24lMjBCb29rfGVufDB8fHx8MTc2NzQzMTk4OHww&ixlib=rb-4.1.0&q=80&w=400",
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

      const product = await Product.create({
        name: `Historical: ${item.name} Number ${randomInt(1000, 9999)}`,
        category: catMap[catKey],
        seller: seller._id,
        mainImage: item.img,
        subImages: ["Phones", "Laptops"].includes(catKey)
          ? TECH_SUB_IMAGES
          : FASHION_SUB_IMAGES,
        description: "Historical item for rating generation.",
        startTime: new Date(Date.now() - 100000000), // Long ago
        endTime: new Date(Date.now() - 90000000),
        startingPrice: item.price,
        stepPrice: 50000,
        currentPrice: item.price * 1.2,
        winnerConfirmed: true,
        transactionCompleted: true,
        bidCount: 5,
        rejectedBidders: [],
        currentBidder: bidder._id, // Add this
        highestBidder: bidder._id, // And this
      });

      // Create Order
      const order = await Order.create({
        product: product._id,
        seller: seller._id,
        buyer: bidder._id,
        amount: product.currentPrice,
        status: OrderStatus.COMPLETED,
        step: 4,
        createdAt: new Date(product.endTime.getTime() + 10000),
        updatedAt: new Date(product.endTime.getTime() + 100000),
      });

      // Create Chat for this order (to prevent "Loading chat..." loop)
      const chat = await Chat.create({
        participants: [bidder._id, seller._id],
        product: product._id,
        order: order._id,
        messages: [
          {
            sender: bidder._id,
            content: "I'm so happy I won this Item!",
            timestamp: new Date(product.endTime.getTime() + 20000),
          },
          {
            sender: seller._id,
            content: "Congratulations! I will ship it immediately.",
            timestamp: new Date(product.endTime.getTime() + 100000),
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

  for (const b of bidders) {
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
      // Chọn 2 bidder ngẫu nhiên
      const shuffledBidders = [...bidders].sort(() => 0.5 - Math.random());
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
            content:
              "Confirmed! I've shipped your item. Tracking code: SHIPPING-CODE-123456",
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
  await processCatalog("Furniture", seller2._id, 11);
  await processCatalog("Decor", seller2._id, 11);

  // Collectibles (5 subcats): 5 * (1 + 4) = 25
  await processCatalog("Comics", seller2._id, 4);
  await processCatalog("Cards", seller2._id, 4);
  await processCatalog("Stamps", seller2._id, 4);
  await processCatalog("Coins", seller2._id, 4);
  await processCatalog("Memorabilia", seller2._id, 4);

  // Art (1 subcat): 1 * (1 + 23) = 24
  await processCatalog("Art", seller2._id, 23);

  // Sports (1 subcat): 1 * (1 + 23) = 24
  await processCatalog("SportsMemorabilia", seller2._id, 23);

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
