import { useState, useEffect } from "react";
import OnlineGame from "../../game-logic/OnlineGame";
import JoinQueueForm from "./join-queue-form/JoinQueueForm";
import "../RoomCreation.css"
/* import { Prompt } from 'react-router' */

function Queue({socket}) {
  const [username, setUsername] = useState("");
  const [room, setRoom] = useState("");
  const [showChat, setShowChat] = useState(false);
  const [roomReady, setRoomReady] =  useState(false);
  const [isOtherPlayerReady, setIsOtherPlayerReady] = useState(false);

  const joinRoom = () => {
    if (username !== "" ) {
      socket.emit("join_queue", username);
      setShowChat(true);
    }
  };

  const componentDidUpdate = () => {
    if (!roomReady) {
      window.onbeforeunload = () => true
    } else {
      window.onbeforeunload = undefined
    }
  }

  useEffect(() => {
    socket.on("check_online", (data) => {
      console.log("verificando se eu estou ok")
      socket.emit("ok", username);
    });
    socket.on("game_start", (data) => {
      console.log("jogo começando na sala " + data)
      setIsOtherPlayerReady(true);
      setRoomReady(true);
      setRoom(data)
    });
  }, [socket, room, roomReady]); 

  return (
    <div className="joinFriendForm">
      {!showChat ? (
        <JoinQueueForm setUsername={setUsername} joinRoom={joinRoom}/>
      ) : (
        <>
        {!roomReady ?
         (<>  
{/*          <Prompt
          when={!roomReady}
          message='You have unsaved changes, are you sure you want to leave?'
    /> */}
          <div className="border"></div>
         </>)
          :
          <OnlineGame socket={socket} username={username} room={room} isOtherPlayerReady={isOtherPlayerReady} setIsOtherPlayerReady={setIsOtherPlayerReady}/> 
          }          
        </>
      )}
    </div>
  );
}

export default Queue;