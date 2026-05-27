// Onde o mapa deve focar ao abrir? [Latitude, Longitude]
// O número 13 no final é o nível do Zoom (maior = mais perto)
const mapa = L.map('meu-mapa').setView([-15.7938, -47.8827], 13);

// Carrega os desenhos das ruas/imagens vindas do servidor do OpenStreetMap
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(mapa);

// ================================
// Busca (geocoder)
// ================================
// Plugin carregado via CDN em mapa.html
const geocoder = L.Control.geocoder({
    defaultMarkGeocode: false,
    placeholder: 'Pesquisar endereço/bairro...'
})
    .on('markgeocode', (e) => {
        const latlng = e.geocode?.center;
        if (!latlng) return;
        mapa.setView(latlng, Math.max(mapa.getZoom(), 15));

        // Marca o local encontrado (sem persistir)
        L.marker(latlng).addTo(mapa).bindPopup('<b>Local encontrado</b>').openPopup();
    })
    .addTo(mapa);

// ================================
// Pontos salvos (localStorage)
// ================================
const STORAGE_KEY = 'lixo_sustetavel_pontos';

/** @type {Array<{id:string, lat:number, lng:number, titulo:string, tipo:string, descricao:string, createdAt:number}>} */
let pontos = [];

function carregarPontos() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        pontos = raw ? JSON.parse(raw) : [];

        // Compatibilidade: pontos antigos podem ter `tipo` variado.
        // Agora não dependemos disso, então garantimos apenas as chaves básicas.
        pontos = pontos.map((p) => {
            if (!p || typeof p !== 'object') return p;
            if (typeof p.tipo !== 'string') p.tipo = 'ponto';
            if (typeof p.tipoLabel !== 'string') p.tipoLabel = '';
            return p;
        });
    } catch {
        pontos = [];
    }
}



function salvarPontos() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(pontos));
}

const layerPontos = L.layerGroup().addTo(mapa);
const markersIndex = new Map(); // id -> marker

function criarPopup(ponto) {
    const titulo = ponto.titulo ? `<div class="popup-title">${escapeHtml(ponto.titulo)}</div>` : '';
    const desc = ponto.descricao ? `<div class="popup-desc">${escapeHtml(ponto.descricao)}</div>` : '';

    return `${titulo}
        <div class="popup-actions">
            <button type="button" class="popup-remove" data-id="${escapeHtml(ponto.id)}">Remover ponto</button>
        </div>
        ${desc ? `<div class="popup-divider"></div>` : ''}`;
}


function renderizarPontos() {
    layerPontos.clearLayers();
    markersIndex.clear();

    const categoriasFiltradas = filtroCategoria === 'todas'
        ? pontos
        : pontos.filter(p => (p.tipo || '').toLowerCase() === filtroCategoria);

    categoriasFiltradas.forEach((ponto) => {
        const marker = L.marker([ponto.lat, ponto.lng], {
            icon: criarIconeDaCategoria(ponto.tipo)
        });
        marker.bindPopup(criarPopup(ponto));
        marker.addTo(layerPontos);
        markersIndex.set(ponto.id, marker);
    });
}

function escapeHtml(str) {
    return String(str)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '<')
        .replaceAll('>', '>')
        .replaceAll('"', '"')
        .replaceAll("'", '&#039;');
}

// addPoint() antigo via prompts foi removido em favor do modal.
// Mantido apenas se necessário em outros fluxos.
function addPoint() {
    console.warn('addPoint() descontinuado: use o modal de cadastro.');
}

function removerPontoPorId(id) {
    const ponto = pontos.find(p => p.id === id);
    if (!ponto) return;

    const ok = confirm(`Remover o ponto: ${ponto.titulo}?`);
    if (!ok) return;

    pontos = pontos.filter(p => p.id !== id);
    salvarPontos();
    renderizarPontos();
}

// Delegação: quando o popup abrir, ligamos o handler do botão remover
function conectarHandlersPopup() {
    const container = document.querySelector('.leaflet-popup-content');
    if (!container) return;

    const btn = container.querySelector('button.popup-remove[data-id]');
    if (!btn) return;

    btn.addEventListener('click', (ev) => {
        ev.preventDefault();
        removerPontoPorId(btn.dataset.id);
    });
}

