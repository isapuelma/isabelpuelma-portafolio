// ==========================================
// PORTAFOLIO.JS - MOTOR V12 (EDICIÓN PREMIUM CON LAZY LOADING)
// ==========================================

// 1. INICIALIZACIÓN DE LIBRERÍAS (Lenis & GSAP)
let lenis;
function initLibraries() {
    try {
        if (typeof Lenis !== 'undefined') {
            lenis = new Lenis({
                duration: 1.2,
                easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
                smooth: true
            });
            function raf(time) { lenis.raf(time); requestAnimationFrame(raf); }
            requestAnimationFrame(raf);
        }
        if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
            gsap.registerPlugin(ScrollTrigger);
        }
    } catch (e) { console.warn("Librerías externas no listas."); }
}

// 2. VISIBILIDAD CRÍTICA
function initPageVisibility() {
    const reveal = () => {
        document.body.classList.add('loaded');
        setTimeout(() => { if(window.ScrollTrigger) ScrollTrigger.refresh(); }, 500);
    };

    const failsafe = setTimeout(reveal, 1000);
    window.addEventListener('load', () => { clearTimeout(failsafe); reveal(); });
}

// 3. ANIMACIONES DE REVELADO
function initScrollAnimations() {
    const elements = document.querySelectorAll('.reveal-element');
    if (elements.length === 0) return;

    elements.forEach(el => {
        ScrollTrigger.create({
            trigger: el,
            start: "top 92%",
            onEnter: () => el.classList.add('active'),
            once: true
        });
    });
}

// --- NAVEGACIÓN LATERAL Y BOTÓN DE SALTO SUAVE Y FLUIDO (OPTIMIZADO) ---
function initScrollNavigation() {
    const existingNav = document.querySelector('.scroll-nav-dots');
    const existingBtn = document.querySelector('.back-to-top');
    if (existingNav) existingNav.remove();
    if (existingBtn) existingBtn.remove();

    const params = new URLSearchParams(window.location.search);
    const projectId = params.get('id');
    
    if (!projectId || typeof DATOS_GLOBALES === 'undefined') return;

    const targetSections = Array.from(document.querySelectorAll('#dyn-narrative-container [data-section-title]'));
    if (targetSections.length === 0) return;

    const navDots = document.createElement('div');
    navDots.className = 'scroll-nav-dots';
    
    const quickNavBtn = document.createElement('button');
    quickNavBtn.className = 'back-to-top'; 
    quickNavBtn.setAttribute('aria-label', 'Navegar sección');
    quickNavBtn.innerHTML = '<i class="ph ph-arrow-down"></i>';
    
    let currentIndex = 0;
    let direction = 'down';

    // FUNCIÓN DE SCROLL FLUIDO CONTROLADO CON RECALCULACIÓN DE ALTURA
    const scrollToSection = (targetSec, index) => {
        currentIndex = index;
        const headerOffset = 90;

        // Función interna para calcular la posición real actual
        const getTargetPosition = () => {
            const elementPosition = targetSec.getBoundingClientRect().top;
            return elementPosition + (window.pageYOffset || window.scrollY) - headerOffset;
        };

        if (window.lenis) {
            // Primer impulso de scroll suave
            window.lenis.scrollTo(targetSec, { 
                offset: -headerOffset, 
                duration: 1.0, 
                easing: (t) => 1 - Math.pow(1 - t, 3) 
            });

            // Pequeño re-chequeo a los 400ms por si se cargó una imagen abajo y cambió la altura
            setTimeout(() => {
                const refreshedPosition = getTargetPosition();
                window.lenis.scrollTo(refreshedPosition, { duration: 0.2, immediate: true });
            }, 400);

        } else {
            const offsetPosition = getTargetPosition();
            window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth'
            });
        }

        // Actualizar dirección del botón flotante
        if (currentIndex >= targetSections.length - 1) {
            direction = 'up';
            quickNavBtn.innerHTML = '<i class="ph ph-arrow-up"></i>';
        } else if (currentIndex <= 0) {
            direction = 'down';
            quickNavBtn.innerHTML = '<i class="ph ph-arrow-down"></i>';
        }
    };

    quickNavBtn.addEventListener('click', () => {
        if (direction === 'down') {
            currentIndex++;
            if (currentIndex >= targetSections.length - 1) {
                currentIndex = targetSections.length - 1;
                direction = 'up';
                quickNavBtn.innerHTML = '<i class="ph ph-arrow-up"></i>';
            }
        } else {
            currentIndex--;
            if (currentIndex <= 0) {
                currentIndex = 0;
                direction = 'down';
                quickNavBtn.innerHTML = '<i class="ph ph-arrow-down"></i>';
            }
        }
        
        scrollToSection(targetSections[currentIndex], currentIndex);
    });
    
    document.body.appendChild(navDots);
    document.body.appendChild(quickNavBtn);

    targetSections.forEach((sec, i) => {
        const dot = document.createElement('div');
        dot.className = `nav-dot ${i === 0 ? 'active' : ''}`;
        dot.setAttribute('data-index', i);

        const labelText = sec.getAttribute('data-section-title');
        dot.innerHTML = `<span class="dot-label text-mono">${labelText}</span>`;
        
        dot.addEventListener('click', () => {
            scrollToSection(sec, i);
        });
        navDots.appendChild(dot);
    });

    // Sincronización limpia al hacer scroll manual con el mouse
    window.addEventListener('scroll', () => {
        quickNavBtn.style.display = 'flex'; 

        let activeIndex = -1;
        targetSections.forEach((sec, i) => {
            const rect = sec.getBoundingClientRect();
            if (rect.top <= window.innerHeight / 2 && rect.bottom >= 0) {
                activeIndex = i;
            }
        });

        if (activeIndex !== -1 && activeIndex !== currentIndex) {
            currentIndex = activeIndex;
            if (currentIndex === targetSections.length - 1) {
                direction = 'up';
                quickNavBtn.innerHTML = '<i class="ph ph-arrow-up"></i>';
            } else if (currentIndex === 0) {
                direction = 'down';
                quickNavBtn.innerHTML = '<i class="ph ph-arrow-down"></i>';
            }
        }

        document.querySelectorAll('.nav-dot').forEach((dot, i) => {
            dot.classList.toggle('active', i === activeIndex);
        });
    });
}

