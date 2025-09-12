set dotenv-load

export EDITOR := 'nvim'

alias d := dev
alias f := fmt
alias i := index

default:
  just --list

add-plugin plugin:
  cargo run add {{ plugin }}

dev:
  bun run dev

fmt: fmt-indexer fmt-web

fmt-indexer:
  cargo +nightly fmt

fmt-web:
  prettier --write .

index:
  cargo run index

typeshare:
  typeshare . -l typescript -o client/src/lib/types.ts
