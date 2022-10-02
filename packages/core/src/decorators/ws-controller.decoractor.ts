import { MetadataKeys } from "./metadata-keys";

/**
 * Configuration for the WebSocketController decorator
 */
export interface WebSocketControllerConfig {
  identifier?: string,
  namespace?: string,
}

/**
 * WebSocketController decorator used to mark a class as a web socket controller.
 *
 * @param config
 * @constructor
 */
export function WebSocketController(config?: WebSocketControllerConfig): ClassDecorator {
  return function(target: any) {
    Reflect.defineMetadata(MetadataKeys.WEB_SOCKET_NAMESPACE, config?.namespace || "/", target);

    if (!Reflect.hasMetadata(MetadataKeys.WEB_SOCKET_EVENT_HANDLERS, target)) {
      Reflect.defineMetadata(MetadataKeys.WEB_SOCKET_EVENT_HANDLERS, [], target);
    }

    // Automatically setup dependency metadata here so users don't need to add @Injectable
    const dependencyKey = config?.identifier
      ? Symbol.for(config.identifier)
      : Symbol.for(target.toString());
    Reflect.defineMetadata(MetadataKeys.DEPENDENCY_KEY, dependencyKey, target.prototype);
    Reflect.defineMetadata(MetadataKeys.DEPENDENCY_CONFIG, {injectMode: "global"}, target.prototype);
  };
}
