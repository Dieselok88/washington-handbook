
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
  fieldguide:["Шпаргалка","Процедуры и ключевые действия на одном экране"],
  situations:["Что делать?","Быстрые решения по типовым RP-ситуациям"],
  government:["Government","Все структуры и подразделения в одном разделе"],
  academy:["Обучение по ролям","Пошаговые инструкции для новичков Government"],
  "usms-notices":["Шаблоны USMS","Готовые служебные уведомления с копированием"],
  workflows:["Алгоритмы действий","Пошаговые процедуры для работы"],
  hierarchy:["Иерархия","Должности и уровни Government"],
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


function normalizeSearchText(value=''){
  return value.toLowerCase()
    .replace(/ё/g,'е')
    .replace(/(\d+)\s*[.,]\s*(\d+)/g,'$1.$2')
    .replace(/[^\p{L}\p{N}.]+/gu,' ')
    .trim();
}

const SEARCH_SYNONYMS = {
  'арест':'задержание наручники кпз',
  'задержать':'задержание арест',
  'коп':'сотрудник правоохранительный',
  'маршал':'usms суд конвой',
  'суд':'судебное заседание зал капитолий',
  'шум':'нарушение порядка крик хулиганство',
  'орет':'крик шум нарушение порядка',
  'мат':'нецензурная брань 5.3',
  'оскорбляет':'оскорбление 5.12 6.6',
  'обыск машины':'обыск автомобиля досмотр транспорта',
  'машина':'автомобиль транспорт',
  'пистолет':'оружие',
  'ствол':'оружие',
  'убежал':'побег 17.10',
  'не слушается':'неповиновение 17.6',
  'мешает':'помеха нарушение порядка 17.9',
  'закрытая зона':'служебная зона контроль доступа',
  'бомба':'взрыв эвакуация',
  'адвокат':'защитник lawyer',
  'прокурор':'прокуратура doj'
};

function expandSearchQuery(value){
  const q=normalizeSearchText(value);
  const extras=[];
  Object.entries(SEARCH_SYNONYMS).forEach(([key, synonyms])=>{
    if(q.includes(normalizeSearchText(key))) extras.push(synonyms);
  });
  return normalizeSearchText(`${q} ${extras.join(' ')}`);
}

function searchTokens(value){
  return [...new Set(expandSearchQuery(value).split(/\s+/).filter(Boolean))];
}

function levenshtein(a,b){
  if(Math.abs(a.length-b.length)>2) return 99;
  const row=Array.from({length:b.length+1},(_,i)=>i);
  for(let i=1;i<=a.length;i++){
    let prev=row[0]; row[0]=i;
    for(let j=1;j<=b.length;j++){
      const old=row[j];
      row[j]=Math.min(row[j]+1,row[j-1]+1,prev+(a[i-1]===b[j-1]?0:1));
      prev=old;
    }
  }
  return row[b.length];
}

function smartScore(query, text, boost=''){
  const raw=normalizeSearchText(query);
  if(!raw) return 0;
  const hay=normalizeSearchText(`${boost} ${text}`);
  const tokens=searchTokens(query);
  const words=hay.split(/\s+/);
  let score=hay.includes(raw)?120:0;
  for(const token of tokens){
    if(hay.includes(token)) score+=token.length>2?18:6;
    else if(token.length>=5 && words.some(word=>Math.abs(word.length-token.length)<=1 && levenshtein(token,word)<=1)) score+=8;
  }
  return score;
}

function getSituationKnowledge(){
  return [...document.querySelectorAll('.situation-card')].map((card,index)=>({
    title:card.querySelector('h4')?.textContent.trim() || `Ситуация ${index+1}`,
    type:'Ситуация',
    section:'situations',
    target:card.id || '',
    terms:`${card.dataset.situationTags||''} ${card.innerText}`
  }));
}

