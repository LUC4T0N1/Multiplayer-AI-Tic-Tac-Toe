import React, { useState, useEffect } from "react";
import LetterSelection from "./letter_selection/LetterSelection";
import GameLogic from "./GameLogic";

const MultiplayerWithFriend = ({ socket, username, room }) => {

  const [board, setBoard] = useState(["","","","","","","","",""])
  const [player, setPlayer] = useState("");
  const [turn, setTurn] = useState("X");

  const [oIsSelected, setOIsSelected] = useState({selected: false, player: ''});
  const [xIsSelected, setXIsSelected] = useState({selected: false, player: ''});
  const [result, setResult] = useState({ winner: "none", state: "none" });

  const handleGameOver = ({winner, state}) => {
    console.log("acabou o jogo! " + state)
    setResult({ winner: winner, state: state });
  }

  const handleRestart = () => {
    setBoard(["","","","","","","","",""]);
    setPlayer("X");
    setResult({ winner: "none", state: "none" });
  }

  const handleXSelection = async () => {
      if(xIsSelected.selected === true){
        if(xIsSelected.player === username){
          await socket.emit("select_letter", {letter: 'X', selected: false, player: '', room: room});
          setXIsSelected({selected: false, player: ''});
          setPlayer('');
        }
      }else{ 
        if(oIsSelected.player !== username) {
          console.log(username + " Selecionou o X");
          await socket.emit("select_letter", {letter: 'X', selected: true, player: username, room: room});
          setXIsSelected({selected: true, player: username});
          setPlayer('X');
        }
      }
    }

    const handleOSelection = async () => {
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

    useEffect(() => {
      socket.on("letter_selected", (data) => {
        if(data.letter === 'X'){
          console.log("o outro selecionou/deselecionou X..");
          setXIsSelected({selected: data.selected, player: data.player});
        }else{
          console.log("o outro selecionou/deselecionou O..");
          setOIsSelected({selected: data.selected, player: data.player});
        }
      });
    }, [socket, xIsSelected, oIsSelected]); 
  


  return (
    <>
      {(!oIsSelected.selected || !xIsSelected.selected) ? <LetterSelection handleXSelection={handleXSelection} xIsSelected={xIsSelected} handleOSelection={handleOSelection} oIsSelected={oIsSelected}/> : 
      <GameLogic socket={socket} username={username} room={room} handleGameOver={handleGameOver} board={board} setBoard={setBoard} player={player} setPlayer={setPlayer} turn={turn} setTurn={setTurn} result={result}/>  }      
      {result.state === "won" && <div> {result.winner} Won The Game</div>}
      {result.state === "tie" && <div> Game Tieds</div>}
      {result.state !== "none" ? <button onClick={handleRestart}> RESTART GAME </button> : ""}
    </>
  );
};

export default MultiplayerWithFriend;