// 4. GRILLA DE PROYECTOS
function initPortfolioGrid() {
    const grid = document.querySelector("#portfolio-grid");
    const selection = document.querySelector("#home-selection");
    if ((!grid && !selection) || typeof DATOS_GLOBALES === 'undefined') return;

    const target = grid || selection;
    const isHome = !!selection;

    const render = (filter = 'all') => {
        target.innerHTML = '';

        let items = (filter === 'all') 
            ? DATOS_GLOBALES.proyectos 
            : DATOS_GLOBALES.proyectos.filter(p => {
                if (!p.filtro || !Array.isArray(p.filtro)) return false;
                return p.filtro.map(f => f.toLowerCase().trim()).includes(filter.toLowerCase().trim());
            });

        if (isHome) items = items.slice(0, 4);

        items.forEach((p, i) => {
            const span = (i % 3 === 0) ? "col-span-12" : "col-span-6";
            const el = document.createElement('a');
            el.className = `project-item ${span} active`;
            el.href = `proyect.html?id=${p.id}`;
            
            const mediaSrc = p.video || p.imagen;
            const esVideo = mediaSrc && /\.(mp4|webm|mov)$/i.test(mediaSrc);
            const mediaHTML = esVideo 
                ? `<video src="${mediaSrc}" autoplay muted loop playsinline style="width: 100%; height: 100%; object-fit: cover;"></video>`
                : `<img src="${mediaSrc}" alt="${p.titulo}" loading="lazy">`;

            el.innerHTML = `
                ${mediaHTML}
                <div class="project-info">
                    <span class="project-name text-h2" style="color: white; opacity: 1;">${p.titulo}</span>
                    <span class="project-meta text-mono" style="color: var(--color-lime); opacity: 1;">${p.filtro ? p.filtro[0].toUpperCase() : ''}</span>
                </div>`;
            target.appendChild(el);
        });

        if (window.ScrollTrigger) {
            ScrollTrigger.refresh();
        }
    };

    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            render(this.dataset.filter);
        });
    });

    render();
}
// 5. DETALLE DE PROYECTO & MOTOR DE NARRATIVA DINÁMICA (ADAPTATIVO PARA PLAYGROUND)
function initProjectDetail() {
    const params = new URLSearchParams(window.location.search);
    const projectId = params.get('id');
    const container = document.getElementById('dyn-narrative-container');
    
    if (!projectId || typeof DATOS_GLOBALES === 'undefined') return;

    const project = DATOS_GLOBALES.proyectos.find(p => p.id === projectId);
    if (!project) return;

    // Detectar si es un proyecto de Playground / Passion Project
    const isPlayground = project.filtro && Array.isArray(project.filtro) && project.filtro.map(f => f.toLowerCase()).includes('playground');

    document.title = `${project.titulo} | Isabel Puelma`;

    const titleEl = document.getElementById('dyn-title');
    const descEl = document.getElementById('dyn-desc');
    
    if (titleEl) {
        if (isPlayground) {
            titleEl.innerHTML = `<span class="text-mono" style="color: var(--color-lime); display: block; font-size: 0.85rem; margin-bottom: 0.5rem; letter-spacing: 0.15em;">PLAYGROUND</span>${project.titulo}`;
        } else {
            titleEl.textContent = project.titulo;
        }
    }
    
    if (descEl) descEl.innerHTML = project.descripcion || '';

    const clientEl = document.getElementById('dyn-client');
    const yearEl = document.getElementById('dyn-year');
    const servicesEl = document.getElementById('dyn-services');
    const toolsEl = document.getElementById('dyn-tools');

    if (clientEl) {
        if (project.contexto) {
            clientEl.textContent = project.contexto;
        } else if (isPlayground) {
            clientEl.textContent = project.cliente || 'Proyecto Personal / Concepto';
        } else {
            clientEl.textContent = project.cliente || '—';
        }
    }
    
    if (yearEl) yearEl.textContent = project.year || '—';
    if (servicesEl) servicesEl.textContent = Array.isArray(project.servicios) ? project.servicios.join(', ') : (project.servicios || '—');
    if (toolsEl) toolsEl.textContent = Array.isArray(project.herramientas || project.tools) ? (project.herramientas || project.tools).join(', ') : (project.herramientas || project.tools || '—');

    if (container && project.galeria) {
        container.innerHTML = '';

        project.galeria.forEach((item) => {
            const block = document.createElement('div');
            const config = typeof item === 'object' ? item : { src: item, layout: 'full' };
            const layoutType = config.layout || config.type || 'full';

            if (config.sectionTitle) {
                block.setAttribute('data-section-title', config.sectionTitle);
            }

            const renderMediaTag = (srcPath) => {
                const isVid = /\.(mp4|webm|mov)$/i.test(srcPath);
                if (isVid) return `<video src="${srcPath}" autoplay muted loop playsinline class="media-element"></video>`;
                return `<img src="${srcPath}" alt="Proyecto" class="media-element" loading="lazy">`;
            };

            // LAYOUT: AUTO-GALLERY
            if (layoutType === 'auto-gallery') {
                block.className = 'narrative-block layout-full reveal-element';
                block.style.width = '100%';

                const galleryItemsData = config.items || config.images || [];

                const spanMap = {
                    '1/2': 'col-span-6',
                    '1/3': 'col-span-4',
                    '2/3': 'col-span-8',
                    '1/1': 'col-span-12',
                    'full': 'col-span-12',
                    '6': 'col-span-6',
                    '4': 'col-span-4',
                    '8': 'col-span-8',
                    '12': 'col-span-12'
                };

                const defaultPatterns = [
                    'col-span-8', 'col-span-4',
                    'col-span-4', 'col-span-4', 'col-span-4',
                    'col-span-6', 'col-span-6',
                    'col-span-12'
                ];

                let customSpans = [];
                if (config.columns && typeof config.columns === 'string') {
                    customSpans = config.columns.trim().split(/\s+/).map(col => spanMap[col] || 'col-span-6');
                }

                const itemsHTML = galleryItemsData.map((gItem, index) => {
                    const spanClass = customSpans.length > 0 
                        ? (customSpans[index] || customSpans[index % customSpans.length]) 
                        : defaultPatterns[index % defaultPatterns.length];

                    const src = typeof gItem === 'string' ? gItem : gItem.src;
                    const caption = typeof gItem === 'object' && gItem.caption ? gItem.caption : '';
                    const captionHTML = caption ? `<div class="auto-gallery-caption">${caption}</div>` : '';

                    const esVideo = src && /\.(mp4|webm|mov)$/i.test(src);
                    const mediaTag = esVideo 
                        ? `<video src="${src}" autoplay muted loop playsinline></video>`
                        : `<img src="${src}" alt="${caption || 'Registro de data ' + (index + 1)}" loading="lazy" />`;

                    return `
                        <article class="auto-gallery-item ${spanClass}">
                            ${mediaTag}
                            ${captionHTML}
                        </article>
                    `;
                }).join('');

                block.innerHTML = `<div class="auto-gallery-grid">${itemsHTML}</div>`;
            }
            // LAYOUT: LONG SCROLL
            else if (layoutType === 'long-scroll' || layoutType === 'full-scroll') {
                block.className = 'narrative-block layout-long-scroll reveal-element';
                block.style.width = '100%';
                
                const mediaHTML = config.src ? renderMediaTag(config.src) : '';
                const captionHTML = config.caption ? `<div class="long-scroll-caption text-mono">/// ${config.caption}</div>` : '';

                block.innerHTML = `
                    <div class="long-scroll-container">
                        ${mediaHTML}
                        ${captionHTML}
                    </div>
                `;
            }
            // LAYOUT: NARRATIVE CENTER
            else if (layoutType === 'narrative-center') {
                block.className = 'layout-narrative-center-full reveal-element';
                block.style.width = '100%';
                block.innerHTML = `
                    <div class="narrative-center-inner">
                        <p class="narrative-center-text">${config.text || ''}</p>
                    </div>
                `;
            }
            // LAYOUT: CITA / TESTIMONIO
            else if (layoutType === 'quote' || layoutType === 'testimonial') {
                block.className = 'narrative-block layout-quote-center reveal-element';
                block.style.width = '100%';
                block.style.gridColumn = '1 / -1';
                
                block.innerHTML = `
                    <div class="quote-center-container">
                        <span class="quote-center-tag text-mono">/// TESTIMONIO &amp; IMPACTO</span>
                        <blockquote class="quote-center-text">
                            “${config.text || ''}”
                        </blockquote>
                        ${config.author ? `
                            <div class="quote-center-author text-mono">
                                <span class="author-name">${config.author}</span>${config.role ? `<span class="author-role">${config.role}</span>` : ''}
                            </div>
                        ` : ''}
                    </div>
                `;
            }
            // LAYOUT: COMPARISON (BEFORE / AFTER)
            else if (layoutType === 'comparison' || layoutType === 'comparison-slider' || layoutType === 'before-after') {
                block.className = 'comparison-slider-wrapper reveal-element';
                block.style.width = '100%';
                
                const imgB = config.before || config.srcBefore || config.imgBefore || config.src;
                const imgA = config.after || config.srcAfter || config.imgAfter;

                block.innerHTML = `
                    <div class="bal-container">
                        <span class="bal-label bal-label-before">${config.labelBefore || 'ANTES /// ORIGINAL'}</span>
                        <span class="bal-label bal-label-after">${config.labelAfter || 'DESPUÉS /// REDISEÑO'}</span>

                        <div class="bal-after">
                            <img src="${imgA}" alt="Versión Rediseñada" loading="lazy">
                        </div>

                        <div class="bal-before">
                            <img src="${imgB}" alt="Versión Original" loading="lazy">
                        </div>

                        <div class="bal-line">
                            <div class="bal-handle-icon" aria-label="Deslizar comparación">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M9 18L3 12L9 6"></path>
                                    <path d="M15 6L21 12L15 18"></path>
                                </svg>
                            </div>
                        </div>
                    </div>

                    <div class="bal-caption-bar text-mono">
                        <span>${config.captionText || '/// OPTIMIZACIÓN DE MARCA Y REDISEÑO'}</span>
                        <span>${config.captionAction || 'DESLIZA PARA COMPARAR'}</span>
                    </div>
                `;
            }
            // LAYOUT: AUDIO OVERLAY
            else if (layoutType === 'audio-overlay') {
                block.className = 'layout-audio-overlay-full reveal-element';
                block.style.width = '100%';
                
                const uniqueId = 'audio-' + Math.random().toString(36).substr(2, 9);

                block.innerHTML = `
                    <div class="audio-overlay-container" style="position: relative; width: 100%;">
                        <img src="${config.src}" alt="${config.speaker || 'Registro de audio'}" class="media-element" loading="lazy" style="width: 100%; height: auto; display: block;">
                        
                        <div class="audio-floating-card">
                            <audio id="${uniqueId}" src="${config.audioSrc || config.src}" preload="metadata"></audio>
                            <button class="audio-toggle-btn" onclick="toggleOverlayAudio('${uniqueId}', this)" aria-label="Reproducir testimonio">
                                <i class="ph-fill ph-play icon-play"></i>
                                <i class="ph-fill ph-stop icon-stop" style="display: none;"></i>
                            </button>
                            <div class="audio-overlay-meta">
                                <div class="audio-speaker text-mono">
                                    <span class="accent-lime">/// ${config.speaker || 'TESTIMONIO'}</span>
                                    ${config.role ? `<span class="speaker-role"> — ${config.role}</span>` : ''}
                                </div>
                                <p class="audio-overlay-title">${config.title || 'Escuchar registro sonoro'}</p>
                            </div>
                        </div>
                    </div>
                `;
            }
            // LAYOUT: AUDIO CLÁSICO
            else if (layoutType === 'audio') {
                block.className = 'layout-audio-full reveal-element';
                block.style.width = '100%';
                block.innerHTML = `
                    <div class="audio-container" style="width: 100%;">
                        <div class="audio-header">
                            <span class="text-mono accent-lime">/// ARCHIVO SONORO</span>
                            <h3 class="audio-title">${config.title || 'Registro de Audio'}</h3>
                            ${config.description ? `<p class="audio-desc text-mono">${config.description}</p>` : ''}
                        </div>
                        <div class="audio-player-card" style="width: 100%;">
                            <audio controls class="custom-audio-element" src="${config.src}" style="width: 100%;"></audio>
                        </div>
                    </div>
                `;
            }
            // LAYOUT: IMPACT GRID
            else if (layoutType === 'impact-grid') {
                block.className = 'narrative-block layout-full col-span-12 reveal-element';
                block.style.width = '100%';
                
                const itemsHTML = (config.items || []).map(it => {
                    const rawVal = String(it.value || it.valor || it.numero || '0');
                    return `
                        <div class="impact-item">
                            <div class="impact-number" data-target="${rawVal}" data-prefix="${it.prefix || ''}" data-suffix="${it.suffix || ''}">${rawVal}</div>
                            <div class="impact-label">${it.label || it.texto || ''}</div>
                        </div>
                    `;
                }).join('');

                block.innerHTML = `<div class="impact-grid-container">${itemsHTML}</div>`;
            }
            // LAYOUT: EDITORIAL SLIDER
            else if (layoutType === 'editorial-slider') {
                block.className = 'horizontal-slider-section reveal-element';
                const galleryPages = config.pages || config.items || [];
                
                const pagesHTML = galleryPages.map(page => {
                    const srcPath = typeof page === 'string' ? page : page.src;
                    const captionText = typeof page === 'object' && page.text ? page.text : (page.caption || '');
                    
                    return `
                        <div class="editorial-page ${captionText ? 'has-caption' : ''}">
                            ${renderMediaTag(srcPath)}
                            ${captionText ? `<div class="editorial-caption">${captionText}</div>` : ''}
                        </div>
                    `;
                }).join('');

                block.innerHTML = `<div class="horizontal-container">${pagesHTML}</div>`;
            }
            // LAYOUT: LIVE PORTAL
            else if (layoutType === 'live-portal') {
                block.className = 'reveal-element';
                const targetUrl = config.src || config.url || '#';
                const cleanUrl = targetUrl.replace(/^https?:\/\//, '').replace(/\/$/, '');
                const previewImg = config.img || config.preview || config.src;

                block.innerHTML = `
                    <div class="browser-mockup">
                        <div class="browser-top-bar">
                            <span class="dot red"></span>
                            <span class="dot yellow"></span>
                            <span class="dot green"></span>
                            <div class="browser-address">${cleanUrl}</div>
                        </div>
                        <div class="live-portal-container">
                            <img src="${previewImg}" alt="Vista previa de ${cleanUrl}" class="live-portal-img" loading="lazy">
                            <div class="live-portal-overlay">
                                <a href="${targetUrl}" target="_blank" rel="noopener noreferrer" class="live-portal-btn">
                                    Visitar sitio web ↗
                                </a>
                            </div>
                        </div>
                    </div>
                `;
            }
            
            // LAYOUTS ESTÁNDAR
            else {
                block.className = `narrative-block layout-${layoutType} reveal-element`;

                if (layoutType === 'full') {
                    block.innerHTML = config.src ? renderMediaTag(config.src) : '';
                } else if (layoutType === 'text-left') {
                    block.innerHTML = `
                        <div class="narrative-text-side">
                            <div class="narrative-description">${config.text || ''}</div>
                        </div>
                        <div class="narrative-image-side">
                            ${config.src ? renderMediaTag(config.src) : ''}
                        </div>
                    `;
                } else {
                    block.innerHTML = `
                        <div class="narrative-image-side">
                            ${config.src ? renderMediaTag(config.src) : ''}
                        </div>
                        <div class="narrative-text-side">
                            <div class="narrative-description">${config.text || ''}</div>
                        </div>
                    `;
                }
            }
            container.appendChild(block);
        });

        initScrollNavigation();
        initComparisonSliders();
    }

    renderizarProyectosRelacionados(project);

    const nextLink = document.getElementById('next-project-link');
    if (nextLink && typeof DATOS_GLOBALES !== 'undefined' && DATOS_GLOBALES.proyectos) {
        const proyectos = DATOS_GLOBALES.proyectos;
        const currentIndex = proyectos.findIndex(p => p.id === projectId);
        
        if (currentIndex !== -1) {
            const nextIndex = (currentIndex + 1) % proyectos.length;
            const nextProject = proyectos[nextIndex];
            
            nextLink.href = `proyect.html?id=${nextProject.id}`;
            
            const nextName = document.getElementById('next-project-name');
            const nextCategory = document.getElementById('next-project-category');
            const nextNumber = document.getElementById('next-project-number');
            const mediaContainer = document.getElementById('next-project-media-container');

            if (nextName) nextName.textContent = nextProject.titulo;
            if (nextCategory) {
                const cat = Array.isArray(nextProject.filtro) ? nextProject.filtro[0] : (nextProject.filtro || 'PROYECTO');
                nextCategory.textContent = cat.toUpperCase();
            }
            if (nextNumber) {
                const formattedNum = String(nextIndex + 1).padStart(2, '0');
                const totalNum = String(proyectos.length).padStart(2, '0');
                nextNumber.textContent = `${formattedNum} / ${totalNum}`;
            }

            if (mediaContainer) {
                const mediaSrc = nextProject.video || nextProject.imagen;
                const esVideo = mediaSrc && /\.(mp4|webm|mov)$/i.test(mediaSrc);
                
                mediaContainer.innerHTML = esVideo 
                    ? `<video src="${mediaSrc}" autoplay muted loop playsinline class="next-media-element"></video>`
                    : `<img src="${mediaSrc}" alt="${nextProject.titulo}" loading="lazy" class="next-media-element">`;
            }
        }
    }

    if (typeof initHorizontalScroll === 'function') initHorizontalScroll();
    if (typeof initScrollAnimations === 'function') initScrollAnimations();
}
// 6. MOTOR AUTOMÁTICO DE PROYECTOS RELACIONADOS
function obtenerProyectosRelacionados(proyectoActual, max = 2) {
    if (!DATOS_GLOBALES || !DATOS_GLOBALES.proyectos || !proyectoActual) return [];
    
    return DATOS_GLOBALES.proyectos
        .filter(function(p) { return p.id !== proyectoActual.id; })
        .map(function(p) {
            var coincidenciaCount = 0;
            if (p.filtro && proyectoActual.filtro) {
                coincidenciaCount = p.filtro.filter(function(f) { 
                    return proyectoActual.filtro.indexOf(f) !== -1; 
                }).length;
            }
            return { proyecto: p, coincidencias: coincidenciaCount };
        })
        .sort(function(a, b) { return b.coincidencias - a.coincidencias; })
        .slice(0, max)
        .map(function(item) { return item.proyecto; });
}

function renderizarProyectosRelacionados(proyectoActual) {
    if (!proyectoActual) return;

    var recomendados = obtenerProyectosRelacionados(proyectoActual, 2);
    var contenedor = document.getElementById('relacionados-container');

    if (!contenedor || recomendados.length === 0) return;

    var htmlCards = recomendados.map(function(p) {
        var mediaSrc = p.imagen || p.video || '';
        var esVideo = mediaSrc && /\.(mp4|webm|mov)$/i.test(mediaSrc);
        
        var mediaHTML = esVideo 
            ? '<video src="' + mediaSrc + '" autoplay muted loop playsinline class="related-card-media"></video>'
            : '<img src="' + mediaSrc + '" alt="' + (p.titulo || '') + '" loading="lazy" class="related-card-media">';

        var categoria = (p.filtro && Array.isArray(p.filtro) && p.filtro.length > 0) 
            ? p.filtro[0].toUpperCase() 
            : '';

        var subtituloFrase = p.subtitulo || p.resumen || p.bajada || '';

        return '<a href="proyect.html?id=' + p.id + '" class="related-project-card">' +
                    '<div class="related-card-image-wrapper">' +
                        mediaHTML +
                        '<div class="related-card-gradient"></div>' +
                        '<div class="related-card-content-overlay">' +
                            '<div class="related-card-header-row">' +
                                '<h3 class="related-card-title text-h2">' + (p.titulo || '') + '</h3>' +
                                '<span class="related-card-tag text-mono">' + categoria + '</span>' +
                            '</div>' +
                            (subtituloFrase ? '<p class="related-card-desc text-mono">' + subtituloFrase + '</p>' : '') +
                        '</div>' +
                    '</div>' +
                '</a>';
    }).join('');

    contenedor.style.opacity = '1';
    contenedor.style.visibility = 'visible';

    contenedor.innerHTML = 
        '<section class="related-projects-section">' +
            '<div class="related-header">' +
                '<h2 class="text-h2 related-main-title">Proyectos que te podrían interesar</h2>' +
            '</div>' +
            '<div class="related-projects-grid">' +
                htmlCards +
            '</div>' +
        '</section>';

    if (typeof ScrollTrigger !== 'undefined') {
        setTimeout(function() {
            ScrollTrigger.refresh();
        }, 150);
    }
}

// 7. CONTROLADOR INTERACTIVO DEL COMPARISON SLIDER
function initComparisonSliders() {
    const sliders = document.querySelectorAll('.bal-container');

    sliders.forEach(slider => {
        const beforeLayer = slider.querySelector('.bal-before');
        const beforeImg = slider.querySelector('.bal-before img, .bal-before video');
        const line = slider.querySelector('.bal-line');
        if (!beforeLayer || !line) return;

        let isDragging = false;

        function updateWidth() {
            if (beforeImg) {
                beforeImg.style.width = `${slider.clientWidth}px`;
            }
        }

        updateWidth();

        function updateSliderPosition(clientX) {
            const rect = slider.getBoundingClientRect();
            let position = ((clientX - rect.left) / rect.width) * 100;

            if (position < 0) position = 0;
            if (position > 100) position = 100;

            requestAnimationFrame(() => {
                beforeLayer.style.width = `${position}%`;
                line.style.left = `${position}%`;

                const labelBefore = slider.querySelector('.bal-label-before');
                const labelAfter = slider.querySelector('.bal-label-after');
                
                if (labelBefore) labelBefore.style.opacity = position < 15 ? (position / 15) : 1;
                if (labelAfter) labelAfter.style.opacity = position > 85 ? ((100 - position) / 15) : 0.85;

                updateWidth();
            });
        }

        slider.addEventListener('pointerdown', (e) => {
            isDragging = true;
            try { slider.setPointerCapture(e.pointerId); } catch(err) {}
            updateSliderPosition(e.clientX);
        });

        slider.addEventListener('pointermove', (e) => {
            if (!isDragging) return;
            updateSliderPosition(e.clientX);
        });

        const stopDragging = (e) => {
            if (isDragging) {
                isDragging = false;
                try { slider.releasePointerCapture(e.pointerId); } catch(err) {}
            }
        };

        slider.addEventListener('pointerup', stopDragging);
        slider.addEventListener('pointercancel', stopDragging);
        
        slider.querySelectorAll('img, video').forEach(el => {
            el.addEventListener('dragstart', (e) => e.preventDefault());
        });
    });
}

// 8. MENÚ MÓVIL
function initMobileMenu() {
    const hamBtn = document.getElementById('hamburgerBtn');
    const mobileNav = document.getElementById('mobileNav');

    if (!hamBtn || !mobileNav) return;

    hamBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const isOpen = hamBtn.classList.toggle('open');
        mobileNav.classList.toggle('active');
        document.body.style.overflow = isOpen ? 'hidden' : '';
    });

    mobileNav.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            hamBtn.classList.remove('open');
            mobileNav.classList.remove('active');
            document.body.style.overflow = '';
        });
    });
}

