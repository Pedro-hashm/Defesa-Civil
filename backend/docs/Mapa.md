# Mapa Interativo — Seleção de Áreas Afetadas (FIDE 4.2)

## Visão geral

O mapa interativo permite que o usuário desenhe polígonos sobre o mapa para indicar as áreas geográficas atingidas pelo desastre. Essa informação corresponde à seção **4.2 — Seleção das áreas com população afetada** do formulário FIDE (SEDEC/MIDR).

---

## Stack utilizada

| Camada | Tecnologia |
|---|---|
| Renderização do mapa | Google Maps JavaScript API |
| Biblioteca React | `@react-google-maps/api` |
| Formato geográfico | GeoJSON (RFC 7946) |
| Persistência | PostgreSQL via Prisma (`jsonb`) |

---

## Fluxo completo

```
Usuário desenha polígono
        ↓
AffectedAreasMap.tsx (componente do mapa)
  → exporta GeoJSON (FeatureCollection)
  → chama onChange(geojson)
        ↓
Fide.tsx (seção 4.2)
  → armazena em fideData.mapa_geojson
        ↓
fide-dmate/page.tsx (submit)
  → chama salvarSimulacaoFideDmate({ fide, dmate })
        ↓
simuladorService.ts
  → parseia mapa_geojson (string → objeto)
  → monta payload para POST /tentativas
        ↓
formulario.controller.ts → formulario.service.ts
  → valida GeoJSON (polígono fechado, coordenadas válidas)
  → normaliza e persiste em TentativaFormulario.respostas (jsonb)
```

---

## Componente do mapa

**Arquivo:** `frontend/components/maps/AffectedAreasMap.tsx`

### Props

| Prop | Tipo | Descrição |
|---|---|---|
| `value` | `string` | GeoJSON atual (FeatureCollection serializado). Usado para hidratar polígonos ao reabrir. |
| `onChange` | `(geojson: string) => void` | Chamado sempre que as áreas mudam. |

### Comportamento

- Carrega a Google Maps JavaScript API via `useJsApiLoader` com a biblioteca `drawing`.
- A ferramenta de desenho fica no centro superior do mapa, restrita ao modo **Polígono**.
- Ao finalizar um polígono, o modo de desenho é automaticamente desativado.
- Cada vértice pode ser movido após o desenho (polígonos editáveis).
- **Clique direito** em um polígono o remove.
- **Limpar seleção**: remove todos os polígonos e emite GeoJSON vazio.
- **Salvar seleção**: confirma o estado atual e emite o GeoJSON para o formulário pai.
- O mapa é centralizado por padrão em Recife/PE (`lat: -8.0476, lng: -34.877`), zoom 11.

### Variável de ambiente necessária

```bash
# frontend/.env.local
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=sua_chave_aqui
```

Se a variável não estiver definida, o componente exibe um aviso e não carrega o mapa.

---

## Formato GeoJSON salvo

O polígono exportado segue o padrão **RFC 7946** com anel fechado obrigatório (primeiro ponto = último ponto).

```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "properties": {},
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [-35.1, -8.2],
            [-35.0, -8.2],
            [-35.0, -8.3],
            [-35.1, -8.2]
          ]
        ]
      }
    }
  ]
}
```

Geometrias suportadas: `Polygon` e `MultiPolygon`.

---

## Onde fica salvo no banco

Tabela: **`TentativaFormulario`**  
Campo: **`respostas`** (tipo `Json` → `jsonb` no PostgreSQL)

O GeoJSON é armazenado em duas posições dentro do objeto `respostas` para compatibilidade com o schema canônico do FIDE:

```json
{
  "fide": {
    "mapa_geojson": { ...FeatureCollection... },
    "areaPopulacaoAfetada": {
      "mapa_selecao": { ...FeatureCollection... },
      "descricao_areas_afetadas": "..."
    }
  },
  "dmate": { ... }
}
```

Não há coluna espacial dedicada (PostGIS não é requisito nesta versão). Todo o dado geográfico vive no `jsonb`.

---

## Validações do backend

Arquivo: `backend/src/modules/Formulario/formulario.service.ts`

Antes de persistir, o backend valida:

1. O valor é um **FeatureCollection** com ao menos uma feature.
2. Cada feature tem geometria do tipo `Polygon` ou `MultiPolygon`.
3. Cada anel do polígono tem ao menos **4 posições** (3 vértices + fechamento).
4. O anel está **fechado** (primeira e última coordenada iguais).
5. Cada coordenada está dentro do intervalo válido (`lng: -180..180`, `lat: -90..90`).

Erros retornam HTTP 400 com mensagem descritiva.

---

## Validação no frontend

Arquivo: `frontend/app/(painel)/simulador/fide-dmate/page.tsx`

Antes de enviar o formulário, verifica se `fideData.mapa_geojson` contém ao menos uma feature. Se não houver área selecionada, o submit é bloqueado e uma mensagem é exibida ao usuário.

---

## Evolução futura sugerida

- Adicionar suporte a **importação de arquivo GeoJSON externo** (upload `.geojson`/`.json`) para preencher áreas automaticamente.
- Migrar para **PostGIS** se houver necessidade de consultas espaciais (intersecção, proximidade, área em km²).
- Ajuste automático de zoom com `fitBounds` ao importar GeoJSON externo.
