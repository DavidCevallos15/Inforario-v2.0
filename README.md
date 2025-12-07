# 📅 Inforario v2.0

![Inforario Banner](https://images.unsplash.com/photo-1506784983877-45594efa4cbe?q=80&w=2068&auto=format&fit=crop&ixlib=rb-4.0.3)

**Gestión Inteligente de Horarios Universitarios**

Inforario v2.0 es una aplicación web moderna diseñada para ayudar a los estudiantes a organizar su vida académica. Utilizando inteligencia artificial, permite extraer horarios automáticamente desde archivos PDF o imágenes, personalizarlos y gestionarlos en una interfaz intuitiva y atractiva.

## ✨ Características Principales

*   **🤖 Extracción con IA:** Sube tu horario en PDF o imagen y deja que nuestra IA lo digitalice por ti.
*   **🎨 Personalización Total:** Edita colores, temas y estilos visuales (incluyendo modo "Gamer" RGB).
*   **☁️ Guardado en la Nube:** Tus horarios se guardan de forma segura (integración con Supabase).
*   **📱 Diseño Responsivo:** Funciona perfectamente en móviles y escritorio.
*   **�� Exportación:** Descarga tu horario organizado en formato PDF o imagen.

## 🚀 Tecnologías

*   **Frontend:** React, Vite, Tailwind CSS, Framer Motion.
*   **Backend/BaaS:** Supabase.
*   **IA:** Google Gemini API.

## 🛠️ Instalación Local

1.  Clona el repositorio:
    ```bash
    git clone https://github.com/DavidCevallos15/Inforario-v2.0.git
    ```
2.  Instala las dependencias:
    ```bash
    npm install
    ```
3.  Configura las variables de entorno (crea un archivo `.env.local`):
    ```env
    VITE_SUPABASE_URL=tu_url_supabase
    VITE_SUPABASE_ANON_KEY=tu_key_supabase
    GEMINI_API_KEY=tu_api_key_gemini
    ```
4.  Inicia el servidor de desarrollo:
    ```bash
    npm run dev
    ```

---
Desarrollado con ❤️ para estudiantes.
