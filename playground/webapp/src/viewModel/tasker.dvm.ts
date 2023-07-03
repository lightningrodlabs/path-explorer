import { DnaViewModel, ZvmDef } from "@ddd-qc/lit-happ";
import {TaskerZvm} from "./tasker.zvm"
import {AgentDirectoryZvm} from "@ddd-qc/agent-directory"
import {AppSignalCb} from "@holochain/client";
import {PathExplorerZvm} from "@path-explorer/elements/dist/viewModels/path-explorer.zvm";


/**
 * TODO: Make a "passthrough" DVM generator in dna-client based on ZVM_DEFS
 */
 export class TaskerDvm extends DnaViewModel {

  /** -- DnaViewModel Interface -- */

  static readonly DEFAULT_BASE_ROLE_NAME = "rTasker";
  static readonly ZVM_DEFS: ZvmDef[] = [
   TaskerZvm,
   [PathExplorerZvm, "zPathExplorer"],
   [AgentDirectoryZvm, "zAgentDirectory"],
  ];

  readonly signalHandler?: AppSignalCb;


  /** QoL Helpers */
  get taskerZvm(): TaskerZvm {return this.getZomeViewModel(TaskerZvm.DEFAULT_ZOME_NAME) as TaskerZvm}
  get pathExplorerZvm(): PathExplorerZvm {return this.getZomeViewModel("zPathExplorer") as PathExplorerZvm}
  get AgentDirectoryZvm(): AgentDirectoryZvm {return this.getZomeViewModel("zAgentDirectory") as AgentDirectoryZvm}


  /** -- ViewModel Interface -- */

  protected hasChanged(): boolean {return true}

  get perspective(): void {return}

}
