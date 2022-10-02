import {EventHandlerDefinition} from "./event-handler-definition";

/**
 * Event handler metadata used internally by the @OnSocketEvent decorator
 * when adding metadata to the target object.
 */
export interface EventHandlerMetadata {
  methodName: string,
  eventHandlerDefinition: EventHandlerDefinition
}
