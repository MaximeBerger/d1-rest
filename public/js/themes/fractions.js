// Données du thème "Fractions"
// Chaque question suit la structure: { question: string, answers: [{ text, correct, remediation? }] }

const FRACTIONS = [
  {
    question: "Simplifie $\\dfrac{6}{8}$ :",
    answers: [
      { text: "$\\dfrac{3}{4}$", correct: true },
      { text: "$\\dfrac{6}{8}$", correct: false, remediation: "Divise numérateur et dénominateur par 2." },
      { text: "$\\dfrac{2}{3}$", correct: false, remediation: "Attention à la simplification : $6/8 = 3/4$." },
      { text: "$\\dfrac{4}{3}$", correct: false, remediation: "Inversion incorrecte." }
    ]
  },
  {
    question: "Calcule $\\dfrac{3}{5}+\\dfrac{1}{10}$ :",
    answers: [
      { text: "$\\dfrac{7}{10}$", correct: true },
      { text: "$\\dfrac{4}{15}$", correct: false, remediation: "Prends un dénominateur commun 10 : $3/5 = 6/10$." },
      { text: "$\\dfrac{2}{5}$", correct: false, remediation: "$6/10 + 1/10 = 7/10$." },
      { text: "$1$", correct: false, remediation: "La somme est inférieure à 1." }
    ]
  },
  {
    question: "Calcule $\\dfrac{4}{9} - \\dfrac{1}{6}$ :",
    answers: [
      { text: "$\\dfrac{5}{18}$", correct: true },
      { text: "$\\dfrac{1}{18}$", correct: false, remediation: "Utilise le PPCM 18 : $4/9 = 8/18$ et $1/6 = 3/18$." },
      { text: "$\\dfrac{7}{18}$", correct: false, remediation: "$8/18 - 3/18 = 5/18$." },
      { text: "$\\dfrac{5}{9}$", correct: false, remediation: "Erreur de dénominateur commun." }
    ]
  },
  {
    question: "Calcule $\\dfrac{2}{3} \\times \\dfrac{9}{4}$ :",
    answers: [
      { text: "$\\dfrac{3}{2}$", correct: true },
      { text: "$\\dfrac{18}{12}$", correct: false, remediation: "Tu peux simplifier par 3 avant de multiplier : $2/3 \\times 9/4 = 2/1 \\times 3/4 = 6/4 = 3/2$." },
      { text: "$\\dfrac{1}{6}$", correct: false, remediation: "Confusion entre multiplication et division." },
      { text: "$2$", correct: false, remediation: "Vérifie la simplification finale: $6/4 = 3/2$." }
    ]
  },
  {
    question: "Calcule $\\dfrac{5}{6} \\div \\dfrac{5}{12}$ :",
    answers: [
      { text: "$2$", correct: true },
      { text: "$\\dfrac{1}{2}$", correct: false, remediation: "Diviser par une fraction revient à multiplier par son inverse: $5/6 \\times 12/5 = 2$." },
      { text: "$\\dfrac{25}{72}$", correct: false, remediation: "Tu as multiplié au lieu d'inverser puis multiplier." },
      { text: "$\\dfrac{12}{5}$", correct: false, remediation: "C'est l'inverse du résultat attendu." }
    ]
  }
];

export default FRACTIONS;