mapa.on('popupopen', () => {
    // tenta conectar handlers do popup aberto
    setTimeout(conectarHandlersPopup, 0);
});

// ================================
// Marcadores
// ================================
let filtroCategoria = 'todas';

function normalizarCategoria(t){
    return String(t || '').trim().toLowerCase();
}


function criarIconeDaCategoria() {
    const html = `
        <div class="marker-dot" style="background:#6abb01;"></div>
    `;

    return L.divIcon({
        className: 'marker-wrapper',
        html,
        iconSize: [18, 18],
        iconAnchor: [9, 9]
    });
}

function preencherSelectCategorias() {
    // Remove opções do filtro e do modal
    const selectFiltro = document.getElementById('filtro-tipo');
    if (selectFiltro) {
        selectFiltro.innerHTML = '<option value="todas">Todas</option>';
    }

    const selectCadastro = document.getElementById('cad-tipo');
    if (selectCadastro) {
        selectCadastro.innerHTML = '';
    }
}



function renderFiltroChange() {
    // Sem filtro: sempre mostra todos os pontos.
    // Mantém a função para compatibilidade com a inicialização.
}


// ================================
// Modal de cadastro
// ================================
function mostrarModalCadastro(latlng) {
    const modal = document.getElementById('modal-cadastro');
    if (!modal) return;

    document.getElementById('cad-lat').value = String(latlng.lat);
    document.getElementById('cad-lng').value = String(latlng.lng);

    modal.classList.add('open');

    const inputTitulo = document.getElementById('cad-titulo');
    if (inputTitulo) inputTitulo.focus();
}

function fecharModalCadastro() {
    const modal = document.getElementById('modal-cadastro');
    if (!modal) return;
    modal.classList.remove('open');
}

function configurarModal() {
    const modal = document.getElementById('modal-cadastro');
    if (!modal) return;

    const btnFechar = document.getElementById('cad-close');
    if (btnFechar) btnFechar.addEventListener('click', fecharModalCadastro);

    const btnCancelar = document.getElementById('cad-cancel');
    if (btnCancelar) btnCancelar.addEventListener('click', fecharModalCadastro);

    const btnSalvar = document.getElementById('cad-save');
    if (btnSalvar) {
        btnSalvar.addEventListener('click', () => {
            const titulo = document.getElementById('cad-titulo')?.value?.trim();
            const tipoKey = document.getElementById('cad-tipo')?.value;
            const descricao = document.getElementById('cad-descricao')?.value?.trim();
            const lat = Number(document.getElementById('cad-lat')?.value);
            const lng = Number(document.getElementById('cad-lng')?.value);

            if (!titulo) {
                alert('Informe um nome para o ponto de descarte.');
                return;
            }
            if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
                alert('Coordenadas inválidas.');
                return;
            }

            const id = (crypto?.randomUUID && crypto.randomUUID())
                ? crypto.randomUUID()
                : `${Date.now()}_${Math.random().toString(16).slice(2)}`;

            // Sem tipos de lixo: cadastramos apenas o ponto.
            const tipoFixo = 'ponto';

            const ponto = {
                id,
                lat,
                lng,
                titulo,
                tipo: tipoFixo,
                descricao: descricao || '',
                createdAt: Date.now(),
                tipoLabel: ''
            };


            pontos.push(ponto);
            salvarPontos();
            renderizarPontos();

            fecharModalCadastro();

            const marker = markersIndex.get(id);
            if (marker) marker.openPopup();
        });
    }

    // Fecha ao clicar no fundo
    modal.addEventListener('click', (e) => {
        if (e.target === modal) fecharModalCadastro();
    });
}

// Ao clicar no mapa, abre modal de cadastro
mapa.on('click', (e) => {
    mostrarModalCadastro(e.latlng);
});

// Inicializa carregando pontos existentes
carregarPontos();
preencherSelectCategorias();
renderFiltroChange();
configurarModal();
renderizarPontos();

// Garantia: fecha modal ao carregar (caso fique aberto por cache)
fecharModalCadastro && fecharModalCadastro();