// 9. CURSOR PERSONALIZADO (PROTEGIDO)
function initCustomCursor() {
    try {
        if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches || window.innerWidth < 900) {
            const dot = document.querySelector(".cursor-dot");
            const outline = document.querySelector(".cursor-outline");
            if (dot) dot.style.display = 'none';
            if (outline) outline.style.display = 'none';
            return;
        }

        let dot = document.querySelector(".cursor-dot");
        let outline = document.querySelector(".cursor-outline");

        if (!dot) {
            dot = document.createElement("div");
            dot.className = "cursor-dot";
            document.body.appendChild(dot);
        }
        if (!outline) {
            outline = document.createElement("div");
            outline.className = "cursor-outline";
            document.body.appendChild(outline);
        }

        dot.style.display = 'block';
        outline.style.display = 'block';

        const updateCursorPosition = (e) => {
            if (window.gsap) {
                gsap.to(dot, { x: e.clientX, y: e.clientY, duration: 0.1, overwrite: "auto" });
                gsap.to(outline, { x: e.clientX, y: e.clientY, duration: 0.4, ease: "power2.out", overwrite: "auto" });
            }
        };

        window.removeEventListener("mousemove", updateCursorPosition);
        window.addEventListener("mousemove", updateCursorPosition);

        document.querySelectorAll('a, button, .project-item, .service-header, .lang-btn, .nav-link').forEach(el => {
            el.addEventListener("mouseenter", addCursorHover);
            el.addEventListener("mouseleave", removeCursorHover);
        });
    } catch (err) {
        console.warn("Cursor personalizado omitido:", err);
    }
}
function addCursorHover() { document.body.classList.add("hovering"); }
function removeCursorHover() { document.body.classList.remove("hovering"); }

