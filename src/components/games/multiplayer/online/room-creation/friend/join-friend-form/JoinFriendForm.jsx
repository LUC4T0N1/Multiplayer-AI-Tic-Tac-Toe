import React from 'react'
import "../../RoomCreation.css"
import {useTranslation} from 'react-i18next';

function JoinForm({setUsername, setRoom, joinRoom}) {
  const {t} = useTranslation()
  return (
    <div className="joinFriendForm">
      <h3>{t('room-title')}</h3>
      <input
        type="text"
        placeholder={t('nickname')}
        onChange={(event) => {
          setUsername(event.target.value);
        }}
      />
      <input
        type="text"
        placeholder={t('room-id')}
        onChange={(event) => {
          setRoom(event.target.value);
        }}
      />
      <button className='join-button' onClick={joinRoom}>{t('join-room')}</button>
  </div>
  )
}

export default JoinForm