import {css, html, PropertyValues, TemplateResult} from "lit";
import {property, state, customElement} from "lit/decorators.js";
import {Cell, ScopedZomeTypes, ZomeElement} from "@ddd-qc/lit-happ";
import {AnyDhtHashB64, encodeHashToBase64, ZomeName} from "@holochain/client";


import Tree from "@ui5/webcomponents/dist/Tree"
import TreeItem from "@ui5/webcomponents/dist/TreeItem";
import BusyIndicator from "@ui5/webcomponents/dist/BusyIndicator";
import "@ui5/webcomponents/dist/Tree.js"
import "@ui5/webcomponents/dist/TreeItem.js";
import "@ui5/webcomponents/dist/BusyIndicator.js";

import "@ui5/webcomponents/dist/Icon.js";
import Input from "@ui5/webcomponents/dist/Input";
import "@ui5/webcomponents/dist/Input.js";
import "@ui5/webcomponents/dist/features/InputSuggestions.js";

import {Base64} from "js-base64";
import {PathExplorerZvm} from "../viewModels/path-explorer.zvm";
import {TypedAnchor} from "../bindings/path-explorer.types";
import {AnyLinkableHashB64, linkType2NamedStr, linkType2str} from "../utils";


const ZOME_LINK_NAMES = [""]; // FIXME Get Link names somehow once Holo provides an API for that ; Object.keys(ThreadsLinkTypeType);

/** */
export interface AnchorTreeItem {
  base: AnyLinkableHashB64 | string /* Anchor */,
  level: number,
  isAnchor: boolean,
  zomeIndex: number,
  linkIndex: number,
}


/** */
function toAnchorTreeItem(ti: TreeItem): AnchorTreeItem | null {
  const isAnchor = ti.getAttribute("is-anchor");
  const zomeIndex = ti.getAttribute("zomeIndex");
  const linkIndex = ti.getAttribute("linkIndex");

  if (!isAnchor) {
    return null;
  }
  const ati = {
    base: ti.id,
    level: ti.level,
    isAnchor: Boolean(isAnchor),
    zomeIndex: Number(zomeIndex),
    linkIndex: Number(linkIndex),
  };
  //console.log("toLinkTreeItem()", ti, lti);
  return ati;
}


/** */
function getLeafComponent(anchor: String): string {
  const subs = anchor.split(".");
  /** Remove empty string at tail */
  if (subs.length > 0 && subs[subs.length - 1] == "") {
    subs.pop();
  }
  console.log("leafComponent()", anchor, subs)
  if (subs.length == 0) {return "<error>"}
  return subs[subs.length - 1];
}



/**
 * Element for displaying a tree of Anchors and their items
 * An AnchorTree is a tree of all Paths using the same link-type.
 * Purpose:
 * 1. Display all paths all types from ROOT
 * 2. Display all paths (and items) of same link-type from some Anchor (i.e. AnchorTree)
 */
@customElement("anchor-tree")
export class AnchorTree extends ZomeElement<unknown, PathExplorerZvm> {

  constructor() {
    super(PathExplorerZvm.DEFAULT_ZOME_NAME);
  }


  /** If no root anchor is provided, then it will start from ROOT */
  @property() rootTypedAnchor: TypedAnchor | undefined = undefined


  /** The TreeItems at level 0 */
  @state() private _level0: AnchorTreeItem[] = [];

  /** ZomeInfo */
  @state() private _linkTypes: ScopedZomeTypes = [];
  @state() private _zomeNames: ZomeName[] = [];


  // TODO
  @property() canProgressiveWalk: boolean = true; // TODO: set probing behavior to traverse the AnchorTree directly on first expand or not
  // TODO: Implement ExpandAll button
  // TODO: Add refresh buttons to branch items


  /** -- Methods -- */

  /** */
  protected async zvmUpdated(newZvm: PathExplorerZvm, oldZvm?: PathExplorerZvm): Promise<void> {
    console.log("<anchor-tree>.zvmUpdated()", newZvm, oldZvm);
    const zi = await newZvm.zomeProxy.zomeInfo();
    //console.log("<anchor-tree>.zvmUpdated()" zi);
    this._linkTypes = zi.zome_types.links;
    const di = await newZvm.zomeProxy.dnaInfo();
    this._zomeNames = di.zome_names;
  }


  // /** Probe rootAnchors at startup */
  // protected firstUpdated() {
  //   this.walkRootAnchor();
  // }


  /** */
  shouldUpdate(changedProperties: PropertyValues<this>) {
    super.shouldUpdate(changedProperties);
    //console.log("<anchor-tree>.shouldUpdate()", changedProperties);
    if (changedProperties.has("rootTypedAnchor")) {
      console.log("<anchor-tree>.shouldUpdate()", changedProperties);
      this.walkRootAnchor();
    }
    return true;
  }


