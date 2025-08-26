/**
 * Gestionnaire de scores pour l'écriture en base de données
 * Inspiré du fichier ecrire.html
 */

class ScoreManager {
  constructor() {
    this.apiEndpoint = '/api/scores';
    this.sessionId = this.generateSessionId();
    this.startedAt = new Date().toISOString();
  }

  /**
   * Génère un ID de session unique
   */
  generateSessionId() {
    return 'qcm_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  /**
   * Enregistre le score d'un thème terminé
   * @param {Object} themeData - Données du thème
   * @param {number} correctAnswers - Nombre de bonnes réponses
   * @param {number} totalQuestions - Nombre total de questions
   */
  async saveThemeScore(themeData, correctAnswers, totalQuestions) {
    try {
      const external_id = this.getStudentName();
      if (!external_id) {
        throw new Error('Veuillez renseigner votre nom dans le champ en haut de page');
      }

      const session = "QCM";
      const theme_code = themeData.id;
      const score = correctAnswers;
      const max_score = totalQuestions;

      const payload = { external_id, session, theme_code, score, max_score };

      console.log('Enregistrement du score:', payload);

      const response = await fetch(this.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('Score enregistré avec succès:', result);
      
      // Afficher une notification de succès
      const percentage = (score / max_score * 100).toFixed(2);
      this.showNotification(`Score enregistré: ${correctAnswers}/${totalQuestions} (${percentage}%)`, true);
      
      return result;

    } catch (error) {
      console.error('Erreur lors de l\'enregistrement du score:', error);
      this.showNotification(`Erreur: ${error.message}`, false);
      throw error;
    }
  }

  /**
   * Récupère le nom de l'étudiant depuis le champ de saisie
   */
  getStudentName() {
    const nameInput = document.getElementById('studentName');
    return nameInput ? nameInput.value.trim() : '';
  }

  /**
   * Enregistre les scores de tous les thèmes terminés
   * @param {Array} themes - Liste des thèmes avec leurs scores
   */
  async saveAllScores(themes) {
    const completedThemes = themes.filter(t => t.done && t.score);
    
    if (completedThemes.length === 0) {
      console.log('Aucun thème terminé à enregistrer');
      return;
    }

    try {
      const external_id = this.getStudentName();
      if (!external_id) {
        throw new Error('Veuillez renseigner votre nom dans le champ en haut de page');
      }

      // Enregistrer chaque thème individuellement
      for (const theme of completedThemes) {
        const [correct, total] = theme.score.split('/').map(Number);
        const themeData = window.THEMES.find(t => t.id === theme.id);
        
        if (themeData) {
          await this.saveThemeScore(themeData, correct, total);
        }
      }
      
      this.showNotification(`${completedThemes.length} thème(s) enregistré(s)`, true);

    } catch (error) {
      console.error('Erreur lors de l\'enregistrement des scores:', error);
      this.showNotification(`Erreur: ${error.message}`, false);
      throw error;
    }
  }

  /**
   * Affiche une notification à l'utilisateur
   * @param {string} message - Message à afficher
   * @param {boolean} isSuccess - Si c'est un succès ou une erreur
   */
  showNotification(message, isSuccess = true) {
    // Créer ou réutiliser l'élément de notification
    let toast = document.getElementById('scoreToast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'scoreToast';
      toast.style.cssText = `
        position: fixed;
        right: 16px;
        bottom: 16px;
        background: #11183a;
        border: 1px solid rgba(255,255,255,0.12);
        color: #e8ecff;
        padding: 12px 14px;
        border-radius: 12px;
        box-shadow: 0 12px 30px rgba(0,0,0,.35);
        opacity: 0;
        transform: translateY(10px);
        transition: .2s;
        z-index: 1000;
        font-family: system-ui, -apple-system, Segoe UI, Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif;
        font-size: 14px;
      `;
      document.body.appendChild(toast);
    }

    // Mettre à jour le style selon le type de message
    toast.style.borderColor = isSuccess ? 'rgba(31,191,117,.6)' : 'rgba(242,87,87,.6)';
    toast.textContent = message;

    // Afficher la notification
    toast.style.opacity = '1';
    toast.style.transform = 'translateY(0)';

    // Masquer après 3 secondes
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
    }, 3000);
  }

  /**
   * Réinitialise la session (nouveau QCM)
   */
  resetSession() {
    this.sessionId = this.generateSessionId();
    this.startedAt = new Date().toISOString();
    console.log('Nouvelle session démarrée:', this.sessionId);
  }
}

// Exporter la classe pour utilisation globale
window.ScoreManager = ScoreManager;
