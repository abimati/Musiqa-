/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from "react";
import { ScreenState, Song } from "./types";
import { LoadingScreen } from "./components/LoadingScreen";
import { SongSelection } from "./components/SongSelection";
import { GameCanvas } from "./components/GameCanvas";

export default function App() {
  const [screen, setScreen] = useState<ScreenState>("loading");
  const [selectedSong, setSelectedSong] = useState<Song | null>(null);

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
          onQuit={() => setScreen("menu")}
        />
      );

    default:
      return <LoadingScreen onComplete={() => setScreen("menu")} />;
  }
}

