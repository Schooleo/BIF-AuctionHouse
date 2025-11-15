import { Request, Response } from "express";

// Thêm các kiểu dữ liệu cho Request và Response nếu có sử dụng trong src/types/guest.ts
// Thêm các biến constants cho messages nếu có sử dụng trong src/constants/messages.ts

export const listCategories = async (req: Request, res: Response) => {
  // TODO: implement list categories logic
  res.status(501).json({ message: "Not implemented" });
};

export const viewHome = async (req: Request, res: Response) => {
  // TODO: implement view home logic
  res.status(501).json({ message: "Not implemented" });
};

export const viewProductsByCategory = async (req: Request, res: Response) => {
  // TODO: implement view products by category logic
  res.status(501).json({ message: "Not implemented" });
};

export const searchProducts = async (req: Request, res: Response) => {
  // TODO: implement search products logic
  res.status(501).json({ message: "Not implemented" });
};

export const viewProductDetail = async (req: Request, res: Response) => {
  // TODO: implement view product detail logic
  res.status(501).json({ message: "Not implemented" });
};
