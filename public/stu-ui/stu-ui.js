/**
 * Stu_UI — Bundle JavaScript Vanilla
 * Grupo Stu, S.A.S. — Sistema Visual v0.1.0
 * Sin dependencias pesadas ni frameworks requeridos.
 */

export const iconos = {
  "apps": "<circle cx=\"5.5\" cy=\"5.5\" r=\"1.25\"/><circle cx=\"12\" cy=\"5.5\" r=\"1.25\"/><circle cx=\"18.5\" cy=\"5.5\" r=\"1.25\"/><circle cx=\"5.5\" cy=\"12\" r=\"1.25\"/><circle cx=\"12\" cy=\"12\" r=\"1.25\"/><circle cx=\"18.5\" cy=\"12\" r=\"1.25\"/><circle cx=\"5.5\" cy=\"18.5\" r=\"1.25\"/><circle cx=\"12\" cy=\"18.5\" r=\"1.25\"/><circle cx=\"18.5\" cy=\"18.5\" r=\"1.25\"/>",
  "menu": "<line x1=\"4\" y1=\"7\" x2=\"20\" y2=\"7\"/><line x1=\"4\" y1=\"12\" x2=\"20\" y2=\"12\"/><line x1=\"4\" y1=\"17\" x2=\"20\" y2=\"17\"/>",
  "home": "<path d=\"M4 11 12 4l8 7\"/><path d=\"M6 9.5V19a1 1 0 0 0 1 1h3.5v-5h3v5H17a1 1 0 0 0 1-1V9.5\"/>",
  "search": "<circle cx=\"10.5\" cy=\"10.5\" r=\"6.5\"/><line x1=\"15.5\" y1=\"15.5\" x2=\"20\" y2=\"20\"/>",
  "close": "<line x1=\"6\" y1=\"6\" x2=\"18\" y2=\"18\"/><line x1=\"18\" y1=\"6\" x2=\"6\" y2=\"18\"/>",
  "plus": "<line x1=\"12\" y1=\"5\" x2=\"12\" y2=\"19\"/><line x1=\"5\" y1=\"12\" x2=\"19\" y2=\"12\"/>",
  "minus": "<line x1=\"5\" y1=\"12\" x2=\"19\" y2=\"12\"/>",
  "check": "<polyline points=\"5 12.5 10 17.5 19 7\"/>",
  "chevron-down": "<polyline points=\"6 9.5 12 15.5 18 9.5\"/>",
  "chevron-up": "<polyline points=\"6 14.5 12 8.5 18 14.5\"/>",
  "chevron-left": "<polyline points=\"14.5 6 8.5 12 14.5 18\"/>",
  "chevron-right": "<polyline points=\"9.5 6 15.5 12 9.5 18\"/>",
  "arrow-left": "<line x1=\"19\" y1=\"12\" x2=\"5\" y2=\"12\"/><polyline points=\"11 6 5 12 11 18\"/>",
  "arrow-right": "<line x1=\"5\" y1=\"12\" x2=\"19\" y2=\"12\"/><polyline points=\"13 6 19 12 13 18\"/>",
  "external-link": "<path d=\"M14 4h6v6\"/><line x1=\"20\" y1=\"4\" x2=\"11\" y2=\"13\"/><path d=\"M18 14v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4\"/>",
  "more-vertical": "<circle cx=\"12\" cy=\"5.5\" r=\"1.25\"/><circle cx=\"12\" cy=\"12\" r=\"1.25\"/><circle cx=\"12\" cy=\"18.5\" r=\"1.25\"/>",
  "more-horizontal": "<circle cx=\"5.5\" cy=\"12\" r=\"1.25\"/><circle cx=\"12\" cy=\"12\" r=\"1.25\"/><circle cx=\"18.5\" cy=\"12\" r=\"1.25\"/>",
  "filter": "<path d=\"M4 6h16l-6 7v5l-4 2v-7z\"/>",
  "sort": "<line x1=\"8\" y1=\"19\" x2=\"8\" y2=\"5\"/><polyline points=\"4 9 8 5 12 9\"/><line x1=\"16\" y1=\"5\" x2=\"16\" y2=\"19\"/><polyline points=\"12 15 16 19 20 15\"/>",
  "user": "<circle cx=\"12\" cy=\"8\" r=\"4\"/><path d=\"M4.5 20a7.5 7.5 0 0 1 15 0\"/>",
  "users": "<circle cx=\"9\" cy=\"8.5\" r=\"3.5\"/><path d=\"M2.5 19.5a6.5 6.5 0 0 1 13 0\"/><path d=\"M16 5.2a3.5 3.5 0 0 1 0 6.6\"/><path d=\"M18 14a6.5 6.5 0 0 1 3.5 5.5\"/>",
  "lock": "<rect x=\"5\" y=\"10.5\" width=\"14\" height=\"9.5\" rx=\"2\"/><path d=\"M8 10.5V8a4 4 0 0 1 8 0v2.5\"/>",
  "key": "<circle cx=\"8\" cy=\"15\" r=\"4\"/><line x1=\"11\" y1=\"12\" x2=\"20\" y2=\"3.5\"/><line x1=\"16.5\" y1=\"7\" x2=\"19\" y2=\"9.5\"/>",
  "shield": "<path d=\"M12 3.5 5 6v5.5c0 4.2 2.8 7.4 7 9 4.2-1.6 7-4.8 7-9V6z\"/>",
  "log-in": "<path d=\"M14 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4\"/><polyline points=\"10 8 14 12 10 16\"/><line x1=\"14\" y1=\"12\" x2=\"4\" y2=\"12\"/>",
  "log-out": "<path d=\"M10 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h4\"/><polyline points=\"16 8 20 12 16 16\"/><line x1=\"20\" y1=\"12\" x2=\"10\" y2=\"12\"/>",
  "eye": "<path d=\"M3 12s3.5-6.5 9-6.5S21 12 21 12s-3.5 6.5-9 6.5S3 12 3 12z\"/><circle cx=\"12\" cy=\"12\" r=\"2.75\"/>",
  "eye-off": "<path d=\"M10 5.7A9 9 0 0 1 12 5.5c5.5 0 9 6.5 9 6.5a15 15 0 0 1-2.6 3.4\"/><path d=\"M6.3 7.8A15 15 0 0 0 3 12s3.5 6.5 9 6.5a8.6 8.6 0 0 0 3.4-.7\"/><line x1=\"4\" y1=\"4\" x2=\"20\" y2=\"20\"/>",
  "mail": "<rect x=\"3.5\" y=\"5.5\" width=\"17\" height=\"13\" rx=\"2\"/><path d=\"m4 7.5 8 6 8-6\"/>",
  "calendar": "<rect x=\"4\" y=\"5.5\" width=\"16\" height=\"14.5\" rx=\"2\"/><line x1=\"4\" y1=\"10\" x2=\"20\" y2=\"10\"/><line x1=\"8.5\" y1=\"3.5\" x2=\"8.5\" y2=\"7\"/><line x1=\"15.5\" y1=\"3.5\" x2=\"15.5\" y2=\"7\"/>",
  "clock": "<circle cx=\"12\" cy=\"12\" r=\"8.5\"/><polyline points=\"12 7.5 12 12 15.5 14\"/>",
  "file": "<path d=\"M14 3.5H7a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8.5z\"/><polyline points=\"14 3.5 14 8.5 19 8.5\"/><line x1=\"8.5\" y1=\"13\" x2=\"15.5\" y2=\"13\"/><line x1=\"8.5\" y1=\"16.5\" x2=\"15.5\" y2=\"16.5\"/>",
  "folder": "<path d=\"M4 7.5a2 2 0 0 1 2-2h3.5l2 2.5H18a2 2 0 0 1 2 2v7.5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z\"/>",
  "download": "<line x1=\"12\" y1=\"4\" x2=\"12\" y2=\"15\"/><polyline points=\"7.5 11 12 15.5 16.5 11\"/><path d=\"M5 19.5h14\"/>",
  "upload": "<line x1=\"12\" y1=\"16\" x2=\"12\" y2=\"5\"/><polyline points=\"7.5 9 12 4.5 16.5 9\"/><path d=\"M5 19.5h14\"/>",
  "edit": "<path d=\"M5 19l1-4L16.5 4.5a2.1 2.1 0 0 1 3 3L9 18z\"/><line x1=\"14.5\" y1=\"6.5\" x2=\"17.5\" y2=\"9.5\"/>",
  "copy": "<rect x=\"8.5\" y=\"8.5\" width=\"11\" height=\"11\" rx=\"2\"/><path d=\"M15.5 8.5V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v7.5a2 2 0 0 0 2 2h2.5\"/>",
  "trash": "<path d=\"M4.5 7h15\"/><path d=\"M9.5 7V5a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v2\"/><path d=\"M6.5 7l.8 11.2a2 2 0 0 0 2 1.8h5.4a2 2 0 0 0 2-1.8L17.5 7\"/>",
  "link": "<path d=\"M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1\"/><path d=\"M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1\"/>",
  "bell": "<path d=\"M6 16.5V11a6 6 0 0 1 12 0v5.5l1.5 2h-15z\"/><path d=\"M10 20.5a2.2 2.2 0 0 0 4 0\"/>",
  "settings": "<line x1=\"4\" y1=\"7\" x2=\"20\" y2=\"7\"/><line x1=\"4\" y1=\"17\" x2=\"20\" y2=\"17\"/><circle cx=\"9\" cy=\"7\" r=\"2.25\"/><circle cx=\"15\" cy=\"17\" r=\"2.25\"/>",
  "globe": "<circle cx=\"12\" cy=\"12\" r=\"8.5\"/><path d=\"M3.5 12h17\"/><path d=\"M12 3.5c2.5 2.4 3.8 5.2 3.8 8.5S14.500 18.100 12 20.500c-2.500-2.400-3.800-5.200-3.800-8.500S9.500 5.900 12 3.500z\"/>",
  "credit-card": "<rect x=\"3.5\" y=\"5.5\" width=\"17\" height=\"13\" rx=\"2\"/><line x1=\"3.5\" y1=\"10\" x2=\"20.5\" y2=\"10\"/><line x1=\"7\" y1=\"14.500\" x2=\"11\" y2=\"14.500\"/>",
  "book": "<path d=\"M12 7c-1.500-1.300-3.500-2-6-2H4.500v13H6c2.500 0 4.500.7 6 2 1.500-1.300 3.500-2 6-2h1.500V5H18c-2.500 0-4.500.7-6 2z\"/><line x1=\"12\" y1=\"7\" x2=\"12\" y2=\"20\"/>",
  "tool": "<path d=\"M14.500 5.500a4 4 0 0 0-4.800 5L4.500 15.700a1.800 1.800 0 0 0 2.600 2.600l5.200-5.200a4 4 0 0 0 5-4.800l-2.600 2.600-2.300-.5-.5-2.300z\"/>",
  "server": "<rect x=\"4\" y=\"4.500\" width=\"16\" height=\"6\" rx=\"2\"/><rect x=\"4\" y=\"13.500\" width=\"16\" height=\"6\" rx=\"2\"/><line x1=\"8\" y1=\"7.500\" x2=\"8.010\" y2=\"7.500\"/><line x1=\"8\" y1=\"16.500\" x2=\"8.010\" y2=\"16.500\"/>",
  "database": "<ellipse cx=\"12\" cy=\"6\" rx=\"7.500\" ry=\"2.500\"/><path d=\"M4.500 6v6c0 1.400 3.400 2.500 7.500 2.500s7.500-1.100 7.500-2.500V6\"/><path d=\"M4.500 12v6c0 1.400 3.400 2.500 7.500 2.500s7.500-1.100 7.500-2.500v-6\"/>",
  "chart": "<line x1=\"4\" y1=\"20\" x2=\"20\" y2=\"20\"/><line x1=\"7\" y1=\"16\" x2=\"7\" y2=\"11\"/><line x1=\"12\" y1=\"16\" x2=\"12\" y2=\"6\"/><line x1=\"17\" y1=\"16\" x2=\"17\" y2=\"13\"/>",
  "building": "<rect x=\"5\" y=\"3.500\" width=\"14\" height=\"17\" rx=\"2\"/><line x1=\"9\" y1=\"8\" x2=\"9.010\" y2=\"8\"/><line x1=\"15\" y1=\"8\" x2=\"15.010\" y2=\"8\"/><line x1=\"9\" y1=\"12\" x2=\"9.010\" y2=\"12\"/><line x1=\"15\" y1=\"12\" x2=\"15.010\" y2=\"12\"/><path d=\"M10 20.500v-4h4v4\"/>",
  "newspaper": "<path d=\"M18 20H6a2 2 0 0 1-2-2V5.500a1 1 0 0 1 1-1h11a1 1 0 0 1 1 1V20z\"/><path d=\"M18 9h1.500a1 1 0 0 1 1 1v8a2 2 0 0 1-2 2H18\"/><line x1=\"7.500\" y1=\"8.500\" x2=\"14.500\" y2=\"8.500\"/><line x1=\"7.500\" y1=\"12\" x2=\"14.500\" y2=\"12\"/><line x1=\"7.500\" y1=\"15.500\" x2=\"11.500\" y2=\"15.500\"/>",
  "info": "<circle cx=\"12\" cy=\"12\" r=\"8.500\"/><line x1=\"12\" y1=\"11\" x2=\"12\" y2=\"16.500\"/><line x1=\"12\" y1=\"7.800\" x2=\"12.010\" y2=\"7.800\"/>",
  "alert-circle": "<circle cx=\"12\" cy=\"12\" r=\"8.500\"/><line x1=\"12\" y1=\"7.500\" x2=\"12\" y2=\"12.500\"/><line x1=\"12\" y1=\"16\" x2=\"12.010\" y2=\"16\"/>",
  "alert-triangle": "<path d=\"M12 4 3.500 19a1 1 0 0 0 .9 1.500h15.200a1 1 0 0 0 .9-1.500z\"/><line x1=\"12\" y1=\"10\" x2=\"12\" y2=\"14.500\"/><line x1=\"12\" y1=\"17.500\" x2=\"12.010\" y2=\"17.500\"/>",
  "check-circle": "<circle cx=\"12\" cy=\"12\" r=\"8.500\"/><polyline points=\"8 12.500 11 15.500 16.500 9.500\"/>",
  "help": "<circle cx=\"12\" cy=\"12\" r=\"8.500\"/><path d=\"M9.500 9.500a2.500 2.500 0 1 1 3.500 2.300c-.7.400-1 .9-1 1.700\"/><line x1=\"12\" y1=\"16.800\" x2=\"12.010\" y2=\"16.800\"/>",
  "sun": "<circle cx=\"12\" cy=\"12\" r=\"3.500\"/><line x1=\"12\" y1=\"3\" x2=\"12\" y2=\"5\"/><line x1=\"12\" y1=\"19\" x2=\"12\" y2=\"21\"/><line x1=\"3\" y1=\"12\" x2=\"5\" y2=\"12\"/><line x1=\"19\" y1=\"12\" x2=\"21\" y2=\"12\"/><line x1=\"5.600\" y1=\"5.600\" x2=\"7\" y2=\"7\"/><line x1=\"17\" y1=\"17\" x2=\"18.400\" y2=\"18.400\"/><line x1=\"5.600\" y1=\"18.400\" x2=\"7\" y2=\"17\"/><line x1=\"17\" y1=\"7\" x2=\"18.400\" y2=\"5.600\"/>",
  "moon": "<path d=\"M19.500 14.500A8 8 0 0 1 9.500 4.500a8 8 0 1 0 10 10z\"/>"
};
export const ATRIBUTOS_SVG = {
  "xmlns": "http://www.w3.org/2000/svg",
  "viewBox": "0 0 24 24",
  "width": "24",
  "height": "24",
  "fill": "none",
  "stroke": "currentColor",
  "stroke-width": "1.75",
  "stroke-linecap": "round",
  "stroke-linejoin": "round"
};

