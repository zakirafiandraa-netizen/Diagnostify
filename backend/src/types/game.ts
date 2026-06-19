export type Player = {
    id: string,
    name: string,
    isHost: boolean,
    score: number,
};

export type Room = {
    code: string,
    players: Player[],
    status: "Waiting" | "In_Game"
};