const KNOWLEDGE_INDEX = [
  {title:'Шпаргалка: задержание', type:'Процедура', section:'fieldguide', target:'guide-detention', terms:'задержание наручники миранда обыск'},
  {title:'Шпаргалка: обыск', type:'Процедура', section:'fieldguide', target:'guide-search', terms:'обыск изъятие помещение'},
  {title:'Шпаргалка: адвокат', type:'Процедура', section:'fieldguide', target:'guide-lawyer', terms:'адвокат защита право'},
  {title:'Шпаргалка: прокурор', type:'Процедура', section:'fieldguide', target:'guide-prosecutor', terms:'прокурор прокуратура doj'},
  {title:'Шпаргалка: ордер', type:'Процедура', section:'fieldguide', target:'guide-order', terms:'ордер проникновение помещение'},
  {title:'Шпаргалка: применение силы', type:'Процедура', section:'fieldguide', target:'guide-force', terms:'сила спецсредства оружие'},
  {title:'USMS: полномочия и секретность', type:'Government', section:'government', role:'usms', terms:'usms маршал маска гостайна удостоверение'},
  {title:'Прокурор: рабочий набор', type:'Роль', section:'government', role:'prosecutor', terms:'прокурор attorney doj постановление'},
  {title:'Адвокат: рабочий набор', type:'Роль', section:'government', role:'lawyer', terms:'адвокат lawyer защита'},
  {title:'Судья: рабочий набор', type:'Роль', section:'government', role:'judge', terms:'судья judge court ордер'},
  {title:'Неприкосновенность', type:'Особый статус', section:'government', role:'immunity', terms:'неприкосновенность губернатор судья статус'},
  {title:'Что делать: побег', type:'Ситуация', section:'situations', terms:'побег убегает преследование'},
  {title:'Что делать: раскрытие USMS', type:'Ситуация', section:'situations', terms:'разглашение личность маршал гостайна'},
  {title:'Что делать: федеральный розыск', type:'Ситуация', section:'situations', terms:'федеральный розыск usms'},
  {title:'Что делать: охрана суда', type:'Ситуация', section:'situations', target:'situation-court-security', terms:'суд охрана порядок заседание usms'},
  {title:'Что делать: нарушение порядка в суде', type:'Ситуация', section:'situations', target:'situation-court-disorder', terms:'шум крик мат оскорбление судьи перебивает'},
  {title:'Что делать: оружие в суде', type:'Ситуация', section:'situations', target:'situation-court-weapon', terms:'оружие пистолет запрещенный предмет угроза'},
  {title:'Что делать: задержание в суде', type:'Ситуация', section:'situations', target:'situation-court-detention', terms:'арест задержание конвой зал суда'},
  {title:'Что делать: эвакуация суда', type:'Ситуация', section:'situations', target:'situation-court-evacuation', terms:'пожар взрыв бомба нападение тревога'}
];

const searchWrap = globalSearch.closest('.search-wrap');
const knowledgeResults = document.createElement('div');
knowledgeResults.className = 'search-results-box';
searchWrap.appendChild(knowledgeResults);

function openKnowledgeResult(item){
  showSection(item.section);
  if(item.target){
    const el = document.getElementById(item.target);
    if(el){
      el.open = true;
      if(el.classList?.contains('situation-card')){
        el._setSituationExpanded?.(true);
        el.classList.add('search-match');
        setTimeout(() => el.classList.remove('search-match'), 1600);
      }
      setTimeout(() => el.scrollIntoView({behavior:'smooth', block:'center'}), 50);
    }
  }
  if(item.role){
    activateRole(item.role);
  }
  knowledgeResults.classList.remove('show');
}

