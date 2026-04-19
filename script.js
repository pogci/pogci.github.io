
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
      <li>
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
      <li>
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
      <li>
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
   CALENDRIER COLLABORATIF
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
    const text = e.target.value;
    if (!text) return;

    db.collection("calendar").doc(key).collection("events").add({
      text,
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
    snap.forEach(doc=>{
      let d=doc.data();

      container.innerHTML += `
        <div>
          <small>${d.user}</small><br>
          ${d.text}
          <button onclick="deleteEvent('${key}','${doc.id}')">❌</button>
        </div>
      `;
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

function nextMonth(){
  currentDate.setMonth(currentDate.getMonth()+1);
  renderCalendar();
}

function prevMonth(){
  currentDate.setMonth(currentDate.getMonth()-1);
  renderCalendar();
}

renderCalendar();