function initHoverReveal() {
    const hoverItems = document.querySelectorAll('.service-accordion-item');
    const revealContainer = document.getElementById('hover-reveal');
    const revealImg = document.getElementById('hover-reveal-img');
    if (!revealContainer || !revealImg) return;

    hoverItems.forEach(item => {
        item.addEventListener('mouseenter', () => {
            const imgPath = item.getAttribute('data-img');
            if (imgPath) { revealImg.src = imgPath; revealContainer.classList.add('active'); }
        });
        item.addEventListener('mouseleave', () => revealContainer.classList.remove('active'));
        item.addEventListener('mousemove', (e) => {
            if (window.gsap) {
                gsap.to(revealContainer, { x: e.clientX + 20, y: e.clientY + 20, duration: 0.4 });
            }
        });
    });
}

function initHorizontalScroll() {
    const sections = document.querySelectorAll('.horizontal-slider-section');
    if (sections.length === 0 || !window.gsap || !window.ScrollTrigger) return;

    sections.forEach(section => {
        const container = section.querySelector('.horizontal-container');
        if (!container) return;

        // 1. Limpiar triggers previos asociados a esta sección
        ScrollTrigger.getAll().forEach(st => {
            if (st.trigger === section) st.kill();
        });

        // 2. Crear / recuperar la barra e indicador móvil
        let track = section.querySelector('.mobile-progress-track');
        if (!track) {
            track = document.createElement('div');
            track.className = 'mobile-progress-track';
            track.innerHTML = `
                <div class="mobile-drag-hint">
                    <i class="ph ph-hand-swipe-left"></i>
                    <span>DESLIZA PARA EXPLORAR</span>
                </div>
                <div class="mobile-progress-fill"></div>
            `;
            section.appendChild(track);
        }

        // 3. En dispositivos de escritorio, crear el efecto ScrollTrigger
        if (window.innerWidth > 900) {
            const getScrollAmount = () => -(container.scrollWidth - window.innerWidth);

            gsap.to(container, {
                x: getScrollAmount,
                ease: "none",
                scrollTrigger: { 
                    trigger: section, 
                    pin: true, 
                    pinSpacing: true, 
                    scrub: 0.8, 
                    start: "top top", 
                    end: () => "+=" + Math.max(container.scrollWidth - window.innerWidth, window.innerHeight),
                    invalidateOnRefresh: true,
                    anticipatePin: 1,

                    onUpdate: (self) => {
                        const currentFill = section.querySelector('.mobile-progress-fill');
                        if (currentFill) {
                            currentFill.style.width = `${self.progress * 100}%`;
                        }
                        
                        const hint = section.querySelector('.mobile-drag-hint');
                        if (hint) {
                            hint.style.opacity = self.progress > 0.05 ? '0' : '1';
                        }
                    }
                }
            });
        }

        // 4. CLAVE: Escuchar la carga de imágenes para recalcular el ancho real de las diapositivas
        const images = container.querySelectorAll('img');
        images.forEach(img => {
            if (img.complete) {
                ScrollTrigger.refresh();
            } else {
                img.addEventListener('load', () => ScrollTrigger.refresh());
            }
        });
    });
}