function renderKnowledgeResults(query){
  const q=query.trim();
  if(!q){
    knowledgeResults.classList.remove('show');
    knowledgeResults.innerHTML='';
    return;
  }
  const knowledgePool=[...KNOWLEDGE_INDEX,...getSituationKnowledge().filter(x=>!KNOWLEDGE_INDEX.some(k=>k.target&&k.target===x.target))];
  const knowledge=knowledgePool
    .map(item=>({item,score:smartScore(q,`${item.title} ${item.type} ${item.terms}`,item.type==='Ситуация'?'ситуация что делать':'' )}))
    .filter(x=>x.score>0).sort((a,b)=>b.score-a.score).slice(0,8).map(x=>x.item);
  const articles=ARTICLES
    .map(item=>({item,score:smartScore(q,`${item.code} ${item.name} ${item.tags.join(' ')} ${item.note} ${item.penalty}`,`статья ${item.code}`)}))
    .filter(x=>x.score>0).sort((a,b)=>b.score-a.score).slice(0,8).map(x=>x.item);
  const items=[
    ...knowledge.map((x,i)=>({kind:'knowledge',data:x,key:`k${i}`})),
    ...articles.map((x,i)=>({kind:'article',data:x,key:`a${i}`}))
  ];
  knowledgeResults.innerHTML=items.length?items.map(x=>x.kind==='knowledge'
    ?`<button class="search-result-item" data-search-kind="knowledge" data-search-key="${x.key}"><strong>${x.data.title}</strong><span>${x.data.type}</span></button>`
    :`<button class="search-result-item" data-search-kind="article" data-search-code="${x.data.code}"><strong>${x.data.code} — ${x.data.name}</strong><span>Статья кодекса</span></button>`
  ).join(''):'<div class="search-result-item"><strong>Ничего не найдено</strong><span>Попробуйте: «шум в суде», «не слушается», «оружие»</span></div>';
  knowledgeResults.classList.add('show');
  const knowledgeMap=Object.fromEntries(items.filter(x=>x.kind==='knowledge').map(x=>[x.key,x.data]));
  knowledgeResults.querySelectorAll('[data-search-kind="knowledge"]').forEach(btn=>btn.addEventListener('click',()=>openKnowledgeResult(knowledgeMap[btn.dataset.searchKey])));
  knowledgeResults.querySelectorAll('[data-search-kind="article"]').forEach(btn=>btn.addEventListener('click',()=>openArticle(btn.dataset.searchCode)));
}
globalSearch.addEventListener('input', () => {
  renderKnowledgeResults(globalSearch.value);
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

  container.innerHTML = list.length ? list.map(a => `
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
          <button class="frequent-remove" data-frequent-remove="${a.code}">Убрать</button>
        </div>
      </div>
    </article>
  `).join('') : '<div class="empty-state">Частых статей пока нет. Добавьте их из кодекса.</div>';

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

  container.querySelectorAll('[data-frequent-remove]').forEach(btn => {
    btn.addEventListener('click', () => {
      frequentCodes = frequentCodes.filter(code => code !== btn.dataset.frequentRemove);
      saveFrequent();
      renderArticles();
      showToast('Статья удалена из частых');
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
  const required = ['home','fieldguide','situations','government','pgo','academy','usms-notices','frequent','criminal','miranda','scenarios','phrases','tools','glossary','faq','mistakes','changes','sources','about'];
  const missing = required.filter(id => !document.getElementById(id));
  if(missing.length){
    console.warn('GOV Handbook: отсутствуют разделы', missing);
  }
});


document.querySelectorAll('[data-pgo-code]').forEach(btn => {
  btn.addEventListener('click', () => openArticle(btn.dataset.pgoCode));
});


document.getElementById('emergencyMode')?.addEventListener('click', () => {
  document.body.classList.toggle('emergency');
  const btn = document.getElementById('emergencyMode');
  btn.textContent = document.body.classList.contains('emergency')
    ? 'Выйти из экстренного режима'
    : 'Экстренный режим';
});

document.addEventListener('keydown', (e) => {
  if(e.key === 'Escape' && document.body.classList.contains('emergency')){
    document.body.classList.remove('emergency');
    const btn = document.getElementById('emergencyMode');
    if(btn) btn.textContent = 'Экстренный режим';
  }
});


const ARTICLE_DETAILS = {
  "17.6": {
    "summary": "Неповиновение законному требованию сотрудника при исполнении.",
    "apply": [
      "Требование законное и относится к компетенции сотрудника.",
      "Требование сформулировано понятно.",
      "Лицо осознанно отказывается выполнять его."
    ],
    "avoid": [
      "Нельзя автоматически вменять только за отказ назвать имя или показать документы.",
      "Нельзя применять, если требование незаконно или непонятно."
    ],
    "mistakes": [
      "Не зафиксировано само требование.",
      "Статья добавлена вместе с 17.9 и 17.10 без разграничения действий."
    ],
    "example": "Сотрудник потребовал прекратить вмешательство в законное задержание. Гражданин понял требование и продолжил препятствовать.",
    "source": "Уголовный кодекс Washington; ПГО; процедура установления личности."
  },
  "17.9": {
    "summary": "Незаконная помеха задержанию или аресту, включая содействие такой помехе.",
    "apply": [
      "Лицо физически или иным способом мешает процессуальному действию.",
      "Действия направлены на срыв задержания или ареста."
    ],
    "avoid": [
      "Не заменяет 17.6 при простом отказе выполнить требование.",
      "Не применяется без фактической помехи."
    ],
    "mistakes": [
      "Любое присутствие рядом ошибочно считается помехой."
    ],
    "example": "Гражданин блокирует служебный автомобиль и помогает задержанному скрыться.",
    "source": "Уголовный кодекс Washington."
  },
  "17.10": {
    "summary": "Побег при задержании, аресте или иной форме процессуального принуждения.",
    "apply": [
      "Лицо уже находится в состоянии задержания или процессуального принуждения.",
      "Имеется фактическая попытка скрыться."
    ],
    "avoid": [
      "Не путать с обычным уходом до объявления задержания."
    ],
    "mistakes": [
      "Статья вменяется до возникновения статуса задержанного."
    ],
    "example": "После надевания наручников задержанный вырывается и убегает.",
    "source": "Уголовный кодекс Washington."
  },
  "10.5": {
    "summary": "Неправомерное завладение транспортным средством.",
    "apply": [
      "Транспорт фактически перемещён без законного права."
    ],
    "avoid": [
      "Одного проникновения в салон недостаточно без перемещения."
    ],
    "mistakes": [
      "Статья применяется за попытку открыть автомобиль без фактического движения."
    ],
    "example": "Лицо завело чужой автомобиль и отъехало с места парковки.",
    "source": "Уголовный кодекс Washington."
  },
  "12.8 Ч1": {
    "summary": "Незаконное приобретение, хранение, перевозка или ношение оружия без разрешения.",
    "apply": [
      "Оружие обнаружено и отсутствует действующее разрешение.",
      "Соблюдена процедура обыска и фиксации."
    ],
    "avoid": [
      "Не применять без подтверждения предмета и законности изъятия."
    ],
    "mistakes": [
      "Не проверена лицензия.",
      "Оружие не зафиксировано в материалах."
    ],
    "example": "При законном обыске найдено огнестрельное оружие, лицензия отсутствует.",
    "source": "Уголовный кодекс Washington; закон об оружии."
  },
  "13.3": {
    "summary": "Наркотические вещества в особо крупном размере — свыше 20 грамм.",
    "apply": [
      "Вес вещества превышает установленный порог.",
      "Изъятие и количество зафиксированы."
    ],
    "avoid": [
      "Не применять без подтверждённого количества."
    ],
    "mistakes": [
      "Перепутан значительный и особо крупный размер."
    ],
    "example": "При обыске обнаружено 25 грамм запрещённого вещества.",
    "source": "Уголовный кодекс Washington."
  },
  "14.3": {
    "summary": "Разглашение сведений, составляющих государственную тайну.",
    "apply": [
      "Сведения действительно имеют режим гостайны.",
      "Лицо довело их до неуполномоченных лиц."
    ],
    "avoid": [
      "Не применять к общедоступной информации.",
      "Не подменять статьёй 14.3.1 о незаконном получении."
    ],
    "mistakes": [
      "Не проверен статус информации.",
      "Разглашение и получение сведений смешиваются."
    ],
    "example": "Лицо публично раскрывает защищённые данные сотрудника засекреченного подразделения.",
    "source": "Уголовный кодекс Washington; закон о государственной тайне."
  },
  "14.3.1": {
    "summary": "Незаконное получение сведений, составляющих государственную тайну.",
    "apply": [
      "Информация получена похищением, обманом, шантажом, принуждением или иным незаконным способом."
    ],
    "avoid": [
      "Не применять только за последующее разглашение без доказанного незаконного получения."
    ],
    "mistakes": [
      "Нет подтверждения способа получения информации."
    ],
    "example": "Лицо похитило служебные документы, содержащие данные засекреченного подразделения.",
    "source": "Уголовный кодекс Washington; закон о государственной тайне."
  },
  "15.1": {
    "summary": "Превышение должностных полномочий.",
    "apply": [
      "Действия явно выходят за пределы предоставленных полномочий.",
      "Возникло существенное нарушение прав или интересов."
    ],
    "avoid": [
      "Не применять только из-за процессуальной ошибки без признаков превышения."
    ],
    "mistakes": [
      "Не установлены конкретные пределы полномочий должностного лица."
    ],
    "example": "Сотрудник применяет полномочие, которого его должность не предусматривает.",
    "source": "Уголовный кодекс Washington; закон о государственной службе."
  },
  "16.11": {
    "summary": "Сокрытие или уничтожение доказательств.",
    "apply": [
      "Имеются доказательства намеренного сокрытия, удаления или уничтожения улик."
    ],
    "avoid": [
      "Не применять при случайной утрате без умысла."
    ],
    "mistakes": [
      "Не доказана связь предмета с делом."
    ],
    "example": "Участник дела намеренно уничтожает запись, имеющую доказательственное значение.",
    "source": "Уголовный кодекс Washington."
  },
  "7.1": {
    "summary": "Похищение человека — незаконное лишение свободы с перемещением или удержанием.",
    "apply": [
      "Лицо лишено свободы силой, обманом или угрозами.",
      "Есть перемещение либо принудительное удержание."
    ],
    "avoid": [
      "Не смешивать с законным задержанием сотрудником."
    ],
    "mistakes": [
      "Не установлено отсутствие законного основания удержания."
    ],
    "example": "Группа лиц насильно помещает гражданина в автомобиль и удерживает его.",
    "source": "Уголовный кодекс Washington."
  },
  "6.2 Ч1": {
    "summary": "Умышленное причинение смерти другому человеку.",
    "apply": [
      "Подтверждён умысел на лишение жизни.",
      "Есть причинно-следственная связь между действиями и смертью."
    ],
    "avoid": [
      "Не применять вместо причинения смерти по неосторожности."
    ],
    "mistakes": [
      "Не разграничены умысел и неосторожность."
    ],
    "example": "Лицо намеренно применяет смертельное оружие с целью убийства.",
    "source": "Уголовный кодекс Washington."
  }
};


function renderDetailList(items){
  if(!items || !items.length) return '<p>Информация уточняется.</p>';
  return `<ul>${items.map(x => `<li>${x}</li>`).join('')}</ul>`;
}

articleCard = function(a){
  const q = getQuery();
  const isFav = favorites.has(a.code);
  const isFrequent = frequentCodes.includes(a.code);
  const related = relatedArticles(a);
  const note = articleNotes[a.code];
  const d = ARTICLE_DETAILS[a.code];

  return `
    <article class="article" data-code="${a.code}">
      <div class="article-code">${highlightText(a.code,q)}</div>
      <div>
        <div class="article-name">${highlightText(a.name,q)} <span class="article-expand-label">${d ? 'Подробнее ▾' : 'Краткая карточка'}</span></div>
        ${a.note ? `<div class="article-note">${highlightText(a.note,q)}</div>` : ''}
        <div class="article-tags">${a.tags.map(t => `<span class="tag">${highlightText(t,q)}</span>`).join('')}</div>
        ${note ? `<div class="article-note-indicator">Есть личная заметка</div>` : ''}
        <div class="related-list">
          ${related.map(r => `<button class="related-chip" data-related="${r.code}">${r.code}</button>`).join('')}
        </div>
        <div class="article-actions">
          <button class="favorite-btn ${isFav ? 'active' : ''}" data-fav="${a.code}">${isFav ? '★' : '☆'}</button>
          <button class="copy-article-btn" data-frequent="${a.code}">${isFrequent ? 'Убрать из частых' : 'В частые'}</button>
          <button class="copy-article-btn" data-note="${a.code}">Заметка</button>
          <button class="copy-article-btn" data-copy-article="${a.code}">Копировать</button>
        </div>
      </div>
      <div class="article-stars">${a.stars}</div>
      <div class="article-penalty">${highlightText(a.penalty,q)}</div>

      <div class="article-details">
        ${d ? `
        <div class="article-detail-grid">
          <div class="detail-block"><h5>Кратко</h5><p>${d.summary}</p></div>
          <div class="detail-block"><h5>Когда применять</h5>${renderDetailList(d.apply)}</div>
          <div class="detail-block"><h5>Когда не применять</h5>${renderDetailList(d.avoid)}</div>
          <div class="detail-block"><h5>Частые ошибки</h5>${renderDetailList(d.mistakes)}</div>
          <div class="detail-block"><h5>RP-пример</h5><p>${d.example}</p></div>
          <div class="detail-block"><h5>Источник</h5><p>${d.source}</p></div>
        </div>` : `<div class="article-details-empty">Расширенный комментарий для этой статьи ещё не подготовлен.</div>`}
      </div>
    </article>`;
};

const completeRenderArticles = renderArticles;
renderArticles = function(){
  completeRenderArticles();

  articleList.querySelectorAll('.article').forEach(card => {
    card.addEventListener('click', (event) => {
      if(event.target.closest('button')) return;
      card.classList.toggle('expanded');
      const label = card.querySelector('.article-expand-label');
      if(label && ARTICLE_DETAILS[card.dataset.code]){
        label.textContent = card.classList.contains('expanded') ? 'Свернуть ▴' : 'Подробнее ▾';
      }
    });
  });

  articleList.querySelectorAll('[data-pgo-code]').forEach(btn => {
    btn.addEventListener('click', () => openArticle(btn.dataset.pgoCode));
  });
};

document.querySelectorAll('[data-pgo-code]').forEach(btn => {
  btn.addEventListener('click', () => openArticle(btn.dataset.pgoCode));
});

renderArticles();


function activateRole(role){
  document.querySelectorAll('.role-tab').forEach(btn => btn.classList.toggle('active', btn.dataset.roleTab === role));
  document.querySelectorAll('.role-panel').forEach(panel => panel.classList.toggle('active', panel.dataset.rolePanel === role));
  const panel = document.querySelector(`[data-role-panel="${role}"]`);
  if(panel) setTimeout(() => panel.scrollIntoView({behavior:'smooth', block:'center'}), 50);
}

document.querySelectorAll('[data-role-tab]').forEach(btn => {
  btn.addEventListener('click', () => activateRole(btn.dataset.roleTab));
});

document.querySelectorAll('[data-open-role]').forEach(btn => {
  btn.addEventListener('click', () => {
    showSection('government');
    activateRole(btn.dataset.openRole);
  });
});

document.querySelectorAll('[data-guide-open]').forEach(btn => {
  btn.addEventListener('click', () => {
    const el = document.getElementById(btn.dataset.guideOpen);
    if(el){
      document.querySelectorAll('.guide-card').forEach(x => x.open = false);
      el.open = true;
      el.scrollIntoView({behavior:'smooth', block:'center'});
    }
  });
});

document.querySelectorAll('[data-open-guide]').forEach(btn => {
  btn.addEventListener('click', () => {
    showSection('fieldguide');
    const el = document.getElementById(btn.dataset.openGuide);
    if(el){
      document.querySelectorAll('.guide-card').forEach(x => x.open = false);
      el.open = true;
      setTimeout(() => el.scrollIntoView({behavior:'smooth', block:'center'}), 50);
    }
  });
});

document.querySelectorAll('[data-open-code]').forEach(btn => {
  btn.addEventListener('click', () => openArticle(btn.dataset.openCode));
});

const situationSearch = document.getElementById('situationSearch');
situationSearch?.addEventListener('input', () => {
  const q = situationSearch.value.trim();
  let visible = 0;
  document.querySelectorAll('.situation-card').forEach(card => {
    const hay = `${card.innerText} ${card.dataset.situationTags || ''}`;
    const show = !q || smartScore(q, hay, 'ситуация что делать') > 0;
    card.style.display = show ? '' : 'none';
    card.classList.toggle('search-match', Boolean(q && show));
    if(q && show) card._setSituationExpanded?.(true);
    if(!q){
      card.classList.remove('search-match');
      card._setSituationExpanded?.(false);
    }
    if(show) visible++;
  });
  document.getElementById('situationEmpty')?.classList.toggle('hidden', visible > 0);
});

document.addEventListener('click', (e) => {
  if(!e.target.closest('.search-wrap')) knowledgeResults?.classList.remove('show');
});


document.querySelectorAll('.situation-card[data-extra-codes]').forEach(card => {
  const laws = card.querySelector(':scope > .mini-laws');
  if(!laws) return;
  const existing = new Set([...laws.querySelectorAll('[data-open-code]')].map(btn => btn.dataset.openCode));
  const articles = card.dataset.extraCodes.split('|')
    .map(code => ARTICLES.find(item => item.code === code.trim()))
    .filter(article => article && !existing.has(article.code));
  if(!articles.length) return;

  const details = document.createElement('details');
  details.className = 'situation-more';
  details.innerHTML = `
    <summary>Ещё ${articles.length} ${articles.length === 1 ? 'статья' : articles.length < 5 ? 'статьи' : 'статей'} по обстоятельствам</summary>
    <div class="mini-laws compact-laws">
      ${articles.map(article => `<button data-open-code="${article.code}"><b>${article.code}</b><span>${article.name}</span></button>`).join('')}
    </div>`;
  laws.appendChild(details);

  if(!card.querySelector('.situation-law-warning')){
    const warning = document.createElement('div');
    warning.className = 'situation-law-warning';
    warning.textContent = 'Статьи применяются только при подтверждённом отдельном составе.';
    card.appendChild(warning);
  }
});

document.querySelectorAll('.mini-laws [data-open-code]').forEach(btn => {
  const article = ARTICLES.find(item => item.code === btn.dataset.openCode);
  if(article){
    btn.innerHTML = `<b>${article.code}</b><span>${article.name}</span><small class="law-stars" aria-label="Тяжесть: ${article.stars}">${article.stars}</small>`;
    btn.title = `${article.name} — ${article.penalty}. Нажмите, чтобы открыть статью.`;
  }
  btn.addEventListener('click', () => openArticle(btn.dataset.openCode));
});

document.querySelectorAll('.academy-tab').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.academy-tab').forEach(item => item.classList.toggle('active', item === btn));
    document.querySelectorAll('.academy-panel').forEach(panel => panel.classList.toggle('active', panel.dataset.academyPanel === btn.dataset.academyTab));
  });
});

