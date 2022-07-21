import io from "socket.io-client";
import { useState, useEffect } from "react";
 import MultiplayerWithFriend from "../with-friend/MultiplayerWithFriend";

const socket = io.connect(process.env.REACT_APP_SERVER_URL);

function Queue() {
  const [username, setUsername] = useState("");
  const [room, setRoom] = useState("");
  const [showChat, setShowChat] = useState(false);
  const [roomReady, setRoomReady] =  useState(false);

  const joinRoom = () => {
    if (username !== "" ) {
      socket.emit("join_queue", username);
      setShowChat(true);
    }
  };

  useEffect(() => {
    socket.on("game_start", (data) => {
      console.log("jogo começando na sala " + data)
      setRoomReady(true);
      setRoom(data)
    });
  }, [socket, room, roomReady]); 

  return (
    <div className="App">
      {!showChat ? (
        <div className="joinChatContainer">
          <h3>Join A Chat</h3>
          <input
            type="text"
            placeholder="Username"
            onChange={(event) => {
              setUsername(event.target.value);
            }}
          />
          <button onClick={joinRoom}>Join Queue</button>
        </div>
      ) : (
        <>
        {!roomReady ?
         (<>  
            <p>You are in queue please wait</p>
          </>)
          :
          <MultiplayerWithFriend socket={socket} username={username} room={room}/> 
          }
        
{/*           <Chat socket={socket} username={username} room={room} /> */}
          
        </>
      )}
    </div>
  );
}

export default Queue;