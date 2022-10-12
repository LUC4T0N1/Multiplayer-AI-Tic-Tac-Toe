import React, {useState, useEffect} from 'react'
import { Link } from "react-router-dom";
import "./Home.css";
import { ThemeContext } from "../../infrastructure/context";
import { useContext } from "react";
import {useTranslation} from 'react-i18next';
import { useLocation } from "react-router-dom";

function Home({socket}) {
  const location = useLocation();
  const {t} = useTranslation()
  const theme =  useContext(ThemeContext);
  const [mode, setMode] = useState("")
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

  useEffect(() => {
    socket.emit("leave-room");
  }, [location]); 

  return (
    <div className='home'>
      <p className='home-title'>{t('tictactoe')}</p>
      <p className='home-subtitle'>{t('mode')}</p>
      <div className='modes'>
        <button className={mode==='Multiplayer'?'mode-selected':'mode'} onClick={() => handleModeSelection("Multiplayer")}>{t('multiplayer')}</button>
        <button className={mode==='Singleplayer'?'mode-selected':'mode'} onClick={() => handleModeSelection("Singleplayer")}>{t('singleplayer')}</button>
      </div>
        {mode === "Multiplayer" ? 
        <>
        <div className='specificModes'>
            <Link className='mode' to="/multiplayer/local">{t('local')}</Link>
            <Link className='mode' to="/multiplayer/friendly">{t('friend')}</Link>
            <Link className='mode' to="/multiplayer/random">{t('random-opponent')}</Link>
        </div>
        </> : ""}
        {mode === "Singleplayer" ? 
        <>
        <div className='specificModes'>
            <Link className='mode' to="/singleplayer/hard">{t('easy')}</Link>
            <Link className='mode' to="/singleplayer/random-ia">{t('random')}</Link>
            <Link className='mode' to="/singleplayer/easy">{t('hard')}</Link>
        </div>
        </> : ""}
    </div>
  )
}

export default Home