/* ============================================================
   tasko — вход через Telegram и режим Mini App
   ============================================================
   НАСТРОЙКА: заполните два поля ниже, подробности в TELEGRAM.md
   ------------------------------------------------------------ */
window.TASKO = window.TASKO || {};
TASKO.config = {
  // имя бота без @. Домен сайта должен быть прописан в @BotFather → /setdomain,
  // иначе Telegram не отрисует кнопку входа.
  bot: 'teydobot',
  // проверка подписи на сервере: функция лежит в api/auth.js.
  // Работает после деплоя на Vercel с переменной BOT_TOKEN.
  verifyUrl: '/api/auth'
};

(function () {
  'use strict';

  var cfg = TASKO.config;
  var tg = window.Telegram && window.Telegram.WebApp;
  var inTelegram = !!(tg && tg.initData !== undefined && tg.platform !== 'unknown');

  var modal = document.getElementById('auth');
  if (!modal) return;

  var steps = {};
  modal.querySelectorAll('[data-step]').forEach(function (el) {
    steps[el.getAttribute('data-step')] = el;
  });

  var lastFocus = null;
  var STORE = 'tasko.profile';

  /* ---------- Mini App: разворачиваем на всё окно ---------- */
  function initMiniApp() {
    if (!inTelegram) return;
    document.documentElement.classList.add('in-telegram');

    try { tg.ready(); } catch (e) {}
    try { tg.expand(); } catch (e) {}
    // полноэкранный режим — Bot API 8.0+, на старых клиентах просто нет метода
    if (typeof tg.requestFullscreen === 'function') {
      try { tg.requestFullscreen(); } catch (e) {}
    }
    if (typeof tg.disableVerticalSwipes === 'function') {
      try { tg.disableVerticalSwipes(); } catch (e) {}
    }
    if (typeof tg.setHeaderColor === 'function') {
      try { tg.setHeaderColor('#FFF8F0'); } catch (e) {}
    }
    if (typeof tg.setBackgroundColor === 'function') {
      try { tg.setBackgroundColor('#FFF8F0'); } catch (e) {}
    }

    applyInsets();
    ['safeAreaChanged', 'contentSafeAreaChanged', 'fullscreenChanged', 'viewportChanged'].forEach(function (ev) {
      if (typeof tg.onEvent === 'function') tg.onEvent(ev, applyInsets);
    });

    // системная кнопка «назад» закрывает окно входа
    if (tg.BackButton && typeof tg.onEvent === 'function') {
      tg.onEvent('backButtonClicked', function () { close(); });
    }
  }

  /* Телеграм в полноэкранном режиме рисует свою шапку поверх страницы —
     отдаём её высоту в CSS, чтобы наша шапка не уезжала под неё. */
  function applyInsets() {
    var safe = tg.safeAreaInset || {};
    var content = tg.contentSafeAreaInset || {};
    var root = document.documentElement.style;
    root.setProperty('--tg-top', ((safe.top || 0) + (content.top || 0)) + 'px');
    root.setProperty('--tg-bottom', ((safe.bottom || 0) + (content.bottom || 0)) + 'px');
    root.setProperty('--tg-left', (safe.left || 0) + 'px');
    root.setProperty('--tg-right', (safe.right || 0) + 'px');
  }

  /* ---------- Окно ---------- */
  function show(name) {
    Object.keys(steps).forEach(function (k) { steps[k].hidden = k !== name; });
  }

  function open() {
    lastFocus = document.activeElement;
    modal.hidden = false;
    modal.classList.remove('is-closing');
    document.body.style.overflow = 'hidden';
    if (inTelegram && tg.BackButton) { try { tg.BackButton.show(); } catch (e) {} }

    var saved = readProfile();
    if (avPanel) avPanel.hidden = true;
    if (saved) { fillProfile(saved); show('profile'); }
    else { show('intro'); mountWidget(); }

    var focusable = modal.querySelector('button, [href], input');
    if (focusable) focusable.focus();
  }

  function close() {
    modal.classList.add('is-closing');
    document.body.style.overflow = '';
    if (inTelegram && tg.BackButton) { try { tg.BackButton.hide(); } catch (e) {} }
    setTimeout(function () {
      modal.hidden = true;
      modal.classList.remove('is-closing');
      if (lastFocus) lastFocus.focus();
    }, 260);
  }

  document.querySelectorAll('[data-auth-open]').forEach(function (b) {
    b.addEventListener('click', open);
  });
  modal.querySelectorAll('[data-auth-close]').forEach(function (b) {
    b.addEventListener('click', close);
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !modal.hidden) close();
  });


  /* ---------- Любое действие требует входа ----------
     Один делегированный обработчик на документ: перехватываем клики
     по кнопкам и действиям до того, как сработают их собственные
     обработчики. Навигация (меню, якоря, логотип) и подсказки под
     поиском не трогаются — иначе по сайту нельзя было бы ходить. */
  var ACTIONS = '.btn, .tile, .req__go, .link--arrow';

  function needsAuth(el) {
    if (!el) return false;
    if (el.closest('#auth')) return false;            // внутри окна входа
    if (el.closest('[data-auth-open]')) return false; // сама кнопка «Войти»
    return true;
  }

  function isLoggedIn() { return !!readProfile(); }

  document.addEventListener('click', function (e) {
    if (isLoggedIn()) return;
    var el = e.target instanceof Element ? e.target.closest(ACTIONS) : null;
    if (!needsAuth(el)) return;
    e.preventDefault();
    e.stopPropagation();
    open();
  }, true);

  // Enter в поле поиска и подписки — тоже действие
  document.addEventListener('submit', function (e) {
    if (isLoggedIn()) return;
    if (e.target.closest('#auth')) return;
    e.preventDefault();
    e.stopPropagation();
    open();
  }, true);

  /* ---------- Виджет входа для обычного сайта ---------- */
  function mountWidget() {
    var box = document.getElementById('tgWidget');
    var btn = modal.querySelector('[data-auth-go]');
    var note = modal.querySelector('[data-auth-note]');
    if (!box || box.dataset.done) return;

    // внутри Telegram виджет не нужен — данные уже есть
    if (inTelegram) { box.dataset.done = '1'; return; }

    if (!cfg.bot) {
      // бот не настроен — оставляем демонстрационную кнопку
      note.textContent = 'Демо-режим: бот ещё не подключён, профиль откроется с тестовыми данными';
      box.dataset.done = '1';
      return;
    }

    var s = document.createElement('script');
    s.src = 'https://telegram.org/js/telegram-widget.js?22';
    s.async = true;
    s.setAttribute('data-telegram-login', cfg.bot);
    s.setAttribute('data-size', 'large');
    s.setAttribute('data-radius', '20');
    s.setAttribute('data-userpic', 'false');
    s.setAttribute('data-request-access', 'write');
    s.setAttribute('data-onauth', 'TASKO.onTelegramAuth(user)');
    box.appendChild(s);
    box.dataset.done = '1';
    btn.hidden = true;      // настоящую кнопку рисует Telegram

    /* Виджет — iframe с сервера Telegram. Он не появится, если домен
       не прописан в @BotFather или страница открыта не с того адреса.
       Через три секунды показываем свою кнопку и объясняем, что не так. */
    setTimeout(function () {
      if (box.querySelector('iframe')) return;
      btn.hidden = false;
      note.textContent =
        'Кнопка Telegram не загрузилась. Проверьте, что домен сайта прописан ' +
        'в @BotFather → /setdomain и совпадает с адресом в строке браузера';
    }, 3000);
  }

  /* ---------- Вход ---------- */
  TASKO.onTelegramAuth = function (user) {
    show('wait');
    verify({
      source: 'widget',
      payload: user,
      profile: {
        id: user.id,
        name: [user.first_name, user.last_name].filter(Boolean).join(' '),
        tag: user.username ? '@' + user.username : '',
        photo: user.photo_url || ''
      }
    });
  };

  modal.querySelector('[data-auth-go]').addEventListener('click', function () {
    show('wait');

    if (inTelegram) {
      var u = (tg.initDataUnsafe && tg.initDataUnsafe.user) || null;
      if (!u) { show('intro'); return; }
      verify({
        source: 'miniapp',
        payload: tg.initData,
        profile: {
          id: u.id,
          name: [u.first_name, u.last_name].filter(Boolean).join(' '),
          tag: u.username ? '@' + u.username : '',
          photo: u.photo_url || ''
        }
      });
      return;
    }

    if (cfg.bot) {
      // виджет не прогрузился — уводим в Telegram напрямую
      show('intro');
      window.open('https://t.me/' + cfg.bot, '_blank', 'noopener');
      return;
    }

    // демо: бота нет, показываем как это будет выглядеть
    setTimeout(function () {
      finish({ id: 0, name: 'Тимур Ковалёв', tag: '@timur', photo: '', demo: true });
    }, 900);
  });

  /* Подпись Telegram проверяется только на сервере — здесь мы её лишь
     отправляем. Без verifyUrl профиль показывается как непроверенный. */
  function verify(data) {
    if (!cfg.verifyUrl) {
      data.profile.demo = true;
      finish(data.profile);
      return;
    }
    fetch(cfg.verifyUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ source: data.source, payload: data.payload })
    })
      .then(function (r) {
        return r.json().catch(function () { return {}; }).then(function (body) {
          if (!r.ok) throw new Error(body.error || ('http_' + r.status));
          return body;
        });
      })
      .then(function (res) { finish(Object.assign({}, data.profile, res.profile || {})); })
      .catch(function (err) {
        var note = modal.querySelector('[data-auth-note]');
        show('intro');
        if (note) note.textContent = explain(String(err.message || err));
      });
  }

  /* Общая фраза «попробуйте ещё раз» не даёт понять, что чинить,
     поэтому переводим код с сервера в конкретное действие. */
  function explain(code) {
    if (code === 'bot_token_not_configured')
      return 'На сервере не задан BOT_TOKEN. Vercel → Settings → Environment Variables, потом Redeploy';
    if (code === 'bad_signature')
      return 'Подпись не сошлась. Обычно это старый или обрезанный BOT_TOKEN в настройках Vercel';
    if (code === 'http_404')
      return 'Функция /api/auth не найдена. Проверьте, что папка api попала в деплой';
    if (code === 'http_405')
      return 'Функция отвечает не на POST — проверьте адрес verifyUrl';
    if (/Failed to fetch|NetworkError/i.test(code))
      return 'Сервер не ответил. Сайт открыт по https и задеплоен?';
    return 'Вход не прошёл: ' + code;
  }

  function finish(profile) {
    saveProfile(profile);
    fillProfile(profile);
    show('profile');
    if (inTelegram && tg.HapticFeedback) {
      try { tg.HapticFeedback.notificationOccurred('success'); } catch (e) {}
    }
  }

  /* ---------- Профиль ---------- */
  function fillProfile(p) {
    var ava = modal.querySelector('[data-prof-ava]');
    var name = modal.querySelector('[data-prof-name]');
    var tag = modal.querySelector('[data-prof-tag]');
    var note = modal.querySelector('[data-prof-note]');

    name.textContent = p.name || 'Без имени';
    tag.textContent = p.tag || '';
    tag.hidden = !p.tag;

    if (p.photo) {
      ava.style.backgroundImage = 'url("' + p.photo + '")';
      ava.textContent = '';
    } else {
      ava.style.backgroundImage = '';
      ava.textContent = (p.name || '?').trim().charAt(0).toUpperCase();
    }

    note.textContent = p.demo
      ? 'Демо-профиль. Подключите бота — и здесь будут ваши данные из Telegram'
      : '';
    note.hidden = !p.demo;

    // шапка: кнопка «Войти» превращается в имя
    document.querySelectorAll('[data-auth-label]').forEach(function (el) {
      el.textContent = (p.name || 'Профиль').split(' ')[0];
    });
    var hAva = document.querySelector('.header__login-avatar');
    if (hAva) {
      hAva.hidden = false;
      if (p.photo) { hAva.style.backgroundImage = 'url("' + p.photo + '")'; hAva.textContent = ''; }
      else hAva.textContent = (p.name || '?').trim().charAt(0).toUpperCase();
    }
  }

  function resetHeader() {
    document.querySelectorAll('[data-auth-label]').forEach(function (el, i) {
      el.textContent = i === 0 ? 'Войти' : 'Войти через Telegram';
    });
    var hAva = document.querySelector('.header__login-avatar');
    if (hAva) { hAva.hidden = true; hAva.style.backgroundImage = ''; hAva.textContent = ''; }
  }

  modal.querySelector('[data-auth-logout]').addEventListener('click', function () {
    try { localStorage.removeItem(STORE); } catch (e) {}
    resetHeader();
    show('intro');
    mountWidget();
  });

  function saveProfile(p) {
    try { localStorage.setItem(STORE, JSON.stringify(p)); } catch (e) {}
  }
  function readProfile() {
    try {
      var raw = localStorage.getItem(STORE);
      var p = raw ? JSON.parse(raw) : null;
      /* Демо-профиль из тестов пережил бы подключение бота и подменял бы
         собой настоящий вход: окно открывалось бы сразу на профиле,
         кнопки Telegram человек бы не увидел. Чистим его. */
      if (p && p.demo && cfg.bot && cfg.verifyUrl) {
        localStorage.removeItem(STORE);
        return null;
      }
      return p;
    } catch (e) { return null; }
  }


  /* ---------- Выбор аватара ---------- */
  var AV_COUNT = 10;
  var avPanel = modal.querySelector('[data-av-panel]');
  var avGrid = modal.querySelector('[data-av-grid]');
  var avKind = 'man';

  function avPath(kind, i) {
    return 'assets/av/' + kind + '-' + (i < 10 ? '0' + i : i) + '.webp';
  }

  function renderGrid() {
    var current = (readProfile() || {}).photo || '';
    avGrid.innerHTML = '';
    for (var i = 1; i <= AV_COUNT; i++) {
      var src = avPath(avKind, i);
      var b = document.createElement('button');
      b.type = 'button';
      b.style.backgroundImage = 'url("' + src + '")';
      b.setAttribute('aria-label', 'Аватар ' + i);
      b.setAttribute('aria-pressed', String(current === src));
      b.dataset.src = src;
      avGrid.appendChild(b);
    }
  }

  modal.querySelectorAll('[data-av-open]').forEach(function (b) {
    b.addEventListener('click', function () {
      var open = avPanel.hidden;
      avPanel.hidden = !open;
      if (open) { renderGrid(); avPanel.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); }
    });
  });

  modal.querySelectorAll('[data-av-tab]').forEach(function (tab) {
    tab.addEventListener('click', function () {
      avKind = tab.getAttribute('data-av-tab');
      modal.querySelectorAll('[data-av-tab]').forEach(function (t) {
        t.setAttribute('aria-selected', String(t === tab));
      });
      renderGrid();
    });
  });

  avGrid.addEventListener('click', function (e) {
    var b = e.target.closest('button[data-src]');
    if (!b) return;
    setPhoto(b.dataset.src);
    renderGrid();
  });

  /* Своё фото: уменьшаем до 320px и кладём в localStorage.
     Исходник с телефона весит мегабайты и в хранилище не влезет. */
  var avFile = modal.querySelector('[data-av-file]');
  avFile.addEventListener('change', function () {
    var file = avFile.files && avFile.files[0];
    if (!file) return;
    if (!/^image\//.test(file.type)) return;

    var reader = new FileReader();
    reader.onload = function () {
      var img = new Image();
      img.onload = function () {
        var side = Math.min(img.width, img.height);
        var canvas = document.createElement('canvas');
        canvas.width = canvas.height = 320;
        var ctx = canvas.getContext('2d');
        ctx.drawImage(img, (img.width - side) / 2, (img.height - side) / 2, side, side, 0, 0, 320, 320);

        var data = canvas.toDataURL('image/webp', 0.85);
        // Safari до 16 не умеет кодировать webp — падаем на jpeg
        if (data.indexOf('data:image/webp') !== 0) data = canvas.toDataURL('image/jpeg', 0.85);

        setPhoto(data);
        renderGrid();
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
    avFile.value = '';
  });

  function setPhoto(src) {
    var p = readProfile() || { name: 'Гость', tag: '', demo: true };
    p.photo = src;
    saveProfile(p);
    fillProfile(p);
    if (inTelegram && tg.HapticFeedback) {
      try { tg.HapticFeedback.impactOccurred('light'); } catch (e) {}
    }
  }

  /* ---------- Старт ---------- */
  initMiniApp();

  var saved = readProfile();
  if (saved) fillProfile(saved);

  // внутри Telegram человек уже авторизован — не заставляем нажимать дважды
  if (inTelegram && !saved && tg.initDataUnsafe && tg.initDataUnsafe.user) {
    var u = tg.initDataUnsafe.user;
    fillProfile({
      id: u.id,
      name: [u.first_name, u.last_name].filter(Boolean).join(' '),
      tag: u.username ? '@' + u.username : '',
      photo: u.photo_url || '',
      demo: !cfg.verifyUrl
    });
  }
})();