const USMS_NOTICE_TEMPLATES = [
  {id:'case-accepted', name:'Принятие дела к производству', text:'Уведомляем Вас о том, что {{AUTHORITY}} принято к производству дело «{{SUBJECT}}» № {{CASE}} от {{DATE}}. Дополнительная информация будет доведена позднее.'},
  {id:'hearing', name:'Назначение судебного разбирательства', text:'Уведомляем Вас о том, что {{AUTHORITY}} вынесено определение о назначении судебного разбирательства по делу № {{CASE}}. Судебное заседание назначено на {{DATE}} в {{TIME}} в помещении Капитолия. Явка в суд обязательна.'},
  {id:'interview', name:'Вызов на допрос', text:'{{SUBJECT}}, Вы вызываетесь на допрос в качестве {{ROLE}} в мэрию г. Лос-Сантос {{DATE}} к {{TIME}}. В случае неявки без уважительной причины Вы можете быть подвергнуты приводу либо привлечены к предусмотренной законом ответственности.'},
  {id:'claim-hearing', name:'Принятие иска к разбирательству', text:'Уведомляем Вас о том, что {{AUTHORITY}} принято к разбирательству исковое заявление по делу № {{CASE}}. Судебное заседание назначено на {{DATE}} в {{TIME}} в зале суда здания Капитолия г. Лос-Сантос. Явка в суд обязательна.'},
  {id:'motion-approved', name:'Удовлетворение ходатайства', text:'Уведомляем Вас, что {{AUTHORITY}} рассмотрено ходатайство, поданное {{DATE}}, по делу № {{CASE}}. По результатам рассмотрения вынесено определение об удовлетворении ходатайства. Сведения о дальнейшем порядке можно получить в канцелярии суда.'},
  {id:'investigation-extended', name:'Продление срока расследования', text:'Уведомляем Вас о том, что {{AUTHORITY}} принято решение о продлении срока расследования по делу «{{SUBJECT}}» № {{CASE}} от {{DATE}}. Дополнительная информация будет доведена участникам в установленном порядке.'},
  {id:'default-prep', name:'Подготовка заочного рассмотрения', text:'Уведомляем Вас о том, что {{AUTHORITY}} начата подготовка дела «{{SUBJECT}}» № {{CASE}} от {{DATE}} к заочному рассмотрению. Вы вправе в установленный срок потребовать рассмотрения дела в общем порядке.'},
  {id:'terminated', name:'Прекращение производства', text:'Уведомляем Вас о том, что {{AUTHORITY}} принято решение о прекращении производства по делу «{{SUBJECT}}» № {{CASE}} от {{DATE}}. Дополнительная информация будет доведена в установленном порядке.'},
  {id:'ogp-transfer', name:'Передача постановления ОГП в суд', text:'Уведомляем Вас о том, что Офисом Генерального прокурора штата Сан-Андреас принято решение о передаче постановления № {{CASE}} по делу «{{SUBJECT}}» от {{DATE}} в канцелярию суда. Дополнительная информация будет доведена позднее.'},
  {id:'appeal-accepted', name:'Принятие апелляционной жалобы', text:'Уведомляем Вас о том, что {{AUTHORITY}} принята к производству апелляционная жалоба по делу «{{SUBJECT}}» № {{CASE}} от {{DATE}}. Дополнительная информация будет доведена позднее.'},
  {id:'appeal-approved', name:'Удовлетворение апелляционной жалобы', text:'Уведомляем Вас, что {{AUTHORITY}} рассмотрена апелляционная жалоба, поданная {{DATE}}, по делу № {{CASE}}. По результатам рассмотрения вынесено определение об её удовлетворении. Сведения о дальнейшем порядке можно получить в канцелярии суда.'},
  {id:'cassation-accepted', name:'Принятие кассационной жалобы', text:'Уведомляем Вас о том, что {{AUTHORITY}} принята к производству кассационная жалоба по делу «{{SUBJECT}}» № {{CASE}} от {{DATE}}. Дополнительная информация будет доведена позднее.'},
  {id:'materials-request', name:'Истребование материалов', text:'Уведомляем Вас о том, что {{AUTHORITY}} определено истребовать материалы по делу «{{SUBJECT}}» № {{CASE}} от {{DATE}}. Материалы необходимо предоставить в срок: {{ROLE}}. Дополнительная информация будет доведена позднее.'},
  {id:'criminal-finished', name:'Завершение уголовного производства', text:'Уведомляем Вас о том, что Офисом Генерального прокурора штата Сан-Андреас принято решение о завершении производства по уголовному делу «{{SUBJECT}}» № {{CASE}} от {{DATE}} и направлении материалов в канцелярию суда.'},
  {id:'claim-filed', name:'Поданное исковое заявление — ответчику', text:'Уведомляем Вас о том, что в {{AUTHORITY}} подано исковое заявление по делу «{{SUBJECT}}» № {{CASE}} от {{DATE}}. Дополнительная информация будет доведена позднее. Уведомление предназначено ответчику.'},
  {id:'criminal-opened', name:'Возбуждение уголовного дела ОГП', text:'Уведомляем Вас о том, что Офисом Генерального прокурора штата Сан-Андреас принято постановление о возбуждении уголовного дела «{{SUBJECT}}» № {{CASE}} от {{DATE}} и принятии его к собственному производству. Дополнительная информация будет доведена позднее.'}
];

