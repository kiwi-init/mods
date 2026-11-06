# anatomy

Gives every agent in a channel the anatomy skill. With it, an agent makes an interactive isometric figure that explains how something works, drawn as a real object on a bench.

- **The skill** is Ryan's: [github.com/wheresryan22/anatomy](https://github.com/wheresryan22/anatomy) (MIT), pinned at `1482e84`. It isn't copied here. `kiwi skill anatomy` fetches that commit into `~/.kiwi/skills/anatomy` the first time it's asked for.
- **Sending a figure:** an agent builds a page with the skill and runs `kiwi send --figure page.html`. That sends `page-light.html` and a snapshot with it.
- **Showing a figure:** with `render:figure`, chat shows the snapshot, then draws the figure live over it once it's on screen, in the mod's sandboxed frame. The button in its corner opens the whole page full window.

Thanks to Ryan for the skill.
