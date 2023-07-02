import { useEffect, useState, useRef } from 'react'
import socketIO from 'socket.io-client';
import PeerList from './PeerList';

function App() {

  const socket =  useRef(socketIO.connect("http://localhost:3000"));

  return (
    <>
      <PeerList name={name} socket={socket.current} />
    </>
  )
}

export default App