function initHeaderContrast() {
    const header = document.querySelector('.header');
    if (!header) return;

    const isProjectPage = window.location.pathname.includes('proyect.html');

    const check = () => {
        if (isProjectPage) {
            header.classList.add('is-scrolled');
            return;
        }

        if (window.scrollY > 50) header.classList.add('is-scrolled');
        else header.classList.remove('is-scrolled');
        
        let isOverLight = false;
        document.querySelectorAll('.bg-lime, [style*="--color-lime"]').forEach(section => {
            const rect = section.getBoundingClientRect();
            if (rect.top <= 50 && rect.bottom >= 50) isOverLight = true;
        });

        if (isOverLight && !header.classList.contains('is-scrolled')) header.classList.add('is-glass');
        else header.classList.remove('is-glass');
    };
    
    window.addEventListener('scroll', check);
    check();
}

// INICIALIZACIÓN GLOBAL UNIFICADA
document.addEventListener('DOMContentLoaded', () => {
    initLibraries();
    initPageVisibility();
    initMobileMenu();
    
    // Ejecutar de inmediato el detalle del proyecto si estamos en proyect.html
    if (window.location.pathname.includes('proyect.html')) {
        initProjectDetail();
    }

    setTimeout(() => {
        initCustomCursor();
        initHeroTypewriter();
        initScrollAnimations();
        initPortfolioGrid();
        if (!window.location.pathname.includes('proyect.html')) {
            initProjectDetail();
        }
        initHoverReveal();
        initHeaderContrast();
        initPageTransitions();

        // CONTROLADOR DE MÉTRICAS DE IMPACTO
        const impactObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const targetEl = entry.target;
                    const rawAttr = String(targetEl.getAttribute('data-target') || targetEl.innerText).trim();
                    const prefix = targetEl.getAttribute('data-prefix') || '';
                    const suffix = targetEl.getAttribute('data-suffix') || '';

                    const tienePuntosDeMiles = /\d+\.\d{3}/.test(rawAttr);

                    let stringParaParse = rawAttr.replace(/[^0-9.,]/g, '');
                    if (tienePuntosDeMiles) {
                        stringParaParse = stringParaParse.replace(/\./g, '');
                    } else {
                        stringParaParse = stringParaParse.replace(/,/g, '.');
                    }

                    const numericValue = parseFloat(stringParaParse);

                    if (isNaN(numericValue)) {
                        targetEl.innerText = `${prefix}${rawAttr}${suffix}`;
                        impactObserver.unobserve(targetEl);
                        return;
                    }

                    const matchPrefijoInterno = rawAttr.match(/^[^\d]+/);
                    const prefijoInterno = matchPrefijoInterno ? matchPrefijoInterno[0] : '';

                    const matchSufijoInterno = rawAttr.match(/[^\d]+$/);
                    const sufijoInterno = matchSufijoInterno ? matchSufijoInterno[0] : '';

                    const duration = 1600;
                    const startTime = performance.now();

                    const updateCounter = (currentTime) => {
                        const elapsedTime = currentTime - startTime;
                        const progress = Math.min(elapsedTime / duration, 1);
                        const easeOutProgress = 1 - Math.pow(1 - progress, 3);
                        
                        let valorActual = Math.round(easeOutProgress * numericValue);

                        let valorFormateado = tienePuntosDeMiles 
                            ? valorActual.toLocaleString('es-CL') 
                            : valorActual.toString();

                        targetEl.innerText = `${prefix}${prefijoInterno}${valorFormateado}${sufijoInterno}${suffix}`;

                        if (progress < 1) {
                            requestAnimationFrame(updateCounter);
                        } else {
                            let valorFinalFormateado = tienePuntosDeMiles 
                                ? numericValue.toLocaleString('es-CL') 
                                : numericValue.toString();
                            targetEl.innerText = `${prefix}${prefijoInterno}${valorFinalFormateado}${sufijoInterno}${suffix}`;
                        }
                    };
                    
                    requestAnimationFrame(updateCounter);
                    impactObserver.unobserve(targetEl); 
                }
            });
        }, { threshold: 0.1 });

        document.querySelectorAll('.impact-number').forEach(el => impactObserver.observe(el));

        document.querySelectorAll('.service-header, .accordion-header').forEach(h => {
            h.addEventListener('click', () => {
                h.parentElement.classList.toggle('active');
                setTimeout(() => { if(window.ScrollTrigger) ScrollTrigger.refresh(); }, 500);
            });
        });

    }, 150);
});