const usmsTemplateList = document.getElementById('usmsTemplateList');
const usmsTemplateSearch = document.getElementById('usmsTemplateSearch');

function readyNoticeText(text){
  return text
    .replaceAll('{{AUTHORITY}}', '[СУД / ОРГАН]')
    .replaceAll('{{SUBJECT}}', '[ИМЯ / НАЗВАНИЕ ДЕЛА]')
    .replaceAll('{{CASE}}', '[НОМЕР ДЕЛА]')
    .replaceAll('{{DATE}}', '[ДАТА]')
    .replaceAll('{{TIME}}', '[ВРЕМЯ]')
    .replaceAll('{{ROLE}}', '[СТАТУС / СРОК]');
}

function renderUsmsTemplates(){
  if(!usmsTemplateList) return;
  const query = usmsTemplateSearch?.value.trim().toLowerCase() || '';
  const items = USMS_NOTICE_TEMPLATES.filter(item => `${item.name} ${item.text}`.toLowerCase().includes(query));
  usmsTemplateList.innerHTML = items.map(item => `
    <article class="usms-template-card">
      <div class="usms-template-head"><h4>${item.name}</h4><button class="copy-btn" data-copy-usms-template="${item.id}">Скопировать</button></div>
      <p>${readyNoticeText(item.text)}</p>
    </article>`).join('') || '<div class="empty-state">Шаблон не найден.</div>';
  usmsTemplateList.querySelectorAll('[data-copy-usms-template]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const template = USMS_NOTICE_TEMPLATES.find(item => item.id === btn.dataset.copyUsmsTemplate);
      await navigator.clipboard.writeText(readyNoticeText(template?.text || ''));
      showToast('Шаблон USMS скопирован');
    });
  });
}

