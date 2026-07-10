
const sections = [...document.querySelectorAll('.page-section')];
const navItems = [...document.querySelectorAll('.nav-item')];
const title = document.getElementById('pageTitle');
const subtitle = document.getElementById('pageSubtitle');
const sidebar = document.getElementById('sidebar');
const menuToggle = document.getElementById('menuToggle');
const themeToggle = document.getElementById('themeToggle');
const globalSearch = document.getElementById('globalSearch');
const articleSearch = document.getElementById('articleSearch');
const articleList = document.getElementById('articleList');
const emptyState = document.getElementById('emptyState');
const articleCounter = document.getElementById('articleCounter');
const favoritesPanel = document.getElementById('favoritesPanel');
const favoritesList = document.getElementById('favoritesList');
const toast = document.getElementById('toast');

const pageMeta = {
  home:["Главная","Портал сотрудников государственных организаций • Washington"],
  government:["Government","Структура USSS и подразделений Washington"],
  immunity:["Неприкосновенность","Особый порядок процессуальных действий"],
  pgo:["Памятка ПГО","Серверные риски и важные предупреждения"],
  frequent:["Частые статьи","Самые используемые статьи для быстрого доступа"],
  criminal:["Уголовный кодекс","Поиск и фильтрация статей"],
  miranda:["Права по Миранде","Готовый текст для зачитывания"],
  scenarios:["Пошаговые сценарии","Игровые алгоритмы действий"],
  phrases:["RP-фразы","Готовые шаблоны для копирования"],
  glossary:["Глоссарий","Термины и сокращения"],
  faq:["FAQ","Частые вопросы сотрудников"],
  tools:["Инструменты","Быстрые функции handbook"],
  about:["О проекте","Информация о текущей версии"]
};

let activeFilter = 'all';
let favorites = new Set(JSON.parse(localStorage.getItem('gov-favorites') || '[]'));

function showSection(id){
  sections.forEach(s => s.classList.toggle('active', s.id === id));
  navItems.forEach(n => n.classList.toggle('active', n.dataset.section === id));
  title.textContent = pageMeta[id][0];
  subtitle.textContent = pageMeta[id][1];
  sidebar.classList.remove('open');
  if(id === 'criminal') renderArticles();
}

navItems.forEach(btn => btn.addEventListener('click', () => showSection(btn.dataset.section)));
document.querySelectorAll('[data-jump]').forEach(btn => btn.addEventListener('click', () => showSection(btn.dataset.jump)));
menuToggle.addEventListener('click', () => sidebar.classList.toggle('open'));

themeToggle.addEventListener('click', () => {
  document.body.classList.toggle('dark');
  themeToggle.textContent = document.body.classList.contains('dark') ? 'Светлая тема' : 'Тёмная тема';
  localStorage.setItem('gov-theme', document.body.classList.contains('dark') ? 'dark' : 'light');
});
if(localStorage.getItem('gov-theme') === 'dark'){
  document.body.classList.add('dark');
  themeToggle.textContent = 'Светлая тема';
}

function getQuery(){
  return (articleSearch?.value || globalSearch?.value || '').trim().toLowerCase();
}

function filteredArticles(){
  const q = getQuery();
  return ARTICLES.filter(a => {
    const hay = `${a.chapter} ${a.chapterTitle} ${a.code} ${a.name} ${a.note} ${a.penalty} ${a.tags.join(' ')}`.toLowerCase();
    const matchesSearch = !q || hay.includes(q);
    const matchesFilter = activeFilter === 'all' || a.category === activeFilter;
    return matchesSearch && matchesFilter;
  });
}

function saveFavorites(){
  localStorage.setItem('gov-favorites', JSON.stringify([...favorites]));
  renderFavorites();
}

