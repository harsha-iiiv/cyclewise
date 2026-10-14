import type { PSSTResult, DailyRating } from '@/types';

export const PSST_QUESTIONS = [
  'Tension or anxiety',
  'Irritability or anger',
  'Tearfulness or sensitivity',
  'Depressed mood or hopelessness',
  'Decreased interest in work',
  'Decreased interest in home activities',
  'Decreased interest in social activities',
  'Difficulty concentrating',
  'Fatigue or lack of energy',
  'Overeating or food cravings',
  'Insomnia',
  'Hypersomnia (sleeping too much)',
  'Feeling overwhelmed',
  'Physical symptoms (bloating, breast tenderness, etc.)',
  'Work efficiency reduced',
  'Relationships with peers affected',
  'Family relationships affected',
  'Social activities reduced',
  'Home responsibilities affected',
];

export const PSST_CORE_MOOD_INDICES = [0, 1, 2, 3]; // tension, irritability, tearfulness, depressed
export const PSST_SYMPTOM_INDICES = Array.from({ length: 14 }, (_, i) => i); // 0-13
export const PSST_IMPAIRMENT_INDICES = Array.from({ length: 5 }, (_, i) => 14 + i); // 14-18

export function scorePSST(answers: number[]): PSSTResult['pattern'] {
  // Check screen-positive (PMDD pattern):
  // ≥1 core mood symptom rated severe (3)
  // AND ≥4 other items among 1-14 (excluding the core item) rated moderate-severe (2-3)
  // AND ≥1 impairment item (15-19) rated severe (3)

  const coreSevere = PSST_CORE_MOOD_INDICES.some((i) => answers[i] === 3);
  const impairmentSevere = PSST_IMPAIRMENT_INDICES.some((i) => answers[i] === 3);

  if (coreSevere && impairmentSevere) {
    // Count other symptoms (excluding the first core item that was severe)
    const coreSevereIdx = PSST_CORE_MOOD_INDICES.find((i) => answers[i] === 3)!;
    const otherSymptoms = PSST_SYMPTOM_INDICES.filter(
      (i) => i !== coreSevereIdx && answers[i] >= 2
    ).length;

    if (otherSymptoms >= 4) {
      return 'screen-positive';
    }
  }

  // Moderate PMS pattern: same structure at moderate (2) level
  const coreModerate = PSST_CORE_MOOD_INDICES.some((i) => answers[i] >= 2);
  const impairmentModerate = PSST_IMPAIRMENT_INDICES.some((i) => answers[i] >= 2);

  if (coreModerate && impairmentModerate) {
    const coreIdx = PSST_CORE_MOOD_INDICES.find((i) => answers[i] >= 2)!;
    const otherSymptoms = PSST_SYMPTOM_INDICES.filter(
      (i) => i !== coreIdx && answers[i] >= 2
    ).length;
    if (otherSymptoms >= 4) {
      return 'moderate-pattern';
    }
  }

  return 'below-threshold';
}

export function psstResultWording(pattern: PSSTResult['pattern']): string {
  switch (pattern) {
    case 'screen-positive':
      return 'Your answers match the screening pattern for significant premenstrual symptoms. The PSST is a screening tool, not a diagnosis — it can over-identify. The reliable next step is tracking daily ratings for 2 cycles, which Cyclewise can do with you, and taking that record to a clinician.';
    case 'moderate-pattern':
      return 'Your answers suggest a moderate premenstrual symptom pattern. The PSST is a screening tool, not a diagnosis. Tracking daily ratings for 2 cycles would give clearer evidence for a clinician.';
    case 'below-threshold':
      return 'Your answers are below the screening threshold. If you still feel something is off, getting checked is always reasonable.';
  }
}

// Prospective tracking
export const DAILY_RATING_SYMPTOMS = [
  'Tension/anxiety',
  'Irritability',
  'Tearfulness',
  'Depressed mood',
  'Difficulty concentrating',
  'Fatigue',
  'Overeating/cravings',
  'Insomnia',
  'Feeling overwhelmed',
  'Physical symptoms',
  'Headache/pain',
];

export function summarizeDailyRatings(
  ratings: DailyRating[]
): { premenstrualAvg: number; postmenstrualAvg: number; elevation: number; clearance: boolean } | null {
  if (ratings.length < 14) return null;

  // Simplified: split into first 7 days (postmenstrual) and last 7 days (premenstrual)
  const sorted = [...ratings].sort((a, b) => a.date.localeCompare(b.date));
  const post = sorted.slice(0, 7);
  const pre = sorted.slice(-7);

  const avg = (arr: DailyRating[]) => {
    const allScores = arr.flatMap((r) => r.scores);
    return allScores.reduce((a, b) => a + b, 0) / allScores.length;
  };

  const premenstrualAvg = avg(pre);
  const postmenstrualAvg = avg(post);
  const elevation = premenstrualAvg - postmenstrualAvg;
  const clearance = postmenstrualAvg < 3;

  return { premenstrualAvg, postmenstrualAvg, elevation, clearance };
}