/**
 * Stu_UI — Controlador Modal Accesible
 * Grupo Stu, S.A.S. — Sistema Visual v0.1.0
 */

let activeOpener = null;

function getFocusableElements(container) {
  const selector = 'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
  return Array.from(container.querySelectorAll(selector));
}

function handleKeydown(event) {
  const openBackdrop = document.querySelector('.stu-modal-backdrop.is-open');
  if (!openBackdrop) return;

  if (event.key === 'Escape') {
    event.preventDefault();
    StuModal.close(openBackdrop);
    return;
  }

  if (event.key === 'Tab') {
    const modal = openBackdrop.querySelector('.stu-modal');
    if (!modal) return;
    const focusables = getFocusableElements(modal);
    if (focusables.length === 0) {
      event.preventDefault();
      return;
    }
    const first = focusables[0];
    const last = focusables[focusables.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }
}

const StuModal = {
  open(target) {
    const el = typeof target === 'string' ? document.querySelector(target) : target;
    if (!el) return;

    const backdrop = el.classList.contains('stu-modal-backdrop') ? el : el.closest('.stu-modal-backdrop');
    if (!backdrop) return;

    activeOpener = document.activeElement;
    backdrop.classList.add('is-open');
    backdrop.setAttribute('aria-hidden', 'false');

    const modal = backdrop.querySelector('.stu-modal');
    if (modal) {
      modal.setAttribute('role', 'dialog');
      modal.setAttribute('aria-modal', 'true');
      const focusables = getFocusableElements(modal);
      if (focusables.length > 0) {
        focusables[0].focus();
      }
    }

    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', handleKeydown);
  },

  close(target) {
    const el = typeof target === 'string' ? document.querySelector(target) : target;
    if (!el) return;

    const backdrop = el.classList.contains('stu-modal-backdrop') ? el : el.closest('.stu-modal-backdrop');
    if (!backdrop) return;

    backdrop.classList.remove('is-open');
    backdrop.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    document.removeEventListener('keydown', handleKeydown);

    if (activeOpener && typeof activeOpener.focus === 'function') {
      activeOpener.focus();
      activeOpener = null;
    }
  },

  init() {
    document.addEventListener('click', (event) => {
      const toggle = event.target.closest('[data-stu-toggle="modal"]');
      if (toggle) {
        event.preventDefault();
        const target = toggle.getAttribute('data-stu-target') || toggle.getAttribute('href');
        if (target) StuModal.open(target);
        return;
      }

      const dismiss = event.target.closest('[data-stu-dismiss="modal"]');
      if (dismiss) {
        event.preventDefault();
        const backdrop = dismiss.closest('.stu-modal-backdrop');
        if (backdrop) StuModal.close(backdrop);
        return;
      }

      // Cerrar al hacer clic en el telón de fondo exterior
      if (event.target.classList.contains('stu-modal-backdrop') && event.target.classList.contains('is-open')) {
        StuModal.close(event.target);
      }
    });
  }
};

/**
 * Stu_UI — Controlador de Panel Lateral / Drawer Accesible
 * Grupo Stu, S.A.S. — Sistema Visual v0.1.0
 */

let activeOpener = null;

function getFocusableElements(container) {
  const selector = 'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
  return Array.from(container.querySelectorAll(selector));
}

function handleKeydown(event) {
  const openDrawer = document.querySelector('.stu-drawer.is-open');
  if (!openDrawer) return;

  if (event.key === 'Escape') {
    event.preventDefault();
    StuDrawer.close(openDrawer);
    return;
  }

  if (event.key === 'Tab') {
    const focusables = getFocusableElements(openDrawer);
    if (focusables.length === 0) {
      event.preventDefault();
      return;
    }
    const first = focusables[0];
    const last = focusables[focusables.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }
}

const StuDrawer = {
  open(target) {
    const drawer = typeof target === 'string' ? document.querySelector(target) : target;
    if (!drawer) return;

    const backdropId = drawer.getAttribute('data-stu-backdrop') || 'stu-drawer-backdrop-default';
    let backdrop = document.getElementById(backdropId);

    if (!backdrop) {
      backdrop = document.createElement('div');
      backdrop.id = backdropId;
      backdrop.className = 'stu-drawer-backdrop';
      document.body.appendChild(backdrop);
    }

    activeOpener = document.activeElement;
    drawer.classList.add('is-open');
    drawer.setAttribute('aria-hidden', 'false');
    drawer.setAttribute('role', 'dialog');
    drawer.setAttribute('aria-modal', 'true');
    backdrop.classList.add('is-open');

    const focusables = getFocusableElements(drawer);
    if (focusables.length > 0) {
      focusables[0].focus();
    }

    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', handleKeydown);
  },

  close(target) {
    const drawer = typeof target === 'string' ? document.querySelector(target) : target;
    if (!drawer) return;

    drawer.classList.remove('is-open');
    drawer.setAttribute('aria-hidden', 'true');

    const backdropId = drawer.getAttribute('data-stu-backdrop') || 'stu-drawer-backdrop-default';
    const backdrop = document.getElementById(backdropId);
    if (backdrop) {
      backdrop.classList.remove('is-open');
    }

    document.body.style.overflow = '';
    document.removeEventListener('keydown', handleKeydown);

    if (activeOpener && typeof activeOpener.focus === 'function') {
      activeOpener.focus();
      activeOpener = null;
    }
  },

  init() {
    document.addEventListener('click', (event) => {
      const toggle = event.target.closest('[data-stu-toggle="drawer"]');
      if (toggle) {
        event.preventDefault();
        const target = toggle.getAttribute('data-stu-target') || toggle.getAttribute('href');
        if (target) StuDrawer.open(target);
        return;
      }

      const dismiss = event.target.closest('[data-stu-dismiss="drawer"]');
      if (dismiss) {
        event.preventDefault();
        const drawer = dismiss.closest('.stu-drawer');
        if (drawer) StuDrawer.close(drawer);
        return;
      }

      if (event.target.classList.contains('stu-drawer-backdrop') && event.target.classList.contains('is-open')) {
        const openDrawer = document.querySelector('.stu-drawer.is-open');
        if (openDrawer) StuDrawer.close(openDrawer);
      }
    });
  }
};

/**
 * Stu_UI — Controlador de Menú Desplegable Accesible
 * Grupo Stu, S.A.S. — Sistema Visual v0.1.0
 */

const StuDropdown = {
  open(dropdown) {
    if (!dropdown) return;
    this.closeAll();
    dropdown.classList.add('is-open');

    const trigger = dropdown.querySelector('[data-stu-toggle="dropdown"]');
    if (trigger) trigger.setAttribute('aria-expanded', 'true');

    const menu = dropdown.querySelector('.stu-dropdown__menu');
    if (menu) {
      menu.setAttribute('role', 'menu');
      const items = menu.querySelectorAll('.stu-dropdown__item');
      if (items.length > 0) {
        items[0].focus();
      }
    }
  },

  close(dropdown) {
    if (!dropdown) return;
    dropdown.classList.remove('is-open');

    const trigger = dropdown.querySelector('[data-stu-toggle="dropdown"]');
    if (trigger) trigger.setAttribute('aria-expanded', 'false');
  },

  toggle(dropdown) {
    if (!dropdown) return;
    if (dropdown.classList.contains('is-open')) {
      this.close(dropdown);
    } else {
      this.open(dropdown);
    }
  },

  closeAll() {
    document.querySelectorAll('.stu-dropdown.is-open').forEach((d) => this.close(d));
  },

  init() {
    document.addEventListener('click', (event) => {
      const toggle = event.target.closest('[data-stu-toggle="dropdown"]');
      if (toggle) {
        event.preventDefault();
        event.stopPropagation();
        const dropdown = toggle.closest('.stu-dropdown');
        if (dropdown) StuDropdown.toggle(dropdown);
        return;
      }

      // Si se hace clic fuera de cualquier dropdown abierto, cerrar todos
      if (!event.target.closest('.stu-dropdown')) {
        StuDropdown.closeAll();
      }
    });

    document.addEventListener('keydown', (event) => {
      const openDropdown = document.querySelector('.stu-dropdown.is-open');
      if (!openDropdown) return;

      if (event.key === 'Escape') {
        event.preventDefault();
        const trigger = openDropdown.querySelector('[data-stu-toggle="dropdown"]');
        StuDropdown.close(openDropdown);
        if (trigger) trigger.focus();
        return;
      }

      const menu = openDropdown.querySelector('.stu-dropdown__menu');
      if (!menu) return;
      const items = Array.from(menu.querySelectorAll('.stu-dropdown__item'));
      if (items.length === 0) return;

      const currentIndex = items.indexOf(document.activeElement);

      if (event.key === 'ArrowDown') {
        event.preventDefault();
        const nextIndex = currentIndex < items.length - 1 ? currentIndex + 1 : 0;
        items[nextIndex].focus();
      } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        const prevIndex = currentIndex > 0 ? currentIndex - 1 : items.length - 1;
        items[prevIndex].focus();
      } else if (event.key === 'Home') {
        event.preventDefault();
        items[0].focus();
      } else if (event.key === 'End') {
        event.preventDefault();
        items[items.length - 1].focus();
      }
    });
  }
};

/**
 * Stu_UI — Notificaciones Toast Accesibles
 * Grupo Stu, S.A.S. — Sistema Visual v0.1.0
 */

const ICONOS_TOAST = {
  info: '<svg class="stu-toast__icon stu-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="8.5"/><line x1="12" y1="11" x2="12" y2="16.5"/><line x1="12" y1="7.8" x2="12.01" y2="7.8"/></svg>',
  success: '<svg class="stu-toast__icon stu-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="8.5"/><polyline points="8 12.5 11 15.5 16.5 9.5"/></svg>',
  warning: '<svg class="stu-toast__icon stu-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4 3.5 19a1 1 0 0 0 .9 1.5h15.2a1 1 0 0 0 .9-1.5z"/><line x1="12" y1="10" x2="12" y2="14.5"/><line x1="12" y1="17.5" x2="12.01" y2="17.5"/></svg>',
  danger: '<svg class="stu-toast__icon stu-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="8.5"/><line x1="12" y1="7.5" x2="12" y2="12.5"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>'
};

const ICONO_CERRAR = '<svg class="stu-icon stu-icon--sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><line x1="6" y1="6" x2="18" y2="18"/><line x1="18" y1="6" x2="6" y2="18"/></svg>';

function getOrCreateContainer() {
  let container = document.querySelector('.stu-toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'stu-toast-container';
    container.setAttribute('aria-live', 'polite');
    container.setAttribute('aria-atomic', 'false');
    document.body.appendChild(container);
  }
  return container;
}

const StuToast = {
  show({ title = '', message = '', type = 'info', duration = 4500 }) {
    const container = getOrCreateContainer();

    const toast = document.createElement('div');
    toast.className = `stu-toast stu-toast--${type}`;
    toast.setAttribute('role', type === 'danger' ? 'alert' : 'status');

    const iconHtml = ICONOS_TOAST[type] || ICONOS_TOAST.info;

    toast.innerHTML = `
      ${iconHtml}
      <div class="stu-toast__content">
        ${title ? `<div class="stu-toast__title">${title}</div>` : ''}
        ${message ? `<div class="stu-toast__message">${message}</div>` : ''}
      </div>
      <button type="button" class="stu-toast__close" aria-label="Cerrar notificación">
        ${ICONO_CERRAR}
      </button>
    `;

    const closeBtn = toast.querySelector('.stu-toast__close');
    let timer = null;

    const dismiss = () => {
      if (timer) clearTimeout(timer);
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(8px)';
      toast.style.transition = 'opacity 150ms ease, transform 150ms ease';
      setTimeout(() => {
        if (toast.parentElement) toast.parentElement.removeChild(toast);
      }, 160);
    };

    closeBtn.addEventListener('click', dismiss);

    if (duration > 0) {
      timer = setTimeout(dismiss, duration);
    }

    container.appendChild(toast);
    return toast;
  }
};


export class StuIconElement extends HTMLElement {
  static get observedAttributes() { return ['name', 'size']; }
  connectedCallback() { this.render(); }
  attributeChangedCallback(n, o, v) { if (o !== v) this.render(); }
  render() {
    const name = this.getAttribute('name');
    const size = this.getAttribute('size') || '20';
    const inner = iconos[name];
    if (!inner) { this.innerHTML = ''; return; }
    this.innerHTML = `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" class="stu-icon">${inner}</svg>`;
  }
}

export class StuButtonElement extends HTMLElement {
  static get observedAttributes() { return ['variant', 'size', 'disabled', 'loading']; }
  connectedCallback() { this.render(); }
  attributeChangedCallback() { this.render(); }
  render() {
    const variant = this.getAttribute('variant') || 'primary';
    const size = this.getAttribute('size') || 'md';
    const isDisabled = this.hasAttribute('disabled');
    const isLoading = this.hasAttribute('loading');
    let btn = this.querySelector('button');
    if (!btn) {
      btn = document.createElement('button');
      btn.type = this.getAttribute('type') || 'button';
      while (this.firstChild) btn.appendChild(this.firstChild);
      this.appendChild(btn);
    }
    btn.className = `stu-btn stu-btn--${variant}${size === 'sm' ? ' stu-btn--sm' : ''}${isLoading ? ' is-loading' : ''}`;
    if (isDisabled) btn.setAttribute('disabled', ''); else btn.removeAttribute('disabled');
  }
}

export const StuTheme = {
  get() { return document.documentElement.getAttribute('data-theme') || 'auto'; },
  set(theme) {
    if (theme === 'auto') {
      document.documentElement.removeAttribute('data-theme');
      try { localStorage.removeItem('stu-theme'); } catch (_) {}
    } else {
      document.documentElement.setAttribute('data-theme', theme);
      try { localStorage.setItem('stu-theme', theme); } catch (_) {}
    }
    window.dispatchEvent(new CustomEvent('stu-theme-changed', { detail: { theme } }));
  },
  toggle() {
    const current = this.get();
    if (current === 'dark') {
      this.set('light');
    } else if (current === 'light') {
      this.set('dark');
    } else {
      const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      this.set(prefersDark ? 'light' : 'dark');
    }
  },
  init() {
    try {
      const saved = localStorage.getItem('stu-theme');
      if (saved) document.documentElement.setAttribute('data-theme', saved);
    } catch (_) {}
    document.addEventListener('click', (e) => {
      const toggle = e.target.closest('[data-stu-theme-toggle]');
      if (toggle) {
        e.preventDefault();
        StuTheme.toggle();
      }
    });
  }
};

export function registerWebComponents() {
  if (typeof customElements !== 'undefined') {
    if (!customElements.get('stu-icon')) customElements.define('stu-icon', StuIconElement);
    if (!customElements.get('stu-button')) customElements.define('stu-button', StuButtonElement);
  }
}

export function initStuUI() {
  StuModal.init();
  StuDrawer.init();
  StuDropdown.init();
  StuTheme.init();
  registerWebComponents();
}

if (typeof window !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initStuUI);
  } else {
    initStuUI();
  }
  window.StuUI = {
    StuModal,
    StuDrawer,
    StuDropdown,
    StuToast,
    StuTheme,
    iconos,
    init: initStuUI
  };
}

export { StuModal, StuDrawer, StuDropdown, StuToast };
