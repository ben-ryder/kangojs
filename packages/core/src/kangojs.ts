import "reflect-metadata";

import express, {Application, NextFunction, Request, Response, Router} from "express";

import { KangoJSOptions } from "./types/kangojs-options";
import { MetadataKeys } from "./decorators/metadata-keys";
import { HTTPMethods } from "./enums/http-methods";
import { RouteMetadata } from "./types/route/route-metadata";
import { DependencyContainer, Instantiable } from "./utils/dependency-container";
import {
  MiddlewareFactory,
  MiddlewareFunction,
  MiddlewareList,
  RequestValidator,
  ValidatorFunction
} from "./types/middleware/middleware-interface";
import {useCommonMiddleware} from "./middleware/common.middleware";
import {useNotFoundMiddleware} from "./middleware/route-not-found";
import {ErrorHandler, ErrorHandlerConfig} from "./utils/error-handler";
import {CommonMiddlewareOptions} from "./types/middleware/common-middleware-options";
import {RouteNotFoundOptions} from "./types/middleware/route-not-found-options";
import {Logger} from "./utils/logger";
import {ErrorResponseManager} from "./utils/error-response-manager";
import {MiddlewareConfig} from "./decorators/middleware.decorator";
import {HTTPStatusCodes} from "./enums/http-status-codes";

/**
 * The main object that encapsulates and manages all framework features.
 */
export class KangoJS {
  private readonly app: Application;
  private readonly router: Router;
  readonly dependencyContainer: DependencyContainer;
  private readonly globalPrefix?: string;
  private readonly authValidator?: Instantiable<MiddlewareFactory>;
  private readonly bodyValidator?: Instantiable<RequestValidator>;
  private readonly queryValidator?: Instantiable<RequestValidator>;
  private readonly paramsValidator?: Instantiable<RequestValidator>;
  private readonly commonMiddlewareOptions?: CommonMiddlewareOptions;
  private readonly routeNotFoundOptions?: RouteNotFoundOptions;
  private readonly errorHandlerConfig?: ErrorHandlerConfig;

  /**
   * The object constructor.
   *
   * @param options - options for customising how KangoJS works.
   */
  constructor(options: KangoJSOptions) {
    this.app = express();
    this.router = Router();
    this.dependencyContainer = new DependencyContainer();

    this.globalPrefix = options.globalPrefix || undefined;
    this.authValidator = options.authValidator || undefined;
    this.bodyValidator = options.bodyValidator || undefined;
    this.queryValidator = options.queryValidator || undefined;
    this.paramsValidator = options.paramsValidator || undefined;
    this.commonMiddlewareOptions = options.commonMiddlewareOptions || undefined;
    this.routeNotFoundOptions = options.routeNotFoundOptions || undefined;
    this.errorHandlerConfig = options.errorHandlerConfig || undefined;

    // Process all dependency overrides before all other processing
    if (options.dependencyOverrides && options.dependencyOverrides.length > 0) {
      for (const dependencyOverride of options.dependencyOverrides) {
        this.dependencyContainer.overrideDependency(dependencyOverride.original, dependencyOverride.override);
      }
    }

    // Force set the ErrorHandler and ErrorResponse if required because they rely on external configuration
    // todo: is there a better way of doing this?
    if (!this.dependencyContainer.hasDependency(ErrorResponseManager)) {
      this.dependencyContainer.forceSetDependency(ErrorResponseManager, {
        signature: ErrorResponseManager,
        instance: new ErrorResponseManager(this.errorHandlerConfig?.responseManagerConfig)
      });
    }
    if (!this.dependencyContainer.hasDependency(ErrorHandler)) {
      this.dependencyContainer.forceSetDependency(ErrorHandler, {
        signature: ErrorHandler,
        instance: new ErrorHandler(
          this.dependencyContainer.useDependency(Logger),
          this.dependencyContainer.useDependency(ErrorResponseManager),
          this.errorHandlerConfig
        )
      });
    }

    const middlewareLists = this.processMiddleware(options.middleware);

    // Setup common middleware for request parsing etc
    useCommonMiddleware(this.app, this.commonMiddlewareOptions);

    // Add "before-controllers" middlewares
    for (const middleware of middlewareLists.beforeControllers) {
      this.addMiddleware(middleware);
    }

    // Process controller routes
    for (const controller of options.controllers) {
      this.processController(controller);
    }

    // Attach the router to the app with all the controller routes setup
    if (this.globalPrefix) {
      this.app.use(this.globalPrefix, this.router);
    }
    else {
      this.app.use(this.router);
    }

    // Add "after-controllers" middlewares
    for (const middleware of middlewareLists.beforeControllers) {
      this.addMiddleware(middleware);
    }

    // Setup 404 fallback middleware
    useNotFoundMiddleware(this.app, this.routeNotFoundOptions);

    // Setup error handling
    this.setupErrorHandling();
  }

  getApp(): Application {
    return this.app;
  }

  getRouter(): Router {
    return this.router;
  }

