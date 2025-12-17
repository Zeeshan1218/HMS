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
      <td>${student.name}</td>
      <td>${student.room_no}</td>
      <td>${student.admission_date}</td>
      <td>${student.room_status ? "Paid" : "Not Paid"}</td>
      <td>
        <button onclick="openStudentModal('${student.cnic}')">View Details</button>
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
