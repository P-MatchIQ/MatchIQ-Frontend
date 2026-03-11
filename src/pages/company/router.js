// ── SPA Router ──────────────────────────────────────────────────
// Hash-based router: carga fragmentos HTML y ejecuta lógica JS
// por cada vista.

const APP_CONTAINER_ID = 'app';

/** @type {Map<string, { html: string, init: (params?: object) => void }>} */
const routes = new Map();

/** @type {string} */
let currentRoute = '';

/**
 * Registra una ruta con su fragmento HTML y función de inicialización.
 * @param {string} path     - Hash path (ej: 'dashboard', 'offers', 'offers/create')
 * @param {string} htmlFile - Ruta al archivo HTML fragmento
 * @param {(params?: object) => void} initFn - Función que se ejecuta al montar la vista
 */
export function registerRoute(path, htmlFile, initFn) {
    routes.set(path, { html: htmlFile, init: initFn });
}

/**
 * Navega a una ruta programáticamente.
 * @param {string} path
 */
export function navigateTo(path) {
    window.location.hash = `/${path}`;
}

/**
 * Parsea el hash actual y extrae la ruta + parámetros.
 * Ejemplo: #/offers/edit/abc123 → { path: 'offers/edit', params: { id: 'abc123' } }
 */
function parseHash() {
    const hash = window.location.hash.replace(/^#\/?/, '') || 'dashboard';

    // Intentar match con rutas de edición: offers/edit/:id
    const editMatch = hash.match(/^offers\/edit\/(.+)$/);
    if (editMatch) {
        return { path: 'offers/edit', params: { id: editMatch[1] } };
    }

    return { path: hash, params: {} };
}

/**
 * Resuelve la ruta actual: carga el HTML, lo inyecta y ejecuta init.
 */
async function resolve() {
    const { path, params } = parseHash();

    // Evitar recargar la misma ruta
    if (path === currentRoute && Object.keys(params).length === 0) return;
    currentRoute = path;

    const route = routes.get(path);
    if (!route) {
        document.getElementById(APP_CONTAINER_ID).innerHTML = `
            <div class="empty-state view-enter">
                <div class="empty-state__icon">🔍</div>
                <h2 class="empty-state__title">Page not found</h2>
                <p class="empty-state__text">The view you're looking for doesn't exist.</p>
                <a href="#/dashboard" class="btn btn--primary">Go to Dashboard</a>
            </div>`;
        return;
    }

    try {
        const response = await fetch(route.html);
        const html = await response.text();
        const container = document.getElementById(APP_CONTAINER_ID);
        container.innerHTML = html;
        container.classList.remove('view-enter');
        // Trigger reflow for animation
        void container.offsetWidth;
        container.classList.add('view-enter');

        // Actualizar active state en sidebar
        updateSidebarActive(path);

        // Ejecutar lógica de la vista
        route.init(params);
    } catch (err) {
        console.error(`Error cargando vista "${path}":`, err);
    }
}

/**
 * Actualiza la clase is-active en el sidebar según la ruta actual.
 */
function updateSidebarActive(path) {
    const navItems = document.querySelectorAll('#sidebar-nav .nav__item');
    navItems.forEach(item => {
        const route = item.dataset.route;
        const isMatch = path === route
            || (route === 'offers' && path === 'offers/edit');
        item.classList.toggle('is-active', isMatch);
    });
}

/**
 * Inicia el router: escucha hashchange y resuelve la ruta inicial.
 */
export function startRouter() {
    window.addEventListener('hashchange', resolve);
    resolve();
}
