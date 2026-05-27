// Onde o mapa deve focar ao abrir? [Latitude, Longitude]
// O número 13 no final é o nível do Zoom (maior = mais perto)
const mapa = L.map('meu-mapa').setView([-15.7938, -47.8827], 13);

// Carrega os desenhos das ruas/imagens vindas do servidor do OpenStreetMap
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(mapa);

// Adiciona um marcador (aquele pininho azul) no mapa
const marcador = L.marker([-15.7938, -47.8827]).addTo(mapa);

// Coloca um texto de balão que abre quando a pessoa clica no marcador
marcador.bindPopup("<b>Parabéns!</b><br>Seu mapa open source está funcionando.").openPopup();