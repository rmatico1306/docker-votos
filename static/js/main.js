const boton = document.querySelector("[data-saludo]");
const mensaje = document.querySelector("[data-mensaje]");

if (boton && mensaje) {
    boton.addEventListener("click", () => {
        mensaje.textContent = "El JavaScript tambien esta funcionando.";
    });
}
