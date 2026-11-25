const main = document.querySelector('#main');
const nav = [...document.querySelectorAll('nav button')];
const storage = { favorites: 'qwFav', personal: 'qwPersonal', seed: 'qwSeed' };
let library = [];
let builtIn = [];
let favorites = readList(storage.favorites);
let bible = null;
let tab = 'topic';
let query = '';
let ready = false;
let returnScroll = 0;

function readList(key) {
  try {
    const value = JSON.parse(localStorage.getItem(key));
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

function writeList(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

function add(tag, text, className, parent = main) {
  const node = document.createElement(tag);
  if (text) node.textContent = text;
  if (className) node.className = className;
  parent.append(node);
  return node;
}

function button(text, action, className, parent = main) {
  const node = add('button', text, className, parent);
  node.type = 'button';
  node.onclick = action;
  return node;
}

function link(text, url, parent = main) {
  if (typeof url !== 'string' || !/^https:\/\//i.test(url)) return;
  if (/(?:^|\.)esv\.org$/i.test(new URL(url).hostname)) return;
  const node = add('a', text, '', parent);
  node.href = url;
  node.target = '_blank';
  node.rel = 'noopener noreferrer';
}

async function readFile(name) {
  const response = await fetch('./' + name);
  if (!response.ok) throw new Error(name);
  return response.json();
}

async function load() {
  const [seed, scripture] = await Promise.allSettled([readFile('seed.json'), readFile('bsb.json')]);
  const entries = seed.status === 'fulfilled' ? seed.value : readList(storage.seed);
  if (seed.status === 'fulfilled') writeList(storage.seed, entries);
  if (scripture.status === 'fulfilled') bible = scripture.value;
  builtIn = entries;
  refreshLibrary();
  ready = true;
  render();
}

function refreshLibrary() {
  library = [...builtIn, ...readList(storage.personal)].filter(entry => entry && typeof entry.title === 'string');
}

function normalized(text) {
  return text.toLowerCase().replace(/[–—−]/g, '-').replace(/[’‘]/g, "'");
}

function lookup(reference) {
  if (!bible) return null;
  const match = /^(.+?)\s*(\d+)(?:\s*:\s*(\d+)(?:\s*-\s*(?:(\d+)\s*:\s*)?(\d+))?)?$/.exec(
    normalized(reference.trim()).replace(/\./g, '')
  );
  if (!match) return null;
  const [, book, firstChapter, startVerse, lastChapter, lastVerse] = match;
  const bookKey = text => normalized(text).replace(/\s+/g, '');
  const aliases = { ps: 'psalms', prov: 'proverbs', mt: 'matthew', mk: 'mark', lk: 'luke', jn: 'john', rom: 'romans', rev: 'revelation' };
  const key = aliases[bookKey(book)] || bookKey(book);
  const names = Object.entries(bible.books);
  const exact = names.find(([name, code]) => [bookKey(name), bookKey(code)].includes(key));
  const prefixes = names.filter(([name]) => key.length >= 2 && bookKey(name).startsWith(key));
  const code = exact?.[1] || (prefixes.length === 1 ? prefixes[0][1] : null);
  const chapters = bible.verses[code];
  const start = Number(firstChapter);
  const end = Number(lastChapter || firstChapter);
  const first = Number(startVerse || 1);
  const last = lastVerse ? Number(lastVerse) : startVerse ? first : Infinity;
  if (!chapters?.[start] || !chapters[end] || !first || start > end || (start === end && first > last)) return null;
  if ((startVerse && !chapters[start][first]) ||
      (lastVerse && !chapters[end][last])) return null;
  const result = [];
  for (let chapter = start; chapter <= end; chapter++) {
    for (const [number, text] of Object.entries(chapters[chapter])) {
      if ((chapter === start && Number(number) < first) || (chapter === end && Number(number) > last)) continue;
      result.push({ number: start === end ? number : chapter + ':' + number, text });
    }
  }
  return result.length ? result : null;
}

function render() {
  main.replaceChildren();
  for (const control of nav) {
    const selected = control.dataset.tab === tab;
    control.classList.toggle('active', selected);
    control.setAttribute('aria-pressed', String(selected));
  }
  add('h1', { topic: 'What does the Bible say about...', passage: 'What does this passage really mean?', saved: 'Your saved references' }[tab]);
  if (!ready) {
    add('p', 'Loading Quick Word…', 'muted');
    return;
  }
  const input = add('input');
  input.placeholder = 'Search topics or Scripture';
  input.type = 'search';
  input.setAttribute('aria-label', input.placeholder);
  input.value = query;
  const lookupRow = add('div', '', 'lookup');
  const grid = add('div', '', 'grid');

  function tiles() {
    lookupRow.replaceChildren();
    grid.replaceChildren();
    const normalizedQuery = normalized(query.trim());
    const verses = lookup(query);
    if (verses) button('Read ' + query.trim() + ' · BSB', () => {
      returnScroll = window.scrollY;
      showDetail();
      add('h1', query.trim());
      scriptureCard({ ref: query.trim() }, verses);
    }, '', lookupRow);

    library.filter(entry => (tab === 'saved' ? favorites.includes(entry.id) : entry.kind === tab) &&
      normalized(JSON.stringify(entry)).includes(normalizedQuery))
      .sort((a, b) => a.title.localeCompare(b.title, undefined, { numeric: true }))
      .forEach(entry => {
        const tile = button('', () => {
          returnScroll = window.scrollY;
          detail(entry);
        }, 'tile', grid);
        add('span', '✦', '', tile).setAttribute('aria-hidden', 'true');
        tile.append(document.createTextNode(entry.title));
      });
    if (!grid.children.length) add('p', tab === 'saved' && !normalizedQuery ? 'No favorites yet.' : 'No matching entries.', 'muted', grid);
  }

  input.oninput = () => {
    query = input.value;
    tiles();
  };
  tiles();
  if (tab !== 'saved') button(tab === 'topic' ? '+ Add a New Topic' : '+ Add a Passage', generate, 'primary');
  add('small', 'Scripture quotations from the Berean Standard Bible (BSB), public domain.');
}

function showDetail() {
  main.replaceChildren();
  button('← Back', () => {
    render();
    window.scrollTo(0, returnScroll);
  });
  window.scrollTo(0, 0);
}

function scriptureCard(verse, text = lookup(verse.ref)) {
  const article = add('article');
  add('strong', verse.ref + (text ? ' · BSB' : ''), '', article);
  if (text) {
    for (const line of text) {
      const p = add('p', '', 'verse', article);
      add('sup', line.number, '', p);
      p.append(document.createTextNode(' ' + line.text));
    }
  } else {
    add('p', bible ? 'Enter a specific Bible reference to read the BSB text.' : 'BSB text is unavailable on this visit.', 'muted', article);
  }
  if (verse.note) add('p', verse.note, 'muted', article);
}

function detail(entry, preview = false, resetScroll = true) {
  const scroll = window.scrollY;
  showDetail();
  add('h1', entry.title);
  if (entry.draft) add('small', 'Personal entry · verify sources before relying on them');
  if (entry.summary) add('article', entry.summary);
  add('h2', 'Key Scripture');
  for (const verse of entry.verses || []) {
    if (verse && typeof verse.ref === 'string') scriptureCard(verse);
  }
  if (entry.context) {
    add('h2', 'Biblical context');
    add('article', entry.context);
  }
  if (entry.distinction) {
    add('h2', entry.draft ? 'Important distinctions' : 'Conclusion');
    add('article', entry.distinction);
  }
  if (Array.isArray(entry.insights) && entry.insights.length) {
    add('h2', 'Theological insight');
    for (const insight of entry.insights.filter(Boolean)) {
      const article = add('article');
      add('strong', insight.author, '', article);
      if (insight.quote) add('blockquote', '“' + insight.quote + '”', '', article);
      if (insight.note) add('p', insight.note, '', article);
      if (insight.source) add('small', insight.source, '', article);
      try { link('Read source ↗', insight.url, article); } catch { /* Ignore malformed legacy URLs. */ }
    }
  }

  if (preview) {
    button('Save to my library', () => {
      const personal = [...readList(storage.personal), entry];
      if (!writeList(storage.personal, personal)) {
        status.textContent = 'This browser could not save the entry.';
        return;
      }
      library.push(entry);
      detail(entry, false, false);
    }, 'primary');
  } else {
    button(favorites.includes(entry.id) ? 'Remove from favorites' : 'Save to favorites', () => {
      const current = readList(storage.favorites);
      const next = current.includes(entry.id) ? current.filter(id => id !== entry.id) : [...current, entry.id];
      if (!writeList(storage.favorites, next)) {
        status.textContent = 'This browser could not save favorites.';
        return;
      }
      favorites = next;
      detail(entry, false, false);
    }, 'primary');
  }
  const status = add('p', '', 'error');
  status.setAttribute('role', 'status');
  if (!resetScroll) window.scrollTo(0, scroll);
}

function generate() {
  returnScroll = window.scrollY;
  showDetail();
  const kind = tab;
  add('h1', kind === 'topic' ? 'Add a new topic' : 'Add a passage');
  const title = add('input');
  title.placeholder = kind === 'topic' ? 'e.g. Gambling' : 'e.g. Hebrews 6:4–6';
  title.setAttribute('aria-label', kind === 'topic' ? 'Topic to research' : 'Passage to research');
  add('p', 'Copy the research prompt, open ChatGPT, then paste its JSON response below.');
  const promptStatus = add('p', '', 'muted');
  promptStatus.setAttribute('role', 'status');
  button('Copy research prompt', async () => {
    if (!title.value.trim()) {
      promptStatus.textContent = 'Enter a topic or passage first.';
      title.focus();
      return;
    }
    const prompt = `Research this Bible ${kind}: ${title.value.trim()}. Use a Reformed Protestant perspective and acknowledge major interpretive disagreements. Include the biblical context and conclusion. Supply 1–3 authentic quotations checked against direct online sources. Omit any unverified quotation. Use standard Scripture references in English with verse ranges. Quick Word displays BSB text locally. Return a single JSON object with title, summary, verses (objects with ref and note), context, insights (objects with author, quote, source, url), and distinction.`;
    try {
      await navigator.clipboard.writeText(prompt);
      promptStatus.textContent = 'Prompt copied.';
    } catch {
      const copy = add('textarea', '', '', promptStatus);
      copy.value = prompt;
      copy.setAttribute('aria-label', 'Research prompt');
      copy.select();
    }
  }, 'primary');
  link('Open ChatGPT ↗', 'https://chatgpt.com/');
  const input = add('textarea');
  input.placeholder = 'Paste the JSON response here';
  input.setAttribute('aria-label', 'Custom entry JSON');
  input.rows = 10;
  button('Preview entry', () => {
    try {
      const entry = JSON.parse(input.value.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, ''));
      if (!entry || typeof entry.title !== 'string' || !entry.title.trim() || typeof entry.summary !== 'string' ||
          !Array.isArray(entry.verses) || !entry.verses.length ||
          !entry.verses.every(verse => verse && typeof verse.ref === 'string' && typeof verse.note === 'string') ||
          (entry.insights && !Array.isArray(entry.insights))) throw new Error('Invalid entry');
      detail({ ...entry, id: crypto.randomUUID(), kind, draft: true }, true);
    } catch {
      status.textContent = 'Could not read the entry. Paste a complete JSON object in the requested format.';
    }
  }, 'primary');
  const status = add('p', '', 'error');
  status.setAttribute('role', 'status');
}

for (const control of nav) {
  control.onclick = () => {
    tab = control.dataset.tab;
    query = '';
    window.scrollTo(0, 0);
    render();
  };
}

window.addEventListener('storage', event => {
  if (event.key !== storage.favorites && event.key !== storage.personal) return;
  favorites = readList(storage.favorites);
  refreshLibrary();
  if (document.querySelector('.grid')) render();
});

render();
load();
if ('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js').catch(console.error);
