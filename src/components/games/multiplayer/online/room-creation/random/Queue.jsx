import { useState, useEffect } from "react";
import OnlineGame from "../../game-logic/OnlineGame";
import JoinQueueForm from "./join-queue-form/JoinQueueForm";
import "../RoomCreation.css"
import {useTranslation} from 'react-i18next';

function Queue({socket}) {
  const {t} = useTranslation()
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
    socket.on("check_online", (data) => {
      socket.emit("ok", username);
    });
    socket.on("game_start", (data) => {
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
          <div className="border" data-after-content={t('waiting-random')}></div>
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