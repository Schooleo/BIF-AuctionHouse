import { ZodType } from "zod";
import { Request, Response, NextFunction } from "express";
import { ParsedQs } from "qs";
import { ParamsDictionary } from "express-serve-static-core";

type Target = "body" | "query" | "params";

export const validate =
  (schema: ZodType, target: Target = "body") =>
  (req: Request, res: Response, next: NextFunction) => {
    const data =
      target === "body"
        ? req.body
        : target === "query"
        ? req.query
        : req.params;

    const result = schema.safeParse(data);

    if (!result.success) {
      const { fieldErrors } = result.error.flatten();
      return res.status(400).json({
        message: "Invalid input",
        errors: fieldErrors,
      });
    }

    if (target === "body") {
      req.body = result.data;
    } else if (target === "query") {
      req.query = result.data as unknown as ParsedQs;
    } else if (target === "params") {
      req.params = result.data as unknown as ParamsDictionary;
    }

    next();
  };

export const validateQuery = (schema: ZodObject<any>) => 
  (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.query);

    if (!result.success) {
      const { fieldErrors } = result.error.flatten((issue) => issue.message);
      return res.status(400).json({
        message: "Invalid query parameters",
        errors: fieldErrors,
      });
    }
    
    next();
  };

