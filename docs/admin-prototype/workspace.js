const paths = {
  home: '<path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z"/><path d="M9 21v-7h6v7"/>',
  contacts: '<circle cx="9" cy="7" r="3"/><path d="M3 21v-3a6 6 0 0 1 12 0v3M17 4a3 3 0 0 1 0 6m0 4a5 5 0 0 1 4 5v2"/>',
  scheduling: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4m10-4v4M3 10h18m-14 5h3m4 0h3"/>',
  content: '<path d="M5 3h11l3 3v15H5zM15 3v5h4M8 12h8m-8 4h8"/>',
  email: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',
  arrow: '<path d="M5 12h14m-6-6 6 6-6 6"/>',
  alert: '<circle cx="12" cy="12" r="9"/><path d="M12 7v6m0 3h.01"/>',
};
const icon = (key) => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + paths[key] + '</svg>';
const areas = [
  ["home", "Home", ""],
  ["contacts", "Contacts", "Inquiries, relationships and follow-ups"],
  ["scheduling", "Scheduling", "Appointments, calendar and availability"],
  ["content", "Content", "Publications, guides, resources and programs"],
  ["email", "Email Studio", "Audience, composition and branded preview"],
];
const collections = {
  publications: ["Publications", "The Architecture Notebook", "Designing for the long view"],
  guides: ["Guides", "Build the Bridge First", "The Customer Map"],
  resources: ["Resources", "Business Idea Reality Check", "Napkin Principle"],
  programs: ["Programs", "Corporate Transition", "Business Architecture"],
  intelligence: ["Website Intelligence", "Acquisition and conversion reports"],
  questions: ["Pick My Brain", "Reader questions and search activity"],
  assessments: ["Assessments", "Business Idea Reality Check submissions"],
  napkin: ["Napkin submissions", "Worksheet and follow-up history"],
};
const contacts = [
  { id: "maya", name: "Maya Chen", email: "maya@example.invalid", role: "Founder · Northline Studio", events: [
    ["Inquiry", "13 Nov", "Asked about positioning a new advisory offer.", "email"],
    ["Appointment", "16 Nov", "Fit Conversation · 10:00 Bangkok", "scheduling"],
    ["Guide download", "10 Nov", "Build the Bridge First", "content"],
    ["Note", "9 Nov", "Interested in a focused working session.", "contacts"],
  ] },
  { id: "alex", name: "Alex Morgan", email: "alex@example.invalid", role: "Independent advisor", events: [
    ["Guide download", "12 Nov", "The Customer Map", "content"],
    ["Inquiry", "8 Nov", "Exploring a new advisory practice.", "email"],
  ] },
  { id: "jules", name: "Jules Rivera", email: "jules@example.invalid", role: "Founder · Fieldwork", events: [
    ["Appointment", "17 Nov", "Exploration session · 14:00 Bangkok", "scheduling"],
  ] },
];
const followups = new Map([["maya", [{ text: "Send scope outline", due: "2026-11-13", done: false }]]]);
const appointments = [
  ["Fit Conversation", "Maya Chen", "16 Nov · 10:00 ICT", "maya"],
  ["Exploration session", "Jules Rivera", "17 Nov · 14:00 ICT", "jules"],
  ["Architecture review", "Alex Morgan", "19 Nov · 11:30 ICT", "alex"],
];
const draft = { audience: "Guide subscribers", subject: "A better question to start with", message: "Before you build the next thing, ask what has to be true for it to work.\n\nPick one assumption you can test this week. That small step is often worth more than another round of planning.\n\nMartin" };
const workspace = document.querySelector("#workspace");

const tile = (key, name, description, href = key) => '<a class="card" href="#' + href + '"><span class="tile-icon">' + icon(key) + '</span><span class="tile-arrow">' + icon("arrow") + '</span><h3>' + name + '</h3><p>' + description + '</p></a>';
const heading = (title, description) => '<header class="intro"><h1 tabindex="-1">' + title + '</h1><p>' + description + '</p></header>';
const item = (key, title, detail, end = "") => '<div class="row"><span class="tile-icon">' + icon(key) + '</span><div class="row-body"><strong>' + title + '</strong><small>' + detail + '</small></div>' + end + '</div>';
const link = (href, label) => '<a class="row-end" href="#' + href + '">' + label + ' →</a>';

