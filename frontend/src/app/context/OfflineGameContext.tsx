import { createContext, useContext, useState, useCallback, useMemo } from "react";
import type { ReactNode } from "react";
import type { OfflinePlayer, OfflineCard, OfflineQuizTurn } from "../types";
import diagnosesData from "../../../../backend/src/data/diagnoses.json";
import quizData from "../../../../backend/src/data/quiz.json";

type DiagnosisPair = { main: string; differential: string };
type DiagnosesMap = Record<string, DiagnosisPair[]>;
type QuizQuestionRaw = { question: string; options: string[]; answer: number };
type QuizMap = Record<string, QuizQuestionRaw[]>;

const diagnoses = diagnosesData as unknown as DiagnosesMap;
const quizzes = quizData as unknown as QuizMap;

function shuffle<T>(arr: T[]): T[] {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j]!, a[i]!];
    }
    return a;
}

function getRandomPair(category: string): DiagnosisPair | null {
    const pairs = diagnoses[category];
    if (!pairs || pairs.length === 0) return null;
    return pairs[Math.floor(Math.random() * pairs.length)]!;
}

function getRandomQuizQuestion(category: string): QuizQuestionRaw | null {
    const qs = quizzes[category] ?? Object.values(quizzes).flat();
    if (!qs || qs.length === 0) return null;
    return qs[Math.floor(Math.random() * qs.length)]!;
}

type OfflinePhase = "role" | "discussion" | "voting" | "quiz" | "ranking";
export type OfflinePrivilege = "points" | "immunity" | "clue_request";

interface OfflineGameState {
    offlinePlayers: OfflinePlayer[];
    category: string;
    cards: OfflineCard[];
    round: number;
    phase: OfflinePhase;
    civilianWord: string;
    undercoverWord: string;

    // Voting (host-entered tallies)
    voteTally: Record<string, number>;
    setVoteTally: (playerId: string, count: number) => void;
    resolveVoting: () => void;

    // Role picking
    pickCard: (playerId: string, cardId: number) => string | null;
    allCardsPicked: boolean;

    // Quiz — pass-and-play, one player at a time
    quizQueue: string[];
    currentQuizTurn: OfflineQuizTurn | null;
    quizStarted: boolean;
    fastestCorrectId: string | null;
    privilegePendingFor: string | null;
    // clue_request target: the player who must give a clue next round
    clueRequestTarget: string | null;
    startQuizForCurrentPlayer: () => void;
    submitQuizAnswer: (selectedIndex: number) => { correct: boolean; points: number; hasPrivilege: boolean };
    choosePrivilege: (privilege: OfflinePrivilege, targetId?: string) => void;

    // Lifecycle
    initializeOfflineGame: (players: { id: string; name: string; avatar?: string; color: string }[], category: string) => void;
    goToDiscussion: () => void;
    goToVoting: () => void;
    resetOfflineGame: () => void;
}

const OfflineGameContext = createContext<OfflineGameState | null>(null);

export function useOfflineGame(): OfflineGameState {
    const ctx = useContext(OfflineGameContext);
    if (!ctx) throw new Error("useOfflineGame must be used within <OfflineGameProvider>");
    return ctx;
}

