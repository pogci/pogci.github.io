/* =======================
   NAVIGATION
======================= */
function showPage(id) {
  document.querySelectorAll(".page").forEach(p => p.style.display = "none");
  document.getElementById(id).style.display = "block";
}

/* =======================
   THEME SWITCH
======================= */
const themeCheckbox = document.getElementById("themeCheckbox");
themeCheckbox.addEventListener("change", () => {
  document.body.setAttribute("data-theme", themeCheckbox.checked ? "dark" : "light");
  localStorage.setItem("theme", themeCheckbox.checked ? "dark" : "light");
});
const savedTheme = localStorage.getItem("theme");
if (savedTheme) {
  document.body.setAttribute("data-theme", savedTheme);
  themeCheckbox.checked = savedTheme === "dark";
}

/* =======================
   AUTH
======================= */
function login() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  auth.signInWithEmailAndPassword(email, password).catch(err => alert(err.message));
}

auth.onAuthStateChanged(user => {
  if (user) {
    document.getElementById("loginPage").style.display = "none";
    document.getElementById("app").style.display = "block";
    document.getElementById("currentUser").textContent = user.email;
    renderCalendar();
    renderPlants();
    Notification.requestPermission();
  }
});

/* =======================
   UTILS: COULEUR + AVATAR
======================= */
function getUserColor(email) {
  if (!email) return "#7c3aed";
  return email.toLowerCase().includes("elodie") ? "#9b5de5" :
         email.toLowerCase().includes("cecilia") ? "#2a9d8f" : "#7c3aed";
}

function getUserAvatar(email) {
  const name = email.includes("elodie") ? "E" : email.includes("cecilia") ? "C" : "?";
  const cls = email.includes("elodie") ? "elodie" : email.includes("cecilia") ? "cecilia" : "";
  return `<div class="avatar ${cls}">${name}</div>`;
}

/* =======================
   BASIC LIST (courses, notes, sport)
======================= */
function createItemHTML(id, user, text, collection) {
  return `
    <li>
      ${getUserAvatar(user)}
      <span><strong>${user.split("@")[0]}</strong> : ${text}</span>
      <button onclick="db.collection('${collection}').doc('${id}').delete()">❌</button>
    </li>`;
}

function addItem(inputId, collection) {
  const text = document.getElementById(inputId).value.trim();
  if (!text) return;
  db.collection(collection).add({ text, user: auth.currentUser.email, created: Date.now() });
  document.getElementById(inputId).value = "";
}

function listenList(collection, listId) {
  db.collection(collection).orderBy("created").onSnapshot(snap => {
    const list = document.getElementById(listId);
    list.innerHTML = "";
    snap.forEach(doc => {
      const d = doc.data();
      list.innerHTML += createItemHTML(doc.id, d.user, d.text, collection);
    });
  });
}

function addCourse() { addItem("courseInput", "courses"); }
function addNote() { addItem("noteInput", "notes"); }
function addSport() { addItem("sportInput", "sport"); }

listenList("courses", "courseList");
listenList("notes", "noteList");
listenList("sport", "sportList");

/* =======================
   PLANTES
======================= */
const plantes = [
  { name: "Barbara", lastWatered: null },
  { name: "Calypso", lastWatered: null },
  { name: "Aretha", lastWatered: null },
  { name: "Tina", lastWatered: null },
  { name: "Adèle", lastWatered: null },
];

function renderPlants() {
  const list = document.getElementById("plantList");
  list.innerHTML = "";
  plantes.forEach(p => {
    const li = document.createElement("li");
    li.innerHTML = `
      <strong>${p.name}</strong>
      <small>${p.lastWatered ? "Arrosée le " + new Date(p.lastWatered).toLocaleDateString("fr-FR") : "Jamais arrosée"} 💧</small>
      <button onclick="waterPlant('${p.name}')">Arroser</button>`;
    list.appendChild(li);
  });
}

function waterPlant(name) {
  const plant = plantes.find(p => p.name === name);
  plant.lastWatered = Date.now();
  renderPlants();
  new Notification(`🌿 ${name} a été arrosée !`);
}

setInterval(() => {
  plantes.forEach(p => {
    if (!p.lastWatered) return;
    const days = (Date.now() - p.lastWatered) / (1000 * 60 * 60 * 24);
    if (days > 3) new Notification(`💦 Pense à arroser ${p.name}`);
  });
}, 1000 * 60 * 60 * 24);

