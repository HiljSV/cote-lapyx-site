// Initialize saved theme on page load
const saved = localStorage.getItem("theme");
if (saved === "light") document.body.classList.add("light-theme");
