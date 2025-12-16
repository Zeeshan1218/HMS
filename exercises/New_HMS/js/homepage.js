document.addEventListener("DOMContentLoaded", function () {
  document.getElementById("addStudentBtn").addEventListener("click", () => {
    window.location.href = "Add_new_student.html";
  });

  document.getElementById("viewStudentBtn").addEventListener("click", () => {
    window.location.href = "Student_list.html";
  });

  function loadStats() {
    fetch("http://127.0.0.1:8000/stats")
      .then((response) => response.json())
      .then((data) => {
        document.getElementById("totalStudents").innerText =
          data.total_students;
        document.getElementById("availableRooms").innerText =
          data.availableRooms;
        document.getElementById("occupiedRooms").innerText = data.occupiedRooms;
      })
      .catch((error) => console.error("Error fetching stats:", error));
  }

  loadStats();
  setInterval(loadStats, 5000);
});