/* =======================
   ACTIVITÉS
======================= */
const suggestions = [
  "Soirée crêpes 🥞","Marathon de séries 🎬","Randonnée 🌄",
  "Atelier DIY déco 🪴","Soirée spa 💅","Cours de danse 💃",
  "Balade au marché 🌽","Picnic au parc 🧺"
];
document.getElementById("suggestButton").onclick = () => {
  const s = suggestions[Math.floor(Math.random() * suggestions.length)];
  const box = document.getElementById("suggestionBox");
  box.textContent = s;
  box.classList.add("fade");
  setTimeout(()=> box.classList.remove("fade"), 400);
};

/* =======================
   GALERIE
======================= */
const gallery = document.getElementById("galleryGrid");
document.getElementById("photoUpload").addEventListener("change", e=>{
  const file = e.target.files[0];
  if (!file) return;
  const ref = storage.ref("photos/" + Date.now() + "_" + file.name);
  ref.put(file).then(()=>{
    ref.getDownloadURL().then(url=>{
      db.collection("photos").add({ url, user: auth.currentUser.email, created: Date.now() });
    });
  });
});
db.collection("photos").orderBy("created","desc").onSnapshot(snap=>{
  gallery.innerHTML = "";
  snap.forEach(doc=>{
    const {url,user} = doc.data();
    const div = document.createElement("div");
    div.innerHTML = `<img src="${url}" alt=""><small>${user}</small>`;
    gallery.appendChild(div);
  });
});

/* =======================
   MODE ABSENCE
======================= */
const absentToggle = document.getElementById("absentToggle");
const presenceStatus = document.getElementById("presenceStatus");
absentToggle.addEventListener("change", () => {
  db.collection("status").doc(auth.currentUser.email).set({
    absent: absentToggle.checked, updated: Date.now()
  });
});
db.collection("status").onSnapshot(snap=>{
  presenceStatus.innerHTML="";
  snap.forEach(doc=>{
    const {absent} = doc.data();
    presenceStatus.innerHTML += `
      <p>${getUserAvatar(doc.id)} est ${absent ? "🌴 absente" : "🏡 à la coloc avec Lumia 🐈‍⬛"}</p>`;
  });
});

/* =======================
   CALENDRIER
======================= */
let currentDate = new Date();

function renderCalendar() {
  const cal = document.getElementById("calendar");
  if (!cal) return;
  cal.innerHTML="";
  document.getElementById("monthLabel").textContent =
    currentDate.toLocaleString("fr-FR",{month:"long",year:"numeric"});

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const days = new Date(year,month+1,0).getDate();

  for (let i=1;i<=days;i++){
    const key = `${year}-${month+1}-${i}`;
    const d = document.createElement("div");
    d.className="day";
    d.innerHTML=`
      <div class="day-header">
        <strong>${i}</strong>
        <button onclick="openInput('${key}')">＋</button>
      </div>
      <div id="input-${key}" style="display:none;">
        <input placeholder="Nouvel event" onkeydown="submitEvent(event,'${key}')">
      </div>
      <div id="ev-${key}" class="events"></div>`;
    cal.appendChild(d);
    setTimeout(()=>listenEvents(key),0);
  }
}

function openInput(key){
  const div=document.getElementById("input-"+key);
  div.style.display=div.style.display==="none"?"block":"none";
}
function submitEvent(e,key){
  if(e.key==="Enter"){
    const text=e.target.value; if(!text)return;
    db.collection("calendar").doc(key).collection("events").add({
      text,user:auth.currentUser.email,created:Date.now()
    });
    e.target.value=""; document.getElementById("input-"+key).style.display="none";
  }
}
function listenEvents(key){
  const c=document.getElementById("ev-"+key);
  if(!c)return;
  db.collection("calendar").doc(key).collection("events").orderBy("created")
  .onSnapshot(s=>{
    c.innerHTML="";
    s.forEach(doc=>{
      const d=doc.data();
      c.innerHTML+=`
        <div class="event" style="border-left:4px solid ${getUserColor(d.user)}">
          ${getUserAvatar(d.user)}
          <div>${d.text}<br><small>${d.user}</small></div>
          <button onclick="deleteEvent('${key}','${doc.id}')">❌</button>
        </div>`;
    });
  });
}
function deleteEvent(key,id){
  db.collection("calendar").doc(key).collection("events").doc(id).delete();
}
function nextMonth(){currentDate.setMonth(currentDate.getMonth()+1);renderCalendar();}
function prevMonth(){currentDate.setMonth(currentDate.getMonth()-1);renderCalendar();}
