import type { DailyLog, FlowLevel } from '@/types';

export interface ParsedLog {
  flow?: FlowLevel;
  pain?: { locations: string[]; severity: number };
  symptoms?: { name: string; severity: 1 | 2 | 3 }[];
  mood?: string[];
  products?: { mention: string; count?: number }[];
  leak?: boolean;
  remedies?: { name: string; helped?: 'a-lot' | 'a-bit' | 'no' }[];
  sleep?: { hours: number };
  notes?: string;
  cycleStarted?: boolean;
  rawText: string;
}

const flowWords: { words: string[]; level: FlowLevel }[] = [
  { words: ['flooding', 'soaked through', 'soaking through'], level: 'very-heavy' },
  { words: ['heavy', 'really heavy', 'very heavy'], level: 'heavy' },
  { words: ['spotting'], level: 'spotting' },
  { words: ['light'], level: 'light' },
  { words: ['moderate', 'medium'], level: 'moderate' },
];

const painWords: { words: string[]; locations: string[]; severity: number }[] = [
  { words: ['cramps', 'cramping'], locations: ['cramps'], severity: 5 },
  { words: ['back pain', 'back ache', 'sore back'], locations: ['back'], severity: 5 },
  { words: ['headache', 'head ache'], locations: ['head'], severity: 5 },
  { words: ['breast tenderness', 'sore breasts', 'tender breasts'], locations: ['breasts'], severity: 4 },
];

const severityIntensifiers: { words: string[]; severity: number }[] = [
  { words: ['severe', 'killing', 'unbearable', 'excruciating'], severity: 9 },
  { words: ['bad', 'really bad', 'terrible', 'awful'], severity: 7 },
  { words: ['mild', 'slight'], severity: 3 },
  { words: ['moderate'], severity: 5 },
];

const moodWords: { words: string[]; mood: string }[] = [
  { words: ['irritable', 'grumpy', 'snappy'], mood: 'Irritable' },
  { words: ['anxious', 'worried', 'nervous'], mood: 'Anxious' },
  { words: ['low', 'down', 'sad'], mood: 'Low' },
  { words: ['emotional', 'tearful', 'weepy'], mood: 'Emotional/tearful' },
  { words: ['calm', 'peaceful'], mood: 'Calm' },
  { words: ['happy', 'good mood'], mood: 'Happy' },
  { words: ['sensitive'], mood: 'Sensitive' },
  { words: ['focused'], mood: 'Focused' },
  { words: ['unmotivated', 'lazy'], mood: 'Unmotivated' },
];

const productWords: { words: string[]; product: string }[] = [
  { words: ['pad', 'pads'], product: 'Pads' },
  { words: ['tampon', 'tampons'], product: 'Tampons' },
  { words: ['cup'], product: 'Menstrual cup' },
  { words: ['liner', 'liners'], product: 'Pads' },
  { words: ['period underwear', 'underwear'], product: 'Period underwear' },
  { words: ['disc'], product: 'Disc' },
];

const remedyWords: { words: string[]; remedy: string }[] = [
  { words: ['ibuprofen', 'advil', 'motrin'], remedy: 'Ibuprofen' },
  { words: ['paracetamol', 'acetaminophen', 'tylenol', 'panadol'], remedy: 'Paracetamol/acetaminophen' },
  { words: ['heat', 'hot water bottle', 'heat pack', 'hot pad'], remedy: 'Heat' },
  { words: ['rest', 'nap', 'lay down', 'lie down'], remedy: 'Rest/nap' },
  { words: ['walk', 'walking'], remedy: 'Gentle walk' },
  { words: ['stretching', 'yoga'], remedy: 'Stretching/yoga' },
  { words: ['shower', 'bath', 'hot shower'], remedy: 'Hot shower/bath' },
  { words: ['tea', 'herbal tea'], remedy: 'Herbal tea' },
  { words: ['magnesium'], remedy: 'Magnesium' },
  { words: ['chocolate'], remedy: 'Dark chocolate' },
  { words: ['caffeine', 'less caffeine'], remedy: 'Less caffeine' },
  { words: ['early night', 'went to bed early'], remedy: 'Early night' },
];

const leakWords = ['leaked', 'leak', 'stain', 'stained', 'soaked through'];
const helpedWords = ['helped', 'worked', 'relief'];
const helpedALotWords = ['helped a lot', 'really helped', 'helped so much', 'worked great'];
const helpedNoWords = ['did nothing', "didn't help", 'didnt help', 'no relief', "didn't work"];
const negationWords = ['no', 'not', 'without', "didn't", 'didnt', 'none'];

const cycleStartedWords = ['period started', 'bleed started', 'it started', 'started today', 'came on'];

