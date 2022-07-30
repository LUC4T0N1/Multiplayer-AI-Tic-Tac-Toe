import React, {useState} from 'react'
import { Link } from "react-router-dom";
import "./Home.css";

function Home() {
  const [mode, setMode] = useState("")
  console.log("mode: " + mode)
  const handleModeSelection = (modeSelected) =>{
    if(modeSelected === 'Multiplayer'){
      if(mode === 'Multiplayer'){
        setMode('')
      }else{
        setMode("Multiplayer")
      }
    }else{
      if(mode === 'Singleplayer'){
        setMode('')
      }else{
        setMode("Singleplayer")
      }
    }
  }

  return (
    <div className='home'>
      <p className='home-title'>Choose a Game Mode</p>
      <div className='modes'>
        <button className={mode==='Multiplayer'?'mode-selected':'mode'} onClick={() => handleModeSelection("Multiplayer")}>Multiplayer</button>
        <button className={mode==='Singleplayer'?'mode-selected':'mode'} onClick={() => handleModeSelection("Singleplayer")}>Singleplayer</button>
      </div>
        {mode === "Multiplayer" ? 
        <>
        <div className='specificModes'>
            <Link className='mode' to="/multiplayer/local">Local</Link>
            <Link className='mode' to="/multiplayer/friendly">Play with a Friend</Link>
            <Link className='mode' to="/multiplayer/random">Play with a Random Person</Link>
        </div>
        </> : ""}
        {mode === "Singleplayer" ? 
        <>
        <div className='specificModes'>
            <Link className='mode' to="/singleplayer/always-win">Easy</Link>
            <Link className='mode' to="/singleplayer/random-ia">Medium</Link>
            <Link className='mode' to="/singleplayer/never-win">Impossible</Link>
        </div>
        </> : ""}
    </div>
  )
}

export default Home