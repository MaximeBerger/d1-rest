// Données du thème "Exponentielle"

const EXPONENTIELLE = [
  {
    question: "La dérivée de $e^{2x}$ est :",
    answers: [
      { text: "$2e^{2x}$", correct: true },
      { text: "$e^{2x}$", correct: false, remediation: "Chaîne: dérivée de $2x$ vaut 2, donc $2e^{2x}$." },
      { text: "$2x e^{2x}$", correct: false, remediation: "Ce n'est pas une dérivation de produit." },
      { text: "$e^{x}$", correct: false, remediation: "Exposant incorrect." }
    ]
  },
  {
    question: "Résous $e^{x}=1$ :",
    answers: [
      { text: "$x=0$", correct: true },
      { text: "$x=1$", correct: false, remediation: "$e^0=1$." },
      { text: "$x=\\ln(1)$", correct: false, remediation: "C'est 0, donc $x=0$." },
      { text: "Aucune solution", correct: false, remediation: "$e^x$ est toujours positif et vaut 1 en 0." }
    ]
  },
  {
    question: "La solution de $e^{x}=5$ est :",
    answers: [
      { text: "$x=\\ln(5)$", correct: true },
      { text: "$x=5$", correct: false, remediation: "Applique $\\ln$ des deux côtés." },
      { text: "$x=\\dfrac{1}{5}$", correct: false, remediation: "Confusion: on utilise le logarithme." },
      { text: "$x=5e$", correct: false, remediation: "Mauvaise manipulation." }
    ]
  },
  {
    question: "Calcule $e^x \\cdot e^{3x}$ :",
    answers: [
      { text: "$e^{4x}$", correct: true },
      { text: "$e^{3x}$", correct: false, remediation: "Additionne les exposants: $x+3x=4x$." },
      { text: "$e^{x}$", correct: false, remediation: "Addition manquante." },
      { text: "$e^{x^4}$", correct: false, remediation: "Ce n'est pas $x^4$ dans l'exposant." }
    ]
  },
  {
    question: "Calcule $\\dfrac{e^{2x}}{e^{x}}$ :",
    answers: [
      { text: "$e^{x}$", correct: true },
      { text: "$e^{3x}$", correct: false, remediation: "Soustrais les exposants: $2x - x = x$." },
      { text: "$x e^{x}$", correct: false, remediation: "Pas de facteur $x$ ici." },
      { text: "$e^{2x}$", correct: false, remediation: "Manque la soustraction des exposants." }
    ]
  }
];

export default EXPONENTIELLE;


