(() => {
  "use strict";

const deepFreeze = (value) => {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) {
    return value;
  }

  Object.freeze(value);
  Object.values(value).forEach(deepFreeze);
  return value;
};

const EDITABLE_CONTENT_DEFAULTS = deepFreeze({
  people: {
    title: "People",
    year: 2023,
    medium: "Pintura sobre lienzo",
    dimensions: "50 × 70 cm",
  },
  decollage: {
    title: "Serie de décollages urbanos",
    year: 2020,
    dimensions: "40 × 60 cm",
  },
  paloma: {
    title: "Suspicious Mind",
    year: 2017,
    medium: "Acuarela sobre papel",
    dimensions: "30 × 40 cm",
    exhibition: "Exposición colectiva",
  },
  cellDrops: {
    year: 2021,
    originalProcess: "Fotografía, ilustración y creación digital",
    presentation: "Caja de luz",
    dimensions: "70 × 110 cm",
  },
  redNight: {},
  constelacion: {
    title: "Constelación interior",
    year: 2026,
  },
  rostroMagnetico: {
    title: "Rostro magnético",
    year: 2026,
  },
  endemoniados: {
    title: "Endemoniados demonios domésticos",
    year: 2012,
    role:
      "Intérprete / performer en la videoinstalación de siete canales de Iury Lech.",
  },
});

const EDITABLE_CONTENT_FIELDS = deepFreeze([
  {
    key: "people",
    label: "People",
    description: "Obra donada y adjudicada en subasta.",
    fields: [
      { key: "title", label: "Título", type: "text", maxLength: 160 },
      { key: "year", label: "Año", type: "year", min: 1900, max: 2100 },
      { key: "medium", label: "Técnica / soporte", type: "text", maxLength: 160 },
      { key: "dimensions", label: "Dimensiones", type: "text", maxLength: 80 },
    ],
  },
  {
    key: "decollage",
    label: "Serie de décollages urbanos",
    description: "Obra física y digital destacada.",
    fields: [
      { key: "title", label: "Título", type: "text", maxLength: 160 },
      { key: "year", label: "Año", type: "year", min: 1900, max: 2100 },
      { key: "dimensions", label: "Dimensiones", type: "text", maxLength: 80 },
    ],
  },
  {
    key: "paloma",
    label: "Suspicious Mind",
    description: "Acuarela de 2017 inspirada en un recuerdo de Paloma Picasso.",
    fields: [
      { key: "title", label: "Título", type: "text", maxLength: 160 },
      { key: "year", label: "Año", type: "year", min: 1900, max: 2100 },
      { key: "medium", label: "Técnica / soporte", type: "text", maxLength: 160 },
      { key: "dimensions", label: "Dimensiones", type: "text", maxLength: 80 },
      {
        key: "exhibition",
        label: "Exposición",
        type: "text",
        maxLength: 300,
      },
    ],
  },
  {
    key: "redNight",
    label: "Creative Insomnia — Red Night",
    description: "Entrada de performance en el archivo.",
    fields: [
      { key: "year", label: "Año", type: "year", min: 1900, max: 2100 },
    ],
  },
  {
    key: "cellDrops",
    label: "Cell Drops",
    description: "Serie presentada en caja de luz.",
    fields: [
      { key: "year", label: "Año", type: "year", min: 1900, max: 2100 },
      { key: "originalProcess", label: "Proceso original", type: "text", maxLength: 200 },
      { key: "presentation", label: "Presentación", type: "text", maxLength: 120 },
      { key: "dimensions", label: "Dimensiones", type: "text", maxLength: 80 },
    ],
  },
  {
    key: "constelacion",
    label: "Constelación interior",
    description: "Obra digital y lectura de archivo.",
    fields: [
      { key: "title", label: "Título", type: "text", maxLength: 160 },
      { key: "year", label: "Año", type: "year", min: 1900, max: 2100 },
    ],
  },
  {
    key: "rostroMagnetico",
    label: "Rostro magnético",
    description: "Obra digital y lectura de archivo.",
    fields: [
      { key: "title", label: "Título", type: "text", maxLength: 160 },
      { key: "year", label: "Año", type: "year", min: 1900, max: 2100 },
    ],
  },
  {
    key: "endemoniados",
    label: "Endemoniados demonios domésticos",
    description: "Entrada de videoinstalación en el archivo.",
    fields: [
      { key: "title", label: "Título", type: "text", maxLength: 160 },
      { key: "year", label: "Año", type: "year", min: 1900, max: 2100 },
      { key: "role", label: "Función / crédito", type: "text", maxLength: 300 },
    ],
  },
]);

const ENALC_EDITABLE_CONTENT = deepFreeze({
  defaults: EDITABLE_CONTENT_DEFAULTS,
  fields: EDITABLE_CONTENT_FIELDS,
});

Object.defineProperty(window, "ENALC_EDITABLE_CONTENT", {
  value: ENALC_EDITABLE_CONTENT,
  configurable: false,
  enumerable: true,
  writable: false,
});
})();
