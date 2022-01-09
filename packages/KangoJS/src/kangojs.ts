import 'reflect-metadata';

import { Application, Router, Request, Response, NextFunction } from 'express';
import glob from 'glob-promise';

import { KangoJSConfig, KangoJSOptions } from './types/kangojs-config';
import { MetadataKeys } from './decorators/metadata-keys';
import { HTTPMethods } from './utils/http-methods';
import { RouteMetadata } from './types/route-metadata';

/**
 * The main object that encapsulates and manages all framework features.
 */
class KangoJS {
	private readonly router: Router;
	private authFunction?: (req: Request, res: Response, next: NextFunction) => Promise<any>;
	private validateBody?: (bodyShape: any) => (req: Request, res: Response, next: NextFunction) => Promise<any>;
	private validateQuery?: (queryShape: any) => (req: Request, res: Response, next: NextFunction) => Promise<any>;
	private config: KangoJSConfig;

	/**
	 * The object constructor.
	 *
	 * @param options - options for customising how KangoJS works.
	 */
	constructor(options: KangoJSOptions) {
		this.router = Router();

		this.config = {
			controllerFilesGlob: options.controllerFilesGlob,
			globalPrefix: options.globalPrefix ? options.globalPrefix : null,
		}

		if (options.authFunction) {
			this.authFunction = options.authFunction;
		}
		if (options.validateBody) {
			this.validateBody = options.validateBody;
		}
		if (options.validateQuery) {
			this.validateQuery = options.validateQuery;
		}
	}

	/**
	 * The main method that bootstraps KangoJS, loading all controllers & routes etc.
	 *
	 * @param app - The Express app instance to add routes to.
	 */
	async boostrap(app: Application) {
		const controllerFiles = await glob(
			this.config.controllerFilesGlob,
			{absolute: true} // Make file paths absolute to ensure imports don't fail when used in a project.
		);

		for (let index = 0; index < controllerFiles.length; index++) {
			let controller = await import(controllerFiles[index])
			await this.registerController(controller.default);
		}

		if (this.config.globalPrefix) {
			app.use(this.config.globalPrefix, this.router);
		}
		else {
			app.use(this.router);
		}
	}

	async registerController(controller: any) {
		const controllerInstance = new controller();

		// Setup controller routes.
		const controllerGlobalRoute = <string> Reflect.getMetadata(MetadataKeys.ROUTE_PREFIX, controller);
		const controllerRoutes = <Array<RouteMetadata>> Reflect.getMetadata(MetadataKeys.ROUTES, controller);

		for (const route of controllerRoutes) {
			// Set route path, making sure to handle if the path has '/' or not.
			let routePath = controllerGlobalRoute.startsWith('/')
				? controllerGlobalRoute
				: `/${controllerGlobalRoute}`;

			if (route.routeDefinition.path) {
				if (!routePath.endsWith('/') && !route.routeDefinition.path.startsWith('/')) {
					routePath += '/';
				}
				routePath += route.routeDefinition.path;
			}

			let routeMiddleware = [];

			if (route.routeDefinition.bodyShape) {
				if (this.validateBody) {
					routeMiddleware.push(
						this.validateBody(route.routeDefinition.bodyShape)
					)
				}
				else {
					throw new Error(`No validateBody function registered but validation is required by ${routePath}`);
				}
			}

			if (route.routeDefinition.queryShape) {
				if (this.validateQuery) {
					routeMiddleware.push(
						this.validateQuery(route.routeDefinition.queryShape)
					)
				}
				else {
					throw new Error(`No validateQuery function registered but validation is required by ${routePath}`);
				}
			}

			// Routes must explicitly set authRequired=false to disable route protection.
			// This ensures no route is accidentally left unprotected.
			if (!!route.routeDefinition.authRequired) {
				if (this.authFunction) {
					routeMiddleware.push(this.authFunction)
				}
				else {
					throw new Error(`No authFunction registered but ${routePath} requires it.`);
				}
			}

			// Bind the controller instance to ensure the method works as expected.
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
}

export { KangoJS };