function matchesAny(text: string, words: string[]): boolean {
  return words.some((w) => {
    const regex = new RegExp(`\\b${escapeRegex(w)}\\b`, 'i');
    return regex.test(text);
  });
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function isNegated(text: string, term: string): boolean {
  // Check if a negation word appears within 2 words before the term
  const regex = new RegExp(`(\\w+\\s+){0,1}(\\w+\\s+)?(${escapeRegex(term)})`, 'i');
  const match = text.match(regex);
  if (!match) return false;
  const beforeTerm = text.slice(0, match.index).trim().split(/\s+/).slice(-2).join(' ');
  return negationWords.some((nw) => beforeTerm.toLowerCase().includes(nw));
}

export function parseNaturalLog(text: string): ParsedLog {
  const result: ParsedLog = { rawText: text };
  const lower = text.toLowerCase();

  // Flow
  for (const { words, level } of flowWords) {
    if (matchesAny(lower, words)) {
      result.flow = level;
      break;
    }
  }

  // Leak
  if (matchesAny(lower, leakWords)) {
    result.leak = true;
  }

  // Cycle started
  if (matchesAny(lower, cycleStartedWords)) {
    result.cycleStarted = true;
  }

  // Pain
  const painLocations: string[] = [];
  let painSeverity = 5;
  for (const { words, locations, severity } of painWords) {
    for (const w of words) {
      if (matchesAny(lower, [w]) && !isNegated(lower, w)) {
        painLocations.push(...locations);
        break;
      }
    }
  }
  // Check for general pain words
  if (matchesAny(lower, ['pain', 'painful', 'hurting', 'hurts']) && !isNegated(lower, 'pain')) {
    if (painLocations.length === 0) painLocations.push('other');
  }
  // Severity
  for (const { words, severity } of severityIntensifiers) {
    if (matchesAny(lower, words)) {
      painSeverity = severity;
      break;
    }
  }
  if (painLocations.length > 0) {
    result.pain = { locations: [...new Set(painLocations)], severity: painSeverity };
  }

  // Symptoms
  const symptoms: { name: string; severity: 1 | 2 | 3 }[] = [];
  if (matchesAny(lower, ['bloating', 'bloated']) && !isNegated(lower, 'bloat')) {
    symptoms.push({ name: 'Bloating', severity: 2 });
  }
  if (matchesAny(lower, ['nausea', 'nauseous', 'sick']) && !isNegated(lower, 'nausea') && !isNegated(lower, 'sick')) {
    symptoms.push({ name: 'Nausea', severity: 2 });
  }
  if (matchesAny(lower, ['dizzy', 'dizziness']) && !isNegated(lower, 'dizz')) {
    symptoms.push({ name: 'Dizziness', severity: 2 });
  }
  if (matchesAny(lower, ['tired', 'fatigue', 'exhausted']) && !isNegated(lower, 'tired') && !isNegated(lower, 'fatigue') && !isNegated(lower, 'exhausted')) {
    symptoms.push({ name: 'Fatigue', severity: 2 });
  }
  if (symptoms.length > 0) result.symptoms = symptoms;

  // Mood
  const moods: string[] = [];
  for (const { words, mood } of moodWords) {
    if (matchesAny(lower, words) && !isNegated(lower, words[0])) {
      moods.push(mood);
    }
  }
  if (moods.length > 0) result.mood = [...new Set(moods)].slice(0, 2);

  // Products
  const products: { mention: string; count?: number }[] = [];
  for (const { words, product } of productWords) {
    if (matchesAny(lower, words)) {
      // Check for count
      const countMatch = text.match(/(\d+)\s*(?:times|time|x)?\s*(?:changed?|changes?)?/i);
      const twiceMatch = /\b(twice|two)\b/i.test(text);
      const thriceMatch = /\b(thrice|three)\b/i.test(text);
      const onceMatch = /\b(once|one)\b/i.test(text);
      const count = countMatch ? parseInt(countMatch[1]) : twiceMatch ? 2 : thriceMatch ? 3 : onceMatch ? 1 : undefined;
      products.push({ mention: product, count });
    }
  }
  if (products.length > 0) result.products = products;

  // Remedies
  const remedies: { name: string; helped?: 'a-lot' | 'a-bit' | 'no' }[] = [];
  for (const { words, remedy } of remedyWords) {
    if (matchesAny(lower, words)) {
      let helped: 'a-lot' | 'a-bit' | 'no' | undefined;
      // Check context around the remedy word
      for (const hw of helpedALotWords) {
        if (matchesAny(lower, [hw])) helped = 'a-lot';
      }
      if (!helped) {
        for (const hw of helpedNoWords) {
          if (matchesAny(lower, [hw])) helped = 'no';
        }
      }
      if (!helped) {
        for (const hw of helpedWords) {
          if (matchesAny(lower, [hw])) helped = 'a-bit';
        }
      }
      remedies.push({ name: remedy, helped });
    }
  }
  if (remedies.length > 0) result.remedies = remedies;

  // Sleep
  const sleepMatch = text.match(/slept\s+(\d+(?:\.\d+)?)\s*hours?/i) || text.match(/(\d+(?:\.\d+)?)\s*hours?\s+(?:of\s+)?sleep/i);
  if (sleepMatch) {
    result.sleep = { hours: parseFloat(sleepMatch[1]) };
  }

  // Energy
  if (matchesAny(lower, ['energy good', 'good energy', 'energetic']) && !isNegated(lower, 'energy')) {
    result.notes = text;
  }

  result.notes = text;
  return result;
}

export function hasParsedAnything(parsed: ParsedLog): boolean {
  return !!(
    parsed.flow ||
    parsed.pain ||
    parsed.symptoms?.length ||
    parsed.mood?.length ||
    parsed.products?.length ||
    parsed.leak ||
    parsed.remedies?.length ||
    parsed.sleep ||
    parsed.cycleStarted
  );
}