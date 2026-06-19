import { useState, useEffect } from "react";
import { Plus, ChevronRight, AlertCircle } from "lucide-react";
import { useGame } from "../context/GameContext";
import { NavBar } from "../components/shared/NavBar";
import { socket } from "../services/socket";

export default function OnlineJoinScreen() {
  const { go } = useGame();
  const [createName, setCreateName] = useState("");
  const [joinName, setJoinName] = useState("");
  const [roomCodeInput, setRoomCodeInput] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const onRoomCreated = () => go("lobby-main");
    const onRoomJoined = () => go("lobby-main");
    const onRoomError = (msg: string) => setError(msg);

    socket.on("room:created", onRoomCreated);
    socket.on("room:joined", onRoomJoined);
    socket.on("room:error", onRoomError);

    return () => {
      socket.off("room:created", onRoomCreated);
      socket.off("room:joined", onRoomJoined);
      socket.off("room:error", onRoomError);
    };
  }, [go]);

  const handleCreate = () => {
    if (!createName.trim()) {
      setError("Please enter your name to create a room.");
      return;
    }
    setError("");
    socket.emit("room:create", createName.trim());
  };

  const handleJoin = () => {
    if (!joinName.trim() || !roomCodeInput.trim()) {
      setError("Please enter your name and a valid room code.");
      return;
    }
    setError("");
    socket.emit("room:join", roomCodeInput.trim(), joinName.trim());
  };

  return (
    <div className="flex flex-col min-h-screen lg:min-h-0">
      <NavBar title="Join the Battle" onBack={() => go("home")} />
      <div className="flex-1 overflow-y-auto px-4 lg:px-10 py-6 lg:py-10 space-y-6">
        <div className="lg:max-w-3xl lg:mx-auto space-y-6">
          {error && (
            <div className="bg-destructive/10 border border-destructive/20 text-destructive text-sm px-4 py-3 rounded-xl flex items-center gap-2">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              {error}
            </div>
          )}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
            <div className="bg-card rounded-2xl lg:rounded-3xl p-5 lg:p-7 border border-border shadow-sm hover:shadow-lg hover:shadow-primary/10 hover:-translate-y-1 transition-all">
              <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center mb-4">
                <Plus className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-bold text-lg mb-1">Create Room</h3>
              <p className="text-sm text-muted-foreground mb-4 leading-relaxed">Host a new game and invite your friends</p>
              <input value={createName} onChange={(e) => setCreateName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleCreate()} placeholder="Your name"
                className="w-full bg-muted rounded-xl px-3 py-2.5 text-sm mb-4 outline-none focus:ring-2 focus:ring-primary/30 text-foreground" />
              <button onClick={handleCreate} className="w-full bg-primary text-white py-2.5 rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity mb-4">
                Create Room
              </button>
              <ul className="space-y-1.5">
                {["Be the host and set the rules","Invite friends with a room code","Control when the game starts"].map((t) => (
                  <li key={t} className="text-xs text-muted-foreground flex items-center gap-2">
                    <span className="w-1 h-1 rounded-full bg-primary flex-shrink-0" />{t}
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-card rounded-2xl lg:rounded-3xl p-5 lg:p-7 border border-border shadow-sm hover:shadow-lg hover:shadow-[#0891B2]/10 hover:-translate-y-1 transition-all">
              <div className="w-12 h-12 bg-[#0891B2]/10 rounded-2xl flex items-center justify-center mb-4">
                <ChevronRight className="w-6 h-6 text-[#0891B2]" />
              </div>
              <h3 className="font-bold text-lg mb-1">Join Room</h3>
              <p className="text-sm text-muted-foreground mb-4 leading-relaxed">Enter an existing room with a code</p>
              <input value={joinName} onChange={(e) => setJoinName(e.target.value)} placeholder="Your name"
                className="w-full bg-muted rounded-xl px-3 py-2.5 text-sm mb-2 outline-none focus:ring-2 focus:ring-primary/30 text-foreground" />
              <input value={roomCodeInput} onChange={(e) => setRoomCodeInput(e.target.value.toUpperCase())} onKeyDown={(e) => e.key === "Enter" && handleJoin()} placeholder="Room code (e.g. MED42K)"
                className="w-full bg-muted rounded-xl px-3 py-2.5 text-sm mb-4 outline-none focus:ring-2 focus:ring-primary/30 tracking-widest font-mono text-foreground" maxLength={6} />
              <button onClick={handleJoin} className="w-full bg-[#0891B2] text-white py-2.5 rounded-xl text-sm font-semibold hover:opacity-90 mb-4">
                Join Room
              </button>
              <ul className="space-y-1.5">
                {["No signup needed","Play with friends anywhere","Free to use always"].map((t) => (
                  <li key={t} className="text-xs text-muted-foreground flex items-center gap-2">
                    <span className="w-1 h-1 rounded-full bg-[#0891B2] flex-shrink-0" />{t}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="bg-card rounded-2xl p-5 border border-border shadow-sm">
            <h4 className="font-semibold text-sm mb-4">How It Works</h4>
            <div className="flex gap-4 lg:gap-8">
              {[
                { n:"1", title:"Create or Join", desc:"Host or enter a 6-letter room code" },
                { n:"2", title:"Get Your Role", desc:"Civilian, Undercover, or Mr. White" },
                { n:"3", title:"Discuss & Vote", desc:"Find the undercover doctor to win" },
              ].map((s) => (
                <div key={s.n} className="flex-1 flex flex-col items-center text-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary text-white text-sm font-bold flex items-center justify-center shadow-md shadow-primary/25">{s.n}</div>
                  <p className="text-xs lg:text-sm font-semibold text-foreground">{s.title}</p>
                  <p className="text-xs text-muted-foreground leading-snug">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
