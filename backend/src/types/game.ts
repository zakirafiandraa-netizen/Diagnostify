export type Player = {
    id: string,
    name: string,
    isHost: boolean,
    score: number,
    role?: "Civilian" | "Undercover" | "Mr White",
    word?: string
};

export type Card = {
    id: number;
    role: "Civilian" | "Undercover" | "Mr White";
    word: string;
    pickedBy?: string; // playerId
};

export type Room = {
    code: string,
    players: Player[],
    status: "Waiting" | "In_Game",
    category?: string,
    civilianWord?: string,
    undercoverWord?: string,
    cards?: Card[]
};