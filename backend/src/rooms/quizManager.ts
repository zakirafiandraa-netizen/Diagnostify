import quizData from "../data/quiz.json" with { type: "json" };

type QuizQuestion = {
    question: string;
    options: string[];
    answer: number;
};

type QuizData = {
    [category: string]: QuizQuestion[];
};

const quiz = quizData as QuizData;

// Build a lowercase-keyed lookup for case-insensitive matching
const quizLower: QuizData = {};
for (const key of Object.keys(quiz)) {
    quizLower[key.toLowerCase()] = quiz[key]!;
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