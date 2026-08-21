/* tasko — интерактив лендинга */
(function () {
  'use strict';

  var header = document.querySelector('.header');
  var burger = document.querySelector('.burger');
  var menu = document.getElementById('mobilemenu');

  /* ---------- Мобильное меню ---------- */
  function closeMenu() {
    if (!header) return;
    header.classList.remove('is-open');
    burger.setAttribute('aria-expanded', 'false');
    menu.hidden = true;
    document.body.style.overflow = '';
  }

  if (burger && menu) {
    burger.addEventListener('click', function () {
      var open = header.classList.toggle('is-open');
      burger.setAttribute('aria-expanded', String(open));
      menu.hidden = !open;
      document.body.style.overflow = open ? 'hidden' : '';
    });
    menu.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') closeMenu();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeMenu();
    });
    window.addEventListener('resize', function () {
      if (window.innerWidth > 1080) closeMenu();
    });
  }

  /* ---------- Линия под шапкой при скролле ---------- */
  var onScroll = function () {
    if (header) header.classList.toggle('is-stuck', window.scrollY > 8);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- Появление блоков ---------- */
  var items = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry, i) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        setTimeout(function () { el.classList.add('is-in'); }, i * 80);
        io.unobserve(el);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    items.forEach(function (el) { io.observe(el); });
  } else {
    items.forEach(function (el) { el.classList.add('is-in'); });
  }

  /* ---------- Аккордеон: плавное раскрытие, открыт один пункт ---------- */
  var buttons = Array.prototype.slice.call(document.querySelectorAll('.acc__btn'));

  function setOpen(btn, open) {
    var panel = document.getElementById(btn.getAttribute('aria-controls'));
    btn.setAttribute('aria-expanded', String(open));
    if (panel) panel.classList.toggle('is-open', open);
  }

  buttons.forEach(function (btn) {
    setOpen(btn, btn.getAttribute('aria-expanded') === 'true');

    btn.addEventListener('click', function () {
      var willOpen = btn.getAttribute('aria-expanded') !== 'true';
      buttons.forEach(function (other) {
        if (other !== btn) setOpen(other, false);
      });
      setOpen(btn, willOpen);
    });
  });

  /* ---------- Подсказки под поиском ---------- */
  var taskInput = document.getElementById('heroTask');
  document.querySelectorAll('.suggest button').forEach(function (chip) {
    chip.addEventListener('click', function () {
      if (!taskInput) return;
      taskInput.value = chip.getAttribute('data-fill');
      taskInput.focus();
    });
  });

  /* ---------- Формы ---------- */
  document.querySelectorAll('form').forEach(function (form) {
    var input = form.querySelector('input');
    var msg = form.querySelector('.form__msg');
    if (!input) return;

    function show(text) {
      if (!msg) return;
      msg.textContent = text;
      msg.classList.add('is-on');
      clearTimeout(msg._t);
      msg._t = setTimeout(function () { msg.classList.remove('is-on'); }, 5000);
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var value = (input.value || '').trim();
      var isMail = input.type === 'email';

      if (!value) {
        show(isMail ? 'Введите e-mail' : 'Опишите задачу — хотя бы парой слов');
        input.focus();
        return;
      }
      if (isMail && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value)) {
        show('Проверьте адрес — кажется, есть опечатка');
        input.focus();
        return;
      }

      show(isMail
        ? 'Готово! Письмо с подтверждением уже летит к вам'
        : 'Задача принята — первые отклики придут в течение 15 минут');
      form.reset();
    });
  });

  /* ---------- Якоря с поправкой на шапку ---------- */
  document.querySelectorAll('a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var id = a.getAttribute('href');
      if (!id || id === '#') return;
      var target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      var top = target.getBoundingClientRect().top + window.scrollY - (header ? header.offsetHeight + 16 : 0);
      window.scrollTo({ top: top, behavior: 'smooth' });
      if (history.replaceState) history.replaceState(null, '', id);
    });
  });
})();
