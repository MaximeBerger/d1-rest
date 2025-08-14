// Registre des thèmes disponibles
// Chaque entrée: { id, label, data: questions[] }

import FRACTIONS from "../themes/fractions.js";
import PUISSANCES from "../themes/puissances.js";
import EXPONENTIELLE from "../themes/exponentielle.js";

export const THEMES = [
  { id: "fractions", label: "Fractions", data: FRACTIONS },
  { id: "puissances", label: "Puissances", data: PUISSANCES },
  { id: "exponentielle", label: "Exponentielle", data: EXPONENTIELLE }
];


