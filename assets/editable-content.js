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
  },
  decollage: {
    title: "Serie de décollages urbanos",
  },
  paloma: {
    title: "Suspicious Mind",
    year: 2017,
    exhibition: "Colectiva · nombre y fecha por confirmar",
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
    ],
  },
  {
    key: "decollage",
    label: "Serie de décollages urbanos",
    description: "Obra física y digital destacada.",
    fields: [
      { key: "title", label: "Título", type: "text", maxLength: 160 },
      { key: "year", label: "Año", type: "year", min: 1900, max: 2100 },
    ],
  },
  {
    key: "paloma",
    label: "Suspicious Mind",
    description: "Acuarela de 2017 inspirada en un recuerdo de Paloma Picasso.",
    fields: [
      { key: "title", label: "Título", type: "text", maxLength: 160 },
      { key: "year", label: "Año", type: "year", min: 1900, max: 2100 },
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
