import { useEffect, useState, useRef } from 'react'
import './App.css'
import axios from 'axios';
import socketIO from 'socket.io-client';
import PeerList from './PeerList';
import { uniqueNamesGenerator, adjectives, colors, animals } from 'unique-names-generator';




function App() {
  
  const [ip, setIp] = useState(null);
  const socket =  useRef(socketIO.connect("http://localhost:3000"));
  const local = useRef(null);
  const remote = useRef(null);
  const [connected, setConnected] = useState(false);
  const name = uniqueNamesGenerator({dictionaries: [colors, animals]});
  

  useEffect(() => {
    
  }, [])

  const RTCInitiate = async () => {
    const servers = {
      iceServers: [
        {
          urls: ['stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302'],
        },
      ],
      iceCandidatePoolSize: 10,
    };
    
    const currentDeviceRTC = new RTCPeerConnection(servers)
    const offer = await currentDeviceRTC.createOffer();
    await currentDeviceRTC.setLocalDescription(new RTCSessionDescription(offer));
    local.current = currentDeviceRTC.localDescription;
  }


  return (
    <>
      <PeerList name={name} socket={socket.current} />
    </>
  )
}

export default App
