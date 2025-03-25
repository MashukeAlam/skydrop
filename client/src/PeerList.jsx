import { useEffect, useRef, useState } from "react";
import { uniqueNamesGenerator, colors, animals } from "unique-names-generator";
import { Peer } from "peerjs";
import { FaDownload, FaMobileScreenButton } from "react-icons/fa6";

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
    // document.documentElement.classList.add('dark')
    const ls_name = localStorage.getItem("name");
    if (ls_name) {
      socket.emit("my_name", { name: ls_name });
    } else {
      const name = uniqueNamesGenerator({ dictionaries: [colors, animals] });
      localStorage.setItem("name", name);
      socket.emit("my_name", { name });
    }
    if (peerRef.current == null) {
      const peer = new Peer(localStorage.getItem("name"), {
        host: "skydrop-4.onrender.com",
        port: 443,
        path: "/peerjs",
        config: {
          iceServers: [{ url: "stun:stun1.l.google.com:19302" }],
        },
      });
      console.log(peer);
      peerRef.current = peer;
      peer.on("connection", (conn) => {
        console.log("hello?");
        conn.on("data", (data) => {
          if (data.fileType.includes("image")) {
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
            });

            // let b = bytes.slice(0, sizes[0]);
            // console.log(bytes);
            // console.log(sizes);
            // setSourceImg(`data:image/png;base64,${encode(b)}`)
          }
        });
      });
    }
  }, []);

  socket.on("my_name", (data) => {
    localStorage.setItem("name", data.name);
  });

  useEffect(() => {
    socket.on("room_update", (data) => {
      let set = new Set(list);
      set.add(data.name);
      const arr = Array.from(set);
      setList(arr);
      // console.log(data);
    });

    socket.on("room_members_list", (data) => {
      setList(data.list);
    });
  }, [socket]);

  useEffect(() => {
    if (connected) {
      if (fileSelected) {
        // console.log(`Trying to send this file: ${fileSelected}`);
        const blob = new Blob(fileSelected, { type: fileSelected[0].type });
        // console.log(blob);
        conn.current.send({
          file: blob,
          fileType: fileSelected[0].type,
          fileName: fileSelected[0].name,
          fileSizes: fileSizeArr,
        });
      }
    }
  }, [connected, fileSelected]);

  const fileWatch = (e) => {
    setFileSelected(e.target.files);
    let fileSizes = [];
    for (let i = 0; i < e.target.files.length; i++) {
      fileSizes.push(e.target.files[i].size);
    }
    setFileSizeArr(fileSizes);
  };

  const handshake = async (id) => {
    conn.current = peerRef.current.connect(id);
    console.log(peerRef.current, conn.current);

    conn.current.on("open", () => {
      console.log("hello?");
      setConnected(true);
      inputFile.current.click();
    });

    conn.current.on("close", () => {
      setConnected(false);
    });
  };

  // Copied from a website.
  const encode = (input) => {
    const keyStr =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
    let output = "";
    let chr1, chr2, chr3, enc1, enc2, enc3, enc4;
    let i = 0;

    while (i < input.length) {
      chr1 = input[i++];
      chr2 = i < input.length ? input[i++] : Number.NaN; // Not sure if the index
      chr3 = i < input.length ? input[i++] : Number.NaN; // checks are needed here

      enc1 = chr1 >> 2;
      enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
      enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
      enc4 = chr3 & 63;

      if (isNaN(chr2)) {
        enc3 = enc4 = 64;
      } else if (isNaN(chr3)) {
        enc4 = 64;
      }
      output +=
        keyStr.charAt(enc1) +
        keyStr.charAt(enc2) +
        keyStr.charAt(enc3) +
        keyStr.charAt(enc4);
    }
    return output;
  };

  return (
    <div className="bg-gray-900 h-screen overflow-auto">
      {connected ? (
        <div className="absolute top-5 right-5 flex items-center justify-center w-fit h-8 px-2 bg-white/10 rounded-xl border border-white/20 shadow-lg">
          <p className="text-sm font-semibold text-emerald-500">Connected</p>
        </div>
      ) : (
        <div className="absolute top-5 right-5 flex items-center justify-center w-fit h-8 px-2 bg-white/10 rounded-xl border border-white/20 shadow-lg">
          <p className="text-sm font-semibold text-red-500">Disconnected</p>
        </div>
      )}

      <div
        style={{
          backgroundColor: `hsl(${Math.floor(Math.random() * 360)}, 70%, 60%)`,
        }}
        class="absolute inset-y-0 left-1/3 transform -translate-x-1/2 flex items-center justify-center w-[28rem] h-[28rem] rounded-full blur-[150px] transition-colors duration-700"
      ></div>
      <div
        style={{
          backgroundColor: `hsl(${Math.floor(Math.random() * 360)}, 70%, 60%)`,
        }}
        class="absolute inset-y-0 left-1/2 transform -translate-x-1/2 flex items-center justify-center w-[24rem] h-[24rem] rounded-full blur-[150px] transition-colors duration-700"
      ></div>
      <div
        style={{
          backgroundColor: `hsl(${Math.floor(Math.random() * 360)}, 70%, 60%)`,
        }}
        class="absolute inset-y-0 left-1/2 transform -translate-x-1/2 flex items-center justify-center w-[24rem] h-[24rem] rounded-full blur-[150px] transition-colors duration-700"
      ></div>
      <div class="relative max-w-xl mx-auto mt-10 p-6 backdrop-blur-lg bg-white/10 rounded-xl border border-white/20 shadow-lg">
        <h3 className="text-3xl text-emerald-500 dark:text-emerald-200 font-semibold hover:text-emerald-400">
          You are known as {localStorage.getItem("name")}
        </h3>
        <ul className="flex flex-wrap justify-center m-7">
          {list.map((number) => (
            <div className="parent flex flex-col justify-center items-center m-2">
              <div
                style={{
                  backgroundColor: `hsl(${
                    [318, 28, 45][Math.floor(Math.random() * 3)]
                  }, ${[60, 70, 80][Math.floor(Math.random() * 3)]}%, ${
                    [95, 90, 85][Math.floor(Math.random() * 3)]
                  }%)`,
                }}
                className="rounded-full border border-slate-500 w-20 h-20 flex justify-center items-center hover:bg-slate-400 cursor-pointer"
                onClick={() => {
                  handshake(number);
                }}
              >
                <strong>{number.slice(0, 2).toUpperCase()}</strong>
              </div>
              <p className="m-1 text-sm font-bold dark:text-slate-300">
                {number}
              </p>
            </div>
          ))}
        </ul>
        <input
          multiple="multiple"
          onChange={fileWatch}
          ref={inputFile}
          type="file"
          style={{ display: "none" }}
          accept="image/*"
        />
        {sourceImg.length != 0 ? (
          <p className="dark:text-slate-300">
            {sourceImg.length} images are coming your way!
          </p>
        ) : (
          <p className="dark:text-slate-300">
            Send or Recieve images from others...
          </p>
        )}
        <div className="imageContainer flex flex-row p-2 m-4">
          {sourceImg.map((imgSrc) => (
            <div className="indiImage border border-black m-2 bg-white dark:bg-slate-800 rounded-md p-2">
              <img src={imgSrc} height={"300px"} width={"300px"} alt="" />
              <button
                className="bg-emerald-500 hover:bg-emerald-400 text-white font-bold py-2 px-4 rounded-full mt-2"
                onClick={() => {
                  const link = document.createElement("a");
                  link.href = imgSrc;
                  link.setAttribute(
                    "download",
                    `image-${Math.floor(Math.random() * 10000)}.png`
                  );
                  link.click();
                }}
              >
                <FaDownload />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PeerList;