const pulse = [
  ["New leads", 18, 14, "contacts", "contacts"],
  ["Meetings booked", 6, 4, "scheduling", "scheduling"],
  ["New inquiries", 8, 7, "email", "inquiries"],
  ["Guide downloads", 34, 28, "content", "collection/guides"],
  ["Follow-ups due", 1, null, "alert", "contacts/maya"],
];
const activity = [
  ["09:42", "New inquiry", "Maya Chen · Advisory offer", "email", "inquiries/maya"],
  ["08:16", "Meeting booked", "Jules Rivera · Exploration", "scheduling", "scheduling/1"],
  ["Yesterday", "Guide downloaded", "Alex Morgan · The Customer Map", "content", "activity/download"],
  ["Yesterday", "Program application", "Jules Rivera · Corporate Transition", "contacts", "activity/application"],
];
const quick = [
  ["contacts", "Find contact", "contacts/find"],
  ["contacts", "Add contact · demo", "add-contact"],
  ["email", "Compose email", "email"],
  ["scheduling", "View calendar", "calendar"],
  ["content", "Manage content", "content"],
  ["alert", "Review inquiries", "inquiries"],
];

function home() {
  return `<header class="pulse-head"><div><p class="eyebrow">Friday, 13 November 2026</p><h1 tabindex="-1">Business Pulse<span>.</span></h1></div><span class="demo-label">Synthetic data</span></header>
  <div class="pulse-layout">
    <section class="pulse-board" aria-labelledby="pulse-period">
      <div class="pulse-period"><div><p class="eyebrow">7–13 November</p><h2 id="pulse-period">Your week in motion</h2></div><small>vs. 31 Oct–6 Nov</small></div>
      <div class="pulse-metrics">${pulse.map(([label, value, previous, glyph, href]) =>
        `<a class="pulse-metric" href="#${href}">${icon(glyph)}<strong>${value}</strong><span>${label}</span><small>${previous === null ? "As of today" : "+" + (value - previous) + " vs prior week"}</small></a>`).join("")}</div>
      <figure class="pulse-chart">
        <figcaption><strong>Guide downloads</strong><small>Daily count · 7–13 November</small></figcaption>
        <div class="pulse-bars" aria-label="Daily downloads: 3, 4, 4, 6, 5, 7, 5">${[3,4,4,6,5,7,5].map((value,i) =>
          `<div><span class="bar" style="--bar:${value * 9}px" title="${value} downloads"></span><small>${7+i}</small></div>`).join("")}</div>
      </figure>
    </section>
    <section class="pulse-panel pulse-meetings"><p class="eyebrow">Bangkok time</p><h2>Upcoming meetings</h2>
      ${appointments.map(([title, person, date], index) => `<a class="pulse-entry" href="#scheduling/${index}"><span class="tile-icon">${icon("scheduling")}</span><span><strong>${title}</strong><small>${person} · ${date.replace(" ICT", "")}</small></span>${icon("arrow")}</a>`).join("")}
    </section>
    <section class="pulse-panel pulse-feed"><p class="eyebrow">Latest first</p><h2>Activity feed</h2>
      ${activity.map(([time,title,detail,glyph,href]) => `<a class="pulse-entry" href="#${href}"><span class="tile-icon">${icon(glyph)}</span><span><strong>${title}</strong><small>${detail}</small></span><time>${time}</time>${icon("arrow")}</a>`).join("")}
    </section>
    <section class="pulse-panel pulse-attention"><p class="eyebrow">Owner action</p><h2>Needs attention</h2>
      <a class="pulse-entry" href="#contacts/maya"><span class="tile-icon">${icon("contacts")}</span><span><strong>Send scope outline</strong><small>Maya Chen · Follow-up due today</small></span>${icon("arrow")}</a>
      <a class="pulse-entry" href="#scheduling/2"><span class="tile-icon">${icon("alert")}</span><span><strong>Confirmation bounced</strong><small>Alex Morgan · Architecture review</small></span>${icon("arrow")}</a>
    </section>
  </div>
  <section class="pulse-actions"><h2>Quick actions</h2><div>${quick.map(([glyph,label,href]) =>
    `<a href="#${href}">${icon(glyph)}${label}</a>`).join("")}</div></section>
  <section class="pulse-destinations"><h2>Workspace</h2><div class="grid">${areas.slice(1).map(([id,label,desc]) => tile(id,label,desc)).join("")}
    ${tile("home","Website Intelligence","Acquisition and conversion reports","collection/intelligence")}
    ${tile("content","More tools","Assessments, worksheets and reader questions","specialists")}</div></section>`;
}

function specialists() {
  return heading("More tools", "Specialist views") + '<div class="grid">' +
    ["intelligence", "questions", "assessments", "napkin"].map((id) => tile("content", collections[id][0], collections[id][1], "collection/" + id)).join("") + '</div>';
}

function inquiries(id) {
  return heading("Inquiries", "Recent sample inquiries") + '<section class="panel">' +
    contacts.filter((person) => !id || person.id === id).flatMap((person) => person.events.filter(([type]) => type === "Inquiry")
      .map(([, date, text]) => item("email", person.name, date + " · " + text, link("contacts/" + person.id, "Open contact")))).join("") + '</section>';
}

