import {css, html, PropertyValues, TemplateResult} from "lit";
import {property, state, customElement} from "lit/decorators.js";
import {ScopedZomeTypes, ZomeElement} from "@ddd-qc/lit-happ";
import {AnyDhtHashB64, decodeHashFromBase64, encodeHashToBase64, ZomeName} from "@holochain/client";
import {ItemLink} from '../bindings/deps.types';

import "@ui5/webcomponents/dist/Tree.js"
import "@ui5/webcomponents/dist/TreeItem.js";
import "@ui5/webcomponents/dist/BusyIndicator.js";
import {PathExplorerZvm} from "../viewModels/path-explorer.zvm";
import {linkType2str, utf32Decode} from "../utils";


/**
 *
 */
@customElement("link-list")
export class LinkList extends ZomeElement<unknown, PathExplorerZvm> {

  constructor() {
    super(PathExplorerZvm.DEFAULT_ZOME_NAME);
    //console.log("<link-list>.ctor()", this.rootHash);
  }


  @property() base?: AnyDhtHashB64;

  @state() private _itemLinks: ItemLink[] = [];
  @state() private _zomes: ZomeName[] = [];
  @state() private _selectedZomeLinks: ScopedZomeTypes = [];
  @state() private _linkTypes: ScopedZomeTypes = [];
  @state() private _linkTypeFilter?: number;


  /** */
  async probeBase() {
    console.log("<link-list>.probeBase()", this.base);
    //const b64 = new TextEncoder().encode(this.rootHash);
    if (!this.base) {
      return;
    }
    const baseHash = decodeHashFromBase64(this.base);
    this._itemLinks = await this._zvm.zomeProxy.getAllItems(baseHash);
  }


  /** */
   shouldUpdate(changedProperties: PropertyValues<this>) {
    super.shouldUpdate(changedProperties);
    //console.log("ZomeElement.shouldUpdate() start", !!this._zvm, this.installedCell);
    if (changedProperties.has("base") && this._zvm) {
      this.probeBase();
    }
    return true;
  }


  /** */
  protected async zvmUpdated(newZvm: PathExplorerZvm, oldZvm?: PathExplorerZvm): Promise<void> {
    console.log("<link-list>.zvmUpdated()", this.base);
    const zi = await newZvm.zomeProxy.zomeInfo();
    console.log({zi});
    this._linkTypes = zi.zome_types.links;
    const di = await newZvm.zomeProxy.dnaInfo();
    this._zomes = di.zome_names;
  }


  /** */
  renderLinkTree(): TemplateResult<1> {
    if (!this._itemLinks) {
      return html`No root set`
    }
    let children = this._itemLinks.map((ll) => {
        if (this._linkTypeFilter && ll.linkIndex != this._linkTypeFilter) {
          return html``;
        }
        //console.log("renderLinKTree()", ll.tag);
        let tag;
        /** Tag can be a normal string or a Component in utf32 */
        try {
          tag = utf32Decode(new Uint8Array(ll.tag.slice(2)));
        } catch(e) {
          tag = new TextDecoder().decode(new Uint8Array(ll.tag));
        }
        const hash = encodeHashToBase64(new Uint8Array(ll.itemHash));
        const linkTypeStr = linkType2str(ll);
        const additionalText = tag? linkTypeStr + " | " + tag : linkTypeStr;
        return html`<ui5-tree-item id="${hash}" text="${hash}" additional-text="${additionalText}"></ui5-tree-item>`
      });
    console.log({children})
    const header = "Viewing: " + this.base? this.base : "<none>";

    return html`
      <ui5-busy-indicator id="busy" style="width: 100%">
        <ui5-tree id="linkTree" mode="None" header-text="${header}" no-data-text="No links found">
          ${children}
        </ui5-tree>
      </ui5-busy-indicator>
    `
  }


  /** */
  async onZomeSelect(e: any) {
    //console.log("onZomeSelect() CALLED", e)
    //this._selectedZomeLinks = this._zv
  }


  /** */
  async onLinkTypeSelect(e: any) {
    //console.log("onLinkTypeSelect() CALLED", e)
    const selector = this.shadowRoot!.getElementById("linkTypeSelector") as HTMLSelectElement;
    if (!selector || !selector.value) {
      console.warn("No list selector value", selector);
      return;
    }
    console.log("onLinkTypeSelect() value", Number(selector.value))
    this._linkTypeFilter = Number(selector.value);
  }


  /** */
  onProbe(e:any) {
    const input = this.shadowRoot!.getElementById("baseInput") as HTMLInputElement;
    this.base = input.value;
  }


  /** */
  render() {
    //console.log(`<link-list> render(): ${this.rootHash}`);
    if (!this._zomes) {
      return html`Loading...`;
    }

    /** render all */
    return html`
        <h3>Links Explorer</h3>
          <label for="baseInput">Base:</label>
          <input style="min-width: 400px;" type="text" id="baseInput" name="title">
          <input type="button" value="Probe" @click=${this.onProbe}>
          <div style="margin-top:5px;">
              Filter by
            <span>zome:</span>
            <select name="zomeSelector" id="zomeSelector" @click=${this.onZomeSelect}>
                ${Object.values(this._zomes).map(
                        (zomeName) => {
                            return html`<option>${zomeName}</option>`
                        }
                )}
            </select>
            <span> link type:</span>
            <select name="linkTypeSelector" id="linkTypeSelector" @click=${this.onLinkTypeSelect}>
                ${this._linkTypes.length > 0? this._linkTypes[0].map(
                        (linkIndex) => {
                            return html`<option>${linkIndex}</option>`
                        }
                ): html``}
            </select>
            <button @click="${() => {this._linkTypeFilter = undefined;}}">Reset</button>
          </div>
          <div>
          ${this.renderLinkTree()}
        </div>
    `;
  }

}
