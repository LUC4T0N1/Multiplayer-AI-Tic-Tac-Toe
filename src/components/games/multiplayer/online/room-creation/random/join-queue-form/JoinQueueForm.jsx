import React from 'react'
import "./JoinQueueForm.css"

function JoinQueueForm({setUsername, joinRoom}) {
  return (
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
  )
}

export default JoinQueueForm