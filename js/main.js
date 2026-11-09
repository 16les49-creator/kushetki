/* ==========================================================================
   Кушарики — скрипты лендинга
   ========================================================================== */
(function () {
  'use strict';

  /* ------------------------------------------------------------------
     0. Куда отправлять заявки
     ------------------------------------------------------------------
     Вставьте сюда URL веб-приложения Google Apps Script.
     Пошаговая настройка — в google-sheets/README.md.
     Пока строка пустая, заявки выводятся только в консоль браузера.
     ------------------------------------------------------------------ */
  const FORM_ENDPOINT = 'https://script.google.com/macros/s/AKfycbwBBL7KVF_qKAFLDfn2NMse20JVVFdV6YtB5klgV3PJxkGfEtEpx1X-ZT6w1l2F1AoYAw/exec';

  /* ------------------------------------------------------------------
     1. Шапка: тень/граница при прокрутке
     ------------------------------------------------------------------ */
  const header = document.getElementById('header');

  const onScroll = () => {
    if (!header) return;
    header.classList.toggle('is-scrolled', window.scrollY > 10);
  };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* ------------------------------------------------------------------
     2. Мобильное меню
     ------------------------------------------------------------------ */
  const burger = document.getElementById('burger');
  const nav = document.getElementById('nav');

  const closeNav = () => {
    if (!burger || !nav) return;
    burger.classList.remove('is-open');
    nav.classList.remove('is-open');
    burger.setAttribute('aria-expanded', 'false');
    burger.setAttribute('aria-label', 'Открыть меню');
  };

  if (burger && nav) {
    burger.addEventListener('click', () => {
      const open = nav.classList.toggle('is-open');
      burger.classList.toggle('is-open', open);
      burger.setAttribute('aria-expanded', String(open));
      burger.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
    });

    nav.addEventListener('click', (e) => {
      if (e.target.closest('a')) closeNav();
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeNav();
    });

    window.addEventListener('resize', () => {
      if (window.innerWidth > 860) closeNav();
    });
  }

  /* ------------------------------------------------------------------
     3. Появление блоков при скролле
     ------------------------------------------------------------------ */
  const revealItems = document.querySelectorAll('.reveal');

  if ('IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

    revealItems.forEach((el) => revealObserver.observe(el));
  } else {
    revealItems.forEach((el) => el.classList.add('is-visible'));
  }

  /* ------------------------------------------------------------------
     4. Плавная прокрутка к якорям (с учётом липкой шапки)
     ------------------------------------------------------------------ */
  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener('click', (e) => {
      // Кнопки «Заказать» открывают модальное окно, а не скроллят страницу
      if (link.hasAttribute('data-open-order')) return;

      const id = link.getAttribute('href');
      if (!id || id === '#') return;

      const target = document.querySelector(id);
      if (!target) return;

      e.preventDefault();
      const offset = (header ? header.offsetHeight : 0) + 12;
      const top = target.getBoundingClientRect().top + window.scrollY - offset;

      window.scrollTo({
        top: Math.max(top, 0),
        behavior: 'smooth'
      });
      history.replaceState(null, '', id);
    });
  });

  /* ------------------------------------------------------------------
     5. Формы: валидация и отправка
     ------------------------------------------------------------------
     На странице две формы: модальное окно «Заказать» и блок «Заявка»
     внизу. Чтобы отправлять заявки на сервер, замените вызов
     sendToBackend() на реальный запрос (Telegram-бот, CRM, таблица).
     ------------------------------------------------------------------ */
  const validators = {
    name(value) {
      if (!value.trim()) return 'Укажите, как к вам обращаться';
      if (value.trim().length < 2) return 'Имя слишком короткое';
      return '';
    },
    surname(value) {
      if (!value.trim()) return 'Укажите фамилию';
      if (value.trim().length < 2) return 'Фамилия слишком короткая';
      return '';
    },
    phone(value) {
      const digits = value.replace(/\D/g, '');
      if (!value.trim()) return 'Укажите телефон для связи';
      if (digits.length < 10) return 'Некорректный номер телефона';
      return '';
    },
    email(value) {
      if (!value.trim()) return 'Укажите email';
      if (!/^[^\s@]+@[^\s@]+\.[a-zA-Zа-яА-Я]{2,}$/.test(value.trim())) {
        return 'Проверьте правильность email';
      }
      return '';
    }
  };

  function setError(formEl, input, message) {
    const field = input.closest('.field');
    const errorBox = formEl.querySelector('[data-error-for="' + input.name + '"]');
    if (field) field.classList.toggle('has-error', Boolean(message));
    if (errorBox) errorBox.textContent = message;
  }

  function validateField(formEl, input) {
    const validator = validators[input.name];
    if (!validator) return true;
    const message = validator(input.value);
    setError(formEl, input, message);
    return !message;
  }

  function showFormError(formEl, message) {
    const box = formEl.querySelector('[data-form-error]');
    if (!box) return;
    box.textContent = message;
    box.classList.add('is-visible');
  }

  function hideFormError(formEl) {
    const box = formEl.querySelector('[data-form-error]');
    if (box) box.classList.remove('is-visible');
  }

  /**
   * Отправка заявки.
   * Пустой FORM_ENDPOINT — демо-режим: данные только в консоль.
   * Возвращает true, если заявка принята.
   */
  async function sendToBackend(data) {
    if (!FORM_ENDPOINT) {
      console.log('Заявка «Кушарики»:', data);
      return true;
    }

    try {
      const response = await fetch(FORM_ENDPOINT, {
        method: 'POST',
        // text/plain — чтобы браузер не делал CORS-preflight:
        // Apps Script не отвечает на OPTIONS-запросы
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(data)
      });

      if (!response.ok) return false;

      const result = await response.json().catch(() => ({ ok: true }));
      return result.ok !== false;
    } catch (err) {
      console.error('Не удалось отправить заявку:', err);
      return false;
    }
  }

  function initForm(formEl, successBox, label) {
    if (!formEl) return;

    const inputs = Object.keys(validators)
      .map((name) => formEl.elements[name])
      .filter(Boolean);

    inputs.forEach((input) => {
      input.addEventListener('blur', () => validateField(formEl, input));
      input.addEventListener('input', () => {
        if (input.closest('.field').classList.contains('has-error')) {
          validateField(formEl, input);
        }
      });
    });

    formEl.addEventListener('submit', async (e) => {
      e.preventDefault();
      hideFormError(formEl);

      const valid = inputs.map((input) => validateField(formEl, input)).every(Boolean);

      if (!valid) {
        const firstError = formEl.querySelector('.field.has-error .field__input');
        if (firstError) firstError.focus();
        return;
      }

      const data = Object.fromEntries(
        inputs.map((input) => [input.name, input.value.trim()])
      );
      data.form = label;
      data.page = location.href;

      const submitBtn = formEl.querySelector('button[type="submit"]');
      const btnText = submitBtn ? submitBtn.textContent : '';
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Отправляем…';
      }

      const sent = await sendToBackend(data);

      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = btnText;
      }

      if (!sent) {
        showFormError(
          formEl,
          'Не удалось отправить заявку. Проверьте интернет и попробуйте ещё раз или позвоните: +7 911 964-19-52.'
        );
        return;
      }

      formEl.reset();
      inputs.forEach((input) => setError(formEl, input, ''));
      if (successBox) {
        successBox.classList.add('is-visible');
        successBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    });
  }

  initForm(
    document.getElementById('bookingForm'),
    document.getElementById('formSuccess'),
    'блок «Заявка»'
  );
  initForm(
    document.getElementById('orderForm'),
    document.getElementById('orderSuccess'),
    'модальное окно'
  );

  /* ------------------------------------------------------------------
     5.1 Модальное окно «Заказать»
     ------------------------------------------------------------------ */
  const orderModal = document.getElementById('orderModal');
  const orderSuccess = document.getElementById('orderSuccess');
  const orderOpeners = document.querySelectorAll('[data-open-order]');
  let lastFocused = null;

  const openOrder = () => {
    if (!orderModal) return;
    lastFocused = document.activeElement;
    if (orderSuccess) orderSuccess.classList.remove('is-visible');
    const orderFormEl = document.getElementById('orderForm');
    if (orderFormEl) hideFormError(orderFormEl);
    orderModal.classList.add('is-open');
    orderModal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('is-locked');
    const dialogBody = orderModal.querySelector('.modal__body');
    if (dialogBody) dialogBody.scrollTop = 0;
    const first = orderModal.querySelector('.field__input');
    if (first) window.setTimeout(() => first.focus(), 80);
  };

  const closeOrder = () => {
    if (!orderModal || !orderModal.classList.contains('is-open')) return;
    orderModal.classList.remove('is-open');
    orderModal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('is-locked');
    if (lastFocused && typeof lastFocused.focus === 'function') lastFocused.focus();
  };

  if (orderModal) {
    orderOpeners.forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        openOrder();
      });
    });

    orderModal.querySelectorAll('[data-order-close]').forEach((el) => {
      el.addEventListener('click', closeOrder);
    });

    document.addEventListener('keydown', (e) => {
      if (!orderModal.classList.contains('is-open')) return;

      if (e.key === 'Escape') {
        closeOrder();
        return;
      }
      if (e.key !== 'Tab') return;

      const focusable = Array.from(orderModal.querySelectorAll(
        'a[href], button:not([disabled]), input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])'
      )).filter((el) => el.offsetParent !== null);
      if (!focusable.length) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    });
  }

  /* ------------------------------------------------------------------
     6. Плавающая кнопка ИИ-помощника
     ------------------------------------------------------------------
     Ссылка задаётся в index.html (атрибут href у .ai-fab__btn).
     Ниже — «заглушка», которая срабатывает, пока ссылка не заменена.
     ------------------------------------------------------------------ */
  const aiBtn = document.querySelector('.ai-fab__btn');
  const aiLabel = document.querySelector('.ai-fab__label');

  if (aiBtn) {
    aiBtn.addEventListener('click', (e) => {
      const href = aiBtn.getAttribute('href') || '';
      if (href.indexOf('ВСТАВЬТЕ') !== -1 || href === '#' || href === '') {
        e.preventDefault();
        if (aiLabel) {
          const original = aiLabel.textContent;
          aiLabel.textContent = 'Ссылка не настроена';
          aiLabel.classList.add('is-warning');
          setTimeout(() => {
            aiLabel.textContent = original;
            aiLabel.classList.remove('is-warning');
          }, 2600);
        }
      }
    });
  }
})();
