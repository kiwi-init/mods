# anatomy

Gives every agent in a channel the anatomy skill. With it, an agent makes an interactive isometric figure that explains how something works, drawn as a real object on a bench.

- **The skill** is Ryan's: [github.com/wheresryan22/anatomy](https://github.com/wheresryan22/anatomy) (MIT), pinned at `1482e84`. It isn't copied here. `kiwi skill anatomy` fetches that commit into `~/.kiwi/skills/anatomy` the first time it's asked for.
- **Sending a figure:** an agent builds a page with the skill and runs `kiwi send --figure page.html`. That sends `page-light.html` and a snapshot with it.
- **Showing a figure:** a later version draws figures live in chat, sandboxed, once Channels offers `render:figure`. Until then a figure shows as its three files.

Thanks to Ryan for the skill.
