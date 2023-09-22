import { html } from "lit";
import {property, state} from "lit/decorators.js";
import {AdminWebsocket, AgentPubKeyB64, DnaDefinition, RoleName} from "@holochain/client";
import {
  HvmDef, HappElement, HCL, delay, Cell
} from "@ddd-qc/lit-happ";
import {TaskerPage} from "./elements/tasker-page";
import {AgentDirectoryList} from "@ddd-qc/agent-directory";
import "@ddd-qc/path-explorer";
import { TaskerDvm } from "./viewModel/tasker.dvm";
import {ProfileDef} from "./viewModel/profiles.proxy";




/**
 *
 */
export class TaskerApp extends HappElement {

  /** Ctor */
  constructor() {
    super(Number(process.env.HC_PORT));
  }

  /** HvmDef */
  static readonly HVM_DEF: HvmDef = {
    id: "hTasker",
    dvmDefs: [{ctor: TaskerDvm, isClonable: true}],
  };

  /** QoL */
  get taskerDvm(): TaskerDvm { return this.hvm.getDvm(TaskerDvm.DEFAULT_BASE_ROLE_NAME)! as TaskerDvm }
  get taskerDvmClones(): TaskerDvm[] {return this.hvm.getClones(TaskerDvm.DEFAULT_BASE_ROLE_NAME)! as TaskerDvm[]}
  taskerDvmClone(cloneId: RoleName): TaskerDvm { return this.hvm.getDvm(new HCL(this.hvm.appId, TaskerDvm.DEFAULT_BASE_ROLE_NAME, cloneId))! as TaskerDvm }

  /** -- Fields -- */

  @state() private _loaded = false;

  private _pageDisplayIndex: number = 0;
  /** ZomeName -> (AppEntryDefName, isPublic) */
  private _allAppEntryTypes: Record<string, [string, boolean][]> = {};


  @state() private _cell?: Cell;


  private _dnaDef?: DnaDefinition;

  /** */
  async hvmConstructed() {
    console.log("hvmConstructed()")
    //new ContextProvider(this, cellContext, this.taskerDvm.cell);
    /** Authorize all zome calls */
    const adminWs = await AdminWebsocket.connect(new URL(`ws://localhost:${process.env.ADMIN_PORT}`));
    console.log({adminWs});
    await this.hvm.authorizeAllZomeCalls(adminWs);
    console.log("*** Zome call authorization complete");
    this._dnaDef = await adminWs.getDnaDefinition(this.taskerDvm.cell.id[0]);
    console.log("happInitialized() dnaDef", this._dnaDef);
    /** Probe */
    this._cell = this.taskerDvm.cell;
    await this.hvm.probeAll();
    this._allAppEntryTypes = await this.taskerDvm.fetchAllEntryDefs();
    console.log("happInitialized(), _allAppEntryTypes", this._allAppEntryTypes);

    const dummyProfile: ProfileDef = {
      nickname: "camille",
      fields: {},
    }
    console.log("taskerDvm.createMyProfile()", dummyProfile);
    this.taskerDvm.profilesZvm.createMyProfile(dummyProfile);

    /** Done */
    this._loaded = true;
  }


  /** */
  async refresh(_e?: any) {
    console.log("tasker-app.refresh() called")
    await this.hvm.probeAll();
  }



  /** */
  render() {
    console.log("*** <tasker-app> render()", this._loaded, this.taskerDvm.pathExplorerZvm.perspective)
    if (!this._loaded) {
      return html`<span>Loading...</span>`;
    }
    let knownAgents: AgentPubKeyB64[] = this.taskerDvm.AgentDirectoryZvm.perspective.agents;
    //console.log({coordinator_zomes: this._dnaDef?.coordinator_zomes})
    const zomeNames = this._dnaDef?.coordinator_zomes.map((zome) => { return zome[0]; });
    console.log({zomeNames})
    let page;
    switch (this._pageDisplayIndex) {
      case 0: page = html`<tasker-page style="flex: 1;"></tasker-page>` ; break;
      case 1: page = html`<paths-dashboard .allAppEntryTypes=${this._allAppEntryTypes} style="flex: 1;"></paths-dashboard>`; break;
      case 2: page = html`<anchor-tree></anchor-tree>`; break;
      case 3: page = html`<agent-directory-list style="flex: 1;"></agent-directory-list>`; break;

      default: page = html`unknown page index`;
    };

    /* render all */
    return html`
      <cell-context .cell="${this._cell}">
        <div>
          <view-cell-context></view-cell-context>
          <input type="button" value="Tasker" @click=${() => {this._pageDisplayIndex = 0; this.requestUpdate()}} >
          <input type="button" value="Paths Dashboard" @click=${() => {this._pageDisplayIndex = 1; this.requestUpdate()}} >
            <input type="button" value="Anchors" @click=${() => {this._pageDisplayIndex = 2; this.requestUpdate()}} >
            <input type="button" value="Agent Directory" @click=${() => {this._pageDisplayIndex = 3; this.requestUpdate()}} >
        </div>
        <button type="button" @click=${this.refresh}>Refresh</button>
        <span><b>Agent:</b> ${this.taskerDvm.cell.agentPubKey}</span>
        <hr class="solid">      
        ${page}
      </cell-context>        
    `
  }
}