function calendar() {
  return heading("Calendar", "November 2026 · Bangkok time") + '<section class="panel">' +
    appointments.map(([title, person, date], index) => item("scheduling", date, title + " · " + person, link("scheduling/" + index, "Appointment"))).join("") + '</section>';
}

function activityRecord(id) {
  const download = id === "download";
  return heading(download ? "Guide download" : "Program application", "12 November · Sample activity") +
    '<section class="panel">' + (download
      ? item("content", "The Customer Map", "Downloaded by Alex Morgan", link("contacts/alex", "Open contact"))
      : item("contacts", "Corporate Transition", "Submitted by Jules Rivera", link("contacts/jules", "Open contact"))) + '</section>';
}

function addContact() {
  return heading("Add contact", "Prototype only. This contact will clear when you reload.") +
    '<form id="add-contact" class="panel stack"><label class="field">Name<input name="name" required maxlength="80"></label><label class="field">Email<input type="email" name="email" required maxlength="120"></label><button class="button">Add sample contact</button></form>';
}

function meeting(index) {
  const [title, person, date, id] = appointments[index];
  return '<a class="back" href="#scheduling">← Scheduling</a>' + heading(title, person + " · " + date) +
    '<section class="panel">' + item("scheduling", "Appointment details", index === "2" ? "Confirmation bounced · sample record" : "Confirmed · sample record", link("contacts/" + id, "Open contact")) + '</section>';
}

const escapeText = (value) => String(value).replace(/[&<>"']/g, (char) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
})[char]);

function showContacts(id) {
  const active = contacts.find((contact) => contact.id === id) ?? contacts[0];
  return heading("Contacts", "Find people and see the history you share.") +
    '<div class="split"><section class="panel stack"><label class="field">Find a contact<input id="find-contact" type="search" placeholder="Name or email"></label><div class="contact-list">' +
    contacts.map((person) => '<a href="#contacts/' + person.id + '" data-contact="' + person.id + '"' + (active.id === person.id ? ' aria-current="page"' : '') + '><strong>' + escapeText(person.name) + '</strong><br><small>' + person.role + '</small></a>').join("") +
    '<p id="no-contacts" hidden>No matching contacts.</p></div></section>' +
    '<article class="panel stack"><div><h2>' + escapeText(active.name) + '</h2><p class="muted">' + active.role + ' · ' + escapeText(active.email) + '</p></div>' +
    '<h3>Follow-ups</h3><div id="contact-tasks"></div><details><summary>Add follow-up</summary><form id="task-form" class="stack"><label class="field">Description<input name="description" required maxlength="120"></label><label class="field">Due date<input name="due" type="date"></label><button class="button">Add follow-up</button></form></details>' +
    '<h3>Relationship history</h3><div class="timeline">' + active.events.map(([type, date, text, glyph]) => item(glyph, type, text, '<small>' + date + '</small>')).join("") + '</div></article></div>';
}

function schedule() {
  return heading("Scheduling", "Upcoming appointments · Bangkok time") +
    '<div class="split equal"><section class="panel"><h2>Upcoming</h2>' + appointments.map(([title, person, date, id]) =>
      item("scheduling", title, person + " · " + date, link("contacts/" + id, "Contact"))).join("") +
    '</section><section class="panel"><h2>Booking operations</h2>' +
    item("scheduling", "Calendar and video", "Google Calendar and Zoom · example configuration") +
    item("email", "Confirmation bounced", "Alex Morgan · Architecture review", link("contacts/alex", "Open contact")) +
    '</section></div>';
}

function content() {
  return heading("Content", "Manage what visitors read, download and explore.") +
    '<div class="grid">' + ["publications", "guides", "resources", "programs"].map((key) => {
      const [title, ...records] = collections[key];
      return tile("content", title, records.length + " sample records", "collection/" + key);
    }).join("") + '</div>';
}

function collection(key) {
  const [title, ...records] = collections[key];
  return '<a class="back" href="#' + (["publications", "guides", "resources", "programs"].includes(key) ? "content" : "home") + '">← Back</a>' +
    heading(title, "Sample records") + '<section class="panel">' + records.map((record) => item("content", record, "Example record")).join("") + '</section>';
}

function emailStudio() {
  return heading("Email Studio", "Choose an audience, compose a message and preview the branded email.") +
    '<div class="split equal"><section class="panel stack"><h2>Compose</h2><label class="field">Audience<select id="audience"><option>Guide subscribers</option><option>Community subscribers</option></select></label><label class="field">Subject<input id="subject"></label><label class="field">Message<textarea id="message" rows="8"></textarea></label><button type="button" class="button" disabled>Send email</button><small>Sending is disabled in this prototype.</small></section>' +
    '<section class="panel stack"><h2>Preview</h2><p id="preview-audience" class="muted"></p><div class="mail"><header>The Modern Business Architect</header><section><h3 id="preview-subject"></h3><p id="preview-message"></p></section><footer>MBA · Manage email preferences</footer></div></section></div>';
}

