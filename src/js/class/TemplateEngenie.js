import { Navigate } from "../class/Navigate.js";

export class TemplateEngine {
    constructor(context=null, html=null) {
        this.context = context || {};
        this.html = html || document.documentElement.innerHTML;
    }

    async AsyncProcesarRutesNavigation() {
        const regex = /\{\{url-([^\}]+)\}\}/g;
        const context = Navigate.getFullPaths();
        this.html = this.html.replace(regex, (match, key) => context[key] || "");
        document.documentElement.innerHTML = this.html;
    }
}