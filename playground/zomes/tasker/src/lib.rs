#![allow(non_upper_case_globals)]
#![allow(unused_doc_comments)]
#![allow(non_camel_case_types)]
#![allow(non_snake_case)]
#![allow(unused_attributes)]
#![allow(unused_imports)]

mod get;
mod basic_callbacks;

#[macro_use]
extern crate zome_utils;

mod basic_functions;

use hdk::prelude::*;
use zome_utils::call_self_cell;

