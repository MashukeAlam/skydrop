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
            })
        })
        }
        

    }, []);

    
    socket.on('neighborList', data => {
        
    });

    socket.on('my_name', data => {
        console.log(data.name);
        localStorage.setItem('name', data.name);
        console.log("My name: ", localStorage.getItem('name'));
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
            console.log(arr);
            setList(arr)

            // console.log(list, data.name, set);
        });

        socket.on('room_members_list', data => {
            console.log(data.list);
            setList(data.list)
        })
    }, [socket]);

    


    const handshake = async (id) => {
        console.log(peerRef.current);
        const conn = peerRef.current.connect(id);
        
        conn.on('open', () => {
            conn.send("Hey man?");
        })
        
        console.log(`Trying to connect to ${id}`);
        // const servers = {
        //     iceServers: [
        //       {
        //         urls: ['stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302'],
        //       },
        //     ],
        //     iceCandidatePoolSize: 10,
        //   };
          
        //   const currentDeviceRTC = new RTCPeerConnection(servers)
        //   rtc.current = currentDeviceRTC;
        //   const offer = await currentDeviceRTC.createOffer();
        //   await currentDeviceRTC.setLocalDescription(new RTCSessionDescription(offer));
        //   local.current = currentDeviceRTC.localDescription;
        //   socket.emit('join', {name: id, local: local.current, type: 'initial', his: localStorage.getItem('name')});
    }

    return (
        <>
        <h3>{localStorage.getItem('name')}</h3>
        <ul>
            {list.map((number) =>  <li onClick={() => {handshake(number)}}>{number}</li>)}
        </ul>
        </>
    )
}

export default PeerList;