import { useState, useEffect } from "react";
import OnlineGame from "../../game-logic/OnlineGame";
import JoinForm from "./join-friend-form/JoinFriendForm";
import "../RoomCreation.css"


function RoomSelection({socket}) {
  const [username, setUsername] = useState("");
  const [room, setRoom] = useState("");
  const [showChat, setShowChat] = useState(false);
  const [isOtherPlayerReady, setIsOtherPlayerReady] = useState(false);
  const [roomReady, setRoomReady] =  useState(false);

  const joinRoom = async () => {
    if (username !== "" && room !== "") {
      await socket.emit("join_room", room);
      setShowChat(true);
    }
  };

  useEffect(() => {
    socket.on("room-ready", async (data) => {
        console.log("jogo começando na sala " + data)
        setIsOtherPlayerReady(true);
        setRoomReady(true);
    });
  }, [socket, room, roomReady, isOtherPlayerReady]); 

  return (
    <div className="joinFriendForm">
      {!showChat ? (
        <JoinForm setUsername={setUsername} setRoom={setRoom} joinRoom={joinRoom}/>
      ) : (
        <>
          {!roomReady ?
         (<>  
            <p className="waiting-message">Waiting for the other person to join the room</p>
          </>)
          :
          <OnlineGame socket={socket} username={username} room={room} isOtherPlayerReady={isOtherPlayerReady} setIsOtherPlayerReady={setIsOtherPlayerReady}/> 
          }  
        </>
      )}
    </div>
  );
}

export default RoomSelection;