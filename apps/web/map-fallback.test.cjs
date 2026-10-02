const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

test('la carte simplifiée affiche les événements sans Leaflet', () => {
  const elements = new Map();
  function element(id) {
    if (!elements.has(id)) elements.set(id, {
      value: '', checked: false, textContent: '', innerHTML: '',
      elements: {date: {}},
      classList: {add() {}, remove() {}, toggle() {}, contains() { return false; }},
      addEventListener() {}, setAttribute() {}, querySelector() { return {addEventListener() {}}; }
    });
    return elements.get(id);
  }
  const storage = new Map();
  const context = {
    document: {getElementById: element, addEventListener() {}},
    localStorage: {getItem: key => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value)},
    console, setTimeout, clearTimeout, Date, FormData
  };
  const script = fs.readFileSync(path.join(__dirname, 'app.js'), 'utf8');
  vm.runInNewContext(script, context);
  assert.match(element('fallbackPins').innerHTML, /Sceaux/);
  assert.match(element('fallbackPins').innerHTML, /Palaiseau/);
  assert.match(element('eventList').innerHTML, /Running 10 km du dimanche/);
  assert.equal(element('resultCount').textContent, '3 résultats');
});
