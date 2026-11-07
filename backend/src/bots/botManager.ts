import { io as ioClient, type Socket as ClientSocket } from "socket.io-client";
import type { Server } from "socket.io";
import type { Player, Room } from "../types/game.js";
import { getRoom, joinRoom, leaveRoom, deleteRoom, sanitizeRoomForBroadcast, MAX_PLAYERS } from "../rooms/roomManager.js";
import { BOT_NAMES, CHAT_COLORS, QUIZ_ACCURACY, makeClue, makeSolution, pick, rand, type BotDifficulty } from "./botContent.js";

type LiveRoom = Room & Record<string, any>; // includes the server-only _underscore fields
const live = (code: string) => getRoom(code) as LiveRoom | undefined;

/**
 * A bot is a real socket.io client connected to this server, so every action goes through
 * your normal handlers. Fairness: it only uses its own role/word, public state and chat;
 * the one exception is the quiz answer, read server-side so accuracy can be tuned.
 */
class Bot {
    private io!: Server;
    readonly code!: string;
    readonly name!: string;
    private level!: BotDifficulty;
    private onFail!: (b: Bot) => void;
    private socket: ClientSocket;
    private done = new Set<string>();   // actions already scheduled, e.g. "clue:0"
    private timers = new Set<NodeJS.Timeout>();
    private keepalive?: NodeJS.Timeout;
    private chat: { player: string; msg: string }[] = [];
    private used = new Set<string>();
    private dead = false;
    joined = false;

    constructor(init: { io: Server; code: string; name: string; level: BotDifficulty; port: string | number; onFail: (b: Bot) => void }) {
        Object.assign(this, init);
        this.socket = ioClient(`http://127.0.0.1:${init.port}`, { transports: ["websocket"], reconnection: false });
        const s = this.socket;
        s.on("connect", () => this.join());
        s.on("chat:message", (m: { playerName?: string; message?: string }) => {
            if (m?.playerName && m.message && m.playerName !== this.name)
                this.chat = [...this.chat, { player: m.playerName, msg: m.message }].slice(-40);
        });
        s.on("quiz:privilege_options", (d: { options: string[] }) => this.later(rand(2000, 6000), () => this.privilege(d.options)));
        s.on("game:won", () => this.later(20_000, () => this.destroy()));
        s.onAny(() => this.tick());
    }

    get id() { return this.socket.id ?? ""; }
    private me() { return live(this.code)?.players.find((p) => p.id === this.id); }
    private others() { return (live(this.code)?.players ?? []).filter((p) => p.status === "Alive" && p.id !== this.id); }
    private color() {
        const i = live(this.code)?.players.findIndex((p) => p.id === this.id) ?? 0;
        return CHAT_COLORS[Math.max(i, 0) % CHAT_COLORS.length]!;
    }
    private later(ms: number, fn: () => void) {
        const t = setTimeout(() => { this.timers.delete(t); if (!this.dead) fn(); }, ms);
        this.timers.add(t);
    }
    destroy() {
        this.dead = true;
        this.timers.forEach((t) => clearTimeout(t));
        clearInterval(this.keepalive);
        this.socket.removeAllListeners();
        this.socket.disconnect();
    }

    /** Join in-process so isBot is set before anyone sees the player. */
    private join() {
        const sock = this.io.sockets.sockets.get(this.id);
        const room = joinRoom(this.code, { id: this.id, name: this.name, isBot: true });
        if (!room || !sock) return this.onFail(this);
        sock.join(this.code);
        this.joined = true;
        this.io.to(this.code).emit("room:updated", sanitizeRoomForBroadcast(room));
        this.keepalive = setInterval(() => this.socket.emit("bot:ping"), 60_000); // resets the 5-min inactivity kick
    }

