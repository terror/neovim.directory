set dotenv-load

export EDITOR := 'nvim'

alias d := dev
alias f := fmt

default:
  just --list

dev:
  bun run dev

fmt: fmt-indexer fmt-web

fmt-indexer:
  cargo +nightly fmt

fmt-web:
  prettier --write .
