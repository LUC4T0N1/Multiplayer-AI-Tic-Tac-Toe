import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import OnlineGame from "../../game-logic/OnlineGame";
import JoinForm from "./join-friend-form/JoinFriendForm";
import "../RoomCreation.css";
import { useTranslation } from 'react-i18next';
import MeshBackground from '../../../../../ui/MeshBackground';
import WaveAnimation from '../../../../../ui/WaveAnimation';

function RoomSelection({ socket }) {
  const { t } = useTranslation();
  const [username, setUsername] = useState("");
  const [room, setRoom] = useState("");
  const [showChat, setShowChat] = useState(false);
  const [isOtherPlayerReady, setIsOtherPlayerReady] = useState(false);
  const [roomReady, setRoomReady] = useState(false);
  const [rightRoomName, setRightRoomName] = useState(true);
  const [rightUserName, setRightUserName] = useState(true);

  const joinRoom = async () => {
    if (username === "") {
      setRightUserName(false);
    } else {
      setRightUserName(true);
      if (!containsAnyLetter(room)) {
        setRightRoomName(false);
      } else {
        setRightRoomName(true);
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

  if (showChat && roomReady) {
    return (
      <OnlineGame
        socket={socket}
        username={username}
        room={room}
        isOtherPlayerReady={isOtherPlayerReady}
        setIsOtherPlayerReady={setIsOtherPlayerReady}
      />
    );
  }

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: '#050010',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      overflow: 'hidden',
    }}>
      {/* MeshBackground */}
      <MeshBackground zIndex={0} />

      {/* WaveAnimation */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 1, opacity: 0.35, pointerEvents: 'none' }}>
        <WaveAnimation particleColor="#ffffff" waveSpeed={1.5} waveIntensity={12} pointSize={1.5} gridDistance={5} />
      </div>

      {/* Overlay for card readability */}
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,12,0.38)', zIndex: 2 }} />

      {/* Scanlines */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 3,
        backgroundImage: 'linear-gradient(rgba(0,0,0,0.055) 50%, transparent 50%)',
        backgroundSize: '100% 4px',
      }} />

      {/* Back button */}
      <Link to="/" style={{
        position: 'absolute', top: 22, left: 24, zIndex: 20,
        fontFamily: "'Orbitron', sans-serif", fontSize: 10, letterSpacing: '0.14em',
        color: 'rgba(255,255,255,0.35)', textDecoration: 'none', textTransform: 'uppercase',
        transition: 'color 0.15s',
      }}
        onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,0.85)'}
        onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.35)'}
      >{t('back')}</Link>

      {/* Content */}
      <div style={{
        position: 'relative', zIndex: 10,
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
      }}>
        {!showChat ? (
          <>
            <JoinForm setUsername={setUsername} setRoom={setRoom} joinRoom={joinRoom} />
            {!rightRoomName && (
              <div style={{
                fontFamily: "'Orbitron', sans-serif", fontSize: 11,
                color: '#ff2d78', letterSpacing: '0.12em',
                textShadow: '0 0 10px #ff2d78',
              }}>{t('id-warning')}</div>
            )}
            {!rightUserName && (
              <div style={{
                fontFamily: "'Orbitron', sans-serif", fontSize: 11,
                color: '#ff2d78', letterSpacing: '0.12em',
                textShadow: '0 0 10px #ff2d78',
              }}>{t('name-warning')}</div>
            )}
          </>
        ) : (
          <div style={{ textAlign: 'center' }}>
            <div className="retro-waiting-title">{t('waiting-friend')}</div>
            <div style={{ marginTop: 18, fontSize: 28 }}>
              <span className="retro-dot-1"> · </span>
              <span className="retro-dot-2"> · </span>
              <span className="retro-dot-3"> · </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default RoomSelection;