  /** */
  renderLeafAnchor(rootAnchors: TypedAnchor[]): TemplateResult<1> {
    return html``;
  }

  /** */
  async expandAll(): Promise<void> {
    // FIXME
  }


  /** */
  toLevel0TreeItem(ati: AnchorTreeItem): TemplateResult {
    //console.log("toLevel0TreeItem()", lti)
    // if (ati.slt == undefined) {
    //   console.warn("toLevel0TreeItem() aborted. Missing FlatScopedLinkType field in function argument.");
    //   return html``;
    // }
    const linkTypeName = linkType2NamedStr(ati, this._zomeNames); // linkType2str(ati);
    return html`<ui5-tree-item id="${ati.base}"
                               text="${ati.base}" additional-text=${linkTypeName}
                               has-children
                               zomeIndex="${ati.zomeIndex}" linkIndex="${ati.linkIndex}" is-anchor="true"
    ></ui5-tree-item>`;
  }


  /** Set _level0 to all children of this.rootTypedAnchor */
  async walkRootAnchor(): Promise<void> {
    if (!this._zvm) {
      console.warn("walkRootAnchor() aborted. Missing _zvm.");
      return;
    }
    console.debug("walkRootAnchor()", this.rootTypedAnchor);
    // const maybeTree = this.shadowRoot!.getElementById("rootAnchorTree") as Tree;
    // console.debug("walkAnchor()", maybeTree);
    // if (maybeTree) {
    //   maybeTree.innerHTML = '';
    //   while (maybeTree.firstChild) {
    //     maybeTree.removeChild(maybeTree.firstChild);
    //   }
    // }
    let tas: TypedAnchor[] = [];
    if (this.rootTypedAnchor) {
        tas = await this._zvm.zomeProxy.getTypedChildren(this.rootTypedAnchor);
    } else {
      /** AnchorTree from ROOT */
      tas = await this._zvm.zomeProxy.getAllRootAnchors();
    }
    console.log("TypedAnchors", tas);
    this._level0 = tas.map((ta): AnchorTreeItem => {
      return {
        base: ta.anchor,
        level: 0,
        isAnchor: true,
        zomeIndex: ta.zomeIndex,
        linkIndex: ta.linkIndex,
      }
    });
  }


  /** */
  renderAnchorTree(title: string): TemplateResult<1> {
    const level0Items = this._level0.map((lti) => {return this.toLevel0TreeItem(lti)});
    //console.log({level0: level0Items});

    /** */
    return html`
      <ui5-busy-indicator id="busy" style="width: 100%">
        <ui5-tree id="rootAnchorTree"
                  mode="None" no-data-text="No (sub)anchors found"
                  header-text=${title}
                  @item-toggle="${this.toggleTreeItem}"
                  @click="${this.clickTree}"
        >
          ${level0Items}
        </ui5-tree>
      </ui5-busy-indicator>
    `
  }


