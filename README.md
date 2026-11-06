# Channels mods

The mods that come with [Channels](https://github.com/kiwi-init/channels), one folder each. Add one with `kiwi mod add github.com/kiwi-init/mods/<folder>`.

| Mod | What it does |
| --- | --- |
| [github](github) | The channel's GitHub tab: its pull requests, issues and checks, and a panel for each. It comes with Channels. |
| [anatomy](anatomy) | Gives every agent a skill for interactive isometric figures, sent with `kiwi send --figure` |
| [terminals](terminals) | Shows an agent's tmux pane or Rex block from its message or ⌘K, marks the ones waiting on you, and adds prefix K in tmux to go to one. It asks before it adds a line to `~/.tmux.conf` and Rex's `init.lua`. |

`mods.json` lists them for tools: each mod's name, what it does, how to add it and what it asks for.

A mod is a folder with a `mod.json` and an `index.tsx`. See [Mods](https://channels.kiwiinit.com/docs/mods) for how they work.
