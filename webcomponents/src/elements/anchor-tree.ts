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
import {AnyLinkableHashB64, FlatScopedLinkType, linkType2NamedStr, linkType2str} from "../utils";


const ZOME_LINK_NAMES = [""]; // FIXME Get Link names somehow once Holo provides an API for that ; Object.keys(ThreadsLinkTypeType);

export interface AnchorTreeItem {
  origin:  AnyLinkableHashB64 | string /* Anchor */,
  slt?: FlatScopedLinkType,
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


/** */
function toAnchorTreeItem(ti: TreeItem) {
  const lti = {
    origin: ti.getAttribute("origin"),
    slt: {
      zomeIndex: Number(ti.getAttribute("zomeIndex")),
      linkIndex: Number(ti.getAttribute("linkIndex")),
    }
  };
  //console.log("toLinkTreeItem()", ti, lti);
  return lti;
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


  /** Probe rootAnchors at startup */
  protected firstUpdated() {
    this.walkRootAnchor();
  }


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
  toLevel0TreeItem(lti: AnchorTreeItem): TemplateResult {
    //console.log("toLevel0TreeItem()", lti)
    if (lti.slt == undefined) {
      console.warn("toLevel0TreeItem() aborted. Missing linkIndex argument.");
      return html``;
    }
    const id = "anchor__" +  lti.origin;
    const linkTypeName = linkType2NamedStr(lti.slt, this._zomeNames) //linkType2str(lti.slt);
    return html`<ui5-tree-item id="${id}" text="${lti.origin}" additional-text=${linkTypeName} has-children
                             origin="${lti.origin}" zomeIndex="${lti.slt.zomeIndex}" linkIndex="${lti.slt.linkIndex}"></ui5-tree-item>`
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
      return {origin: ta.anchor, slt: {zomeIndex: ta.zomeIndex, linkIndex: ta.linkIndex}}
    });
  }


  /** */
  renderAnchorTree(title: string): TemplateResult<1> {
    const level0Items = this._level0.map((lti) => {return this.toLevel0TreeItem(lti)});
    //console.log({level0: level0Items});

    /** */
    return html`
      <ui5-busy-indicator id="busy" style="width: 100%">
        <ui5-tree id="rootAnchorTree" mode="None" no-data-text="No (sub)anchors found"
                  header-text=${title}
                  @item-toggle="${this.toggleTreeItem}"
                  @click="${this.clickTree}"
        >
          ${level0Items}
        </ui5-tree>
      </ui5-busy-indicator>
    `
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


  /** onToggle fetch the children of the toggled anchor */
  async toggleTreeItem(event:any) {
    const busyIndicator = this.shadowRoot!.getElementById("busy") as BusyIndicator;
    const toggledTreeItem = event.detail.item as TreeItem ; // get the node that is toggled
    const lti = toAnchorTreeItem(toggledTreeItem);
    //const isTyped = !!this.root && typeof this.root == 'object';
    const isTyped = !!toggledTreeItem.getAttribute("linkIndex");

    console.log("toggleTreeItem()", lti.origin, isTyped);

    /* Handle TreeItem marked as "anchor__" */
    if (toggledTreeItem.id.length > 8 && toggledTreeItem.id.substring(0, 8) === "anchor__") {
      if (toggledTreeItem.expanded) {
        return;
      }
      event.preventDefault(); // do not let the toggle button switch yet
      busyIndicator.active = true; // block the tree from the user

      /** Keep already existing children */
      let currentItemTexts = [];
      for (const item of toggledTreeItem.items) {
        currentItemTexts.push((item as TreeItem).text);
      }
      console.log("toggleTreeItem() currentItemTexts", currentItemTexts, isTyped);

      /** Grab children */
      let all_children_tas: TypedAnchor[] = [];
      if (isTyped && lti.origin) {
        all_children_tas = await this._zvm.zomeProxy.getTypedChildren({anchor: lti.origin, zomeIndex: lti.slt.zomeIndex, linkIndex: lti.slt.linkIndex});
      }
      // else {
      //   let linkItems = await this._zvm.zomeProxy.getAllItemsFromAnchor(lti.origin);
      //   //any_children_tas = await this._zvm.zomeProxy.getAllChildren(lti.origin);
      //
      // }
      console.log("toggleTreeItem() any_children_tas", all_children_tas);


      /** Handle branch */
      for (const ta of all_children_tas) {
        const leafComponent = getLeafComponent(ta.anchor);
        /* Skip if item already exists */
        if (currentItemTexts.includes(leafComponent)) {
          continue;
        }
        let newItem = document.createElement("ui5-tree-item") as TreeItem;
        newItem.text = leafComponent;
        newItem.additionalText = "[" + ta.anchor + "]";
        newItem.setAttribute("origin", ta.anchor);
        newItem.setAttribute("zomeIndex", ta.zomeIndex.toString());
        newItem.setAttribute("linkIndex", ta.linkIndex.toString());
        newItem.id = "anchor__" + ta.anchor;
        newItem.hasChildren = true;
        newItem.level = toggledTreeItem.level + 1;
        toggledTreeItem.appendChild(newItem); // add the newly fetched node to the tree
      }


      /** Handle LeafAnchor: Get Items */
      if (all_children_tas.length == 0) {
        let itemHashs = [];
        for (const item of toggledTreeItem.items) {
          itemHashs.push(item.id);
        }

        const maybeOriginAttribute = toggledTreeItem.getAttribute("origin");
        const itemLinks = await this._zvm.zomeProxy.getAllItemsFromAnchor(maybeOriginAttribute? maybeOriginAttribute : "");
        console.log({itemLinks})
        for (const itemLink of itemLinks) {
          const tag = new TextDecoder().decode(new Uint8Array(itemLink.tag));
          const hash = encodeHashToBase64(new Uint8Array(itemLink.itemHash));

          if (itemHashs.includes(hash)) {
            continue;
          }
          var newItem = document.createElement("ui5-tree-item") as TreeItem;
          newItem.text = hash;
          newItem.additionalText = tag // tag ? ZOME_LINK_NAMES[itemLink.linkIndex] + " | " + tag : ZOME_LINK_NAMES[itemLink.linkIndex];
          newItem.setAttribute("origin", hash);
          // /** Set LinkType only if it's the same, in order to determine if we reached leafItems */
          // if (itemLink.zomeIndex.toString() == toggledTreeItem.getAttribute("zomeIndex") && itemLink.linkIndex.toString() == toggledTreeItem.getAttribute("linkIndex")) {
          //   newItem.setAttribute("zomeIndex", itemLink.zomeIndex.toString());
          //   newItem.setAttribute("linkIndex", itemLink.linkIndex.toString());
          // }
          newItem.id = hash;
          newItem.level = toggledTreeItem.level + 1;
          toggledTreeItem.appendChild(newItem); // add the newly fetched node to the tree
        }
      }

      toggledTreeItem.toggle(); // manually switch the toggle button
      busyIndicator.active = false; // unblock the tree

    }

  }


  // cellName(cell: Cell): string {
  //   return `Cell "${cell.name}${this.cloneId? "." + this.cloneId: ""}": ${this.dnaHash}`;
  // }

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
    this.rootTypedAnchor = undefined ;
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
    //const isHash = Base64.isValid(input.value) &&  input.value.substring(0, 3) == "uhC"
    //console.log("onWalk()", input.value, isHash)
    const maybeTypedAnchor = await this._zvm.zomeProxy.getTypedAnchor(input.value);
    console.log("onWalkInput()", maybeTypedAnchor)
    if (maybeTypedAnchor[1]) {
      this.rootTypedAnchor = maybeTypedAnchor[1];
    }
  }

}
