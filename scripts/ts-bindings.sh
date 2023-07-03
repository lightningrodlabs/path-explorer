#!/bin/bash

zits -i -i -i crates/path_explorer -o webcomponents/src/bindings/path-explorer.ts

zits --default-zome-name zTasker -i playground/zomes/tasker -i playground/zomes/tasker_model -o playground/webapp/src/bindings/tasker.ts
