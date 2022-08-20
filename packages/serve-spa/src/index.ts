import { resolve } from "path";
import {NextFunction, Request, Response} from "express";

import { UseServeSPAOptions } from "./types/use-serve-spa-options";
import {HTTPStatusCodes, Instantiable, Middleware, MiddlewareFactory} from "@kangojs/core";

/**
 * Set up an Express app to serve a single page web application.
 *
 * @param options - Options to customise the middleware functionality
 */
export function createServeSPAMiddleware(options: UseServeSPAOptions): Instantiable<MiddlewareFactory> {
  @Middleware({
    identifier: "serve-spa-middleware",
    route: "/*"
  })
  class ServeSpaMiddleware implements MiddlewareFactory {
    run(req: Request, res: Response, next: NextFunction): any {
      try {
        return res.sendFile(
          resolve(options.folderPath, options.serveFile || "index.html"),
          async (error) => {
            if (error !== undefined) {
              this.handleError(error, res);
            }
          }
        );
      } catch (err: any) {
        this.handleError(err, res);
      }
    }

    handleError(error: Error, res: Response) {
      if (options.errorhandler) {
        return options.errorhandler(error, res);
      }
      else {
        return res.status(HTTPStatusCodes.INTERNAL_SERVER_ERROR).send(
          options.fallbackMessage || "There has been an unexpected error loading this page. Please try again later."
        );
      }
    }
  }

  return ServeSpaMiddleware;
}