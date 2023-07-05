import {AppSignalCb} from "@holochain/client";
import { DnaViewModel, ZvmDef } from "@ddd-qc/lit-happ";
import {AgentDirectoryZvm} from "@ddd-qc/agent-directory"
import {PathExplorerZvm} from "@ddd-qc/path-explorer/dist/viewModels/path-explorer.zvm";
import {TaskerZvm} from "./tasker.zvm"
import {ProfilesZvm} from "./profiles.zvm";
import {ProfileDef} from "./profiles.proxy";


/**
 * TODO: Make a "passthrough" DVM generator in dna-client based on ZVM_DEFS
 */
 export class TaskerDvm extends DnaViewModel {

  /** -- DnaViewModel Interface -- */

  static readonly DEFAULT_BASE_ROLE_NAME = "rTasker";
  static readonly ZVM_DEFS: ZvmDef[] = [
   TaskerZvm,
   PathExplorerZvm,
   [AgentDirectoryZvm, "zAgentDirectory"],
   [ProfilesZvm, "profiles"],
  ];

  readonly signalHandler?: AppSignalCb;


  /** QoL Helpers */
  get taskerZvm(): TaskerZvm {return this.getZomeViewModel(TaskerZvm.DEFAULT_ZOME_NAME) as TaskerZvm}
  get pathExplorerZvm(): PathExplorerZvm {return this.getZomeViewModel("zPathExplorer") as PathExplorerZvm}
  get AgentDirectoryZvm(): AgentDirectoryZvm {return this.getZomeViewModel("zAgentDirectory") as AgentDirectoryZvm}
  get profilesZvm(): ProfilesZvm {return this.getZomeViewModel("profiles") as ProfilesZvm}


  /** -- ViewModel Interface -- */

  protected hasChanged(): boolean {return true}

  get perspective(): void {return}


  /** -- */

  // protected async dvmUpdated(newDvm: TaskerDvm, oldDvm?: TaskerDvm): Promise<void> {
  //  const dummyProfile: ProfileDef = {
  //    nickname: "camille",
  //    fields: {},
  //  }
  //  console.log("taskerDvm.dvmUpdated()", dummyProfile);
  //  newDvm.profilesZvm.createMyProfile(dummyProfile);
  // }

}
