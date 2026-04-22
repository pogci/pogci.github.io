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
  document.querySelectorAll(".page").forEach(p=>p.style.display="none");
  const target = document.getElementById(id);
  if(target){
    target.style.display = "block";
    window.scrollTo({top:0, behavior:"smooth"});
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
const plantes=[
  {name:"Barbara"},{name:"Calypso"},
  {name:"Aretha"},{name:"Tina"},{name:"Adèle"}
];

function renderPlants(){
  const list = document.getElementById("plantList");
  list.innerHTML = "";

  plantes.forEach(p=>{
    const li = document.createElement("li");

    li.innerHTML = `
      <strong>${p.name}</strong>
      <button onclick="waterPlant('${p.name}')">💧</button>
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
function initActivities(){
  const btn = document.getElementById("suggestButton");
  const box = document.getElementById("suggestionBox");
  if(!btn||!box) return;

  const ideas=["Spa 💅","Randonnée 🌄","Cinéma 🎬","Picnic 🧺"];

  btn.onclick = ()=>{
    box.textContent = ideas[Math.floor(Math.random()*ideas.length)];
  };
}

/* ===========================
   ABSENCE
=========================== */
function initAbsence(){
  const toggle = document.getElementById("absentToggle");
  const status = document.getElementById("presenceStatus");
  if(!toggle||!status) return;

  toggle.onchange = ()=>{
    db.collection("status").doc(auth.currentUser.email).set({
      absent: toggle.checked
    });
  };

  db.collection("status").onSnapshot(snap=>{
    status.innerHTML="";
    snap.forEach(doc=>{
      const d = doc.data();
      status.innerHTML += `
        <p>${doc.id.split("@")[0]} ${d.absent?"🌴":"🏡"}</p>`;
    });
  });
}

/* ===========================
   UI INIT
=========================== */
function initUI(){
  console.log("UI prête ✨");
}