    /** Runs on every incoming event; schedules at most one action per phase and round. */
    private tick() {
        const room = live(this.code);
        const me = this.me();
        if (this.dead || !room || !me || room.status !== "In_Game") return;
        const alive = me.status === "Alive";
        const once = (k: string, ms: number, fn: () => void) => {
            if (this.done.has(k)) return;
            this.done.add(k);
            this.later(ms, fn);
        };

        if (!me.role) return once("pick", rand(1500, 4000), () => this.pickCard());

        switch (room.phase) {
            case "discussion":
                // wait until everyone holds a role; clue-requested bots answer faster
                if (alive && room.cards?.every((c) => c.pickedBy) && !room._cluesSubmitted?.has(this.id))
                    once(`clue:${room.round}`, room.clueRequests.has(this.id) ? rand(2500, 5000) : rand(5000, 15000), () => this.clue());
                break;
            case "voting":
                if (alive && !room.votes[this.id]) once(`vote:${room.round}`, rand(4000, 12000), () => this.vote());
                break;
            case "quiz": {
                const words = String(room._currentQuestionText ?? "").split(/\s+/).length;
                const reading = Math.min(Math.max((8000 + words * 180) * rand(0.75, 1.25), 10_000), 50_000);
                once(`quiz:${room.round}`, alive ? reading : 12_000, () => this.answer());
                break;
            }
            case "final_diagnosis":
                if (room.finalists?.has(this.id)) once("solution", rand(8000, 20000), () => this.solution());
                break;
            case "final_voting":
                if (!alive) once("fvote", rand(4000, 7000), () => this.finalVote());
                break;
        }
    }

    private pickCard() {
        const free = live(this.code)?.cards?.filter((c) => !c.pickedBy) ?? [];
        const card = pick(free);
        if (card) this.socket.emit("game:pickCard", { code: this.code, cardId: card.id });
        // lost the race for that card? try again
        this.later(1500, () => { if (!this.me()?.role) { this.done.delete("pick"); this.tick(); } });
    }

    private clue() {
        const room = live(this.code);
        const me = this.me();
        if (!room || !me || room.phase !== "discussion" || me.status !== "Alive") return;
        const others = Array.from(new Set(this.chat.map((c) => c.player)));
        const text = makeClue(me.word ?? "", room.category ?? "", others, this.used);
        const requested = room.clueRequests.has(this.id); // humans' clue-request modal sends the formatted version
        this.socket.emit("chat:typing", this.code);
        this.later(rand(2000, 4000), () => {
            if (live(this.code)?.phase === "discussion") {
                this.socket.emit("chat:message", {
                    roomCode: this.code, playerName: this.name, color: this.color(),
                    message: requested ? `🩺 Clue: "${text}"` : text,
                });
            }
            this.socket.emit("chat:stop_typing", this.code);
        });
    }

    private vote() {
        const room = live(this.code);
        const me = this.me();
        if (!room || !me || room.phase !== "voting" || me.status !== "Alive" || room.votes[this.id]) return;
        // Phase 1 heuristic: silent players look more suspicious; 15% pure random
        const spoke = new Set(this.chat.map((c) => c.player));
        const others = this.others();
        const ranked = others
            .map((p: Player) => ({ p, s: (spoke.has(p.name) ? 1 : 2.5) * (0.6 + Math.random() * 0.8) }))
            .sort((a, b) => b.s - a.s);
        const target = Math.random() < 0.15 ? pick(others) : ranked[0]?.p;
        if (target) this.socket.emit("vote:cast", { roomCode: this.code, targetId: target.id });
    }

    private answer() {
        const room = live(this.code);
        const me = this.me();
        if (!room || !me || room.phase !== "quiz" || typeof room._currentAnswer !== "number") return;
        if (room._quizAnswered?.includes(this.id)) return;
        // Spectators wait for someone else to answer first (or 45s), so they don't steal the privilege
        if (me.status === "Eliminated" && !room._firstCorrectId && Date.now() - (room._quizTimerStartedAt ?? 0) < 45_000)
            return void this.later(3000, () => this.answer());
        const correct: number = room._currentAnswer;
        const n: number = room._currentQuestionOptions?.length ?? 5;
        const wrong = Array.from({ length: n }, (_, i) => i).filter((i) => i !== correct);
        const answerIndex = Math.random() < QUIZ_ACCURACY[this.level] ? correct : (pick(wrong) ?? correct);
        this.socket.emit("quiz:answer", { roomCode: this.code, answerIndex });
    }