function renderFavorites(){
  const favArticles = ARTICLES.filter(a => favorites.has(a.code));
  favoritesPanel.classList.toggle('hidden', favArticles.length === 0);
  favoritesList.innerHTML = favArticles.map(a =>
    `<button class="favorite-chip" data-code="${a.code}">${a.code} — ${a.name}</button>`
  ).join('');
  favoritesList.querySelectorAll('.favorite-chip').forEach(btn => btn.addEventListener('click', () => {
    articleSearch.value = btn.dataset.code;
    renderArticles();
  }));
}

function articleCard(a){
  const isFav = favorites.has(a.code);
  return `
    <article class="article">
      <div class="article-code">${a.code}</div>
      <div>
        <div class="article-name">${a.name}</div>
        ${a.note ? `<div class="article-note">${a.note}</div>` : ''}
        <div class="article-tags">${a.tags.map(t => `<span class="tag">${t}</span>`).join('')}</div>
        <div class="article-actions">
          <button class="favorite-btn ${isFav ? 'active' : ''}" data-fav="${a.code}" title="В избранное">${isFav ? '★' : '☆'}</button>
          <button class="copy-article-btn" data-copy-article="${a.code}" title="Скопировать статью">Копировать</button>
        </div>
      </div>
      <div class="article-stars">${a.stars}</div>
      <div class="article-penalty">${a.penalty}</div>
    </article>`;
}

function renderArticles(){
  const items = filteredArticles();
  const grouped = items.reduce((acc,a)=>{
    const key = `${a.chapter}|${a.chapterTitle}`;
    (acc[key] ||= []).push(a);
    return acc;
  },{});

  articleCounter.textContent = `Найдено: ${items.length}`;

  articleList.innerHTML = Object.entries(grouped).map(([key, list]) => {
    const [chapter, title] = key.split('|');
    return `
      <section class="chapter-block">
        <button class="chapter-toggle">
          <strong>Глава ${chapter} • ${title}</strong>
          <span>${list.length} статей</span>
        </button>
        <div class="chapter-content">${list.map(articleCard).join('')}</div>
      </section>`;
  }).join('');

  emptyState.classList.toggle('hidden', items.length > 0);

  articleList.querySelectorAll('.chapter-toggle').forEach(btn => btn.addEventListener('click', () => {
    btn.closest('.chapter-block').classList.toggle('collapsed');
  }));

  articleList.querySelectorAll('[data-fav]').forEach(btn => btn.addEventListener('click', () => {
    const code = btn.dataset.fav;
    favorites.has(code) ? favorites.delete(code) : favorites.add(code);
    saveFavorites();
    renderArticles();
  }));

  articleList.querySelectorAll('[data-copy-article]').forEach(btn => btn.addEventListener('click', async () => {
    const a = ARTICLES.find(x => x.code === btn.dataset.copyArticle);
    const text = `${a.code} — ${a.name}\n${a.stars}\n${a.penalty}${a.note ? '\n' + a.note : ''}`;
    try{
      await navigator.clipboard.writeText(text);
      showToast('Статья скопирована');
    }catch{
      alert(text);
    }
  }));

  renderFavorites();
}

function showToast(text){
  toast.textContent = text;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 1400);
}

globalSearch.addEventListener('input', () => {
  showSection('criminal');
  if(articleSearch) articleSearch.value = globalSearch.value;
  renderArticles();
});
articleSearch.addEventListener('input', () => {
  globalSearch.value = articleSearch.value;
  renderArticles();
});

document.querySelectorAll('.filter').forEach(btn => btn.addEventListener('click', () => {
  activeFilter = btn.dataset.filter;
  document.querySelectorAll('.filter').forEach(b => b.classList.toggle('active', b === btn));
  renderArticles();
}));

document.querySelectorAll('.copy-btn').forEach(btn => btn.addEventListener('click', async () => {
  const el = document.getElementById(btn.dataset.copyTarget);
  try{
    await navigator.clipboard.writeText(el.innerText.trim());
    showToast('Скопировано');
  }catch{
    alert('Не удалось скопировать текст автоматически.');
  }
}));

renderArticles();
renderFavorites();


