const API_URL = "http://127.0.0.1:8000";

const studentModal = document.getElementById("studentModal");
const nameField = document.getElementById("name");
const cnicField = document.getElementById("cnic");
const roomNoField = document.getElementById("room_no");
const admissionDateField = document.getElementById("admission_date");
const studentPhoto = document.getElementById("student_photo")
const closeBtn = document.querySelector(".close");

document.addEventListener("DOMContentLoaded", () => {
  fetchStudents();
});

function fetchStudents() {
  fetch(`${API_URL}/studentslist`)
    .then((response) => response.json())
    .then((data) => {
      let students = data.data;

      students.sort((a, b) => a.room_no - b.room_no);
      students = removeDuplicateRooms(students);
      displayStudents(students);
    })
    .catch((error) => {
      console.error("Error fetching students:", error);
    });
}

function removeDuplicateRooms(students) {
  const seenRooms = new Set();
  return students.filter((student) => {
    if (seenRooms.has(student.room_no)) return false;
    seenRooms.add(student.room_no);
    return true;
  });
}

function displayStudents(students) {
  const tableBody = document.getElementById("studentsTableBody");
  tableBody.innerHTML = "";

  students.forEach((student, index) => {
    const row = document.createElement("tr");

    row.innerHTML = `
      <td>${index + 1}</td>
      <td><span class="name-text">${student.name}</span></td>
      <td><span class="room-text">${student.room_no}</span></td>
      <td><span class="date-text">${student.admission_date}</span></td>
      <td><span class="status-text">${student.room_status ? "Paid" : "Not Paid"}</span></td>
      <td>
        <button onclick="openStudentModal('${student.cnic}')">View Details</button>
        <button onclick="editStudent(this, '${student.cnic}')">Edit</button>
        <button onclick="deleteStudent('${student.cnic}', this)">Delete</button>
      </td>
    `;

    tableBody.appendChild(row);
  });
}

function openStudentModal(cnic) {
  fetch(`${API_URL}/studentslist/by-cnic/${cnic}`)
    .then(res => {
      if (!res.ok) throw new Error("Student not found");
      return res.json();
    })
    .then(student => {
      nameField.textContent = student.name;
      cnicField.textContent = student.cnic;
      roomNoField.textContent = student.room_no;
      admissionDateField.textContent = student.admission_date;
      
      studentPhoto.src = `${API_URL}/${student.image}`;

      studentModal.style.display = "block";
    })
    .catch(err => {
      alert(err.message);
      console.error(err);
    });
}

function closeStudentModal() {
  studentModal.style.display = "none";
}

function editStudent(btn, cnic) {
  const row = btn.closest("tr");

  const nameSpan = row.querySelector(".name-text");
  const roomSpan = row.querySelector(".room-text");
  const dateSpan = row.querySelector(".date-text");
  const statusSpan = row.querySelector(".status-text");

  const currentName = nameSpan.textContent;
  const currentRoom = roomSpan.textContent;
  const currentDate = dateSpan.textContent;
  const currentStatus = statusSpan.textContent;

  nameSpan.innerHTML = `<input type="text" value="${currentName}" />`;

  roomSpan.innerHTML = `<input type="number" value="${currentRoom}" min="1" max="35" />`;

  dateSpan.innerHTML = `<input type="date" value="${currentDate}" />`;

  statusSpan.innerHTML = `
    <select>
      <option value="true" ${currentStatus === "Paid" ? "selected" : ""}>Paid</option>
      <option value="false" ${currentStatus === "Not Paid" ? "selected" : ""}>Not Paid</option>
    </select>
  `;


  btn.textContent = "Save";
  btn.onclick = () => saveStudent(row, cnic);
}

function saveStudent(row, cnic) {
  const name = row.querySelector(".name-text input").value;
  const room_no = parseInt(row.querySelector(".room-text input").value);
  const admission_date = row.querySelector(".date-text input").value;
  const room_status = row.querySelector(".status-text select").value === "true";

  fetch(`${API_URL}/update-student/${cnic}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ name, room_no, admission_date, room_status })
  })
    .then(res => res.json())
    .then(result => {
      if (result.success) {
        row.querySelector(".name-text").textContent = name;
        row.querySelector(".room-text").textContent = room_no;
        row.querySelector(".date-text").textContent = admission_date;
        row.querySelector(".status-text").textContent = room_status ? "Paid" : "Not Paid";

        const editBtn = row.querySelector("button:nth-child(2)");
        editBtn.textContent = "Edit";
        editBtn.onclick = () => editStudent(editBtn, cnic);

        alert("Student updated successfully!");
      } else {
        alert(result.message || "Failed to update student");
      }
    })
    .catch(err => {
      console.error(err);
      alert("Server error, try again later");
    });
}


function deleteStudent(cnic, btn) {
  if (!confirm("Are you sure you want to delete this student?")) return;

  fetch(`${API_URL}/delete-student/${cnic}`, {
    method: "DELETE",
  })
    .then((res) => res.json())
    .then((result) => {
      if (result.success) {

        const row = btn.closest("tr");
        row.remove();
        alert("Student deleted successfully!");
      } else {
        alert(result.message || "Failed to delete student");
      }
    })
    .catch((err) => {
      console.error(err);
      alert("Server error, try again later.");
    });
}


window.onclick = function(event) {
  if (event.target === studentModal) {
    studentModal.style.display = "none";
  }
};
