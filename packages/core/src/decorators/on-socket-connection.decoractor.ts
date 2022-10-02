import { MetadataKeys } from "./metadata-keys";

/**
 * OnSocketConnection decorator used to mark a method as the method to call when a socket gets a connection.
 *
 * @constructor
 */
export function OnSocketConnection() {
  return function (target: any, propertyKey: string) {
    if (Reflect.hasMetadata(MetadataKeys.WEB_SOCKET_CONNECTION_HANDLER, target.constructor)) {
      throw new Error("You can only add one connection handler to a websocket controller.");
    }

    Reflect.defineMetadata(MetadataKeys.WEB_SOCKET_CONNECTION_HANDLER, propertyKey, target.constructor);
  };
}