// UTILIDADES GENERALES
function copyEmailOnly(e) {
    e.preventDefault();
    const email = 'mipuelma@uc.cl';

    if (navigator.clipboard) {
        navigator.clipboard.writeText(email).then(() => {
            showToastNotification();
        });
    }
}

function showToastNotification(mensaje = "¡Correo copiado al portapapeles!", duracion = 4000) {
    const toast = document.getElementById('toast-notification');
    if (!toast) return;

    const spanText = toast.querySelector('span');
    if (spanText) spanText.textContent = mensaje;

    toast.classList.add('is-visible');

    if (window.toastTimeout) clearTimeout(window.toastTimeout);

    window.toastTimeout = setTimeout(() => {
        toast.classList.remove('is-visible');
    }, duracion);
}

function initContactReminder() {
    const reminderTimeout = 3 * 60 * 1000;

    setTimeout(() => {
        const toast = document.getElementById('toast-notification');
        if (toast && !toast.classList.contains('is-visible')) {
            showToastNotification("¿Tienes un proyecto en mente? ¡Hablemos! mipuelma@uc.cl", 7000);
        }
    }, reminderTimeout);
}

document.addEventListener('DOMContentLoaded', () => {
    initContactReminder();
});

function updateSantiagoTime() {
    const timeEl = document.getElementById('santiagoTime');
    if (!timeEl) return;

    const options = {
        timeZone: 'America/Santiago',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    };

    const formatter = new Intl.DateTimeFormat([], options);
    const timeString = formatter.format(new Date());
    timeEl.textContent = `SANTIAGO DE CHILE — ${timeString} CLST`;
}

