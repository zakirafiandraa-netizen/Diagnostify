import data from "../data/diagnoses.json" with { type: "json" };

type DiagnosisPair = {
    main: string;
    differential: string;
};

type DiagnosesData = {
    [category: string]: DiagnosisPair[];
};

const diagnoses = data as DiagnosesData;

export function getCategories(): string[] {
    return Object.keys(diagnoses);
}

export function getRandomPair(category: string): DiagnosisPair | null {
    const pairs = diagnoses[category];
    if (!pairs || pairs.length === 0) return null;
    const index = Math.floor(Math.random() * pairs.length);
    return pairs[index]!;
}

export function getRandomPairFromAnyCategory(): {
    category: string;
    pair: DiagnosisPair;
} {
    const categories = getCategories();
    const category = categories[Math.floor(Math.random() * categories.length)]!;
    const pair = getRandomPair(category)!;
    return { category, pair };
}