usmsTemplateSearch?.addEventListener('input', renderUsmsTemplates);
renderUsmsTemplates();

const homeUniversalSearch = document.getElementById('homeUniversalSearch');
const homeSearchResults = document.getElementById('homeSearchResults');

function renderHomeSearch(){
  if(!homeUniversalSearch||!homeSearchResults) return;
  const query=homeUniversalSearch.value.trim();
  if(!query){homeSearchResults.classList.add('hidden');homeSearchResults.innerHTML='';return;}
  const pool=[...KNOWLEDGE_INDEX,...getSituationKnowledge().filter(x=>!KNOWLEDGE_INDEX.some(k=>k.target&&k.target===x.target))];
  const knowledge=pool.map(item=>({item,score:smartScore(query,`${item.title} ${item.type} ${item.terms}`,item.type==='Ситуация'?'ситуация что делать':'')}))
    .filter(x=>x.score>0).sort((a,b)=>b.score-a.score).slice(0,6).map(x=>x.item);
  const articles=ARTICLES.map(item=>({item,score:smartScore(query,`${item.code} ${item.name} ${item.tags.join(' ')} ${item.note}`,`статья ${item.code}`)}))
    .filter(x=>x.score>0).sort((a,b)=>b.score-a.score).slice(0,6).map(x=>x.item);
  homeSearchResults.innerHTML=[
    ...knowledge.map((item,index)=>`<button data-home-knowledge="${index}"><span>${item.type}</span><strong>${item.title}</strong></button>`),
    ...articles.map(item=>`<button data-home-article="${item.code}"><span>СТАТЬЯ</span><strong>${item.code} — ${item.name}</strong></button>`)
  ].join('')||'<div class="home-search-empty">Ничего не найдено. Попробуйте описать ситуацию другими словами.</div>';
  homeSearchResults.classList.remove('hidden');
  homeSearchResults.querySelectorAll('[data-home-knowledge]').forEach(btn=>btn.addEventListener('click',()=>openKnowledgeResult(knowledge[Number(btn.dataset.homeKnowledge)])));
  homeSearchResults.querySelectorAll('[data-home-article]').forEach(btn=>btn.addEventListener('click',()=>openArticle(btn.dataset.homeArticle)));
}
homeUniversalSearch?.addEventListener('input', renderHomeSearch);
homeUniversalSearch?.addEventListener('keydown', event => {
  if(event.key !== 'Enter') return;
  const exact = ARTICLES.find(item => item.code.toLowerCase() === homeUniversalSearch.value.trim().toLowerCase());
  if(exact) openArticle(exact.code);
});

