// Get the buttons
const buttons = [
  document.getElementById("loginBtn"),
  document.getElementById("signupBtn")
];

let selectedIndex = 0; // Start with first button selected

// Function to update button focus
function updateFocus() {
  buttons.forEach((btn, index) => {
    if (index === selectedIndex) {
      btn.focus();
      btn.style.outline = "3px solid yellow"; // Highlight selected button
    } else {
      btn.style.outline = "none";
    }
  });
}

// Initial focus
window.onload = function() {
  document.body.focus(); // Ensure remote key events are captured
  updateFocus();
};

// Listen for key events (TV remote + keyboard arrows)
document.addEventListener("keydown", function(event) {
  switch(event.keyCode) {
    case 37: // Left arrow
    case 10009: // TV-specific left (optional)
      selectedIndex = (selectedIndex - 1 + buttons.length) % buttons.length;
      updateFocus();
      break;
    case 39: // Right arrow
    case 10010: // TV-specific right (optional)
      selectedIndex = (selectedIndex + 1) % buttons.length;
      updateFocus();
      break;
    case 13: // Enter key
      buttons[selectedIndex].click();
      break;
    case 10004: // Return key on TV remote
      window.history.back();
      break;
  }
});

// Button actions: navigate to pages
buttons[0].addEventListener("click", function() {
  window.location.href = "login.html";
});

buttons[1].addEventListener("click", function() {
  window.location.href = "signup.html";
});