export function OfflineGameProvider({ children }: { children: ReactNode }) {
    const [offlinePlayers, setOfflinePlayers] = useState<OfflinePlayer[]>([]);
    const [category, setCategory] = useState("");
    const [cards, setCards] = useState<OfflineCard[]>([]);
    const [round, setRound] = useState(0);
    const [phase, setPhase] = useState<OfflinePhase>("role");
    const [civilianWord, setCivilianWord] = useState("");
    const [undercoverWord, setUndercoverWord] = useState("");

    const [voteTally, setVoteTallyState] = useState<Record<string, number>>({});

    const [quizQueue, setQuizQueue] = useState<string[]>([]);
    const [currentQuizTurn, setCurrentQuizTurn] = useState<OfflineQuizTurn | null>(null);
    const [quizStarted, setQuizStarted] = useState(false);
    const [fastestCorrectId, setFastestCorrectId] = useState<string | null>(null);
    const [privilegePendingFor, setPrivilegePendingFor] = useState<string | null>(null);
    const [clueRequestTarget, setClueRequestTarget] = useState<string | null>(null);
    const immuneThisRoundRef = useState<Set<string>>(new Set())[0];

    const allCardsPicked = cards.length > 0 && cards.every(c => c.pickedBy);

    // ── Reset / End Game ───────────────────────────────────────────
    const resetOfflineGame = useCallback(() => {
        setOfflinePlayers([]);
        setCategory("");
        setCards([]);
        setRound(0);
        setPhase("role");
        setCivilianWord("");
        setUndercoverWord("");
        setVoteTallyState({});
        setQuizQueue([]);
        setCurrentQuizTurn(null);
        setQuizStarted(false);
        setFastestCorrectId(null);
        setPrivilegePendingFor(null);
        setClueRequestTarget(null);
        immuneThisRoundRef.clear();
    }, [immuneThisRoundRef]);

    // ── Role assignment ────────────────────────────────────────────
    const initializeOfflineGame = useCallback((
        players: { id: string; name: string; avatar?: string; color: string }[],
        cat: string
    ) => {
        const pair = getRandomPair(cat);
        if (!pair) return;

        setCategory(cat);
        setCivilianWord(pair.main);
        setUndercoverWord(pair.differential);

        const roles: { role: "Civilian" | "Undercover" | "Mr White"; word: string }[] = [];
        roles.push({ role: "Undercover", word: pair.differential });
        if (players.length >= 5) roles.push({ role: "Mr White", word: "" });
        const civilianCount = players.length - roles.length;
        for (let i = 0; i < civilianCount; i++) roles.push({ role: "Civilian", word: pair.main });

        const shuffledRoles = shuffle(roles);
        setCards(shuffledRoles.map((r, i) => ({ id: i, role: r.role, word: r.word })));

        setOfflinePlayers(players.map(p => ({
            id: p.id, name: p.name, avatar: p.avatar, color: p.color,
            status: "Alive", roundsSurvived: 0, quizPoints: 0, finalistBonus: 0, score: 0,
        })));

        setRound(1);
        setPhase("role");
    }, []);

    const pickCard = useCallback((playerId: string, cardId: number): string | null => {
        const card = cards.find(c => c.id === cardId);
        if (!card || card.pickedBy) return null;

        card.pickedBy = playerId;
        setCards([...cards]);

        setOfflinePlayers(prev => prev.map(p =>
            p.id === playerId ? { ...p, role: card.role, word: card.word } : p
        ));

        return card.word || "No word — bluff your way through!";
    }, [cards]);

    const goToDiscussion = useCallback(() => setPhase("discussion"), []);
    const goToVoting = useCallback(() => {
        setVoteTallyState({});
        setClueRequestTarget(null);
        setPhase("voting");
    }, []);

    // ── Voting (host enters counts, most-voted eliminated) ─────────
    const setVoteTally = useCallback((playerId: string, count: number) => {
        setVoteTallyState(prev => ({ ...prev, [playerId]: Math.max(0, count) }));
    }, []);

    const resolveVoting = useCallback(() => {
        const alive = offlinePlayers.filter(p => p.status === "Alive");
        const entries = alive.map(p => [p.id, voteTally[p.id] ?? 0] as const);
        const sorted = [...entries].sort((a, b) => b[1] - a[1]);
        const top = sorted[0];
        const tied = sorted.length > 1 && sorted[1]![1] === top?.[1] && (top?.[1] ?? 0) > 0;

        if (top && top[1] > 0 && !tied && !immuneThisRoundRef.has(top[0])) {
            setOfflinePlayers(prev => prev.map(p =>
                p.id === top[0] ? { ...p, status: "Eliminated" as const } : p
            ));
        }
        immuneThisRoundRef.clear();

        // Build this round's quiz queue: every player takes a turn
        setQuizQueue(offlinePlayers.map(p => p.id));
        setFastestCorrectId(null);
        setCurrentQuizTurn(null);
        setQuizStarted(false);
        setPhase("quiz");
    }, [offlinePlayers, voteTally, immuneThisRoundRef]);

    // ── Quiz (pass-and-play, one at a time) ─────────────────────────
    const startQuizForCurrentPlayer = useCallback(() => {
        if (quizQueue.length === 0) return;
        const q = getRandomQuizQuestion(category);
        if (!q) return;

        const optionIndices = q.options.map((_, i) => i);
        const shuffledIndices = shuffle(optionIndices);
        const shuffledOptions = shuffledIndices.map(i => q.options[i]!);
        const correctIndex = shuffledIndices.indexOf(q.answer);

        setCurrentQuizTurn({
            playerId: quizQueue[0]!,
            question: q.question,
            shuffledOptions,
            correctIndex,
        });
        setQuizStarted(true);
    }, [quizQueue, category]);

    const submitQuizAnswer = useCallback((selectedIndex: number) => {
        if (!currentQuizTurn) return { correct: false, points: 0, hasPrivilege: false };

        const playerId = currentQuizTurn.playerId;
        const player = offlinePlayers.find(p => p.id === playerId);
        const correct = selectedIndex === currentQuizTurn.correctIndex;

        let points = 0;
        let hasPrivilege = false;

        if (correct) {
            if (fastestCorrectId === null) {
                setFastestCorrectId(playerId);
                if (player?.status === "Eliminated") {
                    // Eliminated players: flat 15 pts, no privilege choice
                    points = 15;
                } else {
                    // Alive first-correct: choose privilege
                    hasPrivilege = true;
                    setPrivilegePendingFor(playerId);
                }
            } else {
                points = 10;
            }
        }

        if (points > 0) {
            setOfflinePlayers(prev => prev.map(p =>
                p.id === playerId ? { ...p, quizPoints: p.quizPoints + points, score: p.score + points } : p
            ));
        }

        const remaining = quizQueue.slice(1);
        setQuizQueue(remaining);
        setCurrentQuizTurn(null);
        setQuizStarted(false);

        if (remaining.length === 0 && !hasPrivilege) {
            finishQuizRound();
        }

        return { correct, points, hasPrivilege };
    }, [currentQuizTurn, offlinePlayers, fastestCorrectId, quizQueue]);

    const choosePrivilege = useCallback((privilege: OfflinePrivilege, targetId?: string) => {
        if (!privilegePendingFor) return;
        const playerId = privilegePendingFor;

        if (privilege === "points") {
            setOfflinePlayers(prev => prev.map(p =>
                p.id === playerId ? { ...p, quizPoints: p.quizPoints + 15, score: p.score + 15 } : p
            ));
        } else if (privilege === "immunity") {
            immuneThisRoundRef.add(playerId);
        } else if (privilege === "clue_request" && targetId) {
            setClueRequestTarget(targetId);
        }

        setPrivilegePendingFor(null);
        if (quizQueue.length === 0) finishQuizRound();
    }, [privilegePendingFor, quizQueue, immuneThisRoundRef]);

    // ── End of round: award survival points, check for final 3 ─────
    const finishQuizRound = useCallback(() => {
        setOfflinePlayers(prev => {
            const alive = prev.filter(p => p.status === "Alive");
            const reachedFinalThree = alive.length <= 3;

            return prev.map(p => {
                if (p.status !== "Alive") return p;
                const survivalPts = 10;
                const finalistPts = reachedFinalThree && p.finalistBonus === 0 ? 15 : 0;
                return {
                    ...p,
                    roundsSurvived: p.roundsSurvived + 1,
                    finalistBonus: p.finalistBonus + finalistPts,
                    score: p.score + survivalPts + finalistPts,
                };
            });
        });

        setOfflinePlayers(prev => {
            const alive = prev.filter(p => p.status === "Alive");
            if (alive.length <= 3) {
                setPhase("ranking");
            } else {
                setRound(r => r + 1);
                setPhase("discussion");
            }
            return prev;
        });
    }, []);

    const value = useMemo<OfflineGameState>(() => ({
        offlinePlayers, category, cards, round, phase, civilianWord, undercoverWord,
        voteTally, setVoteTally, resolveVoting,
        pickCard, allCardsPicked,
        quizQueue, currentQuizTurn, quizStarted, fastestCorrectId, privilegePendingFor,
        clueRequestTarget,
        startQuizForCurrentPlayer, submitQuizAnswer, choosePrivilege,
        initializeOfflineGame, goToDiscussion, goToVoting, resetOfflineGame,
    }), [
        offlinePlayers, category, cards, round, phase, civilianWord, undercoverWord,
        voteTally, pickCard, allCardsPicked, quizQueue, currentQuizTurn, quizStarted,
        fastestCorrectId, privilegePendingFor, clueRequestTarget, initializeOfflineGame,
        resolveVoting, setVoteTally, startQuizForCurrentPlayer, submitQuizAnswer,
        choosePrivilege, goToDiscussion, goToVoting, resetOfflineGame,
    ]);

    return <OfflineGameContext.Provider value={value}>{children}</OfflineGameContext.Provider>;
}