import { useState, useEffect } from "react";
import OnlineGame from "../../game-logic/OnlineGame";
import JoinForm from "./join-friend-form/JoinFriendForm";
import "../RoomCreation.css"
import {useTranslation} from 'react-i18next';


function RoomSelection({socket}) {
  const {t} = useTranslation()
  const [username, setUsername] = useState("");
  const [room, setRoom] = useState("");
  const [showChat, setShowChat] = useState(false);
  const [isOtherPlayerReady, setIsOtherPlayerReady] = useState(false);
  const [roomReady, setRoomReady] =  useState(false);
  const [rightRoomName, setRightRoomName] = useState(true);
  const [rightUserName, setRightUserName] = useState(true);

  const joinRoom = async () => {
    if(username === ""){
      setRightUserName(false)
    }else{
      setRightUserName(true)
      if(!containsAnyLetter(room)){
        setRightRoomName(false)
      }else{
        setRightRoomName(true)
        await socket.emit("join_room", room);
        setShowChat(true);
      }
    }
  };

  function containsAnyLetter(str) {
    return /[a-zA-Z]/.test(str);
  }

  useEffect(() => {
    socket.on("room-ready", async (data) => {
        setIsOtherPlayerReady(true);
        setRoomReady(true);
    });
  }, [socket, room, roomReady, isOtherPlayerReady]); 

  return (
    <div className="joinFriendForm">
      {!showChat ? (
        <>
          <JoinForm setUsername={setUsername} setRoom={setRoom} joinRoom={joinRoom}/>
          {rightRoomName ? <></> : <div>{t('id-warning')}</div> }
          {rightUserName ? <></> : <div>{t('name-warning')}</div> }
        </>
      ) : (
        <>
          {!roomReady ?
         (<>  
            <div className="border" data-after-content={t('waiting-friend')}></div>
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