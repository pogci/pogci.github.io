
/* =======================
   NAVIGATION
======================= */

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
   UTILS
======================= */

function getUserColor(email) {
  if (!email) return "black";

  if (email.toLowerCase().includes("elodie")) {
    return "#9b5de5"; // violet
  }

  if (email.toLowerCase().includes("cecilia")) {
    return "#2a9d8f"; // vert
  }

  return "#333";
}

/* =======================
   COURSES
======================= */

function addCourse() {
  const text = document.getElementById("courseInput").value;
  if (!text) return;

  db.collection("courses").add({
    text,
    user: auth.currentUser.email,
    created: Date.now()
  });

  document.getElementById("courseInput").value = "";
}

db.collection("courses").orderBy("created")
.onSnapshot(snapshot => {
  let list = document.getElementById("courseList");
  list.innerHTML = "";

  snapshot.forEach(doc => {
    let d = doc.data();

    list.innerHTML += `
      <li style="color:${getUserColor(d.user)}">
        <strong>${d.user}</strong> : ${d.text}
        <button onclick="deleteCourse('${doc.id}')">❌</button>
      </li>
    `;
  });
});

function deleteCourse(id) {
  db.collection("courses").doc(id).delete();
}

/* =======================
   NOTES
======================= */

function addNote() {
  const text = document.getElementById("noteInput").value;
  if (!text) return;

  db.collection("notes").add({
    text,
    user: auth.currentUser.email,
    created: Date.now()
  });

  document.getElementById("noteInput").value = "";
}

db.collection("notes").orderBy("created")
.onSnapshot(snapshot => {
  let list = document.getElementById("noteList");
  list.innerHTML = "";

  snapshot.forEach(doc => {
    let d = doc.data();

    list.innerHTML += `
      <li style="color:${getUserColor(d.user)}">
        <strong>${d.user}</strong> : ${d.text}
        <button onclick="deleteNote('${doc.id}')">❌</button>
      </li>
    `;
  });
});

function deleteNote(id) {
  db.collection("notes").doc(id).delete();
}

/* =======================
   SPORT
======================= */

function addSport() {
  const text = document.getElementById("sportInput").value;
  if (!text) return;

  db.collection("sport").add({
    text,
    user: auth.currentUser.email,
    created: Date.now()
  });

  document.getElementById("sportInput").value = "";
}

db.collection("sport").orderBy("created")
.onSnapshot(snapshot => {
  let list = document.getElementById("sportList");
  list.innerHTML = "";

  snapshot.forEach(doc => {
    let d = doc.data();

    list.innerHTML += `
      <li style="color:${getUserColor(d.user)}">
        <strong>${d.user}</strong> : ${d.text}
        <button onclick="deleteSport('${doc.id}')">❌</button>
      </li>
    `;
  });
});

function deleteSport(id) {
  db.collection("sport").doc(id).delete();
}

/* =======================
   PLANTES (simple)
======================= */

const plantes = ["Barbara","Calypso","Aretha","Tina","Adèle"];

function renderPlants() {
  let list = document.getElementById("plantList");
  list.innerHTML = "";

  plantes.forEach(name => {
    let li = document.createElement("li");

    let cb = document.createElement("input");
    cb.type = "checkbox";

    li.appendChild(cb);
    li.append(" " + name);

    list.appendChild(li);
  });
}

renderPlants();

/* =======================
   CALENDRIER PRO
======================= */

let currentDate = new Date();

function renderCalendar() {
  const cal = document.getElementById("calendar");
  cal.innerHTML = "";

  document.getElementById("monthLabel").textContent =
    currentDate.toLocaleString("fr-FR",{month:"long",year:"numeric"});

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const days = new Date(year, month+1, 0).getDate();

  for (let i=1;i<=days;i++){
    const key = `${year}-${month+1}-${i}`;

    const day = document.createElement("div");
    day.className = "day";

    day.innerHTML = `
      <div class="day-header">
        <strong>${i}</strong>
        <button onclick="openInput('${key}')">＋</button>
      </div>

      <div id="input-${key}" style="display:none;">
        <input placeholder="Nouvel event"
          onkeydown="submitEvent(event,'${key}')">
      </div>

      <div id="ev-${key}" class="events"></div>
    `;

    cal.appendChild(day);

    setTimeout(() => listenEvents(key), 0);
  }
}

/* =======================
   ADD EVENT
======================= */

function openInput(key){
  const div = document.getElementById("input-"+key);
  div.style.display = div.style.display === "none" ? "block" : "none";
}

function submitEvent(e,key){
  if(e.key==="Enter"){
    const text = e.target.value;
    if(!text) return;

    db.collection("calendar")
      .doc(key)
      .collection("events")
      .add({
        text,
        user: auth.currentUser.email,
        created: Date.now()
      });

    e.target.value="";
    document.getElementById("input-"+key).style.display="none";
  }
}

/* =======================
   READ EVENTS
======================= */

function listenEvents(key){
  const container = document.getElementById("ev-"+key);
  if(!container) return;

  db.collection("calendar")
    .doc(key)
    .collection("events")
    .orderBy("created")
    .onSnapshot(snap=>{
      container.innerHTML="";

      snap.forEach(doc=>{
        const d = doc.data();

        const event = document.createElement("div");
        event.className = "event";

        event.style.borderLeft = `4px solid ${getUserColor(d.user)}`;

        event.innerHTML = `
          <div onclick="editEvent('${key}','${doc.id}','${d.text}')">
            <strong>${d.text}</strong><br>
            <small>${d.user}</small>
          </div>
          <button onclick="deleteEvent('${key}','${doc.id}')">❌</button>
        `;

        container.appendChild(event);
      });
    });
}

/* =======================
   EDIT EVENT
======================= */

function editEvent(key,id,oldText){
  const newText = prompt("Modifier l'événement :", oldText);

  if(newText === null) return;
  if(newText === "") return;

  db.collection("calendar")
    .doc(key)
    .collection("events")
    .doc(id)
    .update({
      text: newText
    });
}

/* =======================
   DELETE
======================= */

function deleteEvent(key,id){
  db.collection("calendar")
    .doc(key)
    .collection("events")
    .doc(id)
    .delete();
}

/* =======================
   NAVIGATION
======================= */

function nextMonth(){
  currentDate.setMonth(currentDate.getMonth()+1);
  renderCalendar();
}

function prevMonth(){
  currentDate.setMonth(currentDate.getMonth()-1);
  renderCalendar();
}

renderCalendar();