  /**
	 * Process a given controller class.
	 * This primarily consists of setting up routing to the route methods.
	 *
	 * @param controller - A controller class
	 * @private
	 */
  private processController(controller: any) {
    const controllerInstance = this.dependencyContainer.useDependency<typeof controller>(controller);

    // Setup controller routes.
    const controllerGlobalRoute = <string> Reflect.getMetadata(MetadataKeys.ROUTE_PREFIX, controller);
    const controllerRoutes = <Array<RouteMetadata>> Reflect.getMetadata(MetadataKeys.ROUTES, controller);

    for (const route of controllerRoutes) {
      // Set route path, making sure to handle if the path has '/' or not.
      let routePath = controllerGlobalRoute.startsWith("/")
        ? controllerGlobalRoute
        : `/${controllerGlobalRoute}`;

      if (route.routeDefinition.path) {
        if (!routePath.endsWith("/") && !route.routeDefinition.path.startsWith("/")) {
          routePath += "/";
        }
        routePath += route.routeDefinition.path;
      }

      const routeMiddleware: MiddlewareFunction[] = [];

      // Routes must explicitly set authRequired=false to disable route protection.
      // This ensures no route is accidentally left unprotected.
      if (route.routeDefinition.authRequired !== false) {
        if (this.authValidator) {
          const authValidator = this.dependencyContainer.useDependency(this.authValidator);
          const validatorFunction = authValidator.run.bind(authValidator);
          routeMiddleware.push(validatorFunction);
        }
        else {
          throw new Error(`No auth validator registered but ${routePath} requires it.`);
        }
      }

      if (route.routeDefinition.bodyShape) {
        if (this.bodyValidator) {
          const bodyValidator = this.dependencyContainer.useDependency(this.bodyValidator);
          const validatorFunction = bodyValidator.validate.bind(bodyValidator);

          routeMiddleware.push(
            this.createValidatorMiddleware(validatorFunction, route.routeDefinition.bodyShape, "body")
          );
        }
        else {
          throw new Error(`No body validator registered but validation is required by ${routePath}`);
        }
      }

      if (route.routeDefinition.queryShape) {
        if (this.queryValidator) {
          const queryValidator = this.dependencyContainer.useDependency(this.queryValidator);
          const validatorFunction = queryValidator.validate.bind(queryValidator);

          routeMiddleware.push(
            this.createValidatorMiddleware(validatorFunction, route.routeDefinition.queryShape, "query")
          );
        }
        else {
          throw new Error(`No query validator registered but validation is required by ${routePath}`);
        }
      }

      if (route.routeDefinition.paramsShape) {
        if (this.paramsValidator) {
          const paramsValidator = this.dependencyContainer.useDependency(this.paramsValidator);
          const validatorFunction = paramsValidator.validate.bind(paramsValidator);

          routeMiddleware.push(
            this.createValidatorMiddleware(validatorFunction, route.routeDefinition.paramsShape, "params")
          );
        }
        else {
          throw new Error(`No params validator registered but validation is required by ${routePath}`);
        }
      }

      // Bind the controller instance to ensure internal dependencies work as expected
      routeMiddleware.push(controllerInstance[route.methodName].bind(controllerInstance));

      switch (route.routeDefinition.httpMethod) {
      case HTTPMethods.GET: {
        this.router.get(routePath, ...routeMiddleware);
        break;
      }
      case HTTPMethods.POST: {
        this.router.post(routePath, ...routeMiddleware);
        break;
      }
      case HTTPMethods.PATCH: {
        this.router.patch(routePath, ...routeMiddleware);
        break;
      }
      case HTTPMethods.PUT: {
        this.router.put(routePath, ...routeMiddleware);
        break;
      }
      case HTTPMethods.DELETE: {
        this.router.delete(routePath, ...routeMiddleware);
        break;
      }
      }
    }
  }

  /**
   * A factory function to return the validation middleware for the given validator function.
   *
   * @param validatorFunction
   * @param validationShape
   * @param dataKey
   */
  private createValidatorMiddleware(
    validatorFunction: ValidatorFunction,
    validationShape: any,
    dataKey: "body" | "query" | "params"
  ) {
    return async function validatorMiddleware(req: Request, res: Response, next: NextFunction) {
      const result = await validatorFunction(validationShape, req[dataKey]);

      if (result === true || (typeof result !== "boolean" && result.valid)) {
        return next();
      }

      return res.status(HTTPStatusCodes.BAD_REQUEST).send({
        statusCode: HTTPStatusCodes.BAD_REQUEST,
        message: "The supplied body data did not pass validation.",
        reason: typeof result === "boolean" ? null : (result.failReason ?? null)
      });
    };
  }

  private setupErrorHandling() {
    const errorHandler = this.dependencyContainer.useDependency(ErrorHandler);

    async function errorHandlerMiddleware(err: Error, req: Request, res: Response, next: NextFunction) {
      await errorHandler.handleError(err, res);
    }

    this.app.use(errorHandlerMiddleware);
  }

  private processMiddleware(middlewareList?: MiddlewareList): {beforeControllers: MiddlewareList, afterControllers: MiddlewareList} {
    const before: MiddlewareList = [];
    const after: MiddlewareList = [];

    if (middlewareList && middlewareList.length > 0) {
      for (const middleware of middlewareList) {
        const middlewareConfig = <MiddlewareConfig> Reflect.getMetadata(MetadataKeys.MIDDLEWARE_CONFIG, middleware);
        if (!middlewareConfig) {
          throw new Error("You can't use a middleware that isn't marked with @Middleware");
        }

        if (middlewareConfig.layer === "before-controllers") {
          before.push(middleware);
        }
        else {
          after.push(middleware);
        }
      }
    }

    return {
      beforeControllers: before,
      afterControllers: after
    };
  }

  private addMiddleware(middleware: Instantiable<MiddlewareFactory>) {
    const middlewareConfig = <MiddlewareConfig> Reflect.getMetadata(MetadataKeys.MIDDLEWARE_CONFIG, middleware);
    if (!middlewareConfig) {
      throw new Error("You can't use a middleware that isn't marked with @Middleware");
    }

    const middlewareInstance = this.dependencyContainer.useDependency<MiddlewareFactory>(middleware);
    const middlewareFunction = middlewareInstance.run.bind(middlewareInstance);
    this.app.use(middlewareConfig.route ?? "/*", middlewareFunction);
  }
}
