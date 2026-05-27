# TODO - lixo-sustetavel (mapa: busca + marcação)

- [x] Atualizar `mapa.html` para incluir plugin de busca (geocoder) do Leaflet via CDN.
- [x] Atualizar `mapa.js`:
  - [x] Remover marcador fixo.
  - [x] Implementar persistência com `localStorage` (carregar/salvar pontos).
  - [x] Renderizar pontos salvos no mapa.
  - [x] Permitir adicionar ponto ao clicar no mapa (prompts para nome/tipo/descrição) e salvar no `localStorage`.
- [x] Atualizar `mapa.css` com estilos mínimos para deixar a UI legível.
- [ ] Testar manualmente no navegador:
  - [ ] Buscar localização.
  - [ ] Clicar para criar ponto.
  - [ ] Recarregar a página e confirmar que os pontos persistem.


