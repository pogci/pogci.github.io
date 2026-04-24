/* ===========================
   SAFE INIT
=========================== */
document.addEventListener("DOMContentLoaded", () => {
  initTheme();
  initAuth();
  initUI();
});

/* ===========================
   NAVIGATION
=========================== */
function showPage(id){
  document.querySelectorAll(".page").forEach(p=>{
    p.style.display = "none";
  });

  const target = document.getElementById(id);

  if(target){
    target.style.display = "block";
    window.scrollTo({top:0, behavior:"smooth"});

    // 👇 FIX ACTIVITÉS
    if(id === "activites"){
      initActivities();
    }
  }
}
/* ===========================
   THEME
=========================== */
function initTheme(){
  const checkbox = document.getElementById("themeCheckbox");
  if(!checkbox) return;

  checkbox.addEventListener("change", ()=>{
    const mode = checkbox.checked ? "dark" : "light";
    document.body.setAttribute("data-theme", mode);
    localStorage.setItem("theme", mode);
  });

  const saved = localStorage.getItem("theme");
  if(saved){
    document.body.setAttribute("data-theme", saved);
    checkbox.checked = saved === "dark";
  }
}

/* ===========================
   AUTH
=========================== */
function initAuth(){
  if(typeof auth === "undefined") return;

  auth.onAuthStateChanged(user=>{
    const loginPage = document.getElementById("loginPage");
    const app       = document.getElementById("app");

    if(user){
      loginPage.style.display = "none";
      app.style.display = "block";

      document.getElementById("currentUser").textContent = user.email;

      initApp();
    }
  });
}

function login(){
  const email = document.getElementById("email").value.trim();
  const pass  = document.getElementById("password").value.trim();

  if(!email || !pass){
    alert("Remplis les champs ✨");
    return;
  }

  auth.signInWithEmailAndPassword(email, pass)
    .catch(e => alert(e.message));
}

/* ===========================
   INIT APP
=========================== */
function initApp(){
  renderDashboard();
  renderCalendar();
  renderPlants();
   getWeather();

  listenList("courses","courseList");
  listenList("notes","noteList");
  listenList("sport","sportList");

  initGallery();
  initActivities();
  initAbsence();
}

/* ===========================
   UTILS
=========================== */
function getUserColor(email){
  if(!email) return "#9b00ff";
  email = email.toLowerCase();

  if(email.includes("elodie")) return "#9b00ff";
  if(email.includes("cecilia")) return "#00fff7";

  return "#0066ff";
}

/* ===========================
   METEO REELLE
=========================== */
let currentWeather = null;

