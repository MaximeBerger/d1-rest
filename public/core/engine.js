// Moteur de quiz pour un thème donné

import { shuffleArray, labelizeAnswers, pickRandomQuestions } from "./utils.js";

export class ThemeQuizEngine {
  constructor(themeId, themeLabel, allQuestions, numQuestions = 5) {
    this.themeId = themeId;
    this.themeLabel = themeLabel;
    this.allQuestions = allQuestions;
    this.numQuestions = numQuestions;

    this.questions = pickRandomQuestions(allQuestions, numQuestions).map(q => ({
      question: q.question,
      answers: q.answers.map(a => ({ text: a.text, correct: !!a.correct, remediation: a.remediation || "" }))
    }));
    this.index = 0;
    this.triesCurrent = 0;
    this.errorsCumulative = 0;
    this.successCount = 0;

    this.questions.forEach(q => shuffleArray(q.answers));
    this.questions.forEach(q => labelizeAnswers(q.answers));
  }

  get currentQuestion() {
    return this.questions[this.index];
  }

  get total() {
    return this.questions.length;
  }

  resetTries() {
    this.triesCurrent = 0;
  }

  answer(choiceIndex) {
    const q = this.currentQuestion;
    if (!q) return { done: true };
    const selected = q.answers[choiceIndex];
    if (!selected) return { valid: false };

    this.triesCurrent += 1;
    if (selected.correct) {
      this.successCount += 1;
      const prevIndex = this.index;
      this.index += 1;
      const done = this.index >= this.total;
      this.triesCurrent = 0;
      return { valid: true, correct: true, done, movedFrom: prevIndex, movedTo: this.index };
    }
    this.errorsCumulative += 1;
    return { valid: true, correct: false, remediation: selected.remediation || "" };
  }
}


