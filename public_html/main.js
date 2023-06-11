import { WordCf } from "./WordCf.js";
import { TextCf } from "./TextCf.js";

import { initializeApp } from "https://www.gstatic.com/firebasejs/9.20.0/firebase-app.js";
import { getFirestore, doc, getDoc, getDocs, collection, query, where } from "https://www.gstatic.com/firebasejs/9.20.0/firebase-firestore.js";
import { getStorage, ref, getDownloadURL } from "https://www.gstatic.com/firebasejs/9.20.0/firebase-storage.js";

const firebaseConfig = {
  apiKey: "AIzaSyA6dVE4Ic7AeH1uzeIHgDB_rrgo8EXrYu0",
  authDomain: "diktant5.firebaseapp.com",
  projectId: "diktant5",
  storageBucket: "diktant5.appspot.com",
  messagingSenderId: "702825342319",
  appId: "1:702825342319:web:fbbc869aba354ce2a1349a",
  measurementId: "G-ZP4BM4CFHD"
};

const CHOOSE_DICT = "--------------- Выберите диктант ------------";

function getKeyByValue(object, value) {
  return Object.keys(object).find(key => object[key] === value);
}

async function getCol(col) {
    const snap = await getDocs(col);
    let result = [];
    snap.forEach((doc) => {
        result.push(doc.data());
    });
    return result;
}

async function queryCol(col, queryField, value, returnField) {
    const q = query(col, where(queryField, "==", value));
    const snap = await getDocs(q);
    let result = [];
    snap.forEach((doc) => {
      result.push(doc.data()[returnField]);
    });
    if (result.length === 1) {
        return result[0];
    } else {
        return result;
    }
}

function getGrade(stat) {
    const mistakes = 0.49 * stat.markMiss + 0.49 * stat.markWaste + 
            stat.wordMiss + stat.wordWaste + stat.wordWrong;
    if (mistakes === 0) {
        return "5+";
    } else if (mistakes < 0.5) {
        return "5";
    } else if (mistakes < 1) {
        return "5-";
    } else if (mistakes < 2) {
        return "4+";
    } else if (mistakes < 2.5) {
        return "4";
    } else if (mistakes < 3) {
        return "4-";
    } else if (mistakes < 4) {
        return "3+";
    } else if (mistakes < 4.5) {
        return "3";
    } else if (mistakes < 5) {
        return "3-";
    } else if (mistakes < 6) {
        return "2";
    } else {
        return "1";
    }
}

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);

let glob = {
    db: {},
    html: {},
    dictNames: [],
    dictList: []
};

glob.db.texts = collection(db, "texts");
glob.db.names = collection(db, "names");

glob.html.loader = document.getElementById("loader");
glob.html.mainTab = document.getElementById("mainTab");
glob.html.select = document.getElementById("select");
glob.html.buttonPlay = document.getElementById("buttonPlay");
glob.html.buttonPause = document.getElementById("buttonPause");
glob.html.progressBar = document.getElementById("progressBar");
glob.html.timer = document.getElementById("timer");
glob.html.buttonCheck = document.getElementById("buttonCheck");
glob.html.output = document.getElementById("output");
glob.html.input = document.getElementById("input");
glob.html.statTab = document.getElementById("statTab");
glob.html.wordWrong = document.getElementById("wordWrong");
glob.html.markMiss = document.getElementById("markMiss");
glob.html.markWaste = document.getElementById("markWaste");
glob.html.wordMiss = document.getElementById("wordMiss");
glob.html.wordWaste = document.getElementById("wordWaste");
glob.html.grade = document.getElementById("grade");
glob.html.audio = document.createElement("audio");

glob.dictNames = await getCol(glob.db.names);
glob.html.loader.style.visibility = "hidden";
glob.html.mainTab.style.visibility = "visible";

for (const e of glob.dictNames) {
    glob.dictList.push(e.name);
}
glob.dictList.sort();
glob.dictList.unshift(CHOOSE_DICT);

