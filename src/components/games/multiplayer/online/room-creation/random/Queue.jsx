import { useState, useEffect } from "react";
import OnlineGame from "../../game-logic/OnlineGame";
import JoinQueueForm from "./join-queue-form/JoinQueueForm";

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

  useEffect(() => {
    socket.on("game_start", (data) => {
      console.log("jogo começando na sala " + data)
      setIsOtherPlayerReady(true);
      setRoomReady(true);
      setRoom(data)
    });
  }, [socket, room, roomReady]); 

  return (
    <div className="App">
      {!showChat ? (
        <JoinQueueForm setUsername={setUsername} joinRoom={joinRoom}/>
      ) : (
        <>
        {!roomReady ?
         (<>  
            <p>You are in queue please wait</p>
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