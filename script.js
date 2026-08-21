/* tasko — интерактив лендинга */
(function () {
  'use strict';

  /* ---------- Мобильное меню ---------- */
  var header = document.querySelector('.header');
  var burger = document.querySelector('.burger');
  var menu = document.getElementById('mobilemenu');

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

  /* ---------- Тень у шапки при скролле ---------- */
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
        setTimeout(function () { el.classList.add('is-in'); }, i * 70);
        io.unobserve(el);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    items.forEach(function (el) { io.observe(el); });
  } else {
    items.forEach(function (el) { el.classList.add('is-in'); });
  }

  /* ---------- Аккордеон: открыт только один пункт ---------- */
  var details = document.querySelectorAll('.acc__item');
  details.forEach(function (d) {
    d.addEventListener('toggle', function () {
      if (!d.open) return;
      details.forEach(function (other) {
        if (other !== d) other.open = false;
      });
    });
  });

  /* ---------- Формы ---------- */
  document.querySelectorAll('.subscribe').forEach(function (form) {
    var input = form.querySelector('input');
    var msg = form.querySelector('.form__msg');

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var value = (input.value || '').trim();

      if (!value) {
        show(input.type === 'email' ? 'Введите e-mail' : 'Опишите задачу — хотя бы парой слов');
        input.focus();
        return;
      }
      if (input.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value)) {
        show('Проверьте адрес — кажется, есть опечатка');
        input.focus();
        return;
      }

      show(input.type === 'email'
        ? 'Готово! Письмо с подтверждением уже летит к вам'
        : 'Задача принята — исполнители откликнутся в течение 15 минут');
      form.reset();
    });

    function show(text) {
      if (!msg) return;
      msg.textContent = text;
      msg.classList.add('is-on');
      clearTimeout(msg._t);
      msg._t = setTimeout(function () { msg.classList.remove('is-on'); }, 5000);
    }
  });

  /* ---------- Плавный переход по якорям с учётом шапки ---------- */
  document.querySelectorAll('a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var id = a.getAttribute('href');
      if (!id || id === '#') return;
      var target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      var top = target.getBoundingClientRect().top + window.scrollY - (header ? header.offsetHeight + 12 : 0);
      window.scrollTo({ top: top, behavior: 'smooth' });
      if (history.replaceState) history.replaceState(null, '', id);
    });
  });
})();
