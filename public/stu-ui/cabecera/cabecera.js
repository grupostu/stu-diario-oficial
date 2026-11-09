/**
 * Stu_UI — Cabecera Compartida Institucional
 * Grupo Stu, S.A.S. — Sistema Visual v0.1.0
 * Web Component <stu-cabecera> y API Vanilla JS
 * Rejilla de Apps 3x3 + Panel de Cuenta / Inicio de Sesión
 * Sin dependencias externas
 */

// Catálogo embebido oficial (mismo contenido que catalogo-apps.json)
export const CATALOGO_APPS = {
  version: "1.0.0",
  catalogoVersion: "2026.11",
  cuentaHub: {
    name: "Cuenta Stu",
    url: "https://cuenta.grupostu.com",
    loginUrl: "https://cuenta.grupostu.com/login",
    logoutUrl: "https://cuenta.grupostu.com/logout",
    switchUrl: "https://cuenta.grupostu.com/switch",
    privacyUrl: "https://grupostu.com/es/legal/privacidad",
    termsUrl: "https://grupostu.com/es/legal/terminos"
  },
  apps: [
    {
      id: "herramientas",
      name: "Stu Herramienta",
      shortName: "Herramienta",
      description: "Cálculos fiscales salvadoreños, IVA, retenciones, utilidades y finanzas",
      url: "https://herramientas.grupostu.com",
      icon: "tool",
      monogram: "HT",
      category: "Finanzas & Fiscal",
      favorite: true,
      color: "#10B981"
    },
    {
      id: "studio",
      name: "Stu Studio",
      shortName: "Studio",
      description: "Suite creativa, diseño y producción multimedia asistida",
      url: "https://stustudioapp.grupostu.com",
      icon: "edit",
      monogram: "SA",
      category: "Creatividad",
      favorite: true,
      color: "#6366F1"
    },
    {
      id: "aprende",
      name: "Stu Aprende",
      shortName: "Aprende",
      description: "Cursos profesionales, formación ejecutiva y capacitación continua",
      url: "https://stuaprende.grupostu.com",
      icon: "book",
      monogram: "AP",
      category: "Educación",
      favorite: true,
      color: "#06B6D4"
    },
    {
      id: "crediflow",
      name: "CrediFlow ERP",
      shortName: "CrediFlow",
      description: "Gestión de microcréditos, cartera financiera y contabilidad empresarial",
      url: "https://crediflowerp.grupostu.com",
      icon: "credit-card",
      monogram: "CF",
      category: "Finanzas & Fiscal",
      favorite: true,
      color: "#10B981"
    },
    {
      id: "hosting",
      name: "Stu Hosting",
      shortName: "Hosting",
      description: "Servidores cloud, dominios, infraestructura y alojamiento gestionado",
      url: "https://hosting.grupostu.com",
      icon: "server",
      monogram: "HO",
      category: "Infraestructura",
      favorite: false,
      color: "#06B6D4"
    },
    {
      id: "erp",
      name: "Stu ERP",
      shortName: "ERP",
      description: "Control integral de inventarios, compras, ventas y facturación",
      url: "https://erp.grupostu.com",
      icon: "database",
      monogram: "ER",
      category: "Empresarial",
      favorite: false,
      color: "#6366F1"
    },
    {
      id: "clasificados",
      name: "Stu Clasificados",
      shortName: "Clasificados",
      description: "Marketplace de comercio local, compraventa y anuncios clasificados",
      url: "https://clasificados.grupostu.com",
      icon: "search",
      monogram: "CL",
      category: "Comercio",
      favorite: false,
      color: "#10B981"
    },
    {
      id: "diarios",
      name: "Stu Diario Oficial",
      shortName: "Diario Oficial",
      description: "Búsqueda, archivo histórico y análisis normativo de diarios oficiales",
      url: "https://diariosoficiales.grupostu.com",
      icon: "newspaper",
      monogram: "DO",
      category: "Legal & Normativo",
      favorite: false,
      color: "#0F172A"
    },
    {
      id: "holding",
      name: "Grupo Stu",
      shortName: "Grupo Stu",
      description: "Portal corporativo, gobierno, transparencia e información institucional",
      url: "https://grupostu.com",
      icon: "building",
      monogram: "GS",
      category: "Corporativo",
      favorite: false,
      color: "#020617"
    },
    {
      id: "stream",
      name: "Stu Streaming & Radio",
      shortName: "Streaming",
      description: "Transmisiones en vivo, audio institucional y streaming digital",
      url: "https://stream.grupostu.com",
      icon: "globe",
      monogram: "SR",
      category: "Multimedia",
      favorite: false,
      color: "#06B6D4"
    }
  ]
};

