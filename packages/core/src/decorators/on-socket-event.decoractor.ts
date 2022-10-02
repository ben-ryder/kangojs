import { MetadataKeys } from "./metadata-keys";
import {EventHandlerDefinition} from "../types/websockets/event-handler-definition";
import {EventHandlerMetadata} from "../types/websockets/event-handler-metadata";

/**
 * OnSocketEvent decorator used to mark a method as a web socket event handler.
 *
 * @param eventHandlerDefinition
 * @constructor
 */
export function OnSocketEvent(eventHandlerDefinition: EventHandlerDefinition) {
  return function (target: any, propertyKey: string) {
    if (!Reflect.hasMetadata(MetadataKeys.WEB_SOCKET_EVENT_HANDLERS, target.constructor)) {
      Reflect.defineMetadata(MetadataKeys.WEB_SOCKET_EVENT_HANDLERS, [], target.constructor);
    }

    const eventHandlers = Reflect.getMetadata(MetadataKeys.WEB_SOCKET_EVENT_HANDLERS, target.constructor) as Array<EventHandlerMetadata>;
    eventHandlers.push({
      methodName: propertyKey,
      eventHandlerDefinition
    });

    Reflect.defineMetadata(MetadataKeys.WEB_SOCKET_EVENT_HANDLERS, eventHandlers, target.constructor);
  };
}
