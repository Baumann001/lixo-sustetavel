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
    const titulo = ponto.titulo ? `<b>${escapeHtml(ponto.titulo)}</b><br/>` : '';
    const tipo = ponto.tipo ? `<i>${escapeHtml(ponto.tipo)}</i><br/>` : '';
    const desc = ponto.descricao ? `${escapeHtml(ponto.descricao)}<br/>` : '';

    // Botão para excluir (somente no seu navegador)
    return `${titulo}${tipo}${desc}
        <button type="button" onclick="window.__removerPonto('${ponto.id}')" style="cursor:pointer;">
            Remover ponto
        </button>`;
}

function renderizarPontos() {
    layerPontos.clearLayers();
    markersIndex.clear();

    pontos.forEach((ponto) => {
        const marker = L.marker([ponto.lat, ponto.lng]);
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

function addPoint(latlng) {
    const titulo = prompt('Nome do ponto de descarte (ex.: Ponto de coleta - Parque)...')?.trim();
    if (!titulo) return;

    const tipo = prompt('Tipo de lixo (ex.: reciclável, vidro, eletrônico, orgânico)...')?.trim() || '';
    const descricao = prompt('Descrição/observações (opcional)...')?.trim() || '';

    const id = (crypto?.randomUUID && crypto.randomUUID())
        ? crypto.randomUUID()
        : `${Date.now()}_${Math.random().toString(16).slice(2)}`;

    const ponto = {
        id,
        lat: latlng.lat,
        lng: latlng.lng,
        titulo,
        tipo,
        descricao,
        createdAt: Date.now()
    };

    pontos.push(ponto);
    salvarPontos();
    renderizarPontos();

    // abre popup do novo ponto
    const marker = markersIndex.get(id);
    if (marker) marker.openPopup();
}

// Função global para o popup chamar o botão remover
window.__removerPonto = function removerPonto(id) {
    const ponto = pontos.find(p => p.id === id);
    if (!ponto) return;

    const ok = confirm(`Remover o ponto: ${ponto.titulo}?`);
    if (!ok) return;

    pontos = pontos.filter(p => p.id !== id);
    salvarPontos();
    renderizarPontos();
};

// Ao clicar no mapa, cria um novo ponto
mapa.on('click', (e) => {
    addPoint(e.latlng);
});

// Inicializa carregando pontos existentes
carregarPontos();
renderizarPontos();
