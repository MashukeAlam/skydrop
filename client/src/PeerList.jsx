import { useEffect, useRef, useState } from "react";
import { uniqueNamesGenerator, adjectives, colors, animals } from 'unique-names-generator';
import {Peer} from 'peerjs';
const PeerList = ({ socket, name }) => {

    const [list, setList] = useState([]);
    const [html, setHTML] = useState('');
    const local = useRef(null);
    const remote = useRef(null);
    const rtc = useRef(null);
    const peerRef = useRef(null);
    const inputFile = useRef(null);
    const [fileSelected, setFileSelected] = useState(null);
    const [connected, setConnected] = useState(false);
    const conn = useRef(null);
    const [sourceImg, setSourceImg] = useState(null);

    useEffect(() => {
        const ls_name = localStorage.getItem('name');
        if (ls_name) {
            console.log("retreived from ls");
            socket.emit('my_name', {name: ls_name});
        } else {
            const name = uniqueNamesGenerator({dictionaries: [colors, animals]});
            localStorage.setItem('name', name);
            socket.emit('my_name', {name});

        }
        if (peerRef.current == null) {
            const peer = new Peer(localStorage.getItem('name'), {
            host: 'localhost',
            port: 3000,
            path: '/peerjs'
        });
        peerRef.current = peer;
        // console.log(peerRef);
        peer.on('connection', conn => {
            conn.on('data', data => {
                console.log(data);
                if (data.fileType.includes('image')) {
                    const bytes = new Uint8Array(data.file)
                    setSourceImg(`data:image/png;base64,${encode(bytes)}`)
                }
            })
        })
        
        
        }
        

    }, []);

    
    

    socket.on('my_name', data => {
        localStorage.setItem('name', data.name);
    });

    socket.on('rtcIncoming', async data => {
        if (data.name == localStorage.getItem('name')) {

            console.log(`Connection trynna establish from ${data.his} to ${data.name}`);
            const currentDeviceRTC = new RTCPeerConnection();
            rtc.current = currentDeviceRTC;
            await currentDeviceRTC.setRemoteDescription(data.remote);
            const answer = await currentDeviceRTC.createAnswer();
            await currentDeviceRTC.setLocalDescription(answer);
            console.log(data.remote, currentDeviceRTC.localDescription);
            local.current = currentDeviceRTC.localDescription
            remote.current = currentDeviceRTC.remoteDescription
            socket.emit('join', {his: data.name, remote: currentDeviceRTC.localDescription, type: 'end'});
        }
        
    });

    socket.on('rtcEstablishing', async data => {
        console.log(data);
        if (data.name == localStorage.getItem('name')) {

            rtc.current.setRemoteDescription(data.remote);
            remote.current = rtc.current.remoteDescription;
            remote.on('data', (event) => {
                event.on('message', data => {
                    console.log(data);
                })
            })
        }
    });

    

    useEffect(() => {
        socket.on("room_update", data => {
            let set = new Set(list);
            set.add(data.name);
            const arr = Array.from(set);
            setList(arr)

        });

        socket.on('room_members_list', data => {
            console.log(data.list);
            setList(data.list)
        })
    }, [socket]);

    useEffect(() => {
        if (connected) {
            if (fileSelected) {
                console.log(`Trying to send this file: ${fileSelected}`);
                const blob = new Blob(fileSelected, {type: fileSelected[0].type})
                console.log(blob);
                conn.current.send({
                    file: blob,
                    fileType: fileSelected[0].type,
                    fileName: fileSelected[0].name
                });
            }
        }
    }, [connected, fileSelected])

    const fileWatch = (e) => {
        setFileSelected(e.target.files)
    }


    const handshake = async (id) => {
        console.log(peerRef.current);
        conn.current = peerRef.current.connect(id);
        
        conn.current.on('open', () => {
            setConnected(true);
            inputFile.current.click();
        });

        conn.current.on('close', () => {
            setConnected(false);
        })
        
        // const servers = {
        //     iceServers: [
        //       {
        //         urls: ['stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302'],
        //       },
        //     ],
        //     iceCandidatePoolSize: 10,
        //   };
          
    }

    // Copied from a website.
    const encode = input => {
        const keyStr =
          'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/='
        let output = ''
        let chr1, chr2, chr3, enc1, enc2, enc3, enc4
        let i = 0
      
        while (i < input.length) {
          chr1 = input[i++]
          chr2 = i < input.length ? input[i++] : Number.NaN // Not sure if the index
          chr3 = i < input.length ? input[i++] : Number.NaN // checks are needed here
      
          enc1 = chr1 >> 2
          enc2 = ((chr1 & 3) << 4) | (chr2 >> 4)
          enc3 = ((chr2 & 15) << 2) | (chr3 >> 6)
          enc4 = chr3 & 63
      
          if (isNaN(chr2)) {
            enc3 = enc4 = 64
          } else if (isNaN(chr3)) {
            enc4 = 64
          }
          output +=
            keyStr.charAt(enc1) +
            keyStr.charAt(enc2) +
            keyStr.charAt(enc3) +
            keyStr.charAt(enc4)
        }
        return output
      }

    return (
        <>
        <h3>{localStorage.getItem('name')}</h3>
        <ul>
            {list.map((number) =>  <li onClick={() => {handshake(number)}}>{number}</li>)}
        </ul>
            <input onChange={fileWatch} ref={inputFile} type="file" style={{ display: "none" }} accept="image/*"/>
            {sourceImg ? <img src={sourceImg} alt="" srcset="" /> : "No File"}
            
        </>
    )
}

export default PeerList;