function getWeather(){
  const API_KEY = "79cebfc119f0fec53ed65eb74f3c3340";

  // Paris par défaut (tu peux rendre dynamique après)
  const city = "Paris";

  fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&lang=fr&appid=${API_KEY}`)
    .then(res => res.json())
    .then(data => {
      console.log("Météo:", data);

      currentWeather = data.weather[0].main; 
      // ex: Clear, Rain, Clouds

      displayWeather(data);
    })
    .catch(err => console.error(err));
}


/* ===========================
   DASHBOARD
=========================== */
function renderDashboard(){
  const ideas=[
    "Soirée crêpes 🥞","Marathon de séries 🎬","Randonnée 🌄",
    "Atelier DIY déco 🪴","Soirée spa 💅","Cours de danse 💃",
    "Balade au marché 🌽","Picnic 🧺","Jeux vidéo 🎮",
    "Karaoké 🎤","Cuisine du monde 🍜"
  ];

  document.getElementById("dailyActivity").textContent =
    ideas[Math.floor(Math.random()*ideas.length)];

  db.collection("courses").get().then(s=>{
    document.getElementById("summaryCourses").textContent = s.size;
  });

  db.collection("notes").get().then(s=>{
    document.getElementById("summaryNotes").textContent = s.size;
  });

  const name = auth.currentUser.email.split("@")[0];
  document.getElementById("greeting").textContent = `Bonjour ${name} ✨`;
}

function displayWeather(data){
  const box = document.getElementById("weatherBox");
  if(!box) return;

  const temp = Math.round(data.main.temp);
  const desc = data.weather[0].description;

  box.innerHTML = `
    🌦️ ${desc} — ${temp}°C à Paris
  `;
}

/* ===========================
   LISTES (courses / notes / sport)
=========================== */
function addCourse(){ addItem("courseInput","courses"); }
function addNote(){ addItem("noteInput","notes"); }
function addSport(){ addItem("sportInput","sport"); }

function addItem(inputId, collection){
  const input = document.getElementById(inputId);
  const val = input.value.trim();
  if(!val) return;

  db.collection(collection).add({
    text: val,
    user: auth.currentUser.email,
    created: Date.now()
  });

  input.value = "";
}

function listenList(coll, listId){
  db.collection(coll).orderBy("created").onSnapshot(snap=>{
    const list = document.getElementById(listId);
    list.innerHTML = "";

    snap.forEach(doc=>{
      const d = doc.data();

      const li = document.createElement("li");
      li.style.borderLeft = `4px solid ${getUserColor(d.user)}`;

      li.innerHTML = `
        <span><strong>${d.user.split("@")[0]}</strong> : ${d.text}</span>
        <button onclick="deleteItem('${coll}','${doc.id}')">❌</button>
      `;

      list.appendChild(li);
    });
  });
}

function deleteItem(coll,id){
  db.collection(coll).doc(id).delete();
}

/* ===========================
   PLANTES
=========================== */
const plantes = [
  {name:"Barbara", lastWatered:null},
  {name:"Calypso", lastWatered:null},
  {name:"Aretha",  lastWatered:null},
  {name:"Tina",    lastWatered:null},
  {name:"Adèle",   lastWatered:null},
];
function renderPlants(){
  const list = document.getElementById("plantList");
  list.innerHTML = "";
  plantes.forEach(p=>{
    const li = document.createElement("li");
    li.style.borderLeft = "4px solid #00ff88";
    li.innerHTML = `
      <span>
        <strong>${p.name}</strong><br>
        <small>${p.lastWatered
          ? "Arrosée le " + new Date(p.lastWatered).toLocaleDateString("fr-FR")
          : "Jamais arrosée 🌵"}</small>
      </span>
      <button onclick="waterPlant('${p.name}')">💧 Arroser</button>
    `;
    list.appendChild(li);
  });
}
function waterPlant(name){
  const plant = plantes.find(p=>p.name===name);
  plant.lastWatered = Date.now();
  renderPlants();
}

/* ===========================
   CALENDRIER PRO
=========================== */
let currentDate = new Date();

function renderCalendar(){
  const cal = document.getElementById("calendar");
  cal.innerHTML = "";

  document.getElementById("monthLabel").textContent =
    currentDate.toLocaleString("fr-FR",{month:"long",year:"numeric"});

  const y = currentDate.getFullYear();
  const m = currentDate.getMonth();
  const days = new Date(y, m+1, 0).getDate();

  for(let i=1;i<=days;i++){
    const key = `${y}-${m+1}-${i}`;

    const div = document.createElement("div");
    div.className = "cal-day";

    div.innerHTML = `
      <strong>${i}</strong>
      <input placeholder="+ event" onkeydown="submitEvent(event,'${key}')">
      <div id="ev-${key}"></div>
    `;

    cal.appendChild(div);
    setTimeout(()=>listenEvents(key),0);
  }
}

function submitEvent(e,key){
  if(e.key==="Enter"){
    const val = e.target.value.trim();
    if(!val) return;

    db.collection("calendar")
      .doc(key)
      .collection("events")
      .add({
        text:val,
        user:auth.currentUser.email,
        created:Date.now()
      });

    e.target.value="";
  }
}

function listenEvents(key){
  const div = document.getElementById("ev-"+key);
  if(!div) return;

  db.collection("calendar")
    .doc(key)
    .collection("events")
    .orderBy("created")
    .onSnapshot(s=>{
      div.innerHTML = "";

      s.forEach(doc=>{
        const d = doc.data();

        div.innerHTML += `
          <div style="
            font-size:.75rem;
            border-left:3px solid ${getUserColor(d.user)};
            padding-left:4px;
            margin-top:2px;">
            ${d.text}
            <button onclick="deleteEvent('${key}','${doc.id}')">❌</button>
          </div>`;
      });
    });
}

function deleteEvent(key,id){
  db.collection("calendar")
    .doc(key)
    .collection("events")
    .doc(id)
    .delete();
}

function nextMonth(){ currentDate.setMonth(currentDate.getMonth()+1); renderCalendar(); }
function prevMonth(){ currentDate.setMonth(currentDate.getMonth()-1); renderCalendar(); }

/* ===========================
   ACTIVITÉS
=========================== */
let activitiesInitialized = false;

function initActivities(){
  if(activitiesInitialized) return;

  const btn = document.getElementById("suggestButton");
  const box = document.getElementById("suggestionBox");

  if(!btn || !box){
    console.log("Activités non trouvées");
    return;
  }

const ideasByWeather = {
  Clear: [
    "Picnic au parc 🧺",
    "Balade au soleil 🌞",
    "Terrasse entre copines 🍹",
    "Randonnée 🌄",
    "Blind Test Mission"
  ],
  Rain: [
    "Film + plaid 🎬",
    "Spa maison 💅",
    "Cuisine ensemble 🍜",
    "Puzzle",
    "Laser Game",
    "Swiiiiitch",
    "Blind Test Mission"
  ],
  Clouds: [
    "Expo ou musée 🖼️",
    "Brunch cosy ☕",
    "Session yoga 🧘‍♀️",
    "Soirée crêpes 🥞",
    "Blind Test Mission"
  ],
  Snow: [
    "Chocolat chaud ☕",
    "Film cocooning ❄️",
    "Puzzle",
    "Swiiiiitch",
    "Blind Test Mission"
  ]
};

btn.onclick = () => {
  let ideas = ideasByWeather[currentWeather] || [
    "Soirée chill ✨",
    "Jeux 🎮",
    "Karaoké 🎤"
  ];

  const idea = ideas[Math.floor(Math.random()*ideas.length)];
  box.textContent = idea;

  box.classList.remove("fade");
  void box.offsetWidth;
  box.classList.add("fade");
};

  activitiesInitialized = true;
}
/* ===========================
   ABSENCE
=========================== */
function initAbsence(){
  const toggle = document.getElementById("absentToggle");
  const status = document.getElementById("presenceStatus");
  if(!toggle || !status) return;
  toggle.addEventListener("change",()=>{
    db.collection("status").doc(auth.currentUser.email).set({
      absent:  toggle.checked,
      updated: Date.now()
    });
  });
  db.collection("status").onSnapshot(snap=>{
    status.innerHTML = "";
    snap.forEach(doc=>{
      const absent = doc.data().absent;
      const p = document.createElement("p");
      p.innerHTML =
        "<strong>" + doc.id.split("@")[0] + "</strong> " +
        (absent ? "🌴 est absente" : "🏡 est à la coloc avec Lumia 🐈");
      status.appendChild(p);
    });
  });
}

/* ===========================
   UI INIT
=========================== */
function initUI(){
  console.log("UI prête ✨");
}
/* ===========================
   AURORA CANVAS
=========================== */
let canvas;

window.addEventListener("load", () => {
  canvas = document.getElementById("auroraCanvas");

  if(!canvas){
    console.log("Canvas introuvable ❌");
    return;
  }

  startAurora();
});
console.log("canvas =", canvas);if(canvas){
  const ctx = canvas.getContext("2d");
  let w, h, mouse = {x:0, y:0};
  const palette = [
    {h:280, s:100, l:60},
    {h:320, s:100, l:55},
    {h:190, s:100, l:55},
    {h:240, s:100, l:60},
    {h:20,  s:100, l:55},
    {h:150, s:100, l:50},
  ];
  const blobs = [];
  const rays  = [];
  function resize(){
    w = canvas.width  = window.innerWidth;
    h = canvas.height = window.innerHeight;
  }
  window.addEventListener("resize", resize);
  resize();
  function createBlob(idx){
    const c = palette[idx % palette.length];
    return {
      x:     Math.random()*w,
      y:     Math.random()*h,
      r:     Math.random()*220 + 160,
      hue:   c.h + (Math.random()*30 - 15),
      sat:   c.s,
      lit:   c.l,
      alpha: 0.55 + Math.random()*0.2,
      vx:    (Math.random()-.5)*0.35,
      vy:    (Math.random()-.5)*0.35,
    };
  }
  function createRay(){
    const c = palette[Math.floor(Math.random()*palette.length)];
    return {
      x:     Math.random()*w,
      y:     Math.random()*h,
      len:   Math.random()*(w/3) + w/8,
      angle: Math.random()*Math.PI*2,
      width: Math.random()*3 + 0.5,
      hue:   c.h,
      alpha: 0.2 + Math.random()*0.15,
    };
  }
  for(let i=0; i<6; i++) blobs.push(createBlob(i));
  for(let i=0; i<8; i++) rays.push(createRay());
  window.addEventListener("mousemove", e=>{
    mouse.x = e.clientX;
    mouse.y = e.clientY;
  });
  function draw(){
    ctx.clearRect(0,0,w,h);
    const isDark = document.body.getAttribute("data-theme") === "dark";
    ctx.fillStyle = isDark
      ? "rgba(6,6,17,0.3)"
      : "rgba(243,244,255,0.25)";
    ctx.fillRect(0,0,w,h);
    rays.forEach(r=>{
      r.x += Math.cos(r.angle)*0.4;
      r.y += Math.sin(r.angle)*0.4;
      if(r.x < -r.len || r.x > w+r.len || r.y < -r.len || r.y > h+r.len){
        r.x = Math.random()*w;
        r.y = Math.random()*h;
      }
      const x2 = r.x + Math.cos(r.angle)*r.len;
      const y2 = r.y + Math.sin(r.angle)*r.len;
      const g  = ctx.createLinearGradient(r.x,r.y,x2,y2);
      g.addColorStop(0,   "transparent");
      g.addColorStop(0.5, "hsla("+r.hue+",100%,65%,"+r.alpha+")");
      g.addColorStop(1,   "transparent");
      ctx.strokeStyle = g;
      ctx.lineWidth   = r.width;
      ctx.beginPath();
      ctx.moveTo(r.x, r.y);
      ctx.lineTo(x2,  y2);
      ctx.stroke();
    });
    blobs.forEach(b=>{
      const mx = mouse.x || w/2;
      const my = mouse.y || h/2;
      b.x += b.vx + (mx - b.x)*0.00008;
      b.y += b.vy + (my - b.y)*0.00008;
      if(b.x < -b.r) b.x = w+b.r;
      if(b.x > w+b.r) b.x = -b.r;
      if(b.y < -b.r) b.y = h+b.r;
      if(b.y > h+b.r) b.y = -b.r;
      const g = ctx.createRadialGradient(b.x,b.y,0, b.x,b.y,b.r);
      g.addColorStop(0,   "hsla("+b.hue+","+b.sat+"%,"+b.lit+"%,"+b.alpha+")");
      g.addColorStop(0.6, "hsla("+b.hue+","+b.sat+"%,"+b.lit+"%,"+(b.alpha*0.4)+")");
      g.addColorStop(1,   "transparent");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r, 0, Math.PI*2);
      ctx.fill();
    });
    requestAnimationFrame(draw);
  }
  draw();
}
/* ===========================
   PARALLAX
=========================== */
window.addEventListener("scroll",()=>{
  const offset = window.scrollY;
  document.querySelectorAll(".card.floating").forEach(c=>{
    c.style.transform = "translateY(" + (offset*0.02) + "px)";
  });
});
