function render(str, vars) {
  return str.replace(/\{\{\s*(\w+)\s*\}\}/g, (m, key) => (key in vars ? vars[key] : m));
}

module.exports = { render };
