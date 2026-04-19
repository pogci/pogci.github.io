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
  }
}

/* ===========================
   THEME
=========================== */
const themeCheckbox = document.getElementById("themeCheckbox");
themeCheckbox.addEventListener("change",()=>{
  const mode = themeCheckbox.checked ? "dark" : "light";
  document.body.setAttribute("data-theme", mode);
  localStorage.setItem("theme", mode);
});
const savedTheme = localStorage.getItem("theme");
if(savedTheme){
  document.body.setAttribute("data-theme", savedTheme);
  themeCheckbox.checked = savedTheme === "dark";
}

/* ===========================
   AUTH
=========================== */
function login(){
  const email = document.getElementById("email").value.trim();
  const pass = document.getElementById("password").value.trim();
  auth.signInWithEmailAndPassword(email, pass)
    .catch(e => alert(e.message));
}

auth.onAuthStateChanged(user=>{
  if(user){
    document.getElementById("loginPage").style.display = "none";
    document.getElementById("app").style.display = "block";
    document.getElementById("currentUser").textContent = user.email;
    initApp();
  }
});

/* ===========================
   INIT
=========================== */
function initApp(){
  renderDashboard();
  renderCalendar();
  renderPlants();
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
  if(email.toLowerCase().includes("elodie")) return "#9b00ff";
  if(email.toLowerCase().includes("cecilia")) return "#00fff7";
  return "#0066ff";
}

/* ===========================
   DASHBOARD
=========================== */
function renderDashboard(){
  const ideas=[
    "Soirée crêpes 🥞","Marathon de séries 🎬","Randonnée 🌄",
    "Atelier DIY déco 🪴","Soirée spa 💅","Cours de danse 💃",
    "Balade au marché 🌽","Picnic au parc 🧺","Soirée jeux vidéo 🎮",
    "Session karaoké 🎤","Cuisine du monde 🍜"
  ];
  const act = ideas[Math.floor(Math.random()*ideas.length)];
  document.getElementById("dailyActivity").textContent = act;

  db.collection("courses").get().then(s=>{
    document.getElementById("summaryCourses").textContent = s.size;
  });
  db.collection("notes").get().then(s=>{
    document.getElementById("summaryNotes").textContent = s.size;
  });

  const user = auth.currentUser?.email || "colocataire";
  const name = user.split("@")[0];
  document.getElementById("greeting").textContent = `Bonjour ${name} ✨`;
}

/* ===========================
   LISTES
=========================== */
function addCourse(){ addItem("courseInput","courses"); }
function addNote(){ addItem("noteInput","notes"); }
function addSport(){ addItem("sportInput","sport"); }

function addItem(inputId, collection){
  const val = document.getElementById(inputId).value.trim();
  if(!val) return;
  db.collection(collection).add({
    text:val, user:auth.currentUser.email, created:Date.now()
  });
  document.getElementById(inputId).value = "";
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
        <button onclick="db.collection('${coll}').doc('${doc.id}').delete()">❌</button>
      `;
      list.appendChild(li);
    });
  });
}

/* ===========================
   PLANTES
=========================== */
const plantes=[
  {name:"Barbara",lastWatered:null},
  {name:"Calypso",lastWatered:null},
  {name:"Aretha",lastWatered:null},
  {name:"Tina",lastWatered:null},
  {name:"Adèle",lastWatered:null},
];
function renderPlants(){
  const list = document.getElementById("plantList");
  list.innerHTML = "";
  plantes.forEach(p=>{
    const li = document.createElement("li");
    li.style.borderLeft = `4px solid #00ff88`;
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
   CALENDRIER
   → Utilise .cal-day (pas .card)
   pour éviter le bug d'opacité
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

  for(let i=1; i<=days; i++){
    const key = `${y}-${m+1}-${i}`;
    const div = document.createElement("div");
    div.className = "cal-day";
    div.innerHTML = `
      <strong>${i}</strong>
      <input placeholder="+ event" onkeydown="submitEvent(event,'${key}')">
      <div id="ev-${key}"></div>
    `;
    cal.appendChild(div);
    setTimeout(()=>listenEvents(key), 0);
  }
}
function submitEvent(e, key){
  if(e.key==="Enter"){
    const val = e.target.value.trim();
    if(!val) return;
    db.collection("calendar").doc(key).collection("events")
      .add({text:val, user:auth.currentUser.email, created:Date.now()});
    e.target.value = "";
  }
}
function listenEvents(key){
  const div = document.getElementById("ev-"+key);
  if(!div) return;
  db.collection("calendar").doc(key).collection("events")
    .orderBy("created")
    .onSnapshot(s=>{
      div.innerHTML = "";
      s.forEach(doc=>{
        const d = doc.data();
        div.innerHTML += `
          <div style="font-size:.75rem;border-left:3px solid ${getUserColor(d.user)};padding-left:4px;margin-top:2px;">
            ${d.text}
          </div>`;
      });
    });
}
function nextMonth(){ currentDate.setMonth(currentDate.getMonth()+1); renderCalendar(); }
function prevMonth(){ currentDate.setMonth(currentDate.getMonth()-1); renderCalendar(); }

