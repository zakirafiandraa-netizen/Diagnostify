import type { Player } from "../../types";

type StickmanState = "idle" | "typing" | "speaking"

interface RoundTableSceneProps {
    players: Player[];
    playerId?: string;
    typingPlayerIds?: string[];
    speakingPlayerIds?: string[];
    playerClues?: Record<string, string>;
}

interface StickmanPosition {
    x: number;
    y: number;
    angle: number;
    player: Player;
    isMe: boolean;
    state: StickmanState;
}

function getStickmanState(playerId: string, typingIds: string[], speakingIds: string[]): StickmanState {
    if (speakingIds.includes(playerId)) return "speaking";
    if (typingIds.includes(playerId)) return "typing";
    return "idle"
}

function getPositions(
    players: Player[],
    playerId: string,
    typingIds: string[],
    speakingIds: string[],
    cx: number,
    cy: number,
    rx: number,
    ry: number
): StickmanPosition[] {
    if (players.length === 0) return [];
    return players.map((player, i) => {
        // Distribute players along a semi-circle arc on the top side of the table (from -PI + margin to -margin)
        const margin = 0.2; // margin to prevent sticking directly to the sides
        let angle = -Math.PI / 2;
        if (players.length > 1) {
            const startAngle = -Math.PI + margin;
            const endAngle = -margin;
            angle = startAngle + (i * (endAngle - startAngle)) / (players.length - 1);
        }
        return {
            x: cx + rx * Math.cos(angle),
            y: cy + ry * Math.sin(angle),
            angle,
            player,
            isMe: player.id === playerId,
            state: getStickmanState(player.id, typingIds, speakingIds),
        };
    });
}

function getStickmanImage(state: StickmanState): string {
    switch (state) {
        case "typing": return "/stickman-typing.svg";
        case "speaking": return "/stickman-speaking.svg";
        default: return "/stickman-idle.svg";
    }
}

export function RoundTableScene({ players, playerId = "", typingPlayerIds = [], speakingPlayerIds = [], playerClues = {} }: RoundTableSceneProps) {
    const W = 900;
    const H = 840;
    const cx = W / 2;
    const cy = H; // Positioned center exactly at the bottom of the viewBox
    const tableRx = W / 2; // Stretch the table from left to right
    const tableRy = 300; // Vertical radius of the table (controls table perspective)
    const orbitRx = tableRx - 40; // Extra margin for wider inter-player spacing
    const orbitRy = tableRy + 20; // Vertical orbit radius
    const IMG_W = 72;
    const IMG_H = 96;

    const positions = getPositions(players, playerId, typingPlayerIds, speakingPlayerIds, cx, cy, orbitRx, orbitRy);

    return (
        <div className="w-full flex justify-center items-center">
            <svg
                viewBox={`0 0 ${W} ${H}`}
                className="w-full max-w-2xl aspect-[900/840]"
                style={{ height: "auto" }}
                aria-label="Round table with players"
            >
                {/* Layer 1: Players' bodies & highlight rings (drawn behind/under the table surface) */}
                <g id="players-behind-table">
                    {[...positions]
                        .sort((a, b) => Math.sin(a.angle) - Math.sin(b.angle))
                        .map((pos) => {
                            const imgX = pos.x - IMG_W / 2;
                            const imgY = pos.y - IMG_H;
                            const color = pos.player.color ?? "#6366f1";

                            return (
                                <g key={`body-${pos.player.id}`}>
                                    {/* Highlight ring for local player */}
                                    {pos.isMe && (
                                        <ellipse
                                            cx={pos.x}
                                            cy={pos.y - IMG_H / 2}
                                            rx={IMG_W / 2 + 6}
                                            ry={IMG_H / 2 + 6}
                                            fill="none"
                                            stroke={color}
                                            strokeWidth={2}
                                            opacity={0.3}
                                        />
                                    )}

                                    {/* Stickman PNG */}
                                    <image
                                        href={getStickmanImage(pos.state)}
                                        x={imgX}
                                        y={imgY}
                                        width={IMG_W}
                                        height={IMG_H}
                                    />
                                </g>
                            );
                        })}
                </g>

                {/* Layer 2: Table surface (placed in front of Layer 1 to hide lower bodies) */}
                {/* Table shadow */}
                <ellipse cx={cx} cy={cy + 24} rx={tableRx} ry={tableRy * 0.4} fill="rgba(0,0,0,0.07)" />

                {/* Table surface */}
                <ellipse cx={cx} cy={cy} rx={tableRx} ry={tableRy} fill="#f0f4f8" stroke="#cbd5e1" strokeWidth={3} />
                <ellipse cx={cx} cy={cy} rx={tableRx - 20} ry={tableRy - 14} fill="none" stroke="#e2e8f0" strokeWidth={1.5} />

                {/* Table label */}
                <text x={cx} y={cy - tableRy / 2 - 16} textAnchor="middle" fontSize={14} fill="#94a3b8" fontWeight={600} letterSpacing={2}>DISCUSSION</text>
                <text x={cx} y={cy - tableRy / 2 + 28} textAnchor="middle" fontSize={12} fill="#cbd5e1" letterSpacing={0.8}>ROUND TABLE</text>

                {/* Layer 3: Names, speaking & typing indicators (always drawn on top of the table) */}
                <g id="player-indicators-and-names">
                    {positions.map((pos) => {
                        const imgY = pos.y - IMG_H;
                        const color = pos.player.color ?? "#6366f1";

                        return (
                            <g key={`info-${pos.player.id}`}>
                                {/* Speaking indicator bubble */}
                                {pos.state === "speaking" && (
                                    <circle cx={pos.x + IMG_W / 2} cy={imgY} r={7} fill="#22c55e" />
                                )}

                                {/* Typing indicator bubble */}
                                {pos.state === "typing" && (
                                    <circle cx={pos.x + IMG_W / 2} cy={imgY} r={7} fill="#f59e0b" />
                                )}

                                {/* Player name */}
                                <text
                                    x={pos.x}
                                    y={imgY - 16}
                                    textAnchor="middle"
                                    fontSize={13}
                                    fontWeight={600}
                                    fill={color}
                                    opacity={0.9}
                                >
                                    {pos.isMe ? `${pos.player.name} (You)` : pos.player.name}
                                </text>
                                
                                {/* Player submitted clue */}
                                {playerClues[pos.player.name] && (
                                    <text
                                        x={pos.x}
                                        y={imgY - 2}
                                        textAnchor="middle"
                                        fontSize={11}
                                        fontWeight={500}
                                        fill="#64748b"
                                        opacity={0.9}
                                    >
                                        "{playerClues[pos.player.name]}"
                                    </text>
                                )}
                            </g>
                        );
                    })}
                </g>
            </svg>
        </div>
    );
}