import { useEffect, useState, useRef } from 'react'
import socketIO from 'socket.io-client';
import PeerList from './PeerList';

function App() {

  const socket =  useRef(socketIO.connect("https://skydrop-4.onrender.com/"));

  return (
    <>
      <PeerList name={name} socket={socket.current} />
    </>
  )
}

export default App