function getAudio(name) {
    for (const e of glob.dictNames) {
        if (e.name === name) return e.audio;
    }
    return "";
}

function stopAudio() {
    glob.html.audio.pause();
    //glob.html.audio.load();
    glob.html.progressBar.value = 0;
}

for (let name of glob.dictList){
    let opt = document.createElement("option");
    opt.value = name;
    opt.innerHTML = name;
    glob.html.select.appendChild(opt);
}

glob.html.select.addEventListener("change", async function() {
    stopAudio();
    if (glob.html.select.value === CHOOSE_DICT) {
        glob.html.buttonPlay.disabled = true;
        glob.html.buttonCheck.disabled = true;
    } else {
        glob.html.buttonPlay.disabled = false;
        glob.html.buttonCheck.disabled = false;
        const url = await getDownloadURL(ref(storage, getAudio(glob.html.select.value)));
        glob.html.audio.setAttribute("src", url);
        glob.html.audio.currentTime = 0;
    }
    glob.html.buttonPause.disabled = true;
    glob.html.timer.innerHTML = "";
    glob.html.output.innerHTML = "";
    glob.html.output.style.display = "none";
    glob.html.input.value = "";
    glob.html.input.style.display = "block";
    glob.html.buttonCheck.style.display = "block";
    glob.html.statTab.style.display = "none";
});

glob.html.buttonPause.addEventListener("click", async function() {
    glob.html.audio.pause();
    glob.html.buttonPlay.disabled = false;
    glob.html.buttonPause.disabled = true;
});

glob.html.buttonPlay.addEventListener("click", function() {
    glob.html.buttonPlay.disabled = true;
    glob.html.buttonPause.disabled = false;
    glob.html.output.style.display = "none";
    glob.html.statTab.style.display = "none";
    glob.html.input.style.display = "block";
    glob.html.buttonCheck.style.display = "block";
    glob.html.audio.play();
});

glob.html.audio.addEventListener("timeupdate", function() {
   if (!glob.html.audio.paused) {
       glob.html.progressBar.value = 
               Math.ceil((glob.html.audio.currentTime / glob.html.audio.duration) * 100);
        const t = Math.round(glob.html.audio.duration - glob.html.audio.currentTime);        
        glob.html.timer.innerHTML = new Date(t * 1000).toISOString().slice(14, 19);
       if (glob.html.audio.currentTime === glob.html.audio.duration) {
           glob.html.buttonPause.disabled = true;
       }
   }
});

glob.html.audio.addEventListener("loadedmetadata", function() {
    if (glob.html.select.value !== CHOOSE_DICT) {
        const t = Math.round(glob.html.audio.duration);
        glob.html.timer.innerHTML = new Date(t * 1000).toISOString().slice(14, 19);
    }
});

glob.html.buttonCheck.addEventListener("click", async function() {
    stopAudio();
    glob.html.buttonPlay.disabled = true;
    glob.html.buttonPause.disabled = true;
    glob.html.loader.style.visibility = "visible";
    const refText = await queryCol(glob.db.texts, "name", glob.html.select.value, "text");
    const inputText = glob.html.input.value;
    const t = new TextCf(inputText, refText);
    glob.html.output.innerHTML = t.html();
    const stat = t.stat();
    glob.html.wordWrong.innerHTML = stat.wordWrong;
    glob.html.markMiss.innerHTML = stat.markMiss;
    glob.html.markWaste.innerHTML = stat.markWaste;
    glob.html.wordMiss.innerHTML = stat.wordMiss;
    glob.html.wordWaste.innerHTML = stat.wordWaste;
    glob.html.grade.innerHTML = getGrade(stat);
    glob.html.timer.innerHTML = "";
    glob.html.loader.style.visibility = "hidden";
    glob.html.buttonCheck.style.display = "none";
    glob.html.input.style.display = "none";
    glob.html.input.value = "";
    glob.html.output.style.display = "block";
    glob.html.statTab.style.display = "table";
    glob.html.buttonPlay.disabled = false;
});

