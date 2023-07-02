import { useEffect, useRef, useState } from "react";
import { uniqueNamesGenerator, colors, animals } from 'unique-names-generator';
import {Peer} from 'peerjs';
import {FaMobileScreenButton} from 'react-icons/fa6'

const PeerList = ({ socket, name }) => {

    const [list, setList] = useState([]);
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
                    setSourceImg([]);
                    const sizes = data.fileSizes;
                    const bytes = new Uint8Array(data.file);
                    let start = 0;
                    let newArr = [];
                    sizes.forEach((s) => {
                        const size = parseInt(s);
                        // console.log("size ", s)
                        let currBytes = bytes.slice(start, start + size);
                        // console.log(start, parseInt(size));
                        let currImgSrc = `data:image/png;base64,${encode(currBytes)}`;
                        
                        newArr.push(currImgSrc);
                        setSourceImg(newArr);
                        start = start + size;
                        // console.log(sourceImg.length);;;
                    })
                        
                    
                    // let b = bytes.slice(0, sizes[0]);
                    // console.log(bytes);
                    // console.log(sizes);
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
                // console.log(`Trying to send this file: ${fileSelected}`);
                const blob = new Blob(fileSelected, {type: fileSelected[0].type})
                // console.log(blob);
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
        // console.log(peerRef.current);
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
        <div className="flex flex-col h-screen p-6 rounded-md shadow-2xl items-center space-x-1">
        <h3 className="text-3xl text-emerald-500 font-semibold hover:text-emerald-400">You are known as {localStorage.getItem('name')}</h3>
        <ul className="flex flex-row m-7">
            {list.map((number) =>  (
                <div className="parent flex flex-col justify-center items-center">
                    <div className="rounded-full bg-emerald-200 border border-emerald-300 w-20 h-20 flex justify-center items-center hover:bg-emerald-300 cursor-pointer" onClick={() => {handshake(number)}}><FaMobileScreenButton className="h-10 w-10" /></div>
                    <p className="m-3 text-md font-bold">{number}</p>
                </div>
            ))}
        </ul>
            <input multiple="multiple" onChange={fileWatch} ref={inputFile} type="file" style={{ display: "none" }} accept="image/*"/>
            {sourceImg.length != 0 ? <p>{sourceImg.length} images are coming your way!</p> : "No Images"}
            <div className="imageContainer flex flex-row p-2 m-4">
            {sourceImg.map(imgSrc => (
                <div className="indiImage border border-black m-2">
                    <img src={imgSrc} height={'300px'} width={'300px'} alt="" />
                </div>
            ) )}       

            </div>
        </div>
    )
}

export default PeerList;