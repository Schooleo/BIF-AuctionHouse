import { ZodObject } from "zod";
import { Request, Response, NextFunction } from "express";

export const validate =
  (schema: ZodObject) => (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      const { fieldErrors } = result.error.flatten((issue) => issue.message);

      return res.status(400).json({
        message: "Invalid input",
        errors: fieldErrors,
      });
    }

    req.body = result.data;

    next();
  };
