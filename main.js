import { TemplateEngine } from "./utils/TemplateEngenie.js";

document.addEventListener("DOMContentLoaded", async () => {
    await cargarComponentes();
    const templateengine = new TemplateEngine();
    await templateengine.AsyncProcesarRutesNavigation();
    globalThis.Report = new ReportManager();
    document.dispatchEvent(new CustomEvent("ensamblar:ready"));
    new Sesion();

    
});

async function cargarComponentes() {
    const tags = document.getElementsByTagName("ensamblar");
    for (let tag of Array.from(tags)) await procesarComponente(tag);
}

async function procesarComponente(tag) {
    const src = tag.getAttribute("src");
    if (!src) return;
    try {
        const resp = await fetch(src);
        let html = await resp.text();
        const mikenDatos = tag.getAttribute("miken_datos");
        if (mikenDatos) {
            try {
                const datos = eval(`(${mikenDatos})`);
                html = html.replace(/\{\{(\w+)\}\}/g, (_, clave) => datos[clave] !== undefined ? datos[clave] : _);
            } catch (e) { console.warn("Error en miken_datos", e); }
        }
        tag.innerHTML = html;
        // Ejecutar scripts insertados
        tag.querySelectorAll("script").forEach(oldScript => {
            const newScript = document.createElement("script");
            if (oldScript.src) newScript.src = oldScript.src;
            else newScript.textContent = oldScript.textContent;
            if (oldScript.type === "module") newScript.type = "module";
            document.body.appendChild(newScript);
            oldScript.remove();
        });
    } catch (error) {
        tag.innerHTML = `<p class="text-error">Error cargando ${src}</p>`;
    }
}