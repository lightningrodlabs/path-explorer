use hdk::prelude::*;
use path_explorer_types::*;

#[hdk_extern]
pub fn get_leaf_anchors(ta: TypedAnchor) -> ExternResult<Vec<TypedAnchor>> {
  debug!("get_leaf_anchors() {:?}", ta);
  let res = ta.probe_leaf_anchors()?;
  Ok(res)
}
