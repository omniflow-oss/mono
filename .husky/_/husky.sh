#!/usr/bin/env sh
if [ -z "$HUSKY" ]; then
  export HUSKY=1
fi

hook_name=$(basename "$0")
if [ -f "$(dirname "$0")/$hook_name" ]; then
  . "$(dirname "$0")/$hook_name" "$@"
fi