// Beta 3 tools
document.addEventListener('keydown', (e) => {
  if(e.key === '/' && !['INPUT','TEXTAREA'].includes(document.activeElement.tagName)){
    e.preventDefault();
    globalSearch.focus();
  }
});

const qualificationInput = document.getElementById('qualificationInput');
const qualificationRun = document.getElementById('qualificationRun');
const exportFavorites = document.getElementById('exportFavorites');
const resetSettings = document.getElementById('resetSettings');

qualificationRun?.addEventListener('click', () => {
  globalSearch.value = qualificationInput.value;
  articleSearch.value = qualificationInput.value;
  showSection('criminal');
  renderArticles();
});

exportFavorites?.addEventListener('click', async () => {
  const favArticles = ARTICLES.filter(a => favorites.has(a.code));
  if(!favArticles.length){
    showToast('Избранное пусто');
    return;
  }
  const text = favArticles.map(a => `${a.code} — ${a.name} — ${a.penalty}`).join('\n');
  try{
    await navigator.clipboard.writeText(text);
    showToast('Избранное скопировано');
  }catch{
    alert(text);
  }
});

resetSettings?.addEventListener('click', () => {
  favorites.clear();
  localStorage.removeItem('gov-favorites');
  localStorage.setItem('gov-theme','light');
  document.body.classList.remove('dark');
  themeToggle.textContent = 'Тёмная тема';
  renderFavorites();
  renderArticles();
  showToast('Настройки сброшены');
});


// RC1 page metadata
pageMeta.mistakes = ["Типичные ошибки","Частые ошибки квалификации и процедуры"];
pageMeta.changes = ["История изменений","Версии GOV Handbook"];

// Helpers for highlighting and recent history
let recent = JSON.parse(localStorage.getItem('gov-recent') || '[]');

