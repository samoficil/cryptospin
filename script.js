// Simple "base de datos" temporal en localStorage
const USERS_KEY = "cryptospin_users";

function getUsers() {
  return JSON.parse(localStorage.getItem(USERS_KEY)) || [];
}

function saveUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

// Registro
const registerForm = document.getElementById("registerForm");
if (registerForm) {
  registerForm.addEventListener("submit", e => {
    e.preventDefault();
    const username = registerForm.newUsername.value.trim();
    const email = registerForm.newEmail.value.trim();
    const password = registerForm.newPassword.value.trim();

    if (!username || !email || !password) {
      alert("Completa todos los campos");
      return;
    }

    let users = getUsers();

    if (users.find(u => u.username.toLowerCase() === username.toLowerCase())) {
      alert("El usuario ya existe");
      return;
    }

    if (users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
      alert("El correo ya está registrado");
      return;
    }

    users.push({ username, email, password });
    saveUsers(users);

    alert("Registro exitoso. Por favor inicia sesión.");
    window.location.href = "login.html";
  });
}

// Login
const loginForm = document.getElementById("loginForm");
if (loginForm) {
  loginForm.addEventListener("submit", e => {
    e.preventDefault();
    const username = loginForm.username.value.trim();
    const password = loginForm.password.value.trim();

    const users = getUsers();
    const user = users.find(u => u.username.toLowerCase() === username.toLowerCase());

    if (!user) {
      alert("Usuario no encontrado");
      return;
    }

    if (user.password !== password) {
      alert("Contraseña incorrecta");
      return;
    }

    alert("Inicio de sesión exitoso");
    // Aquí podrías redirigir a la app principal o dashboard
    window.location.href = "index.html"; 
  });

  // Recuperar contraseña link
  const forgotLink = document.getElementById("forgotPasswordLink");
  forgotLink?.addEventListener("click", e => {
    e.preventDefault();
    const emailPrompt = prompt("Por favor ingresa tu correo para recuperar la contraseña:");
    if (!emailPrompt) return;

    const users = getUsers();
    const user = users.find(u => u.email.toLowerCase() === emailPrompt.toLowerCase());

    if (!user) {
      alert("Correo no encontrado");
      return;
    }

    // Simulación envío correo
    alert(`Se ha enviado un enlace para restablecer la contraseña a: ${emailPrompt}\n(En este demo se muestra la contraseña directamente)`);
    alert(`Tu contraseña es: ${user.password}\nPor seguridad, en una app real se enviaría un enlace para cambiar la contraseña.`);

    // Aquí podrías implementar formulario para cambiar contraseña, en este demo solo se muestra
  });
}
