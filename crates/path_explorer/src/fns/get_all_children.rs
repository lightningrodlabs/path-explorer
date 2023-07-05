use hdk::prelude::*;
use zome_utils::*;
use path_explorer_types::*;


/// Return all direct children of a TypedAnchor, whatever the link-type
#[hdk_extern]
pub fn get_all_children(ta: TypedAnchor) -> ExternResult<Vec<TypedAnchor>> {
  /// Check for links on all link types
  let links = get_links(
    ta.path_hash(),
    LinkTypeFilter::Dependencies(dna_zomes()), // LinkTypeFilter::single_type(zome_index, link_type)
    None, //Some(self.make_tag()?),
  )?;
  let mut res = Vec::new();
  for link in links {
    let str = compTag2str(&link.tag).unwrap();
    debug!("zome_index = {} | link_type = {} | tag = {}", link.zome_index.0, link.link_type.0, str);
    res.push(TypedAnchor::new(str, /*get_zome_index(&zome_name)*/ link.zome_index.0, link.link_type.0));
  }
  debug!("done | found: {}\n\n", res.len());
  ///
  Ok(res)
}