function escapeRegex(text){
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function highlightText(text, query){
  if(!query) return text;
  try{
    const re = new RegExp(`(${escapeRegex(query)})`, 'ig');
    return text.replace(re, '<mark class="highlight">$1</mark>');
  }catch{
    return text;
  }
}

function addRecent(code){
  recent = [code, ...recent.filter(x => x !== code)].slice(0,6);
  localStorage.setItem('gov-recent', JSON.stringify(recent));
  renderRecent();
}

function renderRecent(){
  const box = document.getElementById('recentArticles');
  if(!box) return;
  if(!recent.length){
    box.innerHTML = '<span class="section-note">Пока ничего не открывали.</span>';
    return;
  }
  box.innerHTML = recent.map(code => {
    const a = ARTICLES.find(x => x.code === code);
    return a ? `<button class="recent-item" data-recent="${a.code}">${a.code}</button>` : '';
  }).join('');
  box.querySelectorAll('[data-recent]').forEach(btn => btn.addEventListener('click', () => openArticle(btn.dataset.recent)));
}

function openArticle(code){
  showSection('criminal');
  articleSearch.value = code;
  globalSearch.value = code;
  renderArticles();
  addRecent(code);
  setTimeout(() => {
    const el = [...document.querySelectorAll('.article')].find(x => x.dataset.code === code);
    if(el){
      el.classList.add('focused');
      el.scrollIntoView({behavior:'smooth',block:'center'});
      setTimeout(()=>el.classList.remove('focused'),1500);
    }
  },50);
}

const quickJumpInput = document.getElementById('quickJumpInput');
const quickJumpButton = document.getElementById('quickJumpButton');
quickJumpButton?.addEventListener('click', () => {
  const code = quickJumpInput.value.trim();
  const found = ARTICLES.find(a => a.code.toLowerCase() === code.toLowerCase());
  if(found) openArticle(found.code);
  else showToast('Статья не найдена');
});
quickJumpInput?.addEventListener('keydown', e => {
  if(e.key === 'Enter') quickJumpButton.click();
});

// Override article card with highlights and data-code
const originalArticleCard = articleCard;
articleCard = function(a){
  const q = getQuery();
  const isFav = favorites.has(a.code);
  return `
    <article class="article" data-code="${a.code}">
      <div class="article-code">${highlightText(a.code,q)}</div>
      <div>
        <div class="article-name">${highlightText(a.name,q)}</div>
        ${a.note ? `<div class="article-note">${highlightText(a.note,q)}</div>` : ''}
        <div class="article-tags">${a.tags.map(t => `<span class="tag">${highlightText(t,q)}</span>`).join('')}</div>
        <div class="article-actions">
          <button class="favorite-btn ${isFav ? 'active' : ''}" data-fav="${a.code}" title="В избранное">${isFav ? '★' : '☆'}</button>
          <button class="copy-article-btn" data-copy-article="${a.code}" title="Скопировать статью">Копировать</button>
          <button class="copy-article-btn" data-open-article="${a.code}" title="Открыть статью">Открыть</button>
        </div>
      </div>
      <div class="article-stars">${a.stars}</div>
      <div class="article-penalty">${highlightText(a.penalty,q)}</div>
    </article>`;
};

// Extend rendering with open buttons
const originalRenderArticles = renderArticles;
renderArticles = function(){
  const items = filteredArticles();
  const grouped = items.reduce((acc,a)=>{
    const key = `${a.chapter}|${a.chapterTitle}`;
    (acc[key] ||= []).push(a);
    return acc;
  },{});

  articleCounter.textContent = `Найдено: ${items.length}`;

  articleList.innerHTML = Object.entries(grouped).map(([key, list]) => {
    const [chapter, title] = key.split('|');
    return `
      <section class="chapter-block">
        <button class="chapter-toggle">
          <strong>Глава ${chapter} • ${title}</strong>
          <span>${list.length} статей</span>
        </button>
        <div class="chapter-content">${list.map(articleCard).join('')}</div>
      </section>`;
  }).join('');

  emptyState.classList.toggle('hidden', items.length > 0);

  articleList.querySelectorAll('.chapter-toggle').forEach(btn => btn.addEventListener('click', () => {
    btn.closest('.chapter-block').classList.toggle('collapsed');
  }));

  articleList.querySelectorAll('[data-fav]').forEach(btn => btn.addEventListener('click', () => {
    const code = btn.dataset.fav;
    favorites.has(code) ? favorites.delete(code) : favorites.add(code);
    saveFavorites();
    renderArticles();
  }));

  articleList.querySelectorAll('[data-copy-article]').forEach(btn => btn.addEventListener('click', async () => {
    const a = ARTICLES.find(x => x.code === btn.dataset.copyArticle);
    const text = `${a.code} — ${a.name}\n${a.stars}\n${a.penalty}${a.note ? '\n' + a.note : ''}`;
    try{
      await navigator.clipboard.writeText(text);
      showToast('Статья скопирована');
    }catch{
      alert(text);
    }
  }));

  articleList.querySelectorAll('[data-open-article]').forEach(btn => btn.addEventListener('click', () => {
    addRecent(btn.dataset.openArticle);
    const el = btn.closest('.article');
    el.classList.add('focused');
    setTimeout(()=>el.classList.remove('focused'),1500);
  }));

  renderFavorites();
};

renderRecent();
renderArticles();


// RC2 frequent articles
const DEFAULT_FREQUENT_CODES = ["17.6","17.9","17.10","12.8 Ч1","10.5","13.3","6.2 Ч1","7.1","15.1","16.11"];
let frequentCodes = JSON.parse(localStorage.getItem('gov-frequent') || 'null') || [...DEFAULT_FREQUENT_CODES];

function renderFrequent(){
  const container = document.getElementById('frequentArticles');
  if(!container) return;
  const list = frequentCodes
    .map(code => ARTICLES.find(a => a.code === code))
    .filter(Boolean);

  container.innerHTML = list.map(a => `
    <article class="frequent-card">
      <div class="frequent-code">${a.code}</div>
      <div>
        <div class="frequent-name">${a.name}</div>
        <div class="frequent-meta">
          <span>${a.stars}</span>
          <span>${a.penalty}</span>
        </div>
        ${a.note ? `<div class="article-note">${a.note}</div>` : ''}
        <div class="frequent-actions">
          <button class="primary-action" data-frequent-open="${a.code}">Открыть</button>
          <button data-frequent-copy="${a.code}">Копировать</button>
        </div>
      </div>
    </article>
  `).join('');

  container.querySelectorAll('[data-frequent-open]').forEach(btn => {
    btn.addEventListener('click', () => openArticle(btn.dataset.frequentOpen));
  });

  container.querySelectorAll('[data-frequent-copy]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const a = ARTICLES.find(x => x.code === btn.dataset.frequentCopy);
      const text = `${a.code} — ${a.name}\n${a.stars}\n${a.penalty}${a.note ? '\n' + a.note : ''}`;
      try{
        await navigator.clipboard.writeText(text);
        showToast('Статья скопирована');
      }catch{
        alert(text);
      }
    });
  });
}