document.addEventListener('keydown', event => {
  const active=document.activeElement;
  const typing=active && ['INPUT','TEXTAREA','SELECT'].includes(active.tagName);
  if((event.ctrlKey||event.metaKey) && event.key.toLowerCase()==='k'){
    event.preventDefault(); globalSearch?.focus(); globalSearch?.select();
  } else if(event.key==='/' && !typing){
    event.preventDefault(); globalSearch?.focus();
  } else if(event.key==='Escape'){
    knowledgeResults?.classList.remove('show');
    if(document.activeElement===globalSearch) globalSearch.blur();
  }
});

// v2.4.2 — compact accordion for the “Что делать?” section.
(function initSituationAccordion(){
  const cards=[...document.querySelectorAll('.situation-card')];
  cards.forEach((card,index)=>{
    const head=card.querySelector(':scope > .situation-head');
    if(!head) return;
    if(!card.id) card.id=`situation-card-${index+1}`;
    head.setAttribute('role','button');
    head.setAttribute('tabindex','0');
    head.setAttribute('aria-controls',`${card.id}-content`);
    head.setAttribute('aria-expanded','false');
    const toggle=(force)=>{
      const open=typeof force==='boolean'?force:!card.classList.contains('expanded');
      card.classList.toggle('expanded',open);
      head.setAttribute('aria-expanded',String(open));
    };
    head.addEventListener('click',()=>toggle());
    head.addEventListener('keydown',event=>{
      if(event.key==='Enter'||event.key===' '){event.preventDefault();toggle();}
    });
    card._setSituationExpanded=toggle;
  });
})();

