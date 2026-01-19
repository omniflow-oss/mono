#!/bin/sh
if [ -z "$GIT_LFS_ENABLED" ]; then
  command git-lfs "$@"
else
  command git-lfs "$@"
fi
