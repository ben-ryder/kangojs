import {Socket} from "socket.io";

/**
 * Next function used in Socket.io middlewares.
 */
export type SocketNextFunction = (err?: Error) => void;

/**
 * Socket middleware function.
 */
export type SocketMiddlewareFunction = (socket: Socket, next: SocketNextFunction) => void

/**
 * Socket middleware factory class to allow for dependency injection within socket middlewares.
 */
export abstract class SocketMiddlewareFactory {
  abstract run: SocketMiddlewareFunction
}
