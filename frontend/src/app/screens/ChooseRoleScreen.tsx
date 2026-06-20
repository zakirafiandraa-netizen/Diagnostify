import { motion } from "motion/react";
import { Stethoscope } from "lucide-react";
import { useGame } from "../context/GameContext";
import { fadeUp, staggerList } from "../animations/presets";
import { socket } from "../services/socket";

export default function ChooseRoleScreen() {
  const { players, cards, roomCode, playerId } = useGame();

  const pickedCount = cards.filter(c => c.pickedBy).length;
  const progressPercent = players.length > 0 ? (pickedCount / players.length) * 100 : 0;
  const hasPicked = cards.some(c => c.pickedBy === playerId);

  return (
    <div className="flex flex-col min-h-screen lg:min-h-0">
      <div className="flex flex-col items-center pt-8 pb-6 px-4 lg:pt-14 lg:pb-10 bg-gradient-to-b from-primary/10 to-transparent">
        <div className="w-12 h-12 lg:w-16 lg:h-16 rounded-2xl bg-primary flex items-center justify-center mb-3 shadow-xl shadow-primary/30">
          <Stethoscope className="w-7 h-7 lg:w-9 lg:h-9 text-white" />
        </div>
        <h2 className="font-bold text-xl lg:text-3xl text-foreground">Choose Your Card</h2>
        <p className="text-sm text-muted-foreground mt-1.5">Tap a card to reveal your secret role</p>
        <div className="mt-3 flex items-center gap-3 bg-muted px-4 py-2 rounded-full">
          <span className="text-xs text-muted-foreground font-medium">{pickedCount} of {players.length} players chosen</span>
          <div className="h-1.5 w-20 bg-border rounded-full overflow-hidden">
            <motion.div className="h-full bg-primary rounded-full" initial={{ width:0 }} animate={{ width:`${progressPercent}%` }} transition={{ duration:0.6, delay:0.3 }} />
          </div>
        </div>
      </div>

      <div className="flex-1 px-4 lg:px-10 py-4 lg:py-6">
        <motion.div variants={staggerList} initial="initial" animate="animate"
          className="grid grid-cols-2 gap-3 lg:gap-5 max-w-lg mx-auto">
          {cards.map((card, i) => {
            const isTaken = !!card.pickedBy;
            const pickedByPlayer = isTaken ? players.find(p => p.id === card.pickedBy) : null;
            const isMyCard = card.pickedBy === playerId;

            return (
              <motion.button key={card.id} variants={fadeUp} 
                onClick={() => {
                  if (!isTaken && !hasPicked && roomCode) {
                    socket.emit("game:pickCard", { code: roomCode, cardId: card.id });
                  }
                }}
                disabled={isTaken || hasPicked}
                className={`rounded-2xl lg:rounded-3xl border-2 p-6 lg:p-8 flex flex-col items-center gap-3 lg:gap-4 transition-all duration-200
                  ${isTaken 
                    ? isMyCard 
                      ? "bg-primary/10 border-primary/50 opacity-100" 
                      : "bg-muted border-border/50 opacity-60"
                    : hasPicked 
                      ? "bg-card border-border opacity-50 cursor-not-allowed"
                      : "bg-card border-border hover:border-primary/50 hover:shadow-xl hover:shadow-primary/10 hover:-translate-y-1.5 active:scale-95"
                  }`}
              >
                <span className="text-xs text-muted-foreground font-mono self-end">#{i + 1}</span>
                {isTaken ? (
                   <div className="flex flex-col items-center gap-1">
                     <span className="text-2xl">{pickedByPlayer?.avatar || "🧑"}</span>
                     <span className="text-xs font-medium text-muted-foreground">{pickedByPlayer?.name}</span>
                   </div>
                ) : (
                   <Stethoscope className="w-10 h-10 lg:w-14 lg:h-14 text-primary/30" />
                )}
                <span className={`text-xs lg:text-sm font-semibold ${isTaken ? 'text-muted-foreground' : 'text-primary'}`}>
                  {isTaken ? (isMyCard ? "Your Card" : "Taken") : "Click to pick"}
                </span>
              </motion.button>
            )
          })}
        </motion.div>
      </div>
    </div>
  );
}
