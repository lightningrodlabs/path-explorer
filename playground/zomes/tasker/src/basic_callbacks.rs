use hdk::prelude::*;
#[allow(unused_imports)]
use tasker_model::*;

use std::collections::BTreeSet;

/// Setup initial capabilities
//#[hdk_extern]
fn init_caps(_: ()) -> ExternResult<()> {
   //let /*mut*/ functions: GrantedFunctions = BTreeSet::new();
   //functions.insert((zome_info()?.name, REMOTE_ENDPOINT.into()));
   create_cap_grant(
      CapGrantEntry {
         tag: "".into(),
         access: ().into(), // empty access converts to unrestricted
         functions: hdk::prelude::GrantedFunctions::Listed(BTreeSet::new()),
         //functions,
      }
   )?;
   Ok(())
}


/// Setup
#[hdk_extern]
fn init(_: ()) -> ExternResult<InitCallbackResult> {
   std::panic::set_hook(Box::new(zome_utils::zome_panic_hook));
   debug!("*** Tasker.init() callback - START");
   let res = init_inner();
   if let Err(e) = res.clone() {
      error!("Tracker.init() FAILED: {:?}", e);
      return res;
   }
   /// Done
   debug!("*** Tasker.init() callback - DONE");
   Ok(InitCallbackResult::Pass)
}


///
fn init_inner() -> ExternResult<InitCallbackResult> {
   init_caps(())?;
   init_anchors(())?;
   Ok(InitCallbackResult::Pass)
}


/// Setup Global Anchors
fn init_anchors(_: ()) -> ExternResult<()> {
   //let typed_path = path.clone().into_typed(ScopedLinkType::try_from(LinkTypes::Tree)?);
   let path1 = Path::from("lists").typed(TaskerLinkType::Path)?;
   let path2 = Path::from("locked").typed(TaskerLinkType::Path)?;
   let path3 = Path::from("completed").typed(TaskerLinkType::Path)?;
   path1.ensure()?;
   path2.ensure()?;
   path3.ensure()?;

   let path4 = Path::from("foo.2:3#barbazii").typed(TaskerLinkType::Path)?;
   path4.ensure()?;

   let external = AnyLinkableHash::from(ExternalHash::from_raw_36(path4.path_entry_hash()?.get_raw_36().to_vec()));

   let _link_ah = create_link(
      path4.path_entry_hash()?,
      external,
      TaskerLinkType::TaskLists,
      LinkTag::from(()),
   )?;

   Ok(())
}


/// Zome Callback
#[hdk_extern(infallible)]
fn post_commit(_signedActionList: Vec<SignedActionHashed>) {
   // n/a
}


// /// Zome Callback
// #[hdk_extern]
// fn validate(_op: Op) -> ExternResult<ValidateCallbackResult> {
//    // fixme
//    Ok(ValidateCallbackResult::Valid)
// }