// Set de iconos SVG institucional de Stu_UI (área útil 24x24, trazo 1.75px)
const ICONOS_CABECERA = {
  apps: '<circle cx="5.5" cy="5.5" r="1.25"/><circle cx="12" cy="5.5" r="1.25"/><circle cx="18.5" cy="5.5" r="1.25"/><circle cx="5.5" cy="12" r="1.25"/><circle cx="12" cy="12" r="1.25"/><circle cx="18.5" cy="12" r="1.25"/><circle cx="5.5" cy="18.5" r="1.25"/><circle cx="12" cy="18.5" r="1.25"/><circle cx="18.5" cy="18.5" r="1.25"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4.5 20a7.5 7.5 0 0 1 15 0"/>',
  users: '<circle cx="9" cy="8.5" r="3.5"/><path d="M2.5 19.5a6.5 6.5 0 0 1 13 0"/><path d="M16 5.2a3.5 3.5 0 0 1 0 6.6"/><path d="M18 14a6.5 6.5 0 0 1 3.5 5.5"/>',
  'log-in': '<path d="M14 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4"/><polyline points="10 8 14 12 10 16"/><line x1="14" y1="12" x2="4" y2="12"/>',
  'log-out': '<path d="M10 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h4"/><polyline points="16 8 20 12 16 16"/><line x1="20" y1="12" x2="10" y2="12"/>',
  tool: '<path d="M14.500 5.500a4 4 0 0 0-4.800 5L4.500 15.700a1.800 1.800 0 0 0 2.600 2.600l5.200-5.200a4 4 0 0 0 5-4.800l-2.600 2.600-2.300-.5-.5-2.300z"/>',
  edit: '<path d="M5 19l1-4L16.5 4.5a2.1 2.1 0 0 1 3 3L9 18z"/><line x1="14.5" y1="6.5" x2="17.5" y2="9.5"/>',
  book: '<path d="M12 7c-1.500-1.300-3.500-2-6-2H4.500v13H6c2.500 0 4.500.7 6 2 1.500-1.300 3.500-2 6-2h1.500V5H18c-2.500 0-4.500.7-6 2z"/><line x1="12" y1="7" x2="12" y2="20"/>',
  'credit-card': '<rect x="3.5" y="5.5" width="17" height="13" rx="2"/><line x1="3.5" y1="10" x2="20.5" y2="10"/><line x1="7" y1="14.500" x2="11" y2="14.500"/>',
  server: '<rect x="4" y="4.500" width="16" height="6" rx="2"/><rect x="4" y="13.500" width="16" height="6" rx="2"/><line x1="8" y1="7.500" x2="8.010" y2="7.500"/><line x1="8" y1="16.500" x2="8.010" y2="16.500"/>',
  database: '<ellipse cx="12" cy="6" rx="7.500" ry="2.500"/><path d="M4.500 6v6c0 1.400 3.400 2.500 7.500 2.500s7.500-1.100 7.500-2.500V6"/><path d="M4.500 12v6c0 1.400 3.400 2.500 7.500 2.500s7.500-1.100 7.500-2.500v-6"/>',
  search: '<circle cx="10.5" cy="10.5" r="6.5"/><line x1="15.5" y1="15.5" x2="20" y2="20"/>',
  newspaper: '<path d="M18 20H6a2 2 0 0 1-2-2V5.500a1 1 0 0 1 1-1h11a1 1 0 0 1 1 1V20z"/><path d="M18 9h1.500a1 1 0 0 1 1 1v8a2 2 0 0 1-2 2H18"/><line x1="7.500" y1="8.500" x2="14.500" y2="8.500"/><line x1="7.500" y1="12" x2="14.500" y2="12"/><line x1="7.500" y1="15.500" x2="11.500" y2="15.500"/>',
  building: '<rect x="5" y="3.500" width="14" height="17" rx="2"/><line x1="9" y1="8" x2="9.010" y2="8"/><line x1="15" y1="8" x2="15.010" y2="8"/><line x1="9" y1="12" x2="9.010" y2="12"/><line x1="15" y1="12" x2="15.010" y2="12"/><path d="M10 20.500v-4h4v4"/>',
  globe: '<circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17"/><path d="M12 3.5c2.5 2.4 3.8 5.2 3.8 8.5S14.500 18.100 12 20.500c-2.500-2.400-3.800-5.200-3.800-8.500S9.500 5.900 12 3.500z"/>',
  sun: '<circle cx="12" cy="12" r="3.500"/><line x1="12" y1="3" x2="12" y2="5"/><line x1="12" y1="19" x2="12" y2="21"/><line x1="3" y1="12" x2="5" y2="12"/><line x1="19" y1="12" x2="21" y2="12"/><line x1="5.600" y1="5.600" x2="7" y2="7"/><line x1="17" y1="17" x2="18.400" y2="18.400"/><line x1="5.600" y1="18.400" x2="7" y2="17"/><line x1="17" y1="7" x2="18.400" y2="5.600"/>',
  moon: '<path d="M19.500 14.500A8 8 0 0 1 9.500 4.500a8 8 0 1 0 10 10z"/>',
  'external-link': '<path d="M14 4h6v6"/><line x1="20" y1="4" x2="11" y2="13"/><path d="M18 14v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4"/>'
};

