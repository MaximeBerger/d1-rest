// Données du thème "Puissances"

const PUISSANCES = [
  {
    question: "Calcule $2^3 \\times 2^4$ :",
    answers: [
      { text: "$2^7$", correct: true },
      { text: "$2^{12}$", correct: false, remediation: "Additionne les exposants pour un produit de même base: $3+4=7$." },
      { text: "$2^1$", correct: false, remediation: "Tu as soustrait au lieu d'additionner." },
      { text: "$7^2$", correct: false, remediation: "On ne multiplie pas la base ici." }
    ]
  },
  {
    question: "Calcule $5^6 \\div 5^2$ :",
    answers: [
      { text: "$5^4$", correct: true },
      { text: "$5^8$", correct: false, remediation: "Soustrais les exposants pour un quotient de même base: $6-2=4$." },
      { text: "$5^3$", correct: false, remediation: "Erreur de soustraction: $6-2=4$." },
      { text: "$25$", correct: false, remediation: "Forme puissance attendue." }
    ]
  },
  {
    question: "Calcule $(3^2)^4$ :",
    answers: [
      { text: "$3^8$", correct: true },
      { text: "$3^6$", correct: false, remediation: "Produit de puissances: multiplie les exposants: $2\\times4=8$." },
      { text: "$9^4$", correct: false, remediation: "Réécriture correcte mais la forme canonique est $3^8$." },
      { text: "$12$", correct: false, remediation: "Ceci n'est pas une puissance de 3." }
    ]
  },
  {
    question: "Calcule $10^3 \\times 10^{-5}$ :",
    answers: [
      { text: "$10^{-2}$", correct: true },
      { text: "$10^8$", correct: false, remediation: "Additionne: $3+(-5)=-2$." },
      { text: "$10^2$", correct: false, remediation: "Le résultat est une puissance négative." },
      { text: "$10^{-8}$", correct: false, remediation: "Erreur de signe dans la somme des exposants." }
    ]
  },
  {
    question: "Calcule $\\dfrac{2^5}{2^{-1}}$ :",
    answers: [
      { text: "$2^6$", correct: true },
      { text: "$2^4$", correct: false, remediation: "$5-(-1)=6$." },
      { text: "$2^{-6}$", correct: false, remediation: "Attention au signe: soustraire un négatif équivaut à ajouter." },
      { text: "$2^{-4}$", correct: false, remediation: "Même remarque: $5-(-1)=6$." }
    ]
  }
];

export default PUISSANCES;


