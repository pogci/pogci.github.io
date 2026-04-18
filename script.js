function showPage(id) {
  document.querySelectorAll(".page").forEach(p => {
    p.style.display = "none";
  });
  document.getElementById(id).style.display = "block";
}

/* =======================
   AUTH
======================= */

function login() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  auth.signInWithEmailAndPassword(email, password)
    .then(user => {
      document.getElementById("loginPage").style.display = "none";
      document.getElementById("app").style.display = "block";
    })
    .catch(err => alert(err.message));
}

auth.onAuthStateChanged(user => {
  if (user) {
    document.getElementById("loginPage").style.display = "none";
    document.getElementById("app").style.display = "block";
    document.getElementById("currentUser").textContent = user.email;
  }
});

/* =======================
   COURSES
======================= */

function addCourse() {
  db.collection("courses").add({
    text: document.getElementById("courseInput").value,
    user: auth.currentUser.email,
    created: Date.now()
  });
}

db.collection("courses").orderBy("created")
.onSnapshot(snap => {
  let list = document.getElementById("courseList");
  list.innerHTML = "";
  snap.forEach(d => {
    let x = d.data();
    list.innerHTML += `<li><strong>${x.user}</strong> : ${x.text}</li>`;
  });
});

/* =======================
   NOTES
======================= */

function addNote() {
  db.collection("notes").add({
    text: document.getElementById("noteInput").value,
    user: auth.currentUser.email,
    created: Date.now()
  });
}

/* =======================
   SPORT
======================= */

function addSport() {
  db.collection("sport").add({
    text: document.getElementById("sportInput").value,
    user: auth.currentUser.email
  });
}

/* =======================
   PLANTES (local simple)
======================= */

const plantes = ["Barbara","Calypso","Aretha","Tina","Adèle"];

function renderPlants() {
  let list = document.getElementById("plantList");
  list.innerHTML = "";

  plantes.forEach(p => {
    let li = document.createElement("li");
    let cb = document.createElement("input");
    cb.type = "checkbox";
    li.appendChild(cb);
    li.append(" " + p);
    list.appendChild(li);
  });
}

renderPlants();

/* =======================
   CALENDRIER COLLABORATIF (BASE)
======================= */

let currentDate = new Date();

function renderCalendar() {
  let cal = document.getElementById("calendar");
  cal.innerHTML = "";

  document.getElementById("monthLabel").textContent =
    currentDate.toLocaleString("fr-FR",{month:"long",year:"numeric"});

  let year = currentDate.getFullYear();
  let month = currentDate.getMonth();
  let days = new Date(year, month+1, 0).getDate();

  for (let i=1;i<=days;i++){
    const key = `${year}-${month+1}-${i}`;

    cal.innerHTML += `
      <div class="day">
        <strong>${i}</strong>
        <input placeholder="event"
          onkeydown="addEvent(event,'${key}')">
        <div id="ev-${key}"></div>
      </div>
    `;

    listenEvents(key);
  }
}

function addEvent(e,key){
  if(e.key==="Enter"){
    db.collection("calendar").doc(key).collection("events").add({
      text:e.target.value,
      user:auth.currentUser.email,
      created:Date.now()
    });
    e.target.value="";
  }
}

function listenEvents(key){
  let container=document.getElementById("ev-"+key);

  db.collection("calendar").doc(key).collection("events")
  .orderBy("created")
  .onSnapshot(snap=>{
    container.innerHTML="";
    snap.forEach(d=>{
      let x=d.data();
      container.innerHTML+=`<div>${x.user}: ${x.text}</div>`;
    });
  });
}

function nextMonth(){
  currentDate.setMonth(currentDate.getMonth()+1);
  renderCalendar();
}

function prevMonth(){
  currentDate.setMonth(currentDate.getMonth()-1);
  renderCalendar();
}

renderCalendar();
