export const config = {
  transition: {
    outgoingLag: 0.75,
    imageDepth: 0.1,
    seamBlend: 0.2,
    captionWindow: 0.1,
    backdropOpacityStart: 0.5
  },

  captionFadeMs: 400,

  scroll: {
    snapDelayMs: 160,
    stepMs: 700
  },

  font: {
    googleSlug: 'Cormorant',
    weights: { normal: 500, bold: 700 },
    sizePx: { title: 144, caption: 22, subtitle: 50 }
  }
} as const;

export const fontFamily = config.font.googleSlug.replace(/\+/g, ' ');

export const googleFontsHref =
  `https://fonts.googleapis.com/css2?family=${config.font.googleSlug}` +
  `:ital,wght@0,${config.font.weights.normal};0,${config.font.weights.bold};` +
  `1,${config.font.weights.normal};1,${config.font.weights.bold}&display=swap`;
