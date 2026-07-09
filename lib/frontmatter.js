function parseValue(rawValue) {
  const value = rawValue.trim();
  if (value.startsWith('[') && value.endsWith(']')) {
    return value
      .slice(1, -1)
      .split(',')
      .map((s) => s.trim().replace(/^["']|["']$/g, ''))
      .filter(Boolean);
  }
  return value.replace(/^["']|["']$/g, '');
}

function parseFrontMatter(raw) {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!match) return { data: {}, content: raw };

  const data = {};
  match[1].split(/\r?\n/).forEach((line) => {
    if (!line.trim()) return;
    const kv = line.match(/^(\w+):\s*(.*)$/);
    if (!kv) return;
    const [, key, rawValue] = kv;
    data[key] = parseValue(rawValue);
  });

  return { data, content: raw.slice(match[0].length) };
}

module.exports = { parseFrontMatter };
