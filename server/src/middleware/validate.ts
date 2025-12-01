import { ZodObject, ZodError, z } from "zod";
import { Request, Response, NextFunction } from "express";

// Define a type for the custom request that includes properties for query, body, and params.
// We use a general `Request` and cast internal properties as needed for validation logic.
interface CustomRequest extends Request {
  query: any;
  body: any;
  params: any;
}

type Location = "body" | "query" | "params";

export const validate =
  (schema: z.ZodType<any, any>, location: Location) =>
  async (req: CustomRequest, res: Response, next: NextFunction) => {
    try {
      const parsedData = schema.parse(req[location]);

      Object.assign(req[location], parsedData);

      return next();
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          message: `Invalid ${location} parameters`,
          errors: z.treeifyError(error),
        });
      }

      console.error(`Validation failed in ${location}:`, error);
      return res.status(500).json({
        message: "Internal validation error occurred.",
      });
    }
  };
