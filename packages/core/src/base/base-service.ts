import {KangoJS} from "../kangojs";

/**
 * A base service interface
 */
interface BaseService {
  /**
   * A hook method which will be called as the application initializes.
   * This can be used for setup tasks etc.
   *
   * @param app
   */
  onInit(app: KangoJS): Promise<void>;

  /**
   * A hook method which will be called as the application is stopped or errors out.
   * This can be used for cleanup and teardown tasks.
   *
   * @param app
   */
  onKill(app: KangoJS): Promise<void>;
}