function renderSvgIcon(name, size = 20) {
  const content = ICONOS_CABECERA[name] || ICONOS_CABECERA.globe;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${content}</svg>`;
}

function getInitials(name) {
  if (!name) return 'U';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

/**
 * Clase controladora de Cabecera Compartida
 */
export class StuCabeceraController {
  constructor(container, options = {}) {
    this.container = container;
    this.options = Object.assign({
      platform: 'holding',
      platformName: 'Grupo Stu',
      platformUrl: 'https://grupostu.com',
      catalog: CATALOGO_APPS,
      user: null, // { name, email, avatarUrl, initials } | null
      themeToggle: true,
      loginUrl: 'https://cuenta.grupostu.com/login',
      activeTab: 'todas', // 'todas' | 'favoritas'
      navContent: '',
    }, options);

    if (!this.options.navContent && this.container) {
      const existingNav = this.container.querySelector('[slot="nav"], nav, .stu-cabecera-nav');
      if (existingNav) {
        this.options.navContent = existingNav.outerHTML;
      }
    }

    this.openPanel = null; // 'apps' | 'account' | null
    this.boundHandleDocumentClick = this.handleDocumentClick.bind(this);
    this.boundHandleKeyDown = this.handleKeyDown.bind(this);

    this.render();
    this.attachEvents();
  }

  setUser(user) {
    this.options.user = user;
    this.render();
    this.attachEvents();
  }

  setPlatform(platform, platformName, platformUrl) {
    if (platform) this.options.platform = platform;
    if (platformName) this.options.platformName = platformName;
    if (platformUrl) this.options.platformUrl = platformUrl;
    this.render();
    this.attachEvents();
  }

  render() {
    const { platform, platformName, platformUrl, user, themeToggle, loginUrl, activeTab } = this.options;
    const apps = this.options.catalog.apps || [];
    const favorites = apps.filter(a => a.favorite);
    const displayedApps = activeTab === 'favoritas' ? favorites : apps;

    const brandName = platform === 'holding' ? 'Grupo Stu' : 'Grupo Stu';
    const showSeparator = platform !== 'holding';

    const isAuthenticated = user && (user.name || user.email);
    const userInitials = user ? (user.initials || getInitials(user.name || user.email)) : 'U';

    const loginTarget = loginUrl || 'https://cuenta.grupostu.com/login';
    const manageUrl = this.options.catalog.cuentaHub?.url || 'https://cuenta.grupostu.com';
    const logoutUrl = this.options.catalog.cuentaHub?.logoutUrl || 'https://cuenta.grupostu.com/logout';
    const switchUrl = this.options.catalog.cuentaHub?.switchUrl || 'https://cuenta.grupostu.com/switch';
    const privacyUrl = this.options.catalog.cuentaHub?.privacyUrl || 'https://grupostu.com/es/legal/privacidad';
    const termsUrl = this.options.catalog.cuentaHub?.termsUrl || 'https://grupostu.com/es/legal/terminos';

    this.container.innerHTML = `
      <header class="stu-cabecera" role="banner" aria-label="Cabecera institucional de Grupo Stu">
        <div class="stu-cabecera__inner">
          
          <!-- Bloque Marca y Plataforma -->
          <a href="${platformUrl}" class="stu-cabecera__brand" aria-label="${showSeparator ? brandName + ' ' + platformName : brandName}">
            <div class="stu-cabecera__logo-mark" aria-hidden="true" data-mark="GS"></div>
            <span class="stu-cabecera__brand-name">${brandName}</span>
            ${showSeparator ? `
              <span class="stu-cabecera__separator" aria-hidden="true">/</span>
              <span class="stu-cabecera__platform-name">${platformName}</span>
            ` : ''}
          </a>

          <!-- Espacio para Navegación Central (si se proporciona) -->
          ${this.options.navContent ? `
            <div class="stu-cabecera__nav-slot">
              ${this.options.navContent}
            </div>
          ` : ''}

          <!-- Bloque Acciones Derecha -->
          <div class="stu-cabecera__actions">
            
            ${themeToggle ? `
              <button type="button" class="stu-cabecera-btn stu-cabecera-btn--theme" data-stu-action="theme" aria-label="Alternar tema visual claro y oscuro" title="Alternar tema visual">
                ${renderSvgIcon('sun', 20)}
              </button>
            ` : ''}

            <!-- Botón y Panel de Apps -->
            <div class="stu-cabecera__anchor">
              <button type="button" 
                      class="stu-cabecera-btn stu-cabecera-btn--apps" 
                      data-stu-toggle="apps" 
                      aria-label="Aplicaciones de Grupo Stu" 
                      aria-haspopup="dialog" 
                      aria-expanded="false" 
                      aria-controls="stu-panel-apps"
                      title="Aplicaciones de Grupo Stu">
                ${renderSvgIcon('apps', 20)}
              </button>

              <div id="stu-panel-apps" 
                   class="stu-cabecera-panel stu-apps-panel" 
                   role="dialog" 
                   aria-modal="false"
                   aria-label="Menú de Aplicaciones de Grupo Stu"
                   tabindex="-1">
                <div class="stu-apps-panel__header">
                  <h2 class="stu-apps-panel__title">Aplicaciones</h2>
                  <div class="stu-apps-panel__tabs" role="tablist" aria-label="Filtro de aplicaciones">
                    <button type="button" 
                            role="tab" 
                            class="stu-apps-panel__tab ${activeTab === 'todas' ? 'is-active' : ''}" 
                            data-stu-tab="todas"
                            aria-selected="${activeTab === 'todas' ? 'true' : 'false'}"
                            aria-controls="stu-apps-list">
                      Todas (${apps.length})
                    </button>
                    <button type="button" 
                            role="tab" 
                            class="stu-apps-panel__tab ${activeTab === 'favoritas' ? 'is-active' : ''}" 
                            data-stu-tab="favoritas"
                            aria-selected="${activeTab === 'favoritas' ? 'true' : 'false'}"
                            aria-controls="stu-apps-list">
                      Favoritas (${favorites.length})
                    </button>
                  </div>
                </div>

                <div class="stu-apps-panel__body" id="stu-apps-list" tabindex="0" role="region" aria-label="Listado de aplicaciones">
                  <ul class="stu-apps-grid" role="menu">
                    ${displayedApps.map((app) => `
                      <li role="none">
                        <a href="${app.url}" 
                           class="stu-app-tile ${app.id === platform ? 'is-current' : ''}" 
                           role="menuitem"
                           data-stu-app="${app.id}"
                           title="${app.name} — ${app.description}">
                          <div class="stu-app-tile__icon-box" style="border-left: 3px solid ${app.color || 'var(--gs-accent)'};">
                            ${renderSvgIcon(app.icon, 20)}
                          </div>
                          <span class="stu-app-tile__name">${app.name}</span>
                        </a>
                      </li>
                    `).join('')}
                  </ul>
                </div>

                <div class="stu-apps-panel__footer">
                  <a href="https://grupostu.com/#plataformas" class="stu-apps-panel__footer-link" target="_blank" rel="noopener noreferrer">
                    <span>Más plataformas del ecosistema</span>
                    ${renderSvgIcon('external-link', 14)}
                  </a>
                </div>
              </div>
            </div>

            <!-- Botón y Panel de Cuenta / Iniciar Sesión -->
            ${isAuthenticated ? `
              <div class="stu-cabecera__anchor">
                <button type="button" 
                        class="stu-cabecera-avatar-btn" 
                        data-stu-toggle="account" 
                        aria-label="${userInitials} — Cuenta Stu: ${user.name || user.email}" 
                        aria-haspopup="dialog" 
                        aria-expanded="false" 
                        aria-controls="stu-panel-account"
                        title="Cuenta Stu: ${user.name || user.email}">
                  ${user.avatarUrl ? `
                    <img src="${user.avatarUrl}" alt="${user.name || 'Avatar'}" class="stu-cabecera-avatar-img">
                  ` : `
                    <span class="stu-cabecera-avatar-monogram" aria-hidden="true">${userInitials}</span>
                  `}
                </button>

                <div id="stu-panel-account" 
                     class="stu-cabecera-panel stu-account-panel" 
                     role="dialog" 
                     aria-modal="false"
                     aria-label="Detalles de Cuenta Stu"
                     tabindex="-1">
                  <div class="stu-account-panel__header">
                    <div class="stu-account-panel__avatar" aria-hidden="true">
                      ${user.avatarUrl ? `
                        <img src="${user.avatarUrl}" alt="">
                      ` : `
                        <span>${userInitials}</span>
                      `}
                    </div>
                    <div class="stu-account-panel__name">${user.name || 'Usuario Stu'}</div>
                    <div class="stu-account-panel__email">${user.email || ''}</div>
                    <a href="${manageUrl}" class="stu-account-panel__manage-btn" target="_blank" rel="noopener noreferrer">
                      Administrar tu Cuenta Stu
                    </a>
                  </div>

                  <div class="stu-account-panel__actions" role="menu">
                    <a href="${switchUrl}" class="stu-account-menu-item" role="menuitem" data-stu-action="switch-account">
                      ${renderSvgIcon('users', 18)}
                      <span>Cambiar de cuenta</span>
                    </a>
                    <button type="button" class="stu-account-menu-item stu-account-menu-item--logout" role="menuitem" data-stu-action="logout">
                      ${renderSvgIcon('log-out', 18)}
                      <span>Cerrar sesión</span>
                    </button>
                  </div>

                  <div class="stu-account-panel__footer">
                    <a href="${privacyUrl}" class="stu-account-panel__footer-link" target="_blank" rel="noopener noreferrer">Privacidad</a>
                    <span aria-hidden="true">•</span>
                    <a href="${termsUrl}" class="stu-account-panel__footer-link" target="_blank" rel="noopener noreferrer">Términos</a>
                  </div>
                </div>
              </div>
            ` : `
              <a href="${loginTarget}" class="stu-cabecera-login-btn" data-stu-action="login">
                ${renderSvgIcon('log-in', 16)}
                <span>Iniciar sesión</span>
              </a>
            `}

          </div>
        </div>
      </header>
    `;

    this.updateThemeIcon();
  }

  attachEvents() {
    // Botón apps toggle
    const appsBtn = this.container.querySelector('[data-stu-toggle="apps"]');
    if (appsBtn) {
      appsBtn.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.togglePanel('apps');
      };
    }

    // Botón cuenta toggle
    const accountBtn = this.container.querySelector('[data-stu-toggle="account"]');
    if (accountBtn) {
      accountBtn.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.togglePanel('account');
      };
    }

    // Botón tema
    const themeBtn = this.container.querySelector('[data-stu-action="theme"]');
    if (themeBtn) {
      themeBtn.onclick = (e) => {
        e.preventDefault();
        this.toggleTheme();
      };
    }

    // Tabs del panel de apps (Todas / Favoritas)
    const tabs = this.container.querySelectorAll('[data-stu-tab]');
    tabs.forEach((tab) => {
      tab.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        const targetTab = tab.getAttribute('data-stu-tab');
        if (targetTab && targetTab !== this.options.activeTab) {
          this.options.activeTab = targetTab;
          this.render();
          this.attachEvents();
          this.openPanelExplicit('apps');
        }
      };
    });

    // Acción logout
    const logoutBtn = this.container.querySelector('[data-stu-action="logout"]');
    if (logoutBtn) {
      logoutBtn.onclick = (e) => {
        e.preventDefault();
        this.closeAllPanels();
        const event = new CustomEvent('stu-logout', {
          bubbles: true,
          cancelable: true,
          detail: { user: this.options.user }
        });
        const allowed = this.container.dispatchEvent(event);
        if (allowed) {
          const logoutUrl = this.options.catalog.cuentaHub?.logoutUrl || 'https://cuenta.grupostu.com/logout';
          window.location.href = logoutUrl;
        }
      };
    }

    // Acción switch account
    const switchBtn = this.container.querySelector('[data-stu-action="switch-account"]');
    if (switchBtn) {
      switchBtn.onclick = (e) => {
        const event = new CustomEvent('stu-switch-account', {
          bubbles: true,
          cancelable: true,
          detail: { user: this.options.user }
        });
        this.container.dispatchEvent(event);
      };
    }

    // Clic en apps
    const appTiles = this.container.querySelectorAll('.stu-app-tile');
    appTiles.forEach((tile) => {
      tile.onclick = (e) => {
        const appId = tile.getAttribute('data-stu-app');
        const event = new CustomEvent('stu-app-select', {
          bubbles: true,
          detail: { appId, url: tile.href }
        });
        this.container.dispatchEvent(event);
      };
    });

    // Escucha global de clics fuera y teclado
    document.removeEventListener('click', this.boundHandleDocumentClick);
    document.addEventListener('click', this.boundHandleDocumentClick);

    document.removeEventListener('keydown', this.boundHandleKeyDown);
    document.addEventListener('keydown', this.boundHandleKeyDown);
  }

  togglePanel(type) {
    if (this.openPanel === type) {
      this.closeAllPanels();
    } else {
      this.openPanelExplicit(type);
    }
  }

  openPanelExplicit(type) {
    this.closeAllPanels();
    this.openPanel = type;

    const btn = this.container.querySelector(`[data-stu-toggle="${type}"]`);
    const panel = this.container.querySelector(type === 'apps' ? '#stu-panel-apps' : '#stu-panel-account');

    if (btn) btn.setAttribute('aria-expanded', 'true');
    if (panel) {
      panel.classList.add('is-open');
      // Enfocar primer elemento interactivo
      setTimeout(() => {
        const first = panel.querySelector('button, [href], input, [tabindex="0"]');
        if (first) first.focus();
      }, 30);
    }

    this.container.dispatchEvent(new CustomEvent('stu-panel-toggle', {
      bubbles: true,
      detail: { panel: type, isOpen: true }
    }));
  }

  closeAllPanels() {
    const prev = this.openPanel;
    this.openPanel = null;

    const panels = this.container.querySelectorAll('.stu-cabecera-panel');
    panels.forEach(p => p.classList.remove('is-open'));

    const toggles = this.container.querySelectorAll('[data-stu-toggle]');
    toggles.forEach(t => t.setAttribute('aria-expanded', 'false'));

    if (prev) {
      this.container.dispatchEvent(new CustomEvent('stu-panel-toggle', {
        bubbles: true,
        detail: { panel: prev, isOpen: false }
      }));
    }
  }

  handleDocumentClick(event) {
    if (!this.openPanel) return;
    if (!this.container.contains(event.target)) {
      this.closeAllPanels();
    }
  }

  handleKeyDown(event) {
    if (!this.openPanel) return;

    // Cerrar con Escape y retornar foco al botón disparador
    if (event.key === 'Escape') {
      event.preventDefault();
      const currentType = this.openPanel;
      this.closeAllPanels();
      const trigger = this.container.querySelector(`[data-stu-toggle="${currentType}"]`);
      if (trigger) trigger.focus();
      return;
    }

    // Navegación por flechas dentro del panel de aplicaciones (Rejilla 3x3)
    if (this.openPanel === 'apps') {
      const activeEl = document.activeElement;
      const tiles = Array.from(this.container.querySelectorAll('.stu-app-tile'));
      const index = tiles.indexOf(activeEl);

      if (index !== -1) {
        let nextIndex = index;
        if (event.key === 'ArrowRight') {
          nextIndex = (index + 1) % tiles.length;
          event.preventDefault();
          tiles[nextIndex].focus();
        } else if (event.key === 'ArrowLeft') {
          nextIndex = (index - 1 + tiles.length) % tiles.length;
          event.preventDefault();
          tiles[nextIndex].focus();
        } else if (event.key === 'ArrowDown') {
          nextIndex = index + 3;
          if (nextIndex >= tiles.length) nextIndex = index % 3;
          event.preventDefault();
          tiles[nextIndex].focus();
        } else if (event.key === 'ArrowUp') {
          nextIndex = index - 3;
          if (nextIndex < 0) nextIndex = tiles.length - (tiles.length % 3 || 3) + (index % 3);
          if (nextIndex >= tiles.length) nextIndex = tiles.length - 1;
          event.preventDefault();
          tiles[nextIndex].focus();
        }
      }
    }

    // Navegación por flechas dentro del panel de cuenta
    if (this.openPanel === 'account') {
      const menuItems = Array.from(this.container.querySelectorAll('.stu-account-panel a, .stu-account-panel button'));
      const index = menuItems.indexOf(document.activeElement);

      if (index !== -1) {
        if (event.key === 'ArrowDown') {
          event.preventDefault();
          const next = (index + 1) % menuItems.length;
          menuItems[next].focus();
        } else if (event.key === 'ArrowUp') {
          event.preventDefault();
          const prev = (index - 1 + menuItems.length) % menuItems.length;
          menuItems[prev].focus();
        }
      }
    }
  }

  toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    let nextTheme;
    if (currentTheme === 'dark') {
      nextTheme = 'light';
    } else if (currentTheme === 'light') {
      nextTheme = 'dark';
    } else {
      const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      nextTheme = prefersDark ? 'light' : 'dark';
    }

    document.documentElement.setAttribute('data-theme', nextTheme);
    try { localStorage.setItem('stu-theme', nextTheme); } catch (_) {}
    this.updateThemeIcon();

    window.dispatchEvent(new CustomEvent('stu-theme-changed', { detail: { theme: nextTheme } }));
  }

  updateThemeIcon() {
    const themeBtn = this.container.querySelector('[data-stu-action="theme"]');
    if (!themeBtn) return;
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark' ||
      (!document.documentElement.getAttribute('data-theme') && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);

    themeBtn.innerHTML = renderSvgIcon(isDark ? 'moon' : 'sun', 20);
    themeBtn.setAttribute('title', isDark ? 'Modo actual: Oscuro. Clic para cambiar a Claro.' : 'Modo actual: Claro. Clic para cambiar a Oscuro.');
  }

  destroy() {
    document.removeEventListener('click', this.boundHandleDocumentClick);
    document.removeEventListener('keydown', this.boundHandleKeyDown);
    this.container.innerHTML = '';
  }
}

/**
 * Web Component <stu-cabecera>
 */
export class StuCabeceraElement extends HTMLElement {
  static get observedAttributes() {
    return ['platform', 'platform-name', 'platform-url', 'user', 'theme-toggle', 'login-url'];
  }

  connectedCallback() {
    this.initController();
  }

  disconnectedCallback() {
    if (this._controller) {
      this._controller.destroy();
      this._controller = null;
    }
  }

  attributeChangedCallback() {
    if (this._controller) {
      this.updateFromAttributes();
    }
  }

  initController() {
    if (this._controller) return;

    let userObj = null;
    const userAttr = this.getAttribute('user');
    if (userAttr) {
      try { userObj = JSON.parse(userAttr); } catch (_) {}
    }

    const existingNav = this.querySelector('[slot="nav"], nav, .stu-cabecera-nav');
    const navContent = existingNav ? existingNav.outerHTML : '';

    this._controller = new StuCabeceraController(this, {
      platform: this.getAttribute('platform') || 'holding',
      platformName: this.getAttribute('platform-name') || 'Grupo Stu',
      platformUrl: this.getAttribute('platform-url') || 'https://grupostu.com',
      loginUrl: this.getAttribute('login-url') || 'https://cuenta.grupostu.com/login',
      themeToggle: this.getAttribute('theme-toggle') !== 'false',
      user: userObj,
      navContent
    });
  }

  updateFromAttributes() {
    let userObj = null;
    const userAttr = this.getAttribute('user');
    if (userAttr) {
      try { userObj = JSON.parse(userAttr); } catch (_) {}
    }

    this._controller.options.platform = this.getAttribute('platform') || 'holding';
    this._controller.options.platformName = this.getAttribute('platform-name') || 'Grupo Stu';
    this._controller.options.platformUrl = this.getAttribute('platform-url') || 'https://grupostu.com';
    this._controller.options.loginUrl = this.getAttribute('login-url') || 'https://cuenta.grupostu.com/login';
    this._controller.options.themeToggle = this.getAttribute('theme-toggle') !== 'false';
    this._controller.options.user = userObj;
    this._controller.render();
    this._controller.attachEvents();
  }

  get user() {
    return this._controller?.options.user || null;
  }

  set user(val) {
    if (this._controller) {
      this._controller.setUser(val);
    }
  }

  openApps() {
    this._controller?.openPanelExplicit('apps');
  }

  openAccount() {
    this._controller?.openPanelExplicit('account');
  }

  close() {
    this._controller?.closeAllPanels();
  }
}

/**
 * Registro e Inicialización Global
 */
export function registerCabecera() {
  if (typeof customElements !== 'undefined' && !customElements.get('stu-cabecera')) {
    customElements.define('stu-cabecera', StuCabeceraElement);
  }
}

export const StuCabecera = {
  CATALOGO_APPS,
  Controller: StuCabeceraController,
  Element: StuCabeceraElement,
  register: registerCabecera,
  create(container, options) {
    return new StuCabeceraController(container, options);
  },
  init() {
    registerCabecera();
    // Auto-instanciar contenedores con data-stu-cabecera si existen
    if (typeof document !== 'undefined') {
      document.querySelectorAll('[data-stu-cabecera]').forEach((el) => {
        if (!el._stuCabeceraInstance) {
          const platform = el.getAttribute('data-platform') || 'holding';
          const platformName = el.getAttribute('data-platform-name') || 'Grupo Stu';
          const platformUrl = el.getAttribute('data-platform-url') || 'https://grupostu.com';
          const userAttr = el.getAttribute('data-user');
          let user = null;
          if (userAttr) {
            try { user = JSON.parse(userAttr); } catch (_) {}
          }
          el._stuCabeceraInstance = new StuCabeceraController(el, {
            platform,
            platformName,
            platformUrl,
            user
          });
        }
      });
    }
  }
};

// Auto-inicializar si se incluye vía <script>
if (typeof window !== 'undefined') {
  registerCabecera();
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => StuCabecera.init());
  } else {
    StuCabecera.init();
  }
  window.StuCabecera = StuCabecera;
}

export default StuCabecera;
