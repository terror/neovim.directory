## neovim.directory

[![CI](https://github.com/terror/neovim.directory/actions/workflows/ci.yaml/badge.svg)](https://github.com/terror/neovim.directory/actions/workflows/ci.yaml)

**neovim.directory** is yet another index for the [Neovim](https://neovim.io/)
plugin ecosystem.

<img width="1341" height="1171" alt="Screenshot 2025-09-01 at 2 31 30 PM" src="https://github.com/user-attachments/assets/beddf389-f8be-46c1-a5c6-7cf1a8c320ac" />

Plugin data is primarily sourced from the
[awesome-neovim](https://github.com/rockerBOO/awesome-neovim) repository,
however we provide tools for adding plugins not present in that repository.

To re-run the index, simply execute the following:

```bash
cargo run index
```

To add a custom plugin, you can:

```bash
cargo run add <plugin>
```

Where `<plugin>` is a string of the form `username/repository_name`, where
`username` is the GitHub username of the owner of the GitHub repository with
name `repository_name`. For instance, `folke/lazy.nvim` is a valid value here.

**n.b.** These commands require you to have a GitHub access token set in the
environment. Refer to `.env.example` for how you should set this token.

## Prior Art

This project was inspired by tools like [store.nvim](https://nvim.store/).