renderFrequent();


// RC3 dashboard widgets
function renderHomeWidgets(){
  const favBox = document.getElementById('homeFavorites');
  const recentBox = document.getElementById('homeRecent');

  if(favBox){
    const favArticles = ARTICLES.filter(a => favorites.has(a.code));
    favBox.innerHTML = favArticles.length
      ? favArticles.slice(0,8).map(a => `<button class="home-favorite-chip" data-home-code="${a.code}">${a.code}</button>`).join('')
      : '<span class="section-note">Добавьте статьи в избранное.</span>';
  }

  if(recentBox){
    const recentArticles = recent.map(code => ARTICLES.find(a => a.code === code)).filter(Boolean);
    recentBox.innerHTML = recentArticles.length
      ? recentArticles.map(a => `<button class="home-favorite-chip" data-home-code="${a.code}">${a.code}</button>`).join('')
      : '<span class="section-note">Пока ничего не открывали.</span>';
  }

  document.querySelectorAll('[data-home-code]').forEach(btn => {
    btn.addEventListener('click', () => openArticle(btn.dataset.homeCode));
  });
}

const oldSaveFavorites = saveFavorites;
saveFavorites = function(){
  oldSaveFavorites();
  renderHomeWidgets();
};

const oldAddRecent = addRecent;
addRecent = function(code){
  oldAddRecent(code);
  renderHomeWidgets();
};

renderHomeWidgets();


// RC4 notes, related articles, customizable frequent
let articleNotes = JSON.parse(localStorage.getItem('gov-article-notes') || '{}');
let noteArticleCode = null;

function saveFrequent(){
  localStorage.setItem('gov-frequent', JSON.stringify(frequentCodes));
  renderFrequent();
}

function toggleFrequent(code){
  if(frequentCodes.includes(code)){
    frequentCodes = frequentCodes.filter(x => x !== code);
    showToast('Удалено из частых');
  }else{
    frequentCodes = [code, ...frequentCodes].slice(0,16);
    showToast('Добавлено в частые');
  }
  saveFrequent();
  renderArticles();
}

document.getElementById('resetFrequent')?.addEventListener('click', () => {
  frequentCodes = [...DEFAULT_FREQUENT_CODES];
  saveFrequent();
  renderArticles();
  showToast('Частые статьи сброшены');
});

function relatedArticles(article){
  return ARTICLES
    .filter(a => a.code !== article.code)
    .map(a => {
      let score = 0;
      if(a.chapter === article.chapter) score += 3;
      if(a.category === article.category) score += 2;
      if(a.tags.some(t => article.tags.includes(t))) score += 1;
      return {a,score};
    })
    .filter(x => x.score > 0)
    .sort((x,y) => y.score - x.score)
    .slice(0,3)
    .map(x => x.a);
}

const noteModal = document.getElementById('noteModal');
const noteModalTitle = document.getElementById('noteModalTitle');
const noteText = document.getElementById('noteText');