/* ===========================
   ACTIVITÉS
=========================== */
function initActivities(){
  const btn = document.getElementById("suggestButton");
  const box = document.getElementById("suggestionBox");
  if(!btn||!box) return;

  const ideas=[
    "Soirée crêpes 🥞","Randonnée 🌄","Atelier DIY fantasy 🎨",
    "Soirée spa maison 💅","Session jeu vidéo coop 🎮",
    "Balade au marché 🌽","Picnic au parc 🧺",
    "Session photo 📸","Cuisine du monde 🍜","Dessin de Lumia 🐈‍⬛",
    "Soirée Karaoké 🎤","Film en plein air 🌙"
  ];

  btn.addEventListener("click",()=>{
    const idea = ideas[Math.floor(Math.random()*ideas.length)];
    box.textContent = idea;
    box.classList.remove("fade");
    void box.offsetWidth;
    box.classList.add("fade");
  });
}

/* ===========================
   GALERIE
=========================== */
function initGallery(){
  const gallery = document.getElementById("galleryGrid");
  const upload = document.getElementById("photoUpload");
  const status = document.getElementById("uploadStatus");
  if(!gallery||!upload) return;

  upload.addEventListener("change", e=>{
    const file = e.target.files[0];
    if(!file||!auth.currentUser) return;

    status.textContent = "⏳ Upload en cours...";

    const filename = `${Date.now()}_${file.name}`;
    const ref = storage.ref(`photos/${auth.currentUser.uid}/${filename}`);

    ref.put(file)
      .then(()=> ref.getDownloadURL())
      .then(url=>{
        return db.collection("photos").add({
          url,
          user: auth.currentUser.email,
          created: Date.now()
        });
      })
      .then(()=>{
        status.textContent = "✅ Photo publiée !";
        setTimeout(()=> status.textContent = "", 3000);
        upload.value = "";
      })
      .catch(err=>{
        console.error(err);
        status.textContent = "❌ Erreur : " + err.message;
      });
  });

  db.collection("photos").orderBy("created","desc").onSnapshot(snap=>{
    gallery.innerHTML = "";
    snap.forEach((doc, i)=>{
      const d = doc.data();
      const div = document.createElement("div");
      div.className = "photo-card";
      const isOwner = auth.currentUser && d.user === auth.currentUser.email;
      div.innerHTML = `
        <div class="photo-wrapper">
          ${isOwner ? `<button class="del-photo" onclick="deletePhoto('${doc.id}','${d.url}')">✕</button>` : ""}
          <img src="${d.url}" alt="photo de ${d.user.split("@")[0]}">
        </div>
        <small>${d.user.split("@")[0]}</small>
      `;
      gallery.appendChild(div);
      setTimeout(()=> div.classList.add("visible"), 80*i);
    });
  });
}

