/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from "react";
import { ScreenState, Song, ScoreReport } from "./types";
import { LoadingScreen } from "./components/LoadingScreen";
import { SongSelection } from "./components/SongSelection";
import { GameCanvas } from "./components/GameCanvas";
import { GameOver } from "./components/GameOver";

export default function App() {
  const [screen, setScreen] = useState<ScreenState>("loading");
  const [selectedSong, setSelectedSong] = useState<Song | null>(null);
  const [scoreReport, setScoreReport] = useState<ScoreReport | null>(null);
  const [isVictory, setIsVictory] = useState<boolean>(false);

  // Screen controller routing
  switch (screen) {
    case "loading":
      return <LoadingScreen onComplete={() => setScreen("menu")} />;
      
    case "menu":
      return (
        <SongSelection
          onSelectSong={(song) => {
            setSelectedSong(song);
            setScreen("playing");
          }}
        />
      );

    case "playing":
      if (!selectedSong) {
        setScreen("menu");
        return null;
      }
      return (
        <GameCanvas
          song={selectedSong}
          onGameOver={(report) => {
            setScoreReport(report);
            setIsVictory(false);
            setScreen("gameover");
          }}
          onVictory={(report) => {
            setScoreReport(report);
            setIsVictory(true);
            setScreen("gameover");
          }}
          onQuit={() => setScreen("menu")}
        />
      );

    case "gameover":
      if (!scoreReport) {
        setScreen("menu");
        return null;
      }
      return (
        <GameOver
          report={scoreReport}
          isVictory={isVictory}
          onRetry={() => setScreen("playing")}
          onGoHome={() => setScreen("menu")}
        />
      );

    default:
      return <LoadingScreen onComplete={() => setScreen("menu")} />;
  }
}