    private privilege(options: string[]) {
        const me = this.me();
        if (!me) return;
        const r = Math.random();
        let p = me.role === "Civilian" ? (r < 0.5 ? "points" : r < 0.85 ? "clue_request" : "immunity") : (r < 0.6 ? "immunity" : "points");
        if (!options.includes(p)) p = options[0] ?? "points";
        const targetId = p === "clue_request" ? pick(this.others())?.id : undefined;
        if (p === "clue_request" && !targetId) p = "points";
        this.socket.emit("quiz:choose_privilege", { roomCode: this.code, privilege: p, targetId });
    }

    private solution() {
        const room = live(this.code);
        if (room?.phase !== "final_diagnosis" || room.finalSolutions?.[this.id]) return;
        this.socket.emit("final:submit_solution", { roomCode: this.code, solution: makeSolution(room.civilianWord ?? "the condition") });
    }

    private finalVote() {
        const room = live(this.code);
        if (room?.phase !== "final_voting" || room.solutionVotes?.[this.id]) return;
        const label = pick(Object.values(room.solutionLabels ?? {}));
        if (label) this.socket.emit("final:vote_solution", { roomCode: this.code, label });
    }
}

class BotManager {
    private rooms = new Map<string, Map<string, Bot>>();
    private idle = new Map<string, NodeJS.Timeout>();

    addBot(io: Server, code: string, level: BotDifficulty): boolean {
        const room = getRoom(code);
        if (!room || room.status !== "Waiting") return false;
        const bots = this.rooms.get(code) ?? new Map<string, Bot>();
        const pending = Array.from(bots.values()).filter((b) => !b.joined).length;
        if (room.players.length + pending >= MAX_PLAYERS) return false;
        // names must be unique per room (rejoin and the table clue bubbles are keyed by name)
        const taken = new Set([...room.players.map((p) => p.name), ...Array.from(bots.keys())].map((n) => n.toLowerCase()));
        const name = pick(BOT_NAMES.filter((n) => !taken.has(n.toLowerCase())));
        if (!name) return false;
        bots.set(name, new Bot({
            io, code, name, level, port: process.env.PORT ?? 3001,
            onFail: (b) => { bots.delete(b.name); b.destroy(); },
        }));
        this.rooms.set(code, bots);
        return true;
    }

    removeBot(io: Server, code: string, botId: string): boolean {
        const bots = this.rooms.get(code);
        const bot = bots && Array.from(bots.values()).find((b) => b.id === botId);
        if (!bots || !bot) return false;
        const room = leaveRoom(code, botId);
        bots.delete(bot.name);
        bot.destroy();
        if (room) io.to(code).emit("room:updated", sanitizeRoomForBroadcast(room));
        return true;
    }

    removeRoomBots(code: string) {
        this.rooms.get(code)?.forEach((b) => b.destroy());
        this.rooms.delete(code);
        clearTimeout(this.idle.get(code));
        this.idle.delete(code);
    }

    /** Call when a human disconnects; if nobody human is back within 90s, clean up bots and room. */
    scheduleIdleCheck(code: string) {
        if (!this.rooms.has(code)) return;
        clearTimeout(this.idle.get(code));
        this.idle.set(code, setTimeout(() => {
            this.idle.delete(code);
            const room = getRoom(code);
            if (room?.players.some((p) => !p.isBot && p.connected !== false)) return;
            this.removeRoomBots(code);
            if (room) deleteRoom(code);
        }, 90_000));
    }
}

export const botManager = new BotManager();