function scrollToTop() {
    if (window.lenis) {
        window.lenis.scrollTo(0);
    } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    updateSantiagoTime();
    setInterval(updateSantiagoTime, 30000);
});

function toggleOverlayAudio(audioId, btn) {
    const audio = document.getElementById(audioId);
    if (!audio) return;

    const playIcon = btn.querySelector('.icon-play');
    const stopIcon = btn.querySelector('.icon-stop');

    document.querySelectorAll('audio').forEach(a => {
        if (a !== audio) {
            a.pause();
            a.currentTime = 0;
            const otherBtn = a.parentElement?.querySelector('.audio-toggle-btn');
            if (otherBtn) {
                const pIcon = otherBtn.querySelector('.icon-play');
                const sIcon = otherBtn.querySelector('.icon-stop');
                if (pIcon) pIcon.style.display = 'inline-block';
                if (sIcon) sIcon.style.display = 'none';
                otherBtn.classList.remove('is-playing');
            }
        }
    });

    if (audio.paused) {
        audio.play();
        if (playIcon) playIcon.style.display = 'none';
        if (stopIcon) stopIcon.style.display = 'inline-block';
        btn.classList.add('is-playing');
    } else {
        audio.pause();
        audio.currentTime = 0;
        if (playIcon) playIcon.style.display = 'inline-block';
        if (stopIcon) stopIcon.style.display = 'none';
        btn.classList.remove('is-playing');
    }

    audio.onended = () => {
        if (playIcon) playIcon.style.display = 'inline-block';
        if (stopIcon) stopIcon.style.display = 'none';
        btn.classList.remove('is-playing');
    };
}

function selectDeckCard(selectedCard) {
    const isAlreadyExpanded = selectedCard.classList.contains('is-expanded');

    const allCards = document.querySelectorAll('.service-deck-card');
    allCards.forEach(card => {
        card.classList.remove('is-expanded');
        const actionBtn = card.querySelector('.deck-action-text');
        if (actionBtn) actionBtn.textContent = 'VER MÁS +';
    });

    if (!isAlreadyExpanded) {
        selectedCard.classList.add('is-expanded');
        const currentBtn = selectedCard.querySelector('.deck-action-text');
        if (currentBtn) currentBtn.textContent = 'VER MENOS −';

        const headerOffset = 90;
        
        setTimeout(() => {
            if (window.lenis) {
                window.lenis.scrollTo(selectedCard, {
                    offset: -headerOffset,
                    duration: 1.0,
                    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t))
                });
            } else {
                const elementPosition = selectedCard.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });
            }
        }, 150);
    }

    setTimeout(() => {
        if (window.ScrollTrigger) ScrollTrigger.refresh();
    }, 500);
}

// TRANSICIÓN DE SALIDA SUAVE ENTRE PÁGINAS
function initPageTransitions() {
    const internalLinks = document.querySelectorAll('a[href^="proyect.html"], a[href^="index.html"], a[href^="about.html"]');

    internalLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            const destination = link.getAttribute('href');

            if (!destination || link.target === '_blank' || e.ctrlKey || e.metaKey) return;

            e.preventDefault();

            document.body.classList.remove('loaded');
            document.body.classList.add('page-exiting');

            setTimeout(() => {
                window.location.href = destination;
            }, 300);
        });
    });
}

// TYPEWRITER HERO: SECUENCIA DINÁMICA MULTI-IDIOMA
function initHeroTypewriter() {
    const textElement = document.getElementById('typewriter-text');
    if (!textElement) return;

    const sequences = {
        es: [
            "Isabel Puelma",
            "puelma.studi0",
            "Diseño Integral",
            "Estrategia & Marca",
            "Dirección Web & UX",
            "Dirección Editorial"
        ],
        en: [
            "Isabel Puelma",
            "puelma.studi0",
            "Integral Design",
            "Strategy & Branding",
            "Web & UX Direction",
            "Editorial Direction"
        ]
    };

    let currentIndex = 0;
    
    window.updateTypewriterSequence = function() {
        const lang = localStorage.getItem('portfolio_lang') || 'es';
        const currentSequence = sequences[lang] || sequences.es;
        currentText = currentSequence[currentIndex % currentSequence.length];
        textElement.textContent = currentText;
    };

    let currentSequence = sequences[localStorage.getItem('portfolio_lang') || 'es'] || sequences.es;
    let currentText = currentSequence[0];
    textElement.textContent = currentText;

    function getCommonPrefixLength(str1, str2) {
        let i = 0;
        const s1 = str1.toLowerCase();
        const s2 = str2.toLowerCase();
        while (i < s1.length && i < s2.length && s1[i] === s2[i]) {
            i++;
        }
        return i;
    }

    function animateTransition() {
        const lang = localStorage.getItem('portfolio_lang') || 'es';
        const activeSequence = sequences[lang] || sequences.es;
        
        const nextIndex = (currentIndex + 1) % activeSequence.length;
        const nextWord = activeSequence[nextIndex];
        const commonLength = getCommonPrefixLength(currentText, nextWord);

        function deleteStep() {
            if (currentText.length > commonLength) {
                currentText = currentText.slice(0, -1);
                textElement.textContent = currentText;
                setTimeout(deleteStep, 70);
            } else {
                setTimeout(typeStep, 220);
            }
        }

        function typeStep() {
            if (currentText.length < nextWord.length) {
                currentText = nextWord.slice(0, currentText.length + 1);
                textElement.textContent = currentText;
                setTimeout(typeStep, 130);
            } else {
                currentIndex = nextIndex;
                setTimeout(animateTransition, 3000);
            }
        }

        deleteStep();
    }

    setTimeout(animateTransition, 2800);
}

