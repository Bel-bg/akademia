/**
 * Utilitaires pour le partage direct des formations.
 */

/**
 * Construit le lien direct absolu vers la formation.
 */
export function getFormationDirectUrl(moduleId: string, formationId: string): string {
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  return `${origin}/m/${moduleId}/formation/${formationId}`;
}

/**
 * Copie le lien direct de la formation dans le presse-papiers.
 */
export async function copyFormationLink(moduleId: string, formationId: string): Promise<boolean> {
  const url = getFormationDirectUrl(moduleId, formationId);
  try {
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(url);
      return true;
    }
    const input = document.createElement('textarea');
    input.value = url;
    input.style.position = 'fixed';
    input.style.opacity = '0';
    document.body.appendChild(input);
    input.focus();
    input.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(input);
    return ok;
  } catch (err) {
    console.error('Erreur lors de la copie du lien:', err);
    return false;
  }
}
