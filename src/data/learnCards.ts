export interface LearnCard {
  id: string;
  trigger: string;
  title: string;
  body: string;
  evidenceLine: string;
  action: string;
  modes?: string[];
}

export const learnCards: LearnCard[] = [
  {
    id: 'tss-safety',
    trigger: 'first-tampon-cup',
    title: 'Tampon and cup safe use',
    body: 'Tampons and cups should be changed regularly — ideally every 4–8 hours for tampons, every 8–12 hours for cups. Never leave a tampon in longer than 8 hours. Toxic shock syndrome is rare but serious: watch for sudden high fever, vomiting, diarrhoea, dizziness, or a rash that looks like sunburn. If you notice these, remove the product and get medical care immediately.',
    evidenceLine: 'Source type: clinical guidance',
    action: 'Got it',
  },
  {
    id: 'why-ranges',
    trigger: 'first-prediction',
    title: 'Why predictions are ranges, not dates',
    body: 'Your cycle length varies naturally — most people vary by 2–7 days cycle to cycle. So instead of saying "your period starts Tuesday", Cyclewise gives you a range like "Thursday–Saturday, most likely Friday". The range narrows as we learn your pattern over 2–3 cycles.',
    evidenceLine: 'Source type: reviewed evidence',
    action: 'Makes sense',
  },
  {
    id: 'why-cycles-vary',
    trigger: 'long-or-short-cycle',
    title: 'Why cycles vary — common reasons',
    body: 'Cycle length can shift for many common reasons: stress, travel, illness, weight changes, exercise changes, starting or stopping contraception, and perimenopause. A cycle that is longer or shorter than usual once in a while is very common. If the pattern persists for 2+ cycles, it is worth tracking and mentioning to a clinician.',
    evidenceLine: 'Source type: reviewed evidence',
    action: 'Thanks',
  },
  {
    id: 'pbac-explainer',
    trigger: 'first-pbac',
    title: 'What PBAC is',
    body: 'PBAC (Pictorial Blood Loss Assessment Chart) is a validated tool clinicians use to estimate menstrual blood loss. You score how soaked each pad or tampon is, plus clots and flooding episodes. A cycle score of 100+ is in the range clinicians use for heavy menstrual bleeding. It is useful evidence to bring to an appointment.',
    evidenceLine: 'Source type: validated clinical instrument',
    action: 'Start scoring',
  },
  {
    id: 'spotting-between',
    trigger: 'first-spotting',
    title: 'Spotting between periods',
    body: 'Spotting between periods can happen for many reasons — ovulation, hormonal changes, starting or changing contraception, or sometimes something worth checking. Track when it happens, how much, and any other symptoms. If it persists for 2–3 cycles, consider mentioning it to a clinician.',
    evidenceLine: 'Source type: reviewed evidence',
    action: 'Track it',
  },
  {
    id: 'cramps-explainer',
    trigger: 'severe-pain',
    title: 'Cramps — what is commonly going on',
    body: 'Cramps are caused by prostaglandins, natural chemicals your body releases that make the uterus contract. They are usually strongest on day 1–2. Heat, rest, and over-the-counter pain relief help many people. If pain is severe enough to disrupt your day regularly, or is different from your usual pattern, that is worth tracking and discussing with a clinician.',
    evidenceLine: 'Source type: clinical guidance',
    action: 'See my playbook',
  },
  {
    id: 'iud-bleeding',
    trigger: 'transition-iud',
    title: 'Starting a hormonal IUD — common bleeding pattern',
    body: 'After a hormonal IUD is placed, irregular spotting is very common for the first 3–6 months. Many people find their periods become lighter or stop entirely after settling in. This is expected, not a sign something is wrong. Track the pattern so you can show your clinician at your follow-up.',
    evidenceLine: 'Source type: reviewed evidence',
    action: 'Track my pattern',
  },
  {
    id: 'implant-bleeding',
    trigger: 'transition-implant',
    title: 'Implant bleeding patterns',
    body: 'Irregular bleeding is the most common reason people stop using the contraceptive implant. Spotting, prolonged bleeding, or unpredictable cycles are common in the first 6–12 months. For many, this settles. Track your pattern — if it is not improving after 6 months, your clinician can discuss options.',
    evidenceLine: 'Source type: reviewed evidence',
    action: 'Track my pattern',
  },
  {
    id: 'stopped-contraception',
    trigger: 'transition-stopped',
    title: 'After stopping contraception',
    body: 'When you stop hormonal contraception, your body takes time to return to its natural cycle. This can take a few weeks to a few months. Your cycle may be different from what it was before — in length, flow, or symptoms. Cyclewise will re-baseline your predictions as your natural pattern emerges.',
    evidenceLine: 'Source type: reviewed evidence',
    action: 'Track my return',
  },
  {
    id: 'first-periods-teen',
    trigger: 'teen-first',
    title: 'First periods — what is normal',
    body: 'In the first 2–3 years after your periods start, it is completely normal for them to be irregular, vary a lot in length, and skip months. Your body is still settling into its pattern. Wide ranges in Cyclewise are expected at your age — they are not a sign something is wrong.',
    evidenceLine: 'Source type: clinical guidance',
    action: 'Okay',
  },
  {
    id: 'started-at-school',
    trigger: 'teen-school',
    title: 'It started at school — your playbook',
    body: 'If your period starts at school: you are okay. Ask a friend, the school nurse, or the front office for a pad or tissue. Folded tissue works as a bridge until you get a pad. If you do not have supplies, the school must let you use the bathroom and access support. You can also keep a small kit in your bag — Cyclewise helps you build one.',
    evidenceLine: 'Source type: reviewed evidence',
    action: 'Build my kit',
  },
  {
    id: 'postpartum-bleeding',
    trigger: 'postpartum',
    title: 'Bleeding after birth vs your first period',
    body: 'After birth, you will have bleeding called lochia — this is different from a period and can last 2–6 weeks. Your first real period may not return for weeks or months, especially if you are breastfeeding. Cyclewise tracks lochia and your first period separately so the record is clear.',
    evidenceLine: 'Source type: clinical guidance',
    action: 'Track lochia',
  },
  {
    id: 'peri-basics',
    trigger: 'perimenopause',
    title: 'When cycles start to change',
    body: 'Perimenopause is the transition before menopause, usually starting in your 40s. Cycles often become shorter, then longer, and flow can change. Hot flushes, night sweats, and sleep changes are common. This transition takes years, not weeks. Tracking the changes gives you and your clinician a clear picture.',
    evidenceLine: 'Source type: reviewed evidence',
    action: 'Track changes',
  },
  {
    id: 'meno-bleeding',
    trigger: 'menopause-plus',
    title: 'Bleeding after menopause — why to get it checked',
    body: 'Any bleeding after 12 months without a period should be checked by a clinician promptly. It is often nothing serious, but it should always be evaluated. Cyclewise will always show you the care card when you log bleeding in this mode.',
    evidenceLine: 'Source type: clinical guidance',
    action: 'See care card',
  },
];