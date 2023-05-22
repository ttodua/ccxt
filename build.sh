#!/usr/bin/env bash

if [ "${BASH_VERSION:0:1}" -lt 4 ]; then
  echo "EPROGMISMATCH: bash version must be at least 4" >&2
  exit 75
fi

if [ $# -gt 0 ]; then
  echo "E2BIG: too many arguments" >&2
  exit 7
fi

function run_tests {
  local rest_args=
  local ws_args=
  if [ $# -eq 2 ]; then
    rest_args="$1"
    ws_args="$2"
    if [ -z "$rest_args" ]; then
      : &
      local rest_pid=$!
    fi
    if [ -z "$ws_args" ]; then
      : &
      local ws_pid=$!
    fi
  fi

  if [ -z "$rest_pid" ]; then
    if [[ -z "$rest_args" ]] || { [[ -n "$rest_args" ]] && [[ $rest_args != "skip" ]]; }; then
      # shellcheck disable=SC2086
      node test-commonjs.cjs && node run-tests --js --python-async --php-async $rest_args &
      local rest_pid=$!
    fi
  fi
  if [ -z "$ws_pid" ]; then
    if [[ -z "$ws_args" ]] || { [[ -n "$ws_args" ]] && [[ $ws_args != "skip" ]]; }; then
      # shellcheck disable=SC2086
      node run-tests-ws --js --python-async --php-async $ws_args &
      local ws_pid=$!
    fi
  fi

  if [ -n "$rest_pid" ] && [ -n "$ws_pid" ]; then
    wait $rest_pid && wait $ws_pid
  elif [ -n "$rest_pid" ]; then
    wait $rest_pid
  else
    wait $ws_pid
  fi
}

build_and_test_all () {
  npm run force-build
  npm run test-base
  npm run test-base-ws
  run_tests
  exit
}

echo "zzzzzzz1"
node a.js
echo "zzzzzzz2"
npm run a
ff () {
  search_dir=./
  for entry in "$search_dir"/*
  do
    echo "$entry"
  done
}

 
# faster version of pre-transpile (without bundle and atomic linting)
echo "zz1"
sdasd aaa
npm
npm run

npm run export-exchanges
echo "zz2"
ff