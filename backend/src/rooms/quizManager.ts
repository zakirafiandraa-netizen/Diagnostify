import quizData from "../data/quiz.json" with { type: "json" };

type QuizQuestion = {
    question: string;
    options: string[];
    answer: number;
};

type QuizData = {
    [category: string]: QuizQuestion[];
};

// quiz.json is a flat object: { [category]: QuizQuestion[] }
const quizMap = quizData as QuizData;

// Build lowercase lookup and category name list
const quizLower: QuizData = {};
const _categoryNames: string[] = [];
for (const [key, questions] of Object.entries(quizMap)) {
    _categoryNames.push(key);
    quizLower[key.toLowerCase()] = questions;
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