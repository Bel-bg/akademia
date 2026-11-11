import type { Formation } from './types';

export interface FormationShareMeta {
  title: string;
  tagline: string;
  emoji: string;
  color: string;
  level: string;
  minutes: number;
  benefits?: string[];
  lessonsCount: number;
  moduleId: string;
  moduleTitle: string;
  moduleEmoji?: string;
}

/**
 * Fonction de découpage du texte avec retour à la ligne pour canvas.
 */
function wrapLines(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const testWidth = ctx.measureText(testLine).width;
    if (testWidth > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  if (currentLine) {
    lines.push(currentLine);
  }
  return lines;
}

/**
 * Dessine un rectangle avec coins arrondis compatible tous navigateurs.
 */
function drawRoundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  ctx.beginPath();
  if (typeof ctx.roundRect === 'function') {
    ctx.roundRect(x, y, width, height, radius);
  } else {
    const r = Math.min(radius, width / 2, height / 2);
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + width - r, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + r);
    ctx.lineTo(x + width, y + height - r);
    ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
    ctx.lineTo(x + r, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }
}

/**
 * Dessine une étoile à 4 branches scintillante.
 */
function drawStar(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number, color: string) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.beginPath();
  const half = size / 2;
  const dip = size * 0.15;
  ctx.moveTo(cx, cy - half);
  ctx.quadraticCurveTo(cx, cy, cx + half, cy);
  ctx.quadraticCurveTo(cx, cy, cx, cy + half);
  ctx.quadraticCurveTo(cx, cy, cx - half, cy);
  ctx.quadraticCurveTo(cx, cy, cx, cy - half);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

/**
 * Dessine la mascotte Nimbo (nuage à lunettes) sur le canvas.
 */
