import {PathExplorerProxy} from "../bindings/path-explorer.proxy";
import {delay, Dictionary, ZomeViewModel} from "@ddd-qc/lit-happ";

/**
 *
 */
export class PathExplorerZvm extends ZomeViewModel {

  static readonly ZOME_PROXY = PathExplorerProxy;

  get zomeProxy(): PathExplorerProxy {
    return this._zomeProxy as PathExplorerProxy;
  }

  /* */
  protected hasChanged(): boolean {
    if (!this._previousPerspective) {
      return true;
    }
    let hasChanged = true; // FIXME
    return hasChanged;
  }


  /** -- Perspective -- */

  /* */
  get perspective(): unknown {
    return undefined;
  }


}
