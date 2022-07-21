import React, { useEffect, useState } from "react";
import Square from "../../../game/Square";
import {checkIfTie, checkWin} from  "../../../../utils/EndGame";
import Board from "../../../game/Board";

function GameLogic({ socket, username, room, handleGameOver, board, setBoard, player, setPlayer, turn, setTurn, result }) {
  console.log("turn: "+ turn)
  console.log("player: "+player)
  console.log("board: "+ JSON.stringify(board))

useEffect(() => {
  socket.on("game-move", (data) => {
    if (data.username !== username) {
      const currentPlayer = data.player === "X" ? "O" : "X";
      setPlayer(currentPlayer);
      setTurn(currentPlayer);
      setBoard(
        board.map((val, idx) => {
          if (idx === data.square && val === "") {
            return data.player;
          }
          return val;
        })
      );
    }
  });
  checkIfTie({board, handleGameOver});
  checkWin({board, handleGameOver});
}, [board]);


const sendMessage = async (message) => {
  await socket.emit("game-move", message);
};

  const chooseSquare = async (square) => {
    if (turn === player && board[square] === "" && result.state === "none") {
      setTurn(player === "X" ? "O" : "X");
      await sendMessage({square: square, player: player, room: room, author: username });
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
    <Board chooseSquare={chooseSquare} board={board}/>
  )
}

export default GameLogic;