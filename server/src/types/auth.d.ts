export interface TokenPayload {
  id: string;
  role: "bidder" | "seller" | "admin";
  email: string;
}

export interface JwtPayload extends TokenPayload {
  iat?: number;
  exp?: number;
}
