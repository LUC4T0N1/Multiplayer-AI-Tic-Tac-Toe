import "./App.css";
import React, { useContext } from 'react';
import NavBar from "./components/navBar/NavBar";
import Error from "./components/error/Error";
import Home from "./components/home/Home";
import RoomSelection from "./components/games/multiplayer/online/room-creation/friend/RoomSelection";
import GameLocalMultiplayer from "./components/games/multiplayer/local/GameLocalMultiplayer";
import SinglePlayerGame from "./components/games/singleplayer/SinglePlayerGame";
import Queue from "./components/games/multiplayer/online/room-creation/random/Queue";
import { BrowserRouter as Router, Routes , Route } from "react-router-dom"
import { ThemeContext } from './infrastructure/context';
function App({socket}) {
  const theme = useContext(ThemeContext);
  const darkMode = theme.state.darkMode;



  return (
    <>

    <div className="App" style={{
      backgroundColor: darkMode ? "#121212" : "rgb(228, 240, 238)",
      color: darkMode && "white",

    }}>
    
       <Router>
       <NavBar/>
            <Routes>
              <Route path="/" element={<Home/>}/>
              <Route path="/singleplayer/never-win" element={<SinglePlayerGame ai_type={1}/>}/>
              <Route path="/singleplayer/always-win" element={<SinglePlayerGame ai_type={2}/>}/>
              <Route path="/singleplayer/random-ia" element={<SinglePlayerGame ai_type={3}/>}/>
              <Route path="/multiplayer/local" element={<GameLocalMultiplayer/>}/>
              <Route path="/multiplayer/friendly" element={<RoomSelection socket={socket}/>}/>
              <Route path="/multiplayer/random" element={<Queue socket={socket}/>}/>
              <Route path='*' element={<Error/>}></Route>
            </Routes>
          </Router>
    </div>
    </>
  );
}

export default App;