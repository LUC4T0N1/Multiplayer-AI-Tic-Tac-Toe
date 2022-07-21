import "./App.css";
import Error from "./components/error/Error";
import Home from "./components/home/Home";
import RoomSelection from "./components/games/multiplayer/with-friend/RoomSelection";
import GameLocalMultiplayer from "./components/games/multiplayer/local/GameLocalMultiplayer";
import SinglePlayerGame from "./components/games/singleplayer/SinglePlayerGame";
import Queue from "./components/games/multiplayer/random-person/Queue";
import { BrowserRouter as Router, Routes , Route } from "react-router-dom"
import io from "socket.io-client";
function App() {

  const socket = io.connect(process.env.REACT_APP_SERVER_URL);

  return (
    <div className="App">
       <Router>
            <Routes>
              <Route path="/" element={<Home/>}/>
    {/*           <CustomRoute exact path="/singleplayer/never-win" children={<ProvasResolvidas/>}/>
              <CustomRoute exact path="/singleplayer/never-loose" children={<ProvaResolvida/>}/>
              <CustomRoute exact path="/singleplayer/random-ia" children={<ProvasCriadas/>}/> */}
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
  );
}

export default App;