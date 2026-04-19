/* ===========================
   SAFE INIT (attend DOM + Firebase)
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
      if(loginPage) loginPage.style.display = "none";
      if(app) app.style.display = "block";

      const el = document.getElementById("currentUser");
      if(el) el.textContent = user.email;

      initApp();
    }
  });
}

function login(){
  const email = document.getElementById("email")?.value.trim();
  const pass  = document.getElementById("password")?.value.trim();

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
  const el = document.getElementById("dailyActivity");
  if(el){
    const ideas = ["Soirée crêpes 🥞","Randonnée 🌄","Soirée spa 💅","Picnic 🧺"];
    el.textContent = ideas[Math.floor(Math.random()*ideas.length)];
  }

  db.collection("courses").get().then(s=>{
    const el = document.getElementById("summaryCourses");
    if(el) el.textContent = s.size;
  });

  db.collection("notes").get().then(s=>{
    const el = document.getElementById("summaryNotes");
    if(el) el.textContent = s.size;
  });

  const user = auth.currentUser?.email || "coloc";
  const name = user.split("@")[0];

  const g = document.getElementById("greeting");
  if(g) g.textContent = `Bonjour ${name} ✨`;
}

/* ===========================
   LISTES
=========================== */
function addCourse(){ addItem("courseInput","courses"); }
function addNote(){ addItem("noteInput","notes"); }
function addSport(){ addItem("sportInput","sport"); }

function addItem(inputId, collection){
  const input = document.getElementById(inputId);
  if(!input) return;

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
    if(!list) return;

    list.innerHTML = "";

    snap.forEach(doc=>{
      const d = doc.data();

      const li = document.createElement("li");
      li.style.borderLeft = `4px solid ${getUserColor(d.user)}`;

      const span = document.createElement("span");
      span.innerHTML = `<strong>${d.user.split("@")[0]}</strong> : ${d.text}`;

      const btn = document.createElement("button");
      btn.textContent = "❌";
      btn.onclick = () => db.collection(coll).doc(doc.id).delete();

      li.appendChild(span);
      li.appendChild(btn);
      list.appendChild(li);
    });
  });
}

/* ===========================
   PLANTES
=========================== */
const plantes = [
  {name:"Barbara"}, {name:"Calypso"},
  {name:"Aretha"}, {name:"Tina"}, {name:"Adèle"}
];

function renderPlants(){
  const list = document.getElementById("plantList");
  if(!list) return;

  list.innerHTML = "";

  plantes.forEach(p=>{
    const li = document.createElement("li");

    li.innerHTML = `
      <strong>${p.name}</strong>
      <button>💧</button>
    `;

    li.querySelector("button").onclick = ()=>{
      p.lastWatered = Date.now();
      renderPlants();
    };

    list.appendChild(li);
  });
}

/* ===========================
   CALENDRIER
=========================== */
let currentDate=new Date();
function renderCalendar(){
  const cal=document.getElementById("calendar");
  cal.innerHTML="";
  document.getElementById("monthLabel").textContent=
    currentDate.toLocaleString("fr-FR",{month:"long",year:"numeric"});
  const y=currentDate.getFullYear(),m=currentDate.getMonth();
  const days=new Date(y,m+1,0).getDate();
  for(let i=1;i<=days;i++){
    const key=`${y}-${m+1}-${i}`;
    const div=document.createElement("div");
    div.className="card glass";
    div.innerHTML=`<strong>${i}</strong>
      <input placeholder="Nouvel event" onkeydown="submitEvent(event,'${key}')">
      <div id="ev-${key}"></div>`;
    cal.appendChild(div);
    setTimeout(()=>listenEvents(key),0);
  }
}
function submitEvent(e,key){
  if(e.key==="Enter"){
    const val=e.target.value.trim();
    if(!val)return;
    db.collection("calendar").doc(key).collection("events")
      .add({text:val,user:auth.currentUser.email,created:Date.now()});
    e.target.value="";
  }
}
function listenEvents(key){
  const div=document.getElementById("ev-"+key);
  db.collection("calendar").doc(key).collection("events").orderBy("created")
    .onSnapshot(s=>{
      div.innerHTML="";
      s.forEach(doc=>{
        const d=doc.data();
        div.innerHTML+=`<div style="font-size:.8rem;border-left:3px solid ${getUserColor(d.user)};padding-left:4px;">${d.text}</div>`;
      });
    });
}
function nextMonth(){currentDate.setMonth(currentDate.getMonth()+1);renderCalendar();}
function prevMonth(){currentDate.setMonth(currentDate.getMonth()-1);renderCalendar();}
/* ===========================
   ACTIVITES
=========================== */
function initActivities(){
  const btn = document.getElementById("suggestButton");
  const box = document.getElementById("suggestionBox");
  if(!btn || !box) return;

  const ideas = ["Spa 💅","Cinéma 🎬","Yoga 🧘‍♀️"];

  btn.onclick = ()=>{
    box.textContent = ideas[Math.floor(Math.random()*ideas.length)];
  };
}

/* ===========================
   GALERIE
=========================== */
function initGallery(){
  const upload = document.getElementById("photoUpload");
  if(!upload) return;

  upload.addEventListener("change", e=>{
    const file = e.target.files[0];
    if(!file || !auth.currentUser) return;

    const ref = storage.ref("photos/"+Date.now());

    ref.put(file)
      .then(()=> ref.getDownloadURL())
      .then(url=>{
        return db.collection("photos").add({
          url,
          user: auth.currentUser.email,
          created: Date.now()
        });
      });
  });
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
      absent: toggle.checked
    });
  });

  db.collection("status").onSnapshot(snap=>{
    status.innerHTML = "";

    snap.forEach(doc=>{
      const p = document.createElement("p");
      p.textContent = doc.id + (doc.data().absent ? " 🌴" : " 🏡");
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