function drawNimbo(ctx: CanvasRenderingContext2D, cx: number, cy: number, scale = 1, accentColor = '#38bdf8') {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(scale, scale);

  // Ombre portée sous le nuage
  ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
  ctx.beginPath();
  ctx.ellipse(0, 68, 85, 16, 0, 0, Math.PI * 2);
  ctx.fill();

  // Puffs du nuage (fond et bordure)
  const puffs: [number, number, number][] = [
    [-42, 0, 36],
    [0, -22, 46],
    [46, -2, 36],
    [-22, 20, 32],
    [24, 20, 32],
  ];

  // Contour sombre
  ctx.fillStyle = '#0f172a';
  for (const [px, py, pr] of puffs) {
    ctx.beginPath();
    ctx.arc(px, py, pr + 4, 0, Math.PI * 2);
    ctx.fill();
  }

  // Remplissage avec dégradé subtil
  const cloudGrad = ctx.createLinearGradient(0, -60, 0, 50);
  cloudGrad.addColorStop(0, '#ffffff');
  cloudGrad.addColorStop(1, accentColor);
  ctx.fillStyle = cloudGrad;
  for (const [px, py, pr] of puffs) {
    ctx.beginPath();
    ctx.arc(px, py, pr, 0, Math.PI * 2);
    ctx.fill();
  }

  // Reflet blanc sur le haut
  ctx.save();
  ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
  ctx.beginPath();
  ctx.ellipse(-12, -42, 18, 7, -0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Joues roses
  ctx.fillStyle = 'rgba(251, 113, 133, 0.55)';
  ctx.beginPath();
  ctx.arc(-38, 20, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(38, 20, 8, 0, Math.PI * 2);
  ctx.fill();

  // Lunettes (monture)
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 4.5;
  ctx.lineCap = 'round';

  // Branches
  ctx.beginPath();
  ctx.moveTo(-60, 2);
  ctx.lineTo(-72, -4);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(60, 2);
  ctx.lineTo(72, -4);
  ctx.stroke();

  // Pont du nez
  ctx.beginPath();
  ctx.arc(0, 10, 8, Math.PI * 1.1, Math.PI * 1.9);
  ctx.stroke();

  // Verre gauche
  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
  ctx.beginPath();
  ctx.arc(-28, 6, 21, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Verre droit
  ctx.beginPath();
  ctx.arc(28, 6, 21, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Reflets des verres
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(-28, 6, 14, Math.PI * 1.1, Math.PI * 1.45);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(28, 6, 14, Math.PI * 1.1, Math.PI * 1.45);
  ctx.stroke();

  // Yeux souriants derrière les verres
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  ctx.arc(-28, 6, 8, Math.PI * 1.15, Math.PI * 1.85);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(28, 6, 8, Math.PI * 1.15, Math.PI * 1.85);
  ctx.stroke();

  // Bouche souriante
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  ctx.arc(0, 24, 7, 0.15 * Math.PI, 0.85 * Math.PI);
  ctx.stroke();

  ctx.restore();
}

/**
 * Génère un Canvas haute résolution pour la formation.
 */
export async function renderFormationShareCanvas(meta: FormationShareMeta): Promise<HTMLCanvasElement> {
  // Attendre que les polices soient prêtes
  if (typeof document !== 'undefined' && document.fonts) {
    try {
      await document.fonts.ready;
    } catch {
      // Ignorer si échec
    }
  }

  const canvas = document.createElement('canvas');
  const width = 1200;
  const height = 675; // Ratio standard 16:9 HD
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Impossible d’initialiser le contexte 2D.');

  const accent = meta.color || '#4f46e5';

  // 1. Fond principal dégradé sombre et luxueux
  const bgGrad = ctx.createLinearGradient(0, 0, width, height);
  bgGrad.addColorStop(0, '#090d16');
  bgGrad.addColorStop(0.5, '#0e1628');
  bgGrad.addColorStop(1, '#080c14');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, width, height);

  // 2. Halos lumineux d'ambiance avec la couleur d'accent
  const halo1 = ctx.createRadialGradient(200, 100, 10, 200, 100, 480);
  halo1.addColorStop(0, `${accent}40`);
  halo1.addColorStop(1, 'transparent');
  ctx.fillStyle = halo1;
  ctx.fillRect(0, 0, width, height);

  const halo2 = ctx.createRadialGradient(1050, 480, 20, 1050, 480, 520);
  halo2.addColorStop(0, `${accent}35`);
  halo2.addColorStop(1, 'transparent');
  ctx.fillStyle = halo2;
  ctx.fillRect(0, 0, width, height);

  // Étoiles scintillantes décoratives en arrière-plan
  drawStar(ctx, 120, 80, 20, `${accent}99`);
  drawStar(ctx, 1100, 100, 26, '#ffffffaa');
  drawStar(ctx, 640, 50, 16, `${accent}77`);
  drawStar(ctx, 1140, 580, 22, `${accent}aa`);
  drawStar(ctx, 80, 590, 18, '#ffffff66');

  // 3. Carte centrale vitrée (Glassmorphism)
  const cardX = 45;
  const cardY = 45;
  const cardW = 1110;
  const cardH = 585;
  const cardR = 28;

  // Ombre portée de la carte
  ctx.save();
  ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
  ctx.shadowBlur = 35;
  ctx.shadowOffsetY = 15;
  drawRoundRect(ctx, cardX, cardY, cardW, cardH, cardR);
  ctx.fillStyle = 'rgba(17, 24, 39, 0.88)';
  ctx.fill();
  ctx.restore();

  // Remplissage intérieur carte avec dégradé subtil
  const cardGrad = ctx.createLinearGradient(cardX, cardY, cardX + cardW, cardY + cardH);
  cardGrad.addColorStop(0, 'rgba(30, 41, 59, 0.7)');
  cardGrad.addColorStop(1, 'rgba(15, 23, 42, 0.95)');
  ctx.fillStyle = cardGrad;
  drawRoundRect(ctx, cardX, cardY, cardW, cardH, cardR);
  ctx.fill();

  // Bordure lumineuse carte
  const borderGrad = ctx.createLinearGradient(cardX, cardY, cardX + cardW, cardY + cardH);
  borderGrad.addColorStop(0, `${accent}bb`);
  borderGrad.addColorStop(0.5, 'rgba(255, 255, 255, 0.15)');
  borderGrad.addColorStop(1, `${accent}88`);
  ctx.strokeStyle = borderGrad;
  ctx.lineWidth = 2;
  drawRoundRect(ctx, cardX, cardY, cardW, cardH, cardR);
  ctx.stroke();

  // 4. Header de la carte : Logo Akademia & Module
  const headerY = cardY + 50;

  // Icône Akademia (Carré arrondi violet/bleu)
  drawRoundRect(ctx, cardX + 35, headerY - 24, 44, 44, 14);
  const logoGrad = ctx.createLinearGradient(cardX + 35, headerY - 24, cardX + 79, headerY + 20);
  logoGrad.addColorStop(0, '#6366f1');
  logoGrad.addColorStop(1, '#4338ca');
  ctx.fillStyle = logoGrad;
  ctx.fill();

  // Chapeau de diplômé sur l'icône
  ctx.font = '22px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('🎓', cardX + 57, headerY - 1);

  // Titre Akademia
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.font = '900 24px "Baloo 2", Nunito, system-ui, sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.fillText('Akademia', cardX + 90, headerY - 2);

  ctx.font = '800 11px system-ui, sans-serif';
  ctx.fillStyle = '#818cf8';
  ctx.fillText('UNIVERSITÉ · FORMATIONS COACHÉES', cardX + 91, headerY + 14);

  // Badge du module (Pill à droite)
  const moduleText = `${meta.moduleEmoji ? meta.moduleEmoji + ' ' : ''}${meta.moduleTitle}`;
  ctx.font = '700 14px Nunito, system-ui, sans-serif';
  const modWidth = ctx.measureText(moduleText).width + 36;
  const modPillX = cardX + cardW - modWidth - 35;
  const modPillY = headerY - 20;

  drawRoundRect(ctx, modPillX, modPillY, modWidth, 36, 18);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.fill();
  ctx.strokeStyle = `${accent}66`;
  ctx.lineWidth = 1.5;
  drawRoundRect(ctx, modPillX, modPillY, modWidth, 36, 18);
  ctx.stroke();

  ctx.fillStyle = '#ffffff';
  ctx.textBaseline = 'middle';
  ctx.fillText(moduleText, modPillX + 18, modPillY + 18);

  // Ligne de séparation sous le header
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(cardX + 35, headerY + 36);
  ctx.lineTo(cardX + cardW - 35, headerY + 36);
  ctx.stroke();

  // 5. Zone de contenu principale (2 colonnes)
  const contentY = headerY + 68;
  const leftX = cardX + 35;
  const leftMaxWidth = 660;

  // Pills de caractéristiques (Niveau, Durée, Leçons)
  let pillOffset = leftX;
  const pills = [
    { label: meta.level, icon: '🎯', bg: `${accent}33`, border: accent, text: '#ffffff' },
    { label: `~${meta.minutes} min`, icon: '⏱️', bg: 'rgba(255, 255, 255, 0.07)', border: 'rgba(255, 255, 255, 0.2)', text: '#e2e8f0' },
    { label: `${meta.lessonsCount} leçons interactives`, icon: '📖', bg: 'rgba(255, 255, 255, 0.07)', border: 'rgba(255, 255, 255, 0.2)', text: '#e2e8f0' },
  ];

  ctx.font = '700 13px system-ui, sans-serif';
  for (const p of pills) {
    const textWithIcon = `${p.icon}  ${p.label}`;
    const pW = ctx.measureText(textWithIcon).width + 24;
    drawRoundRect(ctx, pillOffset, contentY, pW, 30, 15);
    ctx.fillStyle = p.bg;
    ctx.fill();
    ctx.strokeStyle = p.border;
    ctx.lineWidth = 1.2;
    drawRoundRect(ctx, pillOffset, contentY, pW, 30, 15);
    ctx.stroke();

    ctx.fillStyle = p.text;
    ctx.textBaseline = 'middle';
    ctx.fillText(textWithIcon, pillOffset + 12, contentY + 15);
    pillOffset += pW + 10;
  }

  // Titre de la formation
  const titleY = contentY + 68;
  ctx.textBaseline = 'alphabetic';
  ctx.font = '900 38px "Baloo 2", Nunito, system-ui, sans-serif';
  ctx.fillStyle = '#ffffff';

  // Préparer titre avec emoji
  const fullTitle = `${meta.emoji ? meta.emoji + ' ' : ''}« ${meta.title} »`;
  const titleLines = wrapLines(ctx, fullTitle, leftMaxWidth);

  let curY = titleY;
  for (const line of titleLines.slice(0, 2)) {
    ctx.fillText(line, leftX, curY);
    curY += 46;
  }

  // Tagline / Sous-titre
  ctx.font = '500 17px Nunito, system-ui, sans-serif';
  ctx.fillStyle = '#94a3b8';
  const taglineLines = wrapLines(ctx, meta.tagline, leftMaxWidth);
  for (const line of taglineLines.slice(0, 2)) {
    ctx.fillText(line, leftX, curY);
    curY += 24;
  }

  // Boîte "Au programme / Avantages"
  const benefitsY = Math.max(curY + 12, contentY + 185);
  const benefitsBoxH = 135;
  drawRoundRect(ctx, leftX, benefitsY, leftMaxWidth, benefitsBoxH, 18);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.lineWidth = 1;
  drawRoundRect(ctx, leftX, benefitsY, leftMaxWidth, benefitsBoxH, 18);
  ctx.stroke();

  // En-tête de la boîte
  ctx.font = '800 12px system-ui, sans-serif';
  ctx.fillStyle = '#38bdf8';
  ctx.fillText('CE QUE TU VAS MAÎTRISER DANS CETTE FORMATION :', leftX + 18, benefitsY + 26);

  // Bullets
  const benefitsList = (meta.benefits && meta.benefits.length > 0)
    ? meta.benefits.slice(0, 3)
    : [
        'Explications claires pas à pas avec ton coach virtuel',
        'Exercices pratiques interactifs avec correction immédiate',
        'Mise en pratique directe des notions fondamentales',
      ];

  let bulletY = benefitsY + 54;
  ctx.font = '600 14px Nunito, system-ui, sans-serif';
  for (const b of benefitsList) {
    // Pastille verte avec check
    ctx.save();
    ctx.fillStyle = '#10b981';
    ctx.beginPath();
    ctx.arc(leftX + 28, bulletY - 4, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('✓', leftX + 28, bulletY - 4);
    ctx.restore();

    ctx.fillStyle = '#e2e8f0';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.font = '600 14px Nunito, system-ui, sans-serif';
    const cleanB = b.length > 70 ? b.slice(0, 68) + '…' : b;
    ctx.fillText(cleanB, leftX + 46, bulletY);
    bulletY += 28;
  }

  // 6. Colonne de droite : Illustration Nimbo et Bulle Coach
  const rightCenterX = cardX + cardW - 190;
  const rightCenterY = contentY + 150;

  // Halo derrière Nimbo
  const nimboHalo = ctx.createRadialGradient(rightCenterX, rightCenterY, 20, rightCenterX, rightCenterY, 160);
  nimboHalo.addColorStop(0, `${accent}44`);
  nimboHalo.addColorStop(1, 'transparent');
  ctx.fillStyle = nimboHalo;
  ctx.beginPath();
  ctx.arc(rightCenterX, rightCenterY, 160, 0, Math.PI * 2);
  ctx.fill();

  // Dessin de Nimbo
  drawNimbo(ctx, rightCenterX, rightCenterY, 1.25, accent);

  // Petite bulle au-dessus de Nimbo
  const bubbleX = rightCenterX - 110;
  const bubbleY = rightCenterY - 115;
  const bubbleW = 220;
  const bubbleH = 46;
  drawRoundRect(ctx, bubbleX, bubbleY, bubbleW, bubbleH, 16);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 2.5;
  drawRoundRect(ctx, bubbleX, bubbleY, bubbleW, bubbleH, 16);
  ctx.stroke();

  // Pointe de la bulle vers Nimbo
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.moveTo(rightCenterX - 10, bubbleY + bubbleH);
  ctx.lineTo(rightCenterX, bubbleY + bubbleH + 12);
  ctx.lineTo(rightCenterX + 10, bubbleY + bubbleH);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#0f172a';
  ctx.beginPath();
  ctx.moveTo(rightCenterX - 10, bubbleY + bubbleH);
  ctx.lineTo(rightCenterX, bubbleY + bubbleH + 12);
  ctx.lineTo(rightCenterX + 10, bubbleY + bubbleH);
  ctx.stroke();

  ctx.fillStyle = '#0f172a';
  ctx.font = '800 13px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('Prêt à devenir expert ? 🚀', rightCenterX, bubbleY + 23);

  // 7. Footer de la carte (Bas)
  const footerY = cardY + cardH - 32;

  // Séparateur fin
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(cardX + 35, footerY - 25);
  ctx.lineTo(cardX + cardW - 35, footerY - 25);
  ctx.stroke();

  // Texte à gauche
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.font = '700 13px system-ui, sans-serif';
  ctx.fillStyle = '#94a3b8';
  ctx.fillText('⚡ Exercices pratiques · Pratique immédiate · Validation de compétences', cardX + 35, footerY);

  // Lien direct / deep link à droite
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://akademia.app';
  const urlDisplay = `${origin}/m/${meta.moduleId}/formation/${encodeURIComponent(meta.title.toLowerCase().replace(/\s+/g, '-'))}`;
  const shortDisplay = `akademia.app · ${meta.moduleId} / ${meta.title.slice(0, 24)}`;

  ctx.textAlign = 'right';
  ctx.font = '800 13px system-ui, sans-serif';
  ctx.fillStyle = '#38bdf8';
  ctx.fillText(`🔗 ${shortDisplay}`, cardX + cardW - 35, footerY);

  return canvas;
}

/**
 * Crée le Blob PNG à partir des données de la formation.
 */
export async function generateFormationImageBlob(meta: FormationShareMeta): Promise<Blob> {
  const canvas = await renderFormationShareCanvas(meta);
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Erreur lors de la génération de l’image.'));
      },
      'image/png',
      0.95,
    );
  });
}

/**
 * Télécharge proprement l'image de la formation sur l'appareil de l'utilisateur.
 */
export async function downloadFormationImage(meta: FormationShareMeta): Promise<void> {
  const blob = await generateFormationImageBlob(meta);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const safeTitle = meta.title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  a.href = url;
  a.download = `formation-akademia-${safeTitle || 'cours'}.png`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

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
    // Fallback pour anciens navigateurs / contextes restreints
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
    console.error('Erreur de copie:', err);
    return false;
  }
}