function openNoteModal(code){
  noteArticleCode = code;
  const article = ARTICLES.find(a => a.code === code);
  noteModalTitle.textContent = `${article.code} — ${article.name}`;
  noteText.value = articleNotes[code] || '';
  noteModal.classList.remove('hidden');
  setTimeout(() => noteText.focus(), 50);
}

function closeNoteModal(){
  noteModal.classList.add('hidden');
  noteArticleCode = null;
}

document.querySelectorAll('[data-close-note]').forEach(el => el.addEventListener('click', closeNoteModal));

document.getElementById('saveNote')?.addEventListener('click', () => {
  const value = noteText.value.trim();
  if(value) articleNotes[noteArticleCode] = value;
  else delete articleNotes[noteArticleCode];
  localStorage.setItem('gov-article-notes', JSON.stringify(articleNotes));
  closeNoteModal();
  renderArticles();
  showToast('Заметка сохранена');
});

document.getElementById('deleteNote')?.addEventListener('click', () => {
  delete articleNotes[noteArticleCode];
  localStorage.setItem('gov-article-notes', JSON.stringify(articleNotes));
  closeNoteModal();
  renderArticles();
  showToast('Заметка удалена');
});

// Override article card for RC4 controls
articleCard = function(a){
  const q = getQuery();
  const isFav = favorites.has(a.code);
  const isFrequent = frequentCodes.includes(a.code);
  const related = relatedArticles(a);
  const note = articleNotes[a.code];
  return `
    <article class="article" data-code="${a.code}">
      <div class="article-code">${highlightText(a.code,q)}</div>
      <div>
        <div class="article-name">${highlightText(a.name,q)}</div>
        ${a.note ? `<div class="article-note">${highlightText(a.note,q)}</div>` : ''}
        <div class="article-tags">${a.tags.map(t => `<span class="tag">${highlightText(t,q)}</span>`).join('')}</div>
        ${note ? `<div class="article-note-indicator">Есть личная заметка</div>` : ''}
        <div class="related-list">
          ${related.map(r => `<button class="related-chip" data-related="${r.code}">${r.code}</button>`).join('')}
        </div>
        <div class="article-actions">
          <button class="favorite-btn ${isFav ? 'active' : ''}" data-fav="${a.code}" title="В избранное">${isFav ? '★' : '☆'}</button>
          <button class="copy-article-btn" data-frequent="${a.code}">${isFrequent ? 'Убрать из частых' : 'В частые'}</button>
          <button class="copy-article-btn" data-note="${a.code}">Заметка</button>
          <button class="copy-article-btn" data-copy-article="${a.code}">Копировать</button>
          <button class="copy-article-btn" data-open-article="${a.code}">Открыть</button>
        </div>
      </div>
      <div class="article-stars">${a.stars}</div>
      <div class="article-penalty">${highlightText(a.penalty,q)}</div>
    </article>`;
};

// Wrap existing renderArticles to attach RC4 handlers after rendering
const rc3RenderArticles = renderArticles;
renderArticles = function(){
  rc3RenderArticles();

  articleList.querySelectorAll('[data-frequent]').forEach(btn => {
    btn.addEventListener('click', () => toggleFrequent(btn.dataset.frequent));
  });

  articleList.querySelectorAll('[data-note]').forEach(btn => {
    btn.addEventListener('click', () => openNoteModal(btn.dataset.note));
  });

  articleList.querySelectorAll('[data-related]').forEach(btn => {
    btn.addEventListener('click', () => openArticle(btn.dataset.related));
  });
};

renderArticles();
renderFrequent();


// Final integrity check
window.addEventListener('DOMContentLoaded', () => {
  const required = ['home','government','frequent','criminal','miranda','scenarios','phrases','tools','glossary','faq','mistakes','changes','sources','about'];
  const missing = required.filter(id => !document.getElementById(id));
  if(missing.length){
    console.warn('GOV Handbook: отсутствуют разделы', missing);
  }
});


document.querySelectorAll('[data-pgo-code]').forEach(btn => {
  btn.addEventListener('click', () => openArticle(btn.dataset.pgoCode));
});