// =========================================================================
// MOTOR DE TRADUCCIÓN AUTOMÁTICA (ES / EN) - VERSIÓN CORREGIDA & COMPLETA
// =========================================================================
let currentLang = localStorage.getItem('portfolio_lang') || 'es';

// Cache para acelerar traducciones y evitar llamadas repetidas
const translationCache = {};

async function translateText(text, targetLang) {
    if (!text || text.trim() === '') return text;
    const cleanText = text.trim();
    const cacheKey = `${targetLang}:${cleanText}`;
    if (translationCache[cacheKey]) return translationCache[cacheKey];

    try {
        const response = await fetch(
            `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLang}&dt=t&q=${encodeURIComponent(cleanText)}`
        );
        const data = await response.json();
        const translated = data[0].map(item => item[0]).join('');
        translationCache[cacheKey] = translated;
        return translated;
    } catch (e) {
        console.warn('Error en traducción automática:', e);
        return text;
    }
}

function toggleLanguage() {
    const current = localStorage.getItem('portfolio_lang') || 'es';
    const nextLang = current === 'es' ? 'en' : 'es';
    window.applyLanguage(nextLang);
}

window.applyLanguage = async function(lang) {
    currentLang = lang;
    localStorage.setItem('portfolio_lang', lang);

    document.querySelectorAll('.lang-option').forEach(el => {
        el.classList.toggle('active', el.getAttribute('data-lang') === lang);
    });

    if (lang === 'es') {
        document.querySelectorAll('[data-original-html]').forEach(el => {
            el.innerHTML = el.getAttribute('data-original-html');
        });

        if (typeof window.updateTypewriterSequence === 'function') {
            window.updateTypewriterSequence();
        }

        setTimeout(() => {
            if (typeof initCustomCursor === 'function') initCustomCursor();
        }, 100);
        return;
    }

    // LISTA COMPLETA Y EXACTA DE SELECTORES SEGÚN TU HTML & DOM DINÁMICO
    const selectors = [
        // 1. Detalle de Proyecto & Ficha Técnica
        '#dyn-title', '#dyn-desc', '#dyn-client', '#dyn-services', '#dyn-tools',
        '.project-meta-grid .text-mono', '.project-meta-grid p', '.meta-label', '.meta-value',
        '.inline-back-button',

        // 2. Bloques Narrativos, Sliders, Comparadores e Imagen + Texto
        '.narrative-description', '.narrative-text-side', '.narrative-center-text',
        '.quote-center-text', '.quote-center-tag', '.author-name', '.author-role',
        '.editorial-caption', '.auto-gallery-caption', '.long-scroll-caption',
        '.bal-label', '.bal-caption-bar span', '.live-portal-btn', '.impact-label',

        // 3. Proyectos Relacionados
        '.related-main-title', '.related-card-title', '.related-card-desc', '.related-card-tag',

        // 4. About: Hero, Perfil & Banner
        '.about-hero-header h1', '.about-profile-text h2', '.about-profile-text p',
        '.banner-caption span',

        // 5. About: Servicios Profesionales
        '.about-capabilities-section h2', '.deck-title', '.deck-desc',
        '.spec-list li', '.deck-action-text', '.tool-tag-item',

        // 6. About: Reconocimientos (Distinción Máxima, Patente, Conferencia)
        '.about-editorial-timeline h2', '.editorial-sticky-side h3', '.editorial-sticky-side p',
        '.editorial-entry .entry-meta', '.editorial-entry .entry-title', '.editorial-entry .entry-text',

        // 7. About: Educación, Trayectoria & Cursos
        '.about-education-section h2', '.edu-column .sticky-caption',
        '.edu-row .edu-heading', '.edu-row .edu-sub', '.edu-row p', '.edu-row span:not(.edu-year)',

        // 8. Footer & Navegación General
        '.footer-subtext', '.footer-col-time span', '.footer-copyright-wrap span',
        '.hero-title', '.hero-subtitle', '.scroll-down-text', '.eyebrow', '.dot-label', '.nav-link',
        'p', 'h1', 'h2', 'h3', 'h4', 'li'
    ];

    const elements = document.querySelectorAll(selectors.join(', '));

    async function translateTextNodes(node) {
        if (node.nodeType === Node.TEXT_NODE) {
            const text = node.nodeValue.trim();
            // Filtro para ignorar números, años (ej: 2020 — 2026), URLs y caracteres especiales
            if (text.length > 0 && !/^[0-9\/\s—–\-\.:@]+$/.test(text) && !text.startsWith('http')) {
                const translated = await translateText(text, 'en');
                node.nodeValue = node.nodeValue.replace(text, translated);
            }
        } else if (node.nodeType === Node.ELEMENT_NODE) {
            if (node.id === 'lang-toggle-btn' || node.classList.contains('brand-name') || node.tagName === 'SCRIPT' || node.tagName === 'STYLE') return;
            for (let child of node.childNodes) {
                await translateTextNodes(child);
            }
        }
    }

    for (const el of elements) {
        if (el.closest('#lang-toggle-btn') || el.closest('.brand-name')) continue;

        if (!el.getAttribute('data-original-html')) {
            el.setAttribute('data-original-html', el.innerHTML);
        }

        await translateTextNodes(el);
    }

    if (typeof window.updateTypewriterSequence === 'function') {
        window.updateTypewriterSequence();
    }

    setTimeout(() => {
        if (typeof initCustomCursor === 'function') initCustomCursor();
    }, 100);
};

document.addEventListener('DOMContentLoaded', () => {
    const savedLang = localStorage.getItem('portfolio_lang') || 'es';
    if (savedLang === 'en') {
        setTimeout(() => {
            window.applyLanguage('en');
        }, 300);
    }
});
