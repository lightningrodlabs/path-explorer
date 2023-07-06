import {PathExplorerProxy} from "../bindings/path-explorer.proxy";
import {delay, Dictionary, ZomeViewModel} from "@ddd-qc/lit-happ";
import {ZomeName} from "@holochain/client";

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


  /** -- Methods -- */


  /** Should probably cache dnaInfo at init and not have this fn be async */
  async getZomeName(zomeIndex: number): Promise<ZomeName> {
    const dnaInfo = await this._zomeProxy.dnaInfo();
    return dnaInfo.zome_names[zomeIndex];
  }


  /** Should probably cache dnaInfo at init and not have this fn be async */
  async getEntryName(zomeName: ZomeName, entryIndex: number): Promise<string> {
    const entryDefs = await this.zomeProxy.callEntryDefs(zomeName);
    return entryDefs[entryIndex][0];
  }
}
