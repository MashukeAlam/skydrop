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
    const [fileSizeArr, setFileSizeArr] = useState([]);
    const [connected, setConnected] = useState(false);
    const conn = useRef(null);
    const [sourceImg, setSourceImg] = useState([]);

    useEffect(() => {
        const ls_name = localStorage.getItem('name');
        if (ls_name) {
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
            path: '/peerjs',
            config: {'iceServers': [
                { url: 'stun:stun1.l.google.com:19302' },
                { url: 'stun:stun1.l.google.com:19302'},
                { url: 'stun:stun2.l.google.com:19302'}
            ]}
        });
        peerRef.current = peer;
        peer.on('connection', conn => {
            conn.on('data', data => {
                if (data.fileType.includes('image')) {
                    const sizes = data.fileSizes;
                    const bytes = new Uint8Array(data.file);
                    let start = 0;
                    for (let i = 0; i < sizes.length; i++) {
                        const size = parseInt(sizes[i]);
                        let currBytes = bytes.slice(start, start + size);
                        console.log(start, parseInt(size));
                        let currImgSrc = `data:image/png;base64,${encode(currBytes)}`;
                        const newArr = sourceImg;
                        newArr.push(currImgSrc);
                        setSourceImg(newArr);
                        start = start + size;
                    }
                    // let b = bytes.slice(0, sizes[0]);
                    // console.log(bytes);
                    console.log(sizes);
                    // setSourceImg(`data:image/png;base64,${encode(b)}`)
                }
            })
        })
        
        
        }
        

    }, []);

    
    

    socket.on('my_name', data => {
        localStorage.setItem('name', data.name);
    });

    useEffect(() => {
        socket.on("room_update", data => {
            let set = new Set(list);
            set.add(data.name);
            const arr = Array.from(set);
            setList(arr)

        });

        socket.on('room_members_list', data => {
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
                    fileName: fileSelected[0].name,
                    fileSizes: fileSizeArr
                });
            }
        }
    }, [connected, fileSelected])

    const fileWatch = (e) => {
        setFileSelected(e.target.files)
        let fileSizes = []
        for (let i = 0; i < e.target.files.length; i++) {
            fileSizes.push(e.target.files[i].size);
        }
        setFileSizeArr(fileSizes);
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
        });   
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
            <input multiple="multiple" onChange={fileWatch} ref={inputFile} type="file" style={{ display: "none" }} accept="image/*"/>
            {sourceImg.map(imgSrc => <img src={imgSrc} height={'300px'} width={'300px'} alt="" /> )}       
        </>
    )
}

export default PeerList;