// v2.5 — situation favorites, automatic priority and penalty summary.
(function initSituationFavorites(){
  const grid=document.getElementById('situationGrid');
  if(!grid) return;
  const storageKey='gov-situation-favorites';
  let saved=new Set(JSON.parse(localStorage.getItem(storageKey)||'[]'));
  const cards=[...grid.querySelectorAll(':scope > .situation-card')];

  function cardKey(card){return card.id || card.querySelector('h4')?.textContent.trim() || '';}
  function persist(){localStorage.setItem(storageKey,JSON.stringify([...saved]));}
  function sortCards(){
    const ordered=[...cards].sort((a,b)=>Number(saved.has(cardKey(b)))-Number(saved.has(cardKey(a))));
    ordered.forEach(card=>grid.appendChild(card));
  }
  function refreshButton(card,button){
    const active=saved.has(cardKey(card));
    button.classList.toggle('active',active);
    button.textContent=active?'★':'☆';
    button.title=active?'Убрать ситуацию из избранного':'Закрепить ситуацию наверху';
    button.setAttribute('aria-pressed',String(active));
    card.classList.toggle('situation-favorite',active);
  }

  cards.forEach(card=>{
    const head=card.querySelector(':scope > .situation-head');
    if(!head) return;
    const fav=document.createElement('button');
    fav.type='button'; fav.className='situation-favorite-btn';
    fav.addEventListener('click',event=>{
      event.stopPropagation();
      const key=cardKey(card);
      saved.has(key)?saved.delete(key):saved.add(key);
      persist(); refreshButton(card,fav); sortCards();
    });
    fav.addEventListener('keydown',event=>event.stopPropagation());
    head.appendChild(fav); refreshButton(card,fav);

    const codes=[...card.querySelectorAll('.mini-laws [data-open-code]')].map(x=>x.dataset.openCode);
    const unique=[...new Set(codes)].map(code=>ARTICLES.find(a=>a.code===code)).filter(Boolean);
    if(unique.length && !card.querySelector('.situation-penalty-summary')){
      const summary=document.createElement('div'); summary.className='situation-penalty-summary';
      const maxStars=unique.reduce((best,a)=>a.stars.length>best.length?a.stars:best,'');
      const penalties=[...new Set(unique.map(a=>a.penalty).filter(Boolean))];
      summary.innerHTML=`<b>По обстоятельствам:</b> <span>${maxStars||'—'}</span><small>${penalties.slice(0,3).join(' · ')}</small>`;
      const firstBody=head.nextElementSibling; card.insertBefore(summary,firstBody);
    }
  });
  sortCards();
})();
