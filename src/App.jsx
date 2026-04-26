import "./App.css";
import React from 'react';
import Error from "./components/error/Error";
import Home from "./components/home/Home";
import RoomSelection from "./components/games/multiplayer/online/room-creation/friend/RoomSelection";
import GameLocalMultiplayer from "./components/games/multiplayer/local/GameLocalMultiplayer";
import SinglePlayerGame from "./components/games/singleplayer/SinglePlayerGame";
import Queue from "./components/games/multiplayer/online/room-creation/random/Queue";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom"

function App({ socket }) {
  return (
    <div className="App" style={{ backgroundColor: "#050010", color: "white" }}>
      <Router>
        <Routes>
          <Route path="/" element={<Home socket={socket} />} />
          <Route path="/singleplayer/easy" element={<SinglePlayerGame ai_type={2} />} />
          <Route path="/singleplayer/hard" element={<SinglePlayerGame ai_type={1} />} />
          <Route path="/singleplayer/random-ia" element={<SinglePlayerGame ai_type={3} />} />
          <Route path="/multiplayer/local" element={<GameLocalMultiplayer />} />
          <Route path="/multiplayer/friendly" element={<RoomSelection socket={socket} />} />
          <Route path="/multiplayer/random" element={<Queue socket={socket} />} />
          <Route path='*' element={<Error />} />
        </Routes>
      </Router>
    </div>
  );
}

export default App;
