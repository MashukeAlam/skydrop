import { useEffect, useState, useRef } from 'react'
import './App.css'
import axios from 'axios';
import socketIO from 'socket.io-client';
import PeerList from './PeerList';
import { uniqueNamesGenerator, adjectives, colors, animals } from 'unique-names-generator';




function App() {
  
  
  const socket =  useRef(socketIO.connect("http://localhost:3000"));
  
  

  



  return (
    <>
      <PeerList name={name} socket={socket.current} />
    </>
  )
}

export default App
