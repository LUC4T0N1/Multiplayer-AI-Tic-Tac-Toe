import React, {useState} from 'react'
import { Link } from "react-router-dom";

function Home() {
  const [mode, setMode] = useState("")
  const [specificMode, setSpecificMode] = useState("")
  console.log("mode: " + mode)
  console.log("specificMode: " + specificMode)
  return (
    <>
      <div className='modes'>
        <div>Choose A Game Mode</div>
        <button onClick={() => setMode("Multiplayer")}>Multiplayer</button>
        <button onClick={() => setMode("Singleplayer")}>Singleplayer</button>
      </div>
        {mode === "Multiplayer" ? 
        <>
        <div className='specificModes'>
          <div>
            <Link to="/multiplayer/local">LOCAL MULTIPLAYER</Link>
          </div>
          <div>
            <Link to="/multiplayer/friendly">Play with a Friend Online</Link>
          </div>
          <div>
            <Link to="/multiplayer/random">Play with a random person Online</Link>
          </div>
        </div>
        </> : ""}
        {mode === "Singleplayer" ? 
        <>
        <div className='specificModes'>
          <div>
            <Link to="/singleplayer/random-ia">Play against the machine</Link>
          </div>
          <div>
            <Link to="/singleplayer/never-win">Play against the machine AND NEVER WIN</Link>
          </div>
          <div>
            <Link to="/singleplayer/always-win">Play against the machine AND ALWAYS WIN</Link>
          </div>
        </div>
        </> : ""}
    </>
  )
}

export default Home