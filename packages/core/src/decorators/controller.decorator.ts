import { MetadataKeys } from "./metadata-keys";
import { MiddlewareList } from "../types/middleware/middleware-interface";

/**
 * Configuration for the controller decorator
 */
export interface ControllerConfig {
  path?: string,
  identifier?: string,
  middleware?: MiddlewareList
}

/**
 * Controller decorator used to mark a class as a controller.
 *
 * @param config
 * @constructor
 */
export function Controller(config?: ControllerConfig): ClassDecorator {
  return function(target: any) {
    Reflect.defineMetadata(MetadataKeys.CONTROLLER_PATH, config?.path || "", target);
    Reflect.defineMetadata(MetadataKeys.MIDDLEWARE_LIST, config?.middleware || [], target);

    // Routes metadata will most likely be set by a route decorator.
    if (!Reflect.hasMetadata(MetadataKeys.CONTROLLER_ROUTES, target)) {
      Reflect.defineMetadata(MetadataKeys.CONTROLLER_ROUTES, [], target);
    }

    // Automatically setup dependency metadata here so users don't need to add @Injectable to controllers
    const dependencyKey = config?.identifier
      ? Symbol.for(config.identifier)
      : Symbol.for(target.toString());
    Reflect.defineMetadata(MetadataKeys.DEPENDENCY_KEY, dependencyKey, target.prototype);
    Reflect.defineMetadata(MetadataKeys.DEPENDENCY_CONFIG, {injectMode: "global"}, target.prototype);
  };
}
