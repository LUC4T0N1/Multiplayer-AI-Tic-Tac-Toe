import { t } from 'i18next'
import React from 'react'
import Board from './Board'
import Rain from './end-game-animaton/Rain'
import {useTranslation} from 'react-i18next';

function Game({result, chooseSquare, handleRestart, board}) {
  const {t} = useTranslation()
  return (
    <div className="full-game">
    {result.state === "won" && <div className="end-game"> {result.winner} {t('won')}!</div>}
    {result.state === "tie" && <div className="end-game">{t('tie')}</div>}
    <Board chooseSquare={chooseSquare} board={board}/>
      {result.state !== "none" 
      ?
      (
        <>
        <Rain winner={result.winner}/>
        <div className="end-game">   
          <button className="restart-button" onClick={handleRestart}>{t('restart')}</button> 
        </div>
        </>
      )
      :
        ""
      }
  </div>
  )
}

export default Game