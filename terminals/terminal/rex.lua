local terminal = "com.superlogical.terminal"

local function waiting()
  local found = {}
  local listed = rex.call("session.list", {})
  for _, session in ipairs(type(listed) == "table" and listed.sessions or {}) do
    local id = session.session_id
    local blocks = rex.call("session.list_blocks", { session_id = id })
    for _, block in ipairs(type(blocks) == "table" and blocks.blocks or {}) do
      if block.placement == "placed" then
        local status = rex.block.call(terminal, "program_status", { session_id = id, block_id = block.block_id })
        for _, record in ipairs(type(status) == "table" and status.records or {}) do
          local state = record.state
          if record.app == "kiwi" and (state == "blocked" or state == "done") then
            local at = tostring(record.updated_at or "")
            local held = found[state]
            if held == nil or at < held.at then found[state] = { session_id = id, block_id = block.block_id, at = at } end
          end
        end
      end
    end
  end
  return found.blocked or found.done
end

rex.action{
  name = "kiwi_needs_you",
  title = "Kiwi: Go to the agent that needs you",
  description = "Focus the agent with a question for you, else the one with a task waiting for your review.",
  category = "Kiwi",
  keywords = "kiwi channels needs you agent question review",
  run = function(ctx)
    local row = waiting()
    if row == nil then return { found = false } end
    local _, err = rex.call("session.focus_block", { session_id = row.session_id, block_id = row.block_id })
    if err ~= nil then error(err, 0) end
    if row.session_id ~= ctx.session_id then rex.client.queue("session.select", { session_id = row.session_id }) end
    return { found = true }
  end,
}
