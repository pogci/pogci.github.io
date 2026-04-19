/* ===========================
   NAVIGATION & THEME
=========================== */
function showPage(id){
  document.querySelectorAll(".page").forEach(p=>p.style.display="none");
  const target = document.getElementById(id);
  if(target){
    target.style.display="block";
    window.scrollTo({top:0,behavior:"smooth"});
  }
}

const themeCheckbox=document.getElementById("themeCheckbox");
themeCheckbox.addEventListener("change",()=>{
  const mode=themeCheckbox.checked?"dark":"light";
  document.body.setAttribute("data-theme",mode);
  localStorage.setItem("theme",mode);
});
const savedTheme=localStorage.getItem("theme");
if(savedTheme){
  document.body.setAttribute("data-theme",savedTheme);
  themeCheckbox.checked=savedTheme==="dark";
}

/* ===========================
   FIREBASE AUTH
=========================== */
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
    initApp();
  }
});

/* ===========================
   INITIALISATION
=========================== */
function initApp(){
  renderDashboard();
  renderCalendar();
  renderPlants();
  listenList("courses","courseList");
  listenList("notes","noteList");
  listenList("sport","sportList");
}

/* ===========================
   DASHBOARD
=========================== */
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

/* ===========================
   LISTES COURSES/NOTES/SPORT
=========================== */
function addCourse(){addItem("courseInput","courses");}
function addNote(){addItem("noteInput","notes");}
function addSport(){addItem("sportInput","sport");}

function addItem(inputId,collection){
  const val=document.getElementById(inputId).value.trim();
  if(!val)return;
  db.collection(collection).add({text:val,user:auth.currentUser.email,created:Date.now()});
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
  const list=document.getElementById("plantList");
  list.innerHTML="";
  plantes.forEach(p=>{
    const li=document.createElement("li");
    li.innerHTML=`<strong>${p.name}</strong>
    <span>${p.lastWatered?"Arrosée le "+new Date(p.lastWatered).toLocaleDateString("fr-FR"):"Jamais arrosée"}</span>
    <button onclick="waterPlant('${p.name}')">💧</button>`;
    list.appendChild(li);
  });
}
function waterPlant(name){
  const plant=plantes.find(p=>p.name===name);
  plant.lastWatered=Date.now();
  renderPlants();
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
   AURORA CANVAS - BLOBS + RAYS
=========================== */
const canvas=document.getElementById("auroraCanvas");
const ctx=canvas.getContext("2d");
let w,h,blobs=[],rays=[],mouse={x:0,y:0};

function resize(){
  w=canvas.width=window.innerWidth;
  h=canvas.height=window.innerHeight;
}
window.addEventListener("resize",resize);
resize();

function createBlob(){
  return {
    x:Math.random()*w,
    y:Math.random()*h,
    r:Math.random()*200+150,
    color:`hsla(${Math.random()*360},80%,60%,0.4)`,
    vx:(Math.random()-.5)*0.2,
    vy:(Math.random()-.5)*0.2
  };
}
function createRay(){
  return {
    x:Math.random()*w,
    y:Math.random()*h,
    len:Math.random()*w/4+w/8,
    a:Math.random()*Math.PI*2,
    width:Math.random()*2+0.5,
    color:`hsla(${Math.random()*360},100%,70%,0.15)`
  };
}
for(let i=0;i<4;i++) blobs.push(createBlob());
for(let i=0;i<6;i++) rays.push(createRay());

window.addEventListener("mousemove",e=>{
  mouse.x=e.clientX;
  mouse.y=e.clientY;
});

function drawAurora(){
  ctx.clearRect(0,0,w,h);

  // RAYS
  rays.forEach(r=>{
    r.x+=Math.cos(r.a)*0.3;
    r.y+=Math.sin(r.a)*0.3;
    if(r.x<-r.len||r.y<-r.len||r.x>w+r.len||r.y>h+r.len){r.x=Math.random()*w;r.y=Math.random()*h;}
    const grad=ctx.createLinearGradient(r.x,r.y,r.x+Math.cos(r.a)*r.len,r.y+Math.sin(r.a)*r.len);
    grad.addColorStop(0,'transparent');
    grad.addColorStop(0.5,r.color);
    grad.addColorStop(1,'transparent');
    ctx.strokeStyle=grad;
    ctx.lineWidth=r.width;
    ctx.beginPath();
    ctx.moveTo(r.x,r.y);
    ctx.lineTo(r.x+Math.cos(r.a)*r.len,r.y+Math.sin(r.a)*r.len);
    ctx.stroke();
  });

  // BLOBS
  blobs.forEach(b=>{
    const dx=(mouse.x||w/2)-b.x;
    const dy=(mouse.y||h/2)-b.y;
    b.x+=b.vx+dx*0.00005;
    b.y+=b.vy+dy*0.00005;
    const grad=ctx.createRadialGradient(b.x,b.y,0,b.x,b.y,b.r);
    grad.addColorStop(0,b.color);
    grad.addColorStop(1,'transparent');
    ctx.fillStyle=grad;
    ctx.beginPath();
    ctx.arc(b.x,b.y,b.r,0,Math.PI*2);
    ctx.fill();
    if(b.x< -b.r) b.x=w+b.r;
    if(b.x>w+b.r) b.x=-b.r;
    if(b.y< -b.r) b.y=h+b.r;
    if(b.y>h+b.r) b.y=-b.r;
  });

  requestAnimationFrame(drawAurora);
}
drawAurora();

/* ===========================
   PARALLAX
=========================== */
window.addEventListener('scroll',()=>{
  const offset=window.scrollY;
  document.querySelectorAll('.page').forEach(p=>{
    p.style.transform=`translateY(${offset*0.05}px)`;
  });
});
