import { useEffect, useState, useRef } from 'react'
import socketIO from 'socket.io-client';
import PeerList from './PeerList';
import NavBar  from './NavBar';

function App() {

  const socket =  useRef(socketIO.connect("https://skydrop-4.onrender.com/"));

  return (
    <>
      <NavBar />
      <PeerList name={name} socket={socket.current} />
    </>
  )
}

export default App
