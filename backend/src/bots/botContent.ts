export type BotDifficulty = "easy" | "medium" | "hard";
export const QUIZ_ACCURACY: Record<BotDifficulty, number> = { easy: 0.4, medium: 0.6, hard: 0.85 };
export const BOT_NAMES = ["Dr. Clara", "Dr. Anton", "Dr. Maya", "Dr. Budi", "Dr. Sari", "Dr. Rizky", "Dr. Dewi", "Dr. Putra", "Dr. Lina", "Dr. Hadi"];
export const CHAT_COLORS = ["#0D9488", "#8B5CF6", "#F97316", "#EC4899", "#3B82F6", "#EAB308", "#EF4444", "#06B6D4"];

export const rand = (min: number, max: number) => min + Math.random() * (max - min);
export const pick = <T>(a: T[]): T | undefined => a[Math.floor(Math.random() * a.length)];

const CLUES = [
    (c: string) => `A classic case you would study under ${c}.`,
    () => "The history alone gives you a strong lead on this one.",
    () => "Workup usually starts with a carefl history and examination.",
    () => "Complications are what make this worth catching early.",
    () => "Age and risk factors matter quite a bit for this diagnosis",
];

export function makeClue(word: string, category: string, others: string[], used: Set<string>): string {
    const options = word
        ? CLUES.map((f) => f(category))
        : [`That fits the ${category} picture for me.`, "I would agree with the direction so far.",
        ...others.map((o) => `Like ${o} said, that sounds about right for ${category}.`)];
    const text = pick(options.filter((c) => !used.has(c))) ?? pick(options)!;
    used.add(text);
    return text
}

export const makeSolution = (d: string) =>
    `Confirm ${d} with targeted history, examination and investigations, then start treatment and supportive care. Counsel the patient and arrange follow-up to monitor response and complications.`;