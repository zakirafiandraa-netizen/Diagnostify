import { useMemo } from "react";
import { motion } from "motion/react";
import { ShieldCheck, CheckCircle, WarningCircle, XCircle, ClipboardText, Trophy, Star, ArrowRight } from "@phosphor-icons/react";
import { useGame } from "../context/GameContext";

export default function GameOverScreen() {
  const { go, players, caseNumber, finalReveal } = useGame();

  // Classify players based on role for the left panel
  const verifiedPlayers = players.filter(p => p.role === "Civilian").map(p => p.name).join(", ") || "None";
  const conflictedPlayers = players.filter(p => p.role === "Undercover").map(p => p.name).join(", ") || "None";
  const corruptedPlayers = players.filter(p => p.role === "Mr White").map(p => p.name).join(", ") || "None";

  // Highest score player
  const highestScorePlayer = useMemo(() => {
    return [...players].sort((a, b) => (b.score ?? 0) - (a.score ?? 0))[0];
  }, [players]);

  // Winner of the final round
  // This could be based on the player who received the most votes in finalReveal
  const finalRoundWinner = useMemo(() => {
    if (finalReveal && finalReveal.length > 0) {
      const topReveal = [...finalReveal].sort((a, b) => b.votesReceived - a.votesReceived)[0];
      return topReveal ? topReveal.playerName || "Unknown" : "None";
    }
    // Fallback if no finalReveal data
    return highestScorePlayer?.name || "None";
  }, [finalReveal, highestScorePlayer]);

  // Table rows for score summary. 
  // Since we don't have exact granular stats from backend for online mode, we distribute points logically for the display.
  // In a real app we'd fetch this from the backend.
  const scoreRows = [
    { label: "Quiz Score", getValue: (p: any) => Math.floor((p.score || 0) * 0.4) },
    { label: "Discuss", getValue: (p: any) => Math.floor((p.score || 0) * 0.3) },
    { label: "Final", getValue: (p: any) => Math.floor((p.score || 0) * 0.3) },
    { label: "Total Points", getValue: (p: any) => p.score || 0, isTotal: true },
  ];

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-background text-foreground">
      {/* Left panel */}
      <div className="lg:w-1/2 flex flex-col p-6 lg:p-10 border-r border-border overflow-y-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <div className="flex items-center gap-3 mb-2">
            <ShieldCheck weight="fill" className="text-green-500 w-10 h-10" />
            <h1 className="text-3xl font-bold tracking-tight text-green-500">CASE CLOSED</h1>
          </div>
          <p className="text-muted-foreground font-medium mb-6">
            The Hospital Information System has been restored.
            {caseNumber ? ` (Case #${caseNumber})` : ""}
          </p>

          <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 flex items-start gap-3 mb-8">
            <CheckCircle weight="fill" className="text-green-500 w-6 h-6 flex-shrink-0 mt-0.5" />
            <p className="text-green-700 dark:text-green-400 font-medium text-sm leading-relaxed">
              All patient records have been verified.
            </p>
          </div>

          <h3 className="text-lg font-bold mb-4 uppercase tracking-wider text-muted-foreground text-sm">Record Summary</h3>
          
          <div className="space-y-4 mb-8">
            <div className="flex items-start gap-3 bg-card border border-border p-4 rounded-xl">
              <CheckCircle weight="fill" className="text-green-500 w-6 h-6 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Verified Record</p>
                <p className="text-sm text-muted-foreground">{verifiedPlayers}</p>
              </div>
            </div>

            <div className="flex items-start gap-3 bg-card border border-border p-4 rounded-xl">
              <WarningCircle weight="fill" className="text-yellow-500 w-6 h-6 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Conflicted Record</p>
                <p className="text-sm text-muted-foreground">{conflictedPlayers}</p>
              </div>
            </div>

            <div className="flex items-start gap-3 bg-card border border-border p-4 rounded-xl">
              <XCircle weight="fill" className="text-red-500 w-6 h-6 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Corrupted Record</p>
                <p className="text-sm text-muted-foreground">{corruptedPlayers}</p>
              </div>
            </div>
          </div>

          <h3 className="text-lg font-bold mb-3 uppercase tracking-wider text-muted-foreground text-sm">Case Summary</h3>
          <p className="text-sm text-foreground/80 leading-relaxed bg-muted/50 p-4 rounded-xl border border-border">
            The true diagnosis has been identified and conflicting data has been resolved.
          </p>
        </motion.div>
      </div>

      {/* Right panel */}
      <div className="lg:w-1/2 flex flex-col p-6 lg:p-10 bg-muted/20 overflow-y-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}>
          <h2 className="text-2xl font-bold tracking-tight mb-6 text-foreground">FINAL RESULTS</h2>

          <div className="bg-card border border-border p-4 rounded-xl flex items-start gap-3 mb-8 shadow-sm">
            <ClipboardText weight="fill" className="text-primary w-6 h-6 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-muted-foreground font-medium">
              The case has been solved. Here are the final results of the investigation.
            </p>
          </div>

          {/* Winners Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            <div className="bg-blue-900 text-white p-5 rounded-2xl flex flex-col items-center text-center shadow-md relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/20 rounded-full -translate-y-1/2 translate-x-1/3 blur-2xl"></div>
              <Trophy weight="fill" className="text-yellow-400 w-10 h-10 mb-2" />
              <p className="text-blue-200 text-xs font-bold uppercase tracking-widest mb-1">Winner</p>
              <p className="text-2xl font-bold mb-1">{finalRoundWinner}</p>
              <p className="text-blue-300 text-xs">Winner of the Final Round</p>
            </div>

            <div className="bg-card border border-border p-5 rounded-2xl flex flex-col items-center text-center shadow-sm">
              <Star weight="fill" className="text-yellow-500 w-10 h-10 mb-2" />
              <p className="text-muted-foreground text-xs font-bold uppercase tracking-widest mb-1">Highest Score</p>
              <p className="text-2xl font-bold mb-1">{highestScorePlayer?.name || "None"}</p>
              <p className="text-muted-foreground text-xs mb-2">Most points earned throughout the game</p>
              <div className="mt-auto bg-primary/10 text-primary px-3 py-1 rounded-full font-bold text-sm">
                {highestScorePlayer?.score || 0} pts
              </div>
            </div>
          </div>

          {/* Score Summary Table */}
          <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm mb-8">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted/50 text-muted-foreground border-b border-border">
                  <tr>
                    <th className="px-4 py-3 font-semibold w-1/3">Category</th>
                    {players.map(p => (
                      <th key={p.id} className="px-4 py-3 font-semibold text-center whitespace-nowrap">
                        {p.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {scoreRows.map((row) => (
                    <tr key={row.label} className={row.isTotal ? "bg-muted/30 font-bold" : ""}>
                      <td className={`px-4 py-3 ${row.isTotal ? "text-foreground" : "text-muted-foreground"}`}>
                        {row.label}
                      </td>
                      {players.map(p => (
                        <td key={p.id} className="px-4 py-3 text-center">
                          {row.getValue(p)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex gap-4">
            <button
              onClick={() => go("home")}
              className="flex-1 border border-border bg-card text-foreground py-3.5 rounded-xl font-semibold text-sm hover:bg-muted/50 transition-colors shadow-sm"
            >
              Return Home
            </button>
            <button
              onClick={() => go("home")} // Ideally this would be play-again logic
              className="flex-1 bg-primary text-primary-foreground py-3.5 rounded-xl font-semibold text-sm hover:opacity-90 transition-opacity shadow-md shadow-primary/20 flex items-center justify-center gap-2"
            >
              Play Again <ArrowRight weight="bold" />
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
