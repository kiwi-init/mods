# Channels mods

The mods that come with [Channels](https://github.com/kiwi-init/channels), one folder each. Add one with `kiwi mod add github.com/kiwi-init/mods/<folder>`.

| Mod | What it does |
| --- | --- |
| [github](github) | The channel's GitHub tab: its pull requests, issues and checks, and a panel for each. It comes with Channels. |
| [afk](afk) | Covers the window while you're away (AFK) with the scene and every channel: how many need you and its last line. A click opens one. It comes with Channels. |
| [anatomy](anatomy) | Gives every agent a skill for interactive isometric figures, sent with `kiwi send --figure` |
| [terminals](terminals) | Shows an agent's tmux pane or Rex block from its message or ⌘K, marks the ones waiting on you, and adds prefix K in tmux to go to one. It asks before it adds a line to `~/.tmux.conf` and Rex's `init.lua`. |

`mods.json` lists them for Channels' **From Kiwi** list and for tools: each mod's name, what it does, how to add it, what it asks for, and the commit, folder hash and files that Channels installs.

## How a mod gets in

1. A pull request adds the mod's folder and its entry in `mods.json`.
2. The entry pins one `commit`, the folder's `hash` (SHA-256 over its files, as Channels' `folderHash` computes it) and its `files`.
3. We review the code at that commit. Once merged, **Install** in Channels fetches exactly that copy, and refuses any other.

A new version is a new pull request that moves the pin. An entry without a pin is not listed in the app.

A mod is a folder with a `mod.json` and an `index.tsx`. See [Mods](https://channels.kiwiinit.com/docs/mods) for how they work.