function bindContacts(id) {
  const active = contacts.find((contact) => contact.id === id) ?? contacts[0];
  const tasks = followups.get(active.id) ?? [];
  followups.set(active.id, tasks);
  const list = document.querySelector("#contact-tasks");
  function drawTasks() {
    list.replaceChildren();
    if (!tasks.length) list.textContent = "No follow-ups.";
    for (const task of tasks) {
      const label = document.createElement("label");
      label.className = "row";
      const check = document.createElement("input");
      check.type = "checkbox";
      check.checked = task.done;
      check.addEventListener("change", () => { task.done = check.checked; });
      label.append(check, document.createTextNode(task.text + (task.due ? " · " + task.due : "")));
      list.append(label);
    }
  }
  drawTasks();
  document.querySelector("#task-form").addEventListener("submit", (event) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const text = String(data.get("description")).trim();
    if (!text) return;
    tasks.push({ text, due: data.get("due"), done: false });
    event.currentTarget.reset();
    drawTasks();
  });
  document.querySelector("#find-contact").addEventListener("input", (event) => {
    const search = event.target.value.trim().toLowerCase();
    let matches = 0;
    document.querySelectorAll("[data-contact]").forEach((entry) => {
      const person = contacts.find((contact) => contact.id === entry.dataset.contact);
      entry.hidden = !(person.name + " " + person.email).toLowerCase().includes(search);
      if (!entry.hidden) matches++;
    });
    document.querySelector("#no-contacts").hidden = matches > 0;
  });
}

function bindEmail() {
  const fields = ["audience", "subject", "message"];
  function preview() {
    document.querySelector("#preview-audience").textContent = "Audience · " + draft.audience;
    document.querySelector("#preview-subject").textContent = draft.subject || "Subject";
    document.querySelector("#preview-message").textContent = draft.message;
  }
  for (const field of fields) {
    const control = document.querySelector("#" + field);
    control.value = draft[field];
    control.addEventListener("input", () => { draft[field] = control.value; preview(); });
  }
  preview();
}

document.querySelector("#specialists").innerHTML = ["intelligence", "questions", "assessments", "napkin"]
  .map((key) => '<a href="#collection/' + key + '">' + collections[key][0] + '</a>').join("");
function render(moveFocus = false) {
  const [area, id] = location.hash.slice(1).split("/");
  let current = areas.some(([key]) => key === area) ? area : "home";
  if (area === "collection" && Object.hasOwn(collections, id)) current = "collection";
  if (area === "scheduling" && /^[0-2]$/.test(id)) current = "meeting";
  if (["specialists", "inquiries", "add-contact", "calendar"].includes(area)) current = area;
  if (area === "activity" && ["download", "application"].includes(id)) current = "activity";
  document.body.classList.toggle("pulse-home", current === "home");
  const nav = current === "collection" && ["publications", "guides", "resources", "programs"].includes(id) ? "content" : current;
  document.querySelector("#navigation").innerHTML = areas.map(([key, label]) =>
    '<a class="nav-link" href="#' + key + '"' + (nav === key ? ' aria-current="page"' : '') + '>' + icon(key) + '<span>' + label + '</span></a>').join("");
  const pages = { home, contacts: showContacts, scheduling: schedule, content, email: emailStudio, collection, specialists, inquiries, "add-contact": addContact, meeting, calendar, activity: activityRecord };
  workspace.innerHTML = (current === "home" ? "" : '<div class="topline"><span>MBA / ' + (areas.find(([key]) => key === nav)?.[1] ?? "More tools") + '</span><span class="pill">Synthetic data</span></div>') + pages[current](id);
  if (current === "contacts") bindContacts(id);
  if (current === "add-contact") document.querySelector("#add-contact").addEventListener("submit", (event) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const name = String(data.get("name")).trim();
    if (!name) { event.currentTarget.elements.name.focus(); return; }
    const contact = { id: "sample-" + contacts.length, name, email: data.get("email"), role: "Sample contact", events: [] };
    contacts.push(contact);
    location.hash = "contacts/" + contact.id;
  });
  if (current === "email") bindEmail();
  if (moveFocus) {
    window.scrollTo(0, 0);
    const focus = current === "contacts" && id === "find" ? workspace.querySelector("#find-contact") : workspace.querySelector("h1");
    focus.focus({ preventScroll: true });
  }
}
window.addEventListener("hashchange", () => render(true));
render();