  /** onToggle fetch the children of the toggled anchor */
  async toggleTreeItem(event:any) {
    const busyIndicator = this.shadowRoot!.getElementById("busy") as BusyIndicator;
    const toggledTreeItem = event.detail.item as TreeItem; // get the node that is toggled
    /** Don't do anything if Tree is already expanded */
    if (toggledTreeItem.expanded) {
      return;
    }

    const ati = toAnchorTreeItem(toggledTreeItem);
    console.log("toggleTreeItem()", ati);

    /* Make sure it's an Anchor TreeItem */
    if (!ati || !ati.isAnchor) {
      return;
    }

    /** Lock Tree */
    event.preventDefault();
    busyIndicator.active = true;

    /** Keep already existing children */
    let currentItemTexts = [];
    for (const item of toggledTreeItem.items) {
      currentItemTexts.push((item as TreeItem).text);
    }
    console.log("toggleTreeItem() currentItemTexts", currentItemTexts);

    /** Grab children */
    const children_tas: TypedAnchor[] = await this._zvm.zomeProxy.getTypedChildren({anchor: ati.base, zomeIndex: ati.zomeIndex, linkIndex: ati.linkIndex});
    console.log("toggleTreeItem() children_tas", children_tas);

    /** If it has children, then it's a non-LeafAnchor, so create a TreeItem for each child Anchor */
    for (const ta of children_tas) {
      const leafComponent = getLeafComponent(ta.anchor);
      /* Skip if child TreeItem is already part of the Tree */
      if (currentItemTexts.includes(leafComponent)) {
        continue;
      }
      let newItem = document.createElement("ui5-tree-item") as TreeItem;
      newItem.id = ta.anchor;
      newItem.text = leafComponent;
      //newItem.additionalText = linkType2NamedStr(ta, this._zomeNames); // linkType2str(ati);
      newItem.additionalText = ta.anchor;
      newItem.setAttribute("zomeIndex", ta.zomeIndex.toString());
      newItem.setAttribute("linkIndex", ta.linkIndex.toString());
      newItem.setAttribute("is-anchor", "true");
      newItem.hasChildren = true;
      newItem.level = ati.level + 1;
      toggledTreeItem.appendChild(newItem); // add the newly fetched node to the tree
    }


    /** If it has no children then it must be a leaf, so grab its Items instead and create a TreeItem for each */
    if (children_tas.length == 0) {
      let itemHashs = [];
      for (const item of toggledTreeItem.items) {
        itemHashs.push(item.id);
      }
      const itemLinks = await this._zvm.zomeProxy.getAllItemsFromAnchor(ati.base);
      console.log({itemLinks})
      for (const itemLink of itemLinks) {
        const tag = new TextDecoder().decode(new Uint8Array(itemLink.tag));
        const hash = encodeHashToBase64(new Uint8Array(itemLink.itemHash));
        /* Skip if child TreeItem is already part of the Tree */
        if (itemHashs.includes(hash)) {
          continue;
        }
        var newItem = document.createElement("ui5-tree-item") as TreeItem;
        newItem.text = hash;
        //newItem.additionalText = linkType2NamedStr(itemLink, this._zomeNames); // linkType2str(ati);
        newItem.additionalText = tag // tag ? ZOME_LINK_NAMES[itemLink.linkIndex] + " | " + tag : ZOME_LINK_NAMES[itemLink.linkIndex];
        newItem.setAttribute("is-anchor", "false");
        newItem.setAttribute("zomeIndex", itemLink.zomeIndex.toString());
        newItem.setAttribute("linkIndex", itemLink.linkIndex.toString());
        newItem.id = hash;
        newItem.level = ati.level + 1;
        toggledTreeItem.appendChild(newItem); // add the newly fetched node to the tree
      }
    }

    /** Toggle and unlock Tree */
    toggledTreeItem.toggle();
    busyIndicator.active = false;
  }


  /** */
  async clickTree(event:any) {
    //console.log("<anchor-tree> click event:", event)
    console.log("<anchor-tree> click event:", event.target.id);
    /** Hacky way to know it's a hash */
    if (event.target.id.substring(0, 3) == "uhC") {
      await this.updateComplete;
      this.dispatchEvent(new CustomEvent('hashSelected', {detail: event.target.id, bubbles: true, composed: true}));
    }
  }


  /** */
  render() {
    //console.log("<anchor-tree>.render()", this.root);

    let title = "Viewing ROOT";
    if (this.rootTypedAnchor) {
      if (typeof this.rootTypedAnchor == 'string') {
        title = `Viewing "${this.rootTypedAnchor}"`
      } else {
        title = `Viewing "${this.rootTypedAnchor.anchor}"`
      }
    };
    /** render all */
    return html`
        <h2>
            Anchor Explorer: cell "${this.cell.name}"
            <button @click=${this.onProbeROOT}>
                Probe ROOT
            </button>
        </h2>
        <!--<h4>${title}</h4>-->
          <button style="display: none;" @click="${async () => {await this.expandAll();}}">
              Expand All
          </button>
          <ui5-input id="rootInput" type="Text" placeholder="root anchor"
                     style="min-width: 400px;"
                     show-clear-icon
                     @keypress=${(event:any) => {
                       console.log("input event", event);
                        if (event.key === "Enter") {
                            this.onWalkInput(event);
                        }
                     }}
                     ></ui5-input>            
          <button @click=${this.onWalkInput}>Walk</button>
        <div>
          ${this.renderAnchorTree(title)}
        </div>
    `;
  }


  /** */
  async onProbeROOT(e:any) {
    this._level0 = [];
    this.rootTypedAnchor = undefined;
    await this.walkRootAnchor();
    const input = this.shadowRoot!.getElementById("rootInput") as Input;
    input.value = '';
  }


  /** */
  async onWalkInput(e:any) {
    const input = this.shadowRoot!.getElementById("rootInput") as Input;
    if (!input.value) {
      this.rootTypedAnchor = undefined;
      return;
    }
    this._level0 = [];
    //const isHash = Base64.isValid(input.value) &&  input.value.substring(0, 3) == "uhC"
    //console.log("onWalk()", input.value, isHash)
    const maybeTypedAnchor = await this._zvm.zomeProxy.getTypedAnchor(input.value);
    console.log("onWalkInput()", maybeTypedAnchor)
    if (maybeTypedAnchor[1]) {
      this.rootTypedAnchor = maybeTypedAnchor[1];
    }
  }

  /** */
  static get styles() {
    return [
      css`
          :host {
            padding-left:5px;
            padding-right:5px;
          }
      `
    ];
  }
}
