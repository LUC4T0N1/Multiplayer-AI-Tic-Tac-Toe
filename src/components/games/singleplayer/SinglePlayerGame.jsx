import React, {useEffect ,useState} from "react";
import {checkIfTie, checkWin} from  "../../../utils/EndGame";
import Board from "../../game/Board";
import {findBestMove, findWorstMove, findRandomMove} from  "../../../utils/AILogic";
import "../../game/Game.css"

function SinglePlayerGame({ai_type}) {
  const [board, setBoard] = useState(["","","","","","","","",""])
  const [player, setPlayer] = useState("X");
  const [turn, setTurn] = useState("X");
  const [result, setResult] = useState({ winner: "none", state: "none" });

  const handleGameOver = ({winner, state}) => {
    console.log("acabou o jogo! " + state)
    setResult({ winner: winner, state: state });
  }

  useEffect(() => {
    if(turn === "O"){
      handleAITurn();
    }
    checkIfTie({board, handleGameOver});
    checkWin({board, handleGameOver});
}, [board]); 

const handleRestart = () => {
  setBoard(["","","","","","","","",""]);
  setPlayer("X");
  setResult({ winner: "none", state: "none" });
}

const handleAITurn = () => {
  if(turn === "O"){
    let square = null;
      if(ai_type === 1) {
        square = findBestMove({board, player});
      }else if(ai_type === 2){
        square = findWorstMove({board, player});
      }else{
        square = findRandomMove({board});
      }
      console.log("MAQUINA JOGOU " + square )
      const currentPlayer = player === "O" ? "X" : "O";
      setPlayer(currentPlayer); 
      setBoard(
      board.map((val, idx) => {
          if (idx === square && val === "") {
          return player;
        }
        return val; 
      })
      );   
      setTurn("X")
    }
}


  const chooseSquare = (square) => {
    console.log("vez do " + turn)
    if(turn === "X" && result.state === "none"){
      console.log("JOGADOR JOGOU " + square )
      const currentPlayer = player === "X" ? "O" : "X";
      setPlayer(currentPlayer);
      setBoard(
        board.map((val, idx) => {
          if (idx === square && val === "") {
            setTurn("O")
            return player;
          }
          return val;
        })
      );
  
    }
  };
 
  return (
    <div className="full-game">
      <Board chooseSquare={chooseSquare} board={board}/>
      <div className="end-game">
        {result.state === "won" && <div> {result.winner} Won The Game</div>}
        {result.state === "tie" && <div> Game Tieds</div>}
        {result.state !== "none" ? <button className="restart-button" onClick={handleRestart}> RESTART GAME </button> : ""}
      </div>
    </div>
  )
}

export default SinglePlayerGame