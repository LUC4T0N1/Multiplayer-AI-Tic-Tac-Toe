import React from 'react'
import "../../RoomCreation.css"

function JoinForm({setUsername, setRoom, joinRoom}) {
  return (
    <div className="joinFriendForm">
      <h3>Enter a NickName and the room ID</h3>
      <input
        type="text"
        placeholder="Nickname..."
        onChange={(event) => {
          setUsername(event.target.value);
        }}
      />
      <input
        type="text"
        placeholder="Room ID..."
        onChange={(event) => {
          setRoom(event.target.value);
        }}
      />
      <button className='join-button' onClick={joinRoom}>Join A Room</button>
  </div>
  )
}

export default JoinForm