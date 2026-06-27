import quizData from "../data/quiz.json" with { type: "json" };

type QuizQuestion = {
    question: string;
    options: string[];
    answer: number;
};

type QuizData = {
    [category: string]: QuizQuestion[];
};

// quiz.json is now an array of objects, each with one category key
const quizArray = quizData as QuizData[];

// Merge all category objects into one flat lookup (lowercase keys)
const quizLower: QuizData = {};
const _categoryNames: string[] = [];
for (const obj of quizArray) {
    for (const key of Object.keys(obj)) {
        _categoryNames.push(key);
        quizLower[key.toLowerCase()] = (obj as any)[key];
    }
}

export function getQuizCategories(): string[] {
    return _categoryNames;
}

export function getRandomQuestion(category: string): QuizQuestion | null {
    let questions = quizLower[category.toLowerCase()];
    
    // Fallback: If the category is completely missing from quiz.json, pick a random category
    if (!questions || questions.length === 0) {
        const availableCategories = Object.keys(quizLower);
        if (availableCategories.length === 0) return null;
        
        const randomFallbackCategory = availableCategories[Math.floor(Math.random() * availableCategories.length)]!;
        questions = quizLower[randomFallbackCategory];
    }
    
    if (!questions || questions.length === 0) return null;
    return questions[Math.floor(Math.random() * questions.length)]!;
}