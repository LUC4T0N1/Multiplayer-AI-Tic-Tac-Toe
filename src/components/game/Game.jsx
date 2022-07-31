import React from 'react'
import Board from './Board'
import Rain from './end-game-animaton/Rain'
function Game({result, chooseSquare, handleRestart, board}) {
  return (
    <div className="full-game">
    {result.state === "won" && <div className="end-game"> {result.winner} Won The Game!</div>}
    {result.state === "tie" && <div className="end-game"> Game Tieds!</div>}
    <Board chooseSquare={chooseSquare} board={board}/>
      {result.state !== "none" 
      ?
      (
        <>
        <Rain winner={result.winner}/>
        <div className="end-game">   
          <button className="restart-button" onClick={handleRestart}> RESTART GAME </button> 
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