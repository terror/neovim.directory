set dotenv-load

export EDITOR := 'nvim'

alias d := dev
alias f := fmt
alias i := index

default:
  just --list

dev:
  bun run dev

fmt: fmt-indexer fmt-web

fmt-indexer:
  cargo +nightly fmt

fmt-web:
  prettier --write .

index:
  cargo run index --output ./client/public/plugins.json

typeshare:
  typeshare . -l typescript -o client/src/lib/types.ts
