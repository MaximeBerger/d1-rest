export function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

export function labelizeAnswers(answers) {
  const labels = ["A", "B", "C", "D", "E", "F", "G", "H"];
  answers.forEach((a, i) => a.id = labels[i] || String(i + 1));
}

export function pickRandomQuestions(questions, count) {
  const clone = questions.slice();
  shuffleArray(clone);
  return clone.slice(0, Math.min(count, clone.length));
}


