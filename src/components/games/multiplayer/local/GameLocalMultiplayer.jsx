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
    <>
      <Board chooseSquare={chooseSquare} board={board}/>
      {result.state === "won" && <div> {result.winner} Won The Game</div>}
      {result.state === "tie" && <div> Game Tieds</div>}
      {result.state !== "none" ? <button onClick={handleRestart}> RESTART GAME </button> : ""}
    </>
  )
}

export default GameLocalMultiplayer