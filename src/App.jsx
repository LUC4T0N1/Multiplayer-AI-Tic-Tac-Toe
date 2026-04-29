import "./App.css";
import { lazy, Suspense } from 'react';
import Home from "./components/home/Home";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

const Error = lazy(() => import("./components/error/Error"));
const RoomSelection = lazy(() => import("./components/games/multiplayer/online/room-creation/friend/RoomSelection"));
const GameLocalMultiplayer = lazy(() => import("./components/games/multiplayer/local/GameLocalMultiplayer"));
const SinglePlayerGame = lazy(() => import("./components/games/singleplayer/SinglePlayerGame"));
const Queue = lazy(() => import("./components/games/multiplayer/online/room-creation/random/Queue"));
const PacmanGame = lazy(() => import("./components/games/pacman/PacmanGame"));
const SnakeGame  = lazy(() => import("./components/games/snake/SnakeGame"));
const BreakoutGame = lazy(() => import("./components/games/breakout/BreakoutGame"));
const TetrisGame = lazy(() => import("./components/games/tetris/TetrisGame"));

const LoadingFallback = () => (
  <div style={{ width: '100vw', height: '100vh', background: '#050010' }} />
);

function App({ socket }) {
  return (
    <div className="App" style={{ backgroundColor: "#050010", color: "white" }}>
      <Router>
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            <Route path="/" element={<Home socket={socket} />} />
            <Route path="/singleplayer/easy" element={<SinglePlayerGame ai_type={2} />} />
            <Route path="/singleplayer/hard" element={<SinglePlayerGame ai_type={1} />} />
            <Route path="/singleplayer/random-ia" element={<SinglePlayerGame ai_type={3} />} />
            <Route path="/multiplayer/local" element={<GameLocalMultiplayer />} />
            <Route path="/multiplayer/friendly" element={<RoomSelection socket={socket} />} />
            <Route path="/multiplayer/random" element={<Queue socket={socket} />} />
            <Route path="/pacman" element={<PacmanGame />} />
            <Route path="/snake"  element={<SnakeGame />} />
            <Route path="/breakout" element={<BreakoutGame />} />
            <Route path="/tetris" element={<TetrisGame />} />
            <Route path='*' element={<Error />} />
          </Routes>
        </Suspense>
      </Router>
    </div>
  );
}

export default App;
