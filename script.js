/* ========= NAVIGATION ========= */
function showPage(id){
  document.querySelectorAll(".page").forEach(p=>p.style.display="none");
  document.getElementById(id).style.display="block";
}

/* ========= THEME ========= */
const themeCheckbox=document.getElementById("themeCheckbox");
themeCheckbox.addEventListener("change",()=>{
  document.body.setAttribute("data-theme",themeCheckbox.checked?"dark":"light");
  localStorage.setItem("theme",themeCheckbox.checked?"dark":"light");
});
const saved=localStorage.getItem("theme");
if(saved){
  document.body.setAttribute("data-theme",saved);
  themeCheckbox.checked=saved==="dark";
}

/* ========= FIREBASE AUTH ========= */
function login(){
  const email=document.getElementById("email").value.trim();
  const pass=document.getElementById("password").value.trim();
  auth.signInWithEmailAndPassword(email,pass)
    .catch(e=>alert(e.message));
}

auth.onAuthStateChanged(user=>{
  if(user){
    document.getElementById("loginPage").style.display="none";
    document.getElementById("app").style.display="block";
    document.getElementById("currentUser").textContent=user.email;
    renderAll();
  }
});

/* ========= FUNCTIONS ========= */
function renderAll(){
  renderDashboard();
  renderCalendar();
  renderPlants();
  listenList("courses","courseList");
  listenList("notes","noteList");
  listenList("sport","sportList");
}

/* ========= DASHBOARD ========= */
const suggestions=[
  "Soirée crêpes 🥞","Marathon de séries 🎬","Randonnée 🌄",
  "Atelier DIY déco 🪴","Soirée spa 💅","Cours de danse 💃",
  "Balade au marché 🌽","Picnic au parc 🧺"
];

function renderDashboard(){
  const act=suggestions[Math.floor(Math.random()*suggestions.length)];
  document.getElementById("dailyActivity").textContent=act;

  db.collection("courses").get().then(s=>{
    document.getElementById("summaryCourses").textContent=s.size;
  });
  db.collection("notes").get().then(s=>{
    document.getElementById("summaryNotes").textContent=s.size;
  });

  const user=auth.currentUser?.email||"colocataire";
  const name=user.split("@")[0];
  document.getElementById("greeting").textContent=`Bonjour ${name} ✨`;
}

/* ========= BASIC LISTS ========= */
function addCourse(){ addItem("courseInput","courses"); }
function addNote(){ addItem("noteInput","notes"); }
function addSport(){ addItem("sportInput","sport"); }

function addItem(inputId,collection){
  const val=document.getElementById(inputId).value.trim();
  if(!val) return;
  db.collection(collection).add({
    text:val,user:auth.currentUser.email,created:Date.now()
  });
  document.getElementById(inputId).value="";
}

function listenList(coll,listId){
  db.collection(coll).orderBy("created").onSnapshot(snap=>{
    const list=document.getElementById(listId);
    list.innerHTML="";
    snap.forEach(doc=>{
      const d=doc.data();
      list.innerHTML+=`
      <li style="border-left:4px solid ${getUserColor(d.user)}">
        <span>${d.user.split("@")[0]} : ${d.text}</span>
        <button onclick="db.collection('${coll}').doc('${doc.id}').delete()">❌</button>
      </li>`;
    });
  });
}
function getUserColor(email){
  if(email.toLowerCase().includes("elodie")) return "#a855f7";
  if(email.toLowerCase().includes("cecilia")) return "#06b6d4";
  return "#4f46e5";
}

/* ========= PLANTES ========= */
const plantes=[
  {name:"Barbara",lastWatered:null},
  {name:"Calypso",lastWatered:null},
  {name:"Aretha",lastWatered:null},
  {name:"Tina",lastWatered:null},
  {name:"Adèle",lastWatered:null},
];
function renderPlants(){
  const list=document.getElementById("plantList");
  if(!list) return;
  list.innerHTML="";
  plantes.forEach(p=>{
    const li=document.createElement("li");
    li.innerHTML=`<strong>${p.name}</strong>
      <span>${p.lastWatered? "Arrosée le "+new Date(p.lastWatered).toLocaleDateString("fr-FR"):"Jamais arrosée"}</span>
      <button onclick="waterPlant('${p.name}')">💧</button>`;
    list.appendChild(li);
  });
}
function waterPlant(name){
  const plant=plantes.find(p=>p.name===name);
  plant.lastWatered=Date.now();
  renderPlants();
}

/* ========= CALENDAR ========= */
let currentDate=new Date();
function renderCalendar(){
  const cal=document.getElementById("calendar");
  if(!cal) return;
  cal.innerHTML="";
  document.getElementById("monthLabel").textContent=currentDate.toLocaleString("fr-FR",{month:"long",year:"numeric"});
  const y=currentDate.getFullYear(),m=currentDate.getMonth();
  const days=new Date(y,m+1,0).getDate();
  for(let i=1;i<=days;i++){
    const key=`${y}-${m+1}-${i}`;
    const day=document.createElement("div");
    day.className="card glass";
    day.innerHTML=`<strong>${i}</strong>
      <input placeholder='Nouvel event' onkeydown="submitEvent(event,'${key}')">
      <div id="ev-${key}"></div>`;
    cal.appendChild(day);
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
        div.innerHTML+=`<div style="font-size:0.8rem;border-left:3px solid ${getUserColor(d.user)};padding-left:4px;">${d.text}</div>`;
      });
    });
}
function nextMonth(){currentDate.setMonth(currentDate.getMonth()+1);renderCalendar();}
function prevMonth(){currentDate.setMonth(currentDate.getMonth()-1);renderCalendar();}
