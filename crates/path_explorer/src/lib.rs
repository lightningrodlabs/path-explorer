#![allow(non_upper_case_globals)]
#![allow(unused_doc_comments)]
#![allow(non_camel_case_types)]
#![allow(non_snake_case)]
#![allow(unused_attributes)]

mod fns;
mod typed_anchor;
mod utils;


pub use typed_anchor::*;
pub use conversions::*;
pub use utils::*;

//--------------------------------------------------------------------------------------------------

use hdk::prelude::*;
use zome_utils::*;


#[hdk_extern]
fn get_zome_info(_:()) -> ExternResult<ZomeInfo> {
  return zome_info();
}


#[hdk_extern]
fn get_dna_info(_:()) -> ExternResult<DnaInfo> {
  return dna_info();
}


/// Only gives values for current integrity zome.
/// Hopefully Holo will fix this and give all links types for all zomes in the dna.
pub fn dna_link_types() -> Vec<(ZomeIndex, Vec<LinkType>)> {
  //debug!("dna_link_types() {:?}", dna_info().unwrap().zome_names);
  return zome_info()
    .expect("zome_info() should never fail")
    .zome_types
    .links.0;
}


/// Returns all zome indexes in this DNA
/// Only gives link_types for current integrity zome.
/// Hopefully Holo will fix this and return all integrity zomes in the dna.
pub fn dna_zomes() -> Vec<ZomeIndex> {
  return dna_link_types().into_iter().map(|(zt, _lts)| zt).collect();
}


///
pub fn all_dna_link_types() -> LinkTypeFilter {
  return LinkTypeFilter::Dependencies(dna_zomes());
}


/// Return all children of any link-type
pub fn get_any_children(parent_path: Path, link_tag: Option<LinkTag>) -> ExternResult<Vec<Link>> {
  let mut children = get_links(
    parent_path.path_entry_hash()?,
    all_dna_link_types(),
    link_tag,
  )?;
  /// Only need one of each hash.
  children.sort_unstable_by(|a, b| a.tag.cmp(&b.tag));
  children.dedup_by(|a, b| a.tag.eq(&b.tag));
  Ok(children)
}




/// Calls `get_itemlinks()` and all dna link_types
pub fn get_all_itemlinks(path: Path, link_tag: Option<LinkTag>) -> ExternResult<Vec<ItemLink>> {
  let res = get_itemlinks(path, all_dna_link_types(), link_tag.clone())?;
  Ok(res)
}
