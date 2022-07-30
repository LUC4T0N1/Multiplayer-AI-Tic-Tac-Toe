import React, { useState, useEffect } from "react";
import LetterSelection from "./letter_selection/LetterSelection";
import Chat from "../../../../chat/Chat";
import {checkIfTie, checkWin} from  "../../../../../utils/EndGame";
import Board from "../../../../game/Board";
import "../../../../game/Game.css"

const OnlineGame = ({ socket, username, room, isOtherPlayerReady, setIsOtherPlayerReady }) => {

  const [board, setBoard] = useState(["","","","","","","","",""])
  const [player, setPlayer] = useState("");
  const [turn, setTurn] = useState("X");

  const [oIsSelected, setOIsSelected] = useState({selected: false, player: ''});
  const [xIsSelected, setXIsSelected] = useState({selected: false, player: ''});
  const [result, setResult] = useState({ winner: "none", state: "none" });

  const handleGameOver = ({winner, state}) => {
    setResult({ winner: winner, state: state });
    setIsOtherPlayerReady(false);
  }

  const handleRestart = async () => {
    setBoard(["","","","","","","","",""]);
    setPlayer("");
    setTurn("X");
    setResult({ winner: "none", state: "none" });
    setOIsSelected({selected: false, player: ''});
    setXIsSelected({selected: false, player: ''});
    await socket.emit("player-ready", {room: room, author: username });
  }

  const handleXSelection = async () => {
    if(isOtherPlayerReady){
      if(xIsSelected.selected === true){
        if(xIsSelected.player === username){
          await socket.emit("select_letter", {letter: 'X', selected: false, player: '', room: room});
          setXIsSelected({selected: false, player: ''});
          setPlayer('');
        }
      }else{ 
        if(oIsSelected.player !== username) {
          await socket.emit("select_letter", {letter: 'X', selected: true, player: username, room: room});
          setXIsSelected({selected: true, player: username});
          setPlayer('X');
        }
      }
    }
  }

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

    const handleOSelection = async () => {
      if(isOtherPlayerReady){
        if(oIsSelected.selected === true){
          if(oIsSelected.player === username){
            await socket.emit("select_letter", {letter: 'O', selected: false, player: '', room: room});
            setOIsSelected({selected: false, player: ''});
            setPlayer('');
          }
        }else{
          if(xIsSelected.player !== username) {
            console.log(username + " Selecionou o O");
            await socket.emit("select_letter", {letter: 'O', selected: true, player: username, room: room});
            setOIsSelected({selected: true, player: username});
            setPlayer('O');
          }
        }
      }
    }

    useEffect(() => {
      socket.on("player-ready", (data) => {
        if(data.author !== username){
          console.log("o outro jogador entrou na sala de seleção de letra");
          setIsOtherPlayerReady(true);
        }
      });
      socket.on("letter_selected", (data) => {
        if(data.letter === 'X'){
          console.log("o outro selecionou/deselecionou X..");
          setXIsSelected({selected: data.selected, player: data.player});
        }else{
          console.log("o outro selecionou/deselecionou O..");
          setOIsSelected({selected: data.selected, player: data.player});
        }
      });
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
    }, [socket, xIsSelected, oIsSelected, board]); 
  


  return (
    <div className="flex-container">
      {(!oIsSelected.selected || !xIsSelected.selected) ? <LetterSelection handleXSelection={handleXSelection} xIsSelected={xIsSelected} handleOSelection={handleOSelection} oIsSelected={oIsSelected}/> : 
      <>
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
      </> }    


      <Chat socket={socket} username={username} room={room} />
    </div>
  );
};

export default OnlineGame;