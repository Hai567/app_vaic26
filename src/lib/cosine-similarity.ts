/**
 * Cosine similarity between two numeric vectors.
 * Used to match user RIASEC profile against job skill vectors.
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) return 0;

  let dotProduct = 0;
  let magnitudeA = 0;
  let magnitudeB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    magnitudeA += a[i] * a[i];
    magnitudeB += b[i] * b[i];
  }

  magnitudeA = Math.sqrt(magnitudeA);
  magnitudeB = Math.sqrt(magnitudeB);

  if (magnitudeA === 0 || magnitudeB === 0) return 0;

  return dotProduct / (magnitudeA * magnitudeB);
}

/**
 * Convert RIASEC scores object to ordered vector.
 */
export function riasecToVector(scores: {
  R: number;
  I: number;
  A: number;
  S: number;
  E: number;
  C: number;
}): number[] {
  return [scores.R, scores.I, scores.A, scores.S, scores.E, scores.C];
}
