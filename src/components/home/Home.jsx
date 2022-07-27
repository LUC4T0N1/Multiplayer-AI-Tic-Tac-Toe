import React, {useState} from 'react'
import { Link } from "react-router-dom";
import "./Home.css";

function Home() {
  const [mode, setMode] = useState("")
  console.log("mode: " + mode)
  return (
    <div className='home'>
      <p className='home-title'>Choose A Game Mode</p>
      <div className='modes'>
        <button className='mode' onClick={() => setMode("Multiplayer")}>Multiplayer</button>
        <button className='mode' onClick={() => setMode("Singleplayer")}>Singleplayer</button>
      </div>
        {mode === "Multiplayer" ? 
        <>
        <div className='specificModes'>
          <div>
            <Link className='mode' to="/multiplayer/local">LOCAL MULTIPLAYER</Link>
          </div>
          <div>
            <Link className='mode' to="/multiplayer/friendly">Play with a Friend Online</Link>
          </div>
          <div>
            <Link className='mode' to="/multiplayer/random">Play with a random person Online</Link>
          </div>
        </div>
        </> : ""}
        {mode === "Singleplayer" ? 
        <>
        <div className='specificModes'>
          <div>
            <Link className='mode' to="/singleplayer/random-ia">Play against the machine</Link>
          </div>
          <div>
            <Link className='mode' to="/singleplayer/never-win">Play against the machine AND NEVER WIN</Link>
          </div>
          <div>
            <Link className='mode' to="/singleplayer/always-win">Play against the machine AND ALWAYS WIN</Link>
          </div>
        </div>
        </> : ""}
    </div>
  )
}

export default Home