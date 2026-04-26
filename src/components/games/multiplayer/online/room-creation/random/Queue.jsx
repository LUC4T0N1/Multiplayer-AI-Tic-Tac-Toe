import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import OnlineGame from "../../game-logic/OnlineGame";
import JoinQueueForm from "./join-queue-form/JoinQueueForm";
import "../RoomCreation.css";
import { useTranslation } from 'react-i18next';
import MeshBackground from '../../../../../ui/MeshBackground';
import WaveAnimation from '../../../../../ui/WaveAnimation';
import isMobile from '../../../../../../utils/isMobile';

function Queue({ socket }) {
  const { t } = useTranslation();
  const [username, setUsername] = useState("");
  const [room, setRoom] = useState("");
  const [showChat, setShowChat] = useState(false);
  const [roomReady, setRoomReady] = useState(false);
  const [isOtherPlayerReady, setIsOtherPlayerReady] = useState(false);

  const joinRoom = () => {
    if (username !== "") {
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
      setRoom(data);
    });
  }, [socket, room, roomReady]);

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
      {!isMobile && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 1, opacity: 0.35, pointerEvents: 'none' }}>
          <WaveAnimation particleColor="#ffffff" waveSpeed={1.5} waveIntensity={12} pointSize={1.5} gridDistance={5} />
        </div>
      )}

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
        display: 'flex', flexDirection: 'column', alignItems: 'center',
      }}>
        {!showChat ? (
          <JoinQueueForm setUsername={setUsername} joinRoom={joinRoom} />
        ) : (
          <div style={{ textAlign: 'center' }}>
            <div className="retro-waiting-title">{t('waiting-random')}</div>
            <div style={{ marginTop: 18, fontSize: 28, color: '#ff2d78' }}>
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

export default Queue;
