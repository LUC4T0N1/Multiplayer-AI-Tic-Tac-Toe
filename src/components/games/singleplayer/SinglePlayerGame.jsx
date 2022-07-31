import {useEffect ,useState} from "react";
import {checkIfTie, checkWin} from  "../../../utils/EndGame";
import {findBestMove, findWorstMove, findRandomMove} from  "../../../utils/AILogic";
import "../../game/Game.css"
import Game from "../../game/Game";

function SinglePlayerGame({ai_type}) {
  const [board, setBoard] = useState(["","","","","","","","",""])
  const [player, setPlayer] = useState("X");
  const [turn, setTurn] = useState("X");
  const [result, setResult] = useState({ winner: "none", state: "none" });

  const handleGameOver = ({winner, state}) => {
    console.log("acabou o jogo! " + state)
    setResult({ winner: winner, state: state });
    setTurn("X");
  }

  useEffect(() =>  {
    let win = false
    checkIfTie({board, handleGameOver});
    win = checkWin({board, handleGameOver});
    if(turn === "O" && win !== true){
      handleAITurn();
    }
}, [board]); 

const handleRestart = () => {
  setBoard(["","","","","","","","",""]);
  setPlayer("X");
  setResult({ winner: "none", state: "none" });
}

const handleAITurn = () => {
  console.log("winner: " + result.winner)
  if(turn === "O" && result.state === "none"){
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
   <Game result={result} chooseSquare={chooseSquare} handleRestart={handleRestart} board={board}/>
  )
}

export default SinglePlayerGame