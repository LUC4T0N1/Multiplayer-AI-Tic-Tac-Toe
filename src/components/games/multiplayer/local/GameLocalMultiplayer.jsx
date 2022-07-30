import React, {useEffect ,useState} from "react";
import Square from "../../../game/Square";
import {checkIfTie, checkWin} from  "../../../../utils/EndGame";
import Board from "../../../game/Board";

const GameLocalMultiplayer = () => {
  const [board, setBoard] = useState(["","","","","","","","",""])
  const [player, setPlayer] = useState("X");
  const [result, setResult] = useState({ winner: "none", state: "none" });

  const handleGameOver = ({winner, state}) => {
    console.log("acabou o jogo! " + state)
    setResult({ winner: winner, state: state });
  }

  useEffect(() => {
    checkIfTie({board, handleGameOver});
    checkWin({board, handleGameOver});
}, [board]); 

const handleRestart = () => {
  setBoard(["","","","","","","","",""]);
  setPlayer("X");
  setResult({ winner: "none", state: "none" });
}


  const chooseSquare = (square) => {
    if(result.state === "none"){
      const currentPlayer = player === "X" ? "O" : "X";
      setPlayer(currentPlayer);
      setBoard(
        board.map((val, idx) => {
          if (idx === square && val === "") {
            return player;
          }
          return val;
        })
      );
    }
  };

  return (
    <div className="full-game">
      <div className="end-game">
      {result.state === "won" && <div> {result.winner} Won The Game!</div>}
      {result.state === "tie" && <div> Game Tieds!</div>}
      </div>
      <Board chooseSquare={chooseSquare} board={board}/>
      <div className="end-game">
        {result.state !== "none" ? <button className="restart-button" onClick={handleRestart}> RESTART GAME </button> : ""}
      </div>
    </div>
  )
}

export default GameLocalMultiplayer