function deletePhoto(id, url){
  if(!confirm("Supprimer cette photo ?")) return;
  db.collection("photos").doc(id).delete();
  storage.refFromURL(url).delete().catch(()=>{});
}

/* ===========================
   ABSENCE
=========================== */
function initAbsence(){
  const toggle = document.getElementById("absentToggle");
  const status = document.getElementById("presenceStatus");
  if(!toggle||!status) return;

  toggle.addEventListener("change",()=>{
    db.collection("status").doc(auth.currentUser.email).set({
      absent: toggle.checked,
      updated: Date.now()
    });
  });

  db.collection("status").onSnapshot(snap=>{
    status.innerHTML = "";
    snap.forEach(doc=>{
      const {absent} = doc.data();
      const p = document.createElement("p");
      p.innerHTML = `
        <strong>${doc.id.split("@")[0]}</strong>
        ${absent ? "🌴 est absente" : "🏡 est à la coloc avec Lumia 🐈‍⬛"}
      `;
      status.appendChild(p);
    });
  });
}

/* ===========================
   AURORA CANVAS
   Blobs très colorés + rayons
   Réactif à la souris
=========================== */
const canvas = document.getElementById("auroraCanvas");
if(canvas){
  const ctx = canvas.getContext("2d");
  let w, h, mouse = {x:0, y:0};

  // Palette vive French Touch
  const palette = [
    {h:280, s:100, l:60},  // violet
    {h:320, s:100, l:55},  // fuchsia
    {h:190, s:100, l:55},  // cyan
    {h:240, s:100, l:60},  // bleu
    {h:20,  s:100, l:55},  // orange
    {h:150, s:100, l:50},  // vert néon
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
      x: Math.random()*w,
      y: Math.random()*h,
      r: Math.random()*220 + 160,
      hue: c.h + (Math.random()*30 - 15),
      sat: c.s,
      lit: c.l,
      alpha: 0.55 + Math.random()*0.2,
      vx: (Math.random()-.5)*0.35,
      vy: (Math.random()-.5)*0.35,
    };
  }
  function createRay(){
    const c = palette[Math.floor(Math.random()*palette.length)];
    return {
      x: Math.random()*w,
      y: Math.random()*h,
      len: Math.random()*(w/3) + w/8,
      angle: Math.random()*Math.PI*2,
      width: Math.random()*3 + 0.5,
      hue: c.h,
      alpha: 0.2 + Math.random()*0.15,
    };
  }

  for(let i=0;i<6;i++) blobs.push(createBlob(i));
  for(let i=0;i<8;i++) rays.push(createRay());

  window.addEventListener("mousemove", e=>{
    mouse.x = e.clientX;
    mouse.y = e.clientY;
  });

  function draw(){
    ctx.clearRect(0,0,w,h);

    // Fond de base légèrement teinté
    const isDark = document.body.getAttribute("data-theme")==="dark";
    ctx.fillStyle = isDark ? "rgba(6,6,17,0.3)" : "rgba(243,244,255,0.25)";
    ctx.fillRect(0,0,w,h);

    // RAYONS
    rays.forEach(r=>{
      r.x += Math.cos(r.angle)*0.4;
      r.y += Math.sin(r.angle)*0.4;
      if(r.x < -r.len || r.x > w+r.len || r.y < -r.len || r.y > h+r.len){
        r.x = Math.random()*w;
        r.y = Math.random()*h;
      }
      const x2 = r.x + Math.cos(r.angle)*r.len;
      const y2 = r.y + Math.sin(r.angle)*r.len;
      const g = ctx.createLinearGradient(r.x,r.y,x2,y2);
      g.addColorStop(0, "transparent");
      g.addColorStop(0.5, `hsla(${r.hue},100%,65%,${r.alpha})`);
      g.add
