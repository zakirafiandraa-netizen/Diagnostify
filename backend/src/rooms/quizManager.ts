import quizData from "../data/quiz.json" with { type: "json" };

// Define the shape of a quiz item. Adjust fields to match actual JSON structure.
export interface Quiz {
    id: number;
    question: string;
    options: string[];
    answer: string;
}

// Cast the imported data to an array of Quiz objects
const quizzes: Quiz[] = quizData as unknown as Quiz[];

/**
 * Get all quizzes.
 * @returns An array of Quiz objects.
 */
export function getAllQuizzes(): Quiz[] {
    return quizzes;
}

/**
 * Get a quiz by its ID.
 * @param id - The ID of the quiz to retrieve.
 * @returns The matching Quiz object, or undefined if not found.
 */
export function getQuizById(id: number): Quiz | undefined {
    return quizzes.find((q) => q.id === id);
}
