const { createApp } = Vue;

const app = createApp({
    data() {
        return {
            widgets: [],
            draggingIndex: null,
            offsetX: 0,
            offsetY: 0,
            isFullscreen: false,
            showWidgetMenu: false,
            resizingIndex: null,
            startWidth: 0,
            startHeight: 0,
            rotatingIndex: null,
            centerX: 0,
            centerY: 0,
            startAngle: 0,
            aktuelleZeit: new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }),

            showSettings: false,
            activeSettingsTab: 'klassen',

            isDrawingMode: false,
            isDrawing: false,
            drawColor: '#ef4444',
            ctx: null,

            availableBackgrounds: [
                'hintergruende/bild1.jpg',
                'hintergruende/bild2.jpg',
                'hintergruende/bild3.jpg',
                'hintergruende/bild4.jpg',
                'hintergruende/bild5.jpg',
                'hintergruende/bild6.jpg',
                'hintergruende/bild7.jpg',
                'hintergruende/bild8.jpg',
                'hintergruende/bild9.jpg',
                'hintergruende/bild10.jpg',
                'hintergruende/bild11.jpg',
                'hintergruende/bild12.jpg',
                'hintergruende/bild13.jpg',
                'hintergruende/bild14.jpg',
                'hintergruende/bild15.jpg'
            ],


            settings: {
                klassen: [],
                hintergrund: '1e293b',
                design: {
                    widgetBg: '#1e293b',
                    widgetBgOpacity: 90,
                    widgetHeader: '#0f172a',
                    widgetHeaderOpacity: 90,
                    textColor: '#ffffff',
                    buttonColor: '#3b82f6'
                }
            },
            neuerKlassenName: '',
            aktiveKlasse: 'Standard'
        }
    },
    mounted() {
        const savedSettings = localStorage.getItem('boardSettings');
        if (savedSettings) {
            this.settings = JSON.parse(savedSettings);
        }

        if (!this.settings.design) {
            this.settings.design = {
                widgetBg: '#1e293b', widgetBgOpacity: 90,
                widgetHeader: '#0f172a', widgetHeaderOpacity: 90,
                textColor: '#ffffff',
                buttonColor: '#3b82f6'
            };
        }
        this.applyDesign();

        if (!this.settings.klassen || this.settings.klassen.length === 0) {
            this.showSettings = true;
            this.activeSettingsTab = 'klassen';
        }

        if (!this.settings.hintergrund) {
            this.settings.hintergrund = '#1e293b';
            this.saveToLocal();
        }

        const lastActive = localStorage.getItem('aktiveKlasse');
        if (lastActive) {
            this.aktiveKlasse = lastActive;
        }

        this.loadBoard();

        document.addEventListener('click', (e) => {
            if (!e.target.closest('.dropdown')) {
                this.showWidgetMenu = false;
            }
        });

        window.addEventListener('mousemove', this.onDrag);
        window.addEventListener('mouseup', this.stopDrag);
        window.addEventListener('touchmove', this.onDrag, { passive: false });
        window.addEventListener('touchend', this.stopDrag);
        window.addEventListener('touchcancel', this.stopDrag);
        document.addEventListener('fullscreenchange', this.onFullscreenChange);

        setInterval(() => {
            this.aktuelleZeit = new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
        }, 1000);
    },

    methods: {
        // === METHODEN FÜR DIE GLASSCHEIBE ===
        toggleDrawingMode() {
            this.isDrawingMode = !this.isDrawingMode;
            if (this.isDrawingMode) {
                // Warten, bis das HTML geladen ist, dann Leinwand aufbauen
                this.$nextTick(() => {
                    this.initCanvas();
                });
            }
        },
        initCanvas() {
            const canvas = this.$refs.drawingCanvas;
            if (!canvas) return;

            // Passt die Zeichenfläche exakt an den Monitor an
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;

            this.ctx = canvas.getContext('2d');
            this.ctx.lineCap = 'round';   // Runde Pinselstriche
            this.ctx.lineJoin = 'round';
            this.ctx.lineWidth = 6;       // Dicke des Stifts
        },
        startDrawing(e) {
            this.isDrawing = true;
            this.draw(e);
        },
        startTouchDrawing(e) {
            this.isDrawing = true;
            this.touchDraw(e);
        },
        draw(e) {
            if (!this.isDrawing || !this.ctx) return;
            this.ctx.strokeStyle = this.drawColor;
            this.ctx.lineTo(e.clientX, e.clientY);
            this.ctx.stroke();
            this.ctx.beginPath();
            this.ctx.moveTo(e.clientX, e.clientY);
        },
        touchDraw(e) {
            if (!this.isDrawing || !this.ctx) return;
            const touch = e.touches[0];
            this.ctx.strokeStyle = this.drawColor;
            this.ctx.lineTo(touch.clientX, touch.clientY);
            this.ctx.stroke();
            this.ctx.beginPath();
            this.ctx.moveTo(touch.clientX, touch.clientY);
        },
        stopDrawing() {
            this.isDrawing = false;
            if (this.ctx) this.ctx.beginPath(); // Setzt den Stift ab
        },
        clearCanvas() {
            if (!this.ctx) return;
            const canvas = this.$refs.drawingCanvas;
            this.ctx.clearRect(0, 0, canvas.width, canvas.height);
        },
        applyDesign() {
            const root = document.documentElement;
            const d = this.settings.design;

            // Hilfsfunktion: Wandelt Hex (#1e293b) und Deckkraft (90) in RGBA um
            const hexToRgba = (hex, opacity) => {
                let r = parseInt(hex.slice(1, 3), 16),
                    g = parseInt(hex.slice(3, 5), 16),
                    b = parseInt(hex.slice(5, 7), 16);
                return `rgba(${r}, ${g}, ${b}, ${opacity / 100})`;
            };
            root.style.setProperty('--widget-bg', hexToRgba(d.widgetBg, d.widgetBgOpacity));
            root.style.setProperty('--widget-header', hexToRgba(d.widgetHeader, d.widgetHeaderOpacity));
            root.style.setProperty('--text-color', d.textColor);
            root.style.setProperty('--button-color', d.buttonColor || '#3b82f6');
        },
        resetDesign() {
            this.settings.hintergrund = '1e293b'
            this.settings.design = {
                widgetBg: '#1e293b', widgetBgOpacity: 90,
                widgetHeader: '#0f172a', widgetHeaderOpacity: 90,
                textColor: '#ffffff', fontMain: 'Arial, sans-serif',
                buttonColor: '#3b82f6',
            };
            this.applyDesign();
            this.saveSettings();
        },
        startRotate(event, index) {
            // Verhindert, dass das iPad scrollt oder markiert
            if (event.cancelable) event.preventDefault();

            this.rotatingIndex = index;

            // Finde das Widget auf dem Bildschirm, um die Mitte (Achse) zu berechnen
            const widgetElements = document.querySelectorAll('.widget');
            const rect = widgetElements[index].getBoundingClientRect();
            this.centerX = rect.left + rect.width / 2;
            this.centerY = rect.top + rect.height / 2;

            // Position des Fingers (Touch) oder der Maus
            const clientX = event.touches ? event.touches[0].clientX : event.clientX;
            const clientY = event.touches ? event.touches[0].clientY : event.clientY;

            // Winkel berechnen
            const radians = Math.atan2(clientY - this.centerY, clientX - this.centerX);
            this.startAngle = radians * (180 / Math.PI) - (this.widgets[index].rotation || 0);

            // Dem Browser sagen: Hör jetzt auf jede Bewegung!
            document.addEventListener('mousemove', this.doRotate);
            document.addEventListener('touchmove', this.doRotate, { passive: false });
            document.addEventListener('mouseup', this.stopRotate);
            document.addEventListener('touchend', this.stopRotate);
        },
        doRotate(event) {
            if (this.rotatingIndex === null) return;
            if (event.cancelable) event.preventDefault();

            const clientX = event.touches ? event.touches[0].clientX : event.clientX;
            const clientY = event.touches ? event.touches[0].clientY : event.clientY;

            // Neuen Winkel berechnen
            const radians = Math.atan2(clientY - this.centerY, clientX - this.centerX);
            let currentAngle = radians * (180 / Math.PI);

            let newRotation = currentAngle - this.startAngle;

            let nearest90 = Math.round(newRotation / 90) * 90;

            if (Math.abs(newRotation - nearest90) <= 5) {
                newRotation = nearest90;
            }

            // Winkel auf das Widget anwenden
            this.widgets[this.rotatingIndex].rotation = newRotation;
        },
        stopRotate() {
            this.rotatingIndex = null;
            document.removeEventListener('mousemove', this.doRotate);
            document.removeEventListener('touchmove', this.doRotate);
            document.removeEventListener('mouseup', this.stopRotate);
            document.removeEventListener('touchend', this.stopRotate);

            if (typeof this.saveToLocal === 'function') this.saveToLocal();
        },
        aktualisiereWidgets() {
            const aktuelleKlasse = this.settings.klassen.find(k => k.name === this.aktiveKlasse);

            if (aktuelleKlasse && aktuelleKlasse.schueler && aktuelleKlasse.schueler.length > 0) {
                const anwesendeSchueler = aktuelleKlasse.schueler
                    .filter(s => !s.absent)
                    .map(s => s.name)
                    .join('\n');

                if (!anwesendeSchueler) {
                    alert("Es sind momentan keine anwesenden Schüler in dieser Klasse eingetragen.");
                    return;
                }

                let hatAktualisiert = false;

                this.widgets.forEach(w => {
                    if (w.type === 'gruppen' || w.type === 'zufall') {
                        w.schuelerListe = anwesendeSchueler;
                        if (w.type === 'gruppen') {
                            const anzahlGruppen = w.gruppen.length > 0 ? w.gruppen.length : (w.parameter || 4);
                            w.gruppen = [];
                            for (let i = 0; i < anzahlGruppen; i++) {
                                w.gruppen.push([]);
                            }
                            w.unassigned = anwesendeSchueler.split('\n');
                        }
                        hatAktualisiert = true;
                    }
                });

                if (hatAktualisiert) {
                    this.saveToLocal();
                    window.location.reload();
                }
            }
        },
        minimizeWidget(index) {
            // Setzt den Status auf "minimiert" und speichert
            this.widgets[index].isMinimized = true;
            this.saveToLocal();
        },

        restoreWidget(index) {
            // Holt das Widget zurück
            this.widgets[index].isMinimized = false;
            this.saveToLocal();
        },
        resetAll() {
            if (confirm("⚠️ ACHTUNG: Möchtest du wirklich ALLES löschen? Alle Klassen, Schüler und Einstellungen gehen unwiderruflich verloren!")) {
                localStorage.clear();
                alert("Das Board wurde auf Werkseinstellungen zurückgesetzt.");
                window.location.reload(); // Seite neu laden, um alles zu säubern
            }
        },
        setHintergrund(bg) {
            this.settings.hintergrund = bg;
            localStorage.setItem('hintergrund_' + this.aktiveKlasse, bg);
        },

        loadBoard() {
            const saved = localStorage.getItem('board_' + this.aktiveKlasse);
            if (saved) {
                this.widgets = JSON.parse(saved);
            } else {
                this.widgets = [];
            }

            const savedBg = localStorage.getItem('hintergrund_' + this.aktiveKlasse);
            if (savedBg) {
                this.settings.hintergrund = savedBg;
            } else {
                this.settings.hintergrund = '#1e293b';
            }

            // NEU: Das Design für genau diese Klasse laden
            const savedDesign = localStorage.getItem('design_' + this.aktiveKlasse);
            if (savedDesign) {
                this.settings.design = JSON.parse(savedDesign);
            } else {
                // Wenn noch kein Design gespeichert wurde: Standard-Werte setzen
                this.settings.design = {
                    widgetBg: '#1e293b', widgetBgOpacity: 90,
                    widgetHeader: '#0f172a', widgetHeaderOpacity: 95,
                    textColor: '#ffffff', buttonColor: '#3b82f6'
                };
            }

            // Standard-Buttons und Texte umfärben
            document.documentElement.style.setProperty('--button-color', this.settings.design.buttonColor);
            document.documentElement.style.setProperty('--text-color', this.settings.design.textColor);
        },
        saveToLocal() {
            localStorage.setItem('board_' + this.aktiveKlasse, JSON.stringify(this.widgets));

        },
        wechsleKlasse(klassenName) {
            this.aktiveKlasse = klassenName;
            localStorage.setItem('aktiveKlasse', klassenName);
            this.loadBoard();
            this.showSettings = false;
        },

        addKlasse() {
            if (!this.neuerKlassenName.trim()) return;
            if (!this.settings.klassen) this.settings.klassen = [];

            const name = this.neuerKlassenName.trim();
            this.settings.klassen.push({ name: name, schueler: [] });
            this.neuerKlassenName = '';
            this.saveSettings();

            if (this.settings.klassen.length === 1) {
                this.aktiveKlasse = name;
                localStorage.setItem('aktiveKlasse', name);
                this.loadBoard();
            }
        },
        removeKlasse(index) {
            if(confirm('Möchtest du diese Klasse und ihr Board wirklich löschen?')) {
                const klasseName = this.settings.klassen[index].name;
                localStorage.removeItem('board_' + klasseName);
                localStorage.removeItem('hintergrund_' + klasseName);
                localStorage.removeItem('design_' + klasseName); // NEU: Design-Speicher löschen
                this.settings.klassen.splice(index, 1);

                if (this.aktiveKlasse === klasseName) {
                    this.wechsleKlasse('Standard');
                }
                this.saveSettings();
            }
        },
        addSchuelerInline(klasse, event) {
            const name = event.target.value;
            if (name && name.trim()) {
                klasse.schueler.push({ name: name.trim(), absent: false });
                event.target.value = '';
                this.saveSettings();
            }
        },
        removeSchueler(klasse, sIndex) {
            klasse.schueler.splice(sIndex, 1);
            this.saveSettings();
        },
        toggleAbsent(schueler) {
            schueler.absent = !schueler.absent;
            this.saveSettings();
        },
        saveSettings() {
            localStorage.setItem('boardSettings', JSON.stringify(this.settings));
        },

        addWidget(type, icon) {
            const isNotiz = type === 'notiz';
            const isGruppen = type === 'gruppen';

            let startListe = '';
            if (type === 'zufall' || type === 'gruppen') {
                const aktuelleKlasseObj = this.settings.klassen.find(k => k.name === this.aktiveKlasse);
                if (aktuelleKlasseObj && aktuelleKlasseObj.schueler) {
                    const anwesendeSchueler = aktuelleKlasseObj.schueler
                        .filter(s => !s.absent)
                        .map(s => s.name);
                    startListe = anwesendeSchueler.join('\n');
                }
            }

            this.widgets.push({
                id: Date.now(),
                type: type,
                icon: icon || '✨',
                x: window.innerWidth / 2 - (isNotiz ? 300 : (isGruppen ? 250 : 150)),
                y: 100,
                width: isNotiz ? 600 : (isGruppen ? 500 : 300),
                height: isNotiz ? 400 : (isGruppen ? 350 : 200),
                data: isNotiz ? 'Hier tippen...' : '',
                schuelerListe: (type === 'zufall' || type === 'gruppen') ? startListe : ''
            });
            this.saveToLocal();
        },
        removeWidget(index) {
            this.widgets.splice(index, 1);
            this.saveToLocal();
        },

        startResize(e, index) {
            this.resizingIndex = index;
            const widget = this.widgets[index];
            let clientX, clientY;
            if (e.type === 'touchstart') {
                clientX = e.touches[0].clientX;
                clientY = e.touches[0].clientY;
            } else {
                clientX = e.clientX;
                clientY = e.clientY;
            }
            this.startWidth = widget.width;
            this.startHeight = widget.height;
            this.offsetX = clientX;
            this.offsetY = clientY;
        },

        startDrag(e, index) {
            // 1. Prüfen, ob auf ein interaktives Element geklickt wurde
            const tagName = e.target.tagName.toUpperCase();

            if (tagName === 'BUTTON' || tagName === 'INPUT' || tagName === 'TEXTAREA' || tagName === 'SELECT') {
                return;
            }
            if (e.target.closest('button') || e.target.closest('.close-btn')) {
                return;
            }

            this.draggingIndex = index;
            const widget = this.widgets[index];

            let clientX, clientY;
            if (e.type === 'touchstart') {
                clientX = e.touches[0].clientX;
                clientY = e.touches[0].clientY;
            } else {
                clientX = e.clientX;
                clientY = e.clientY;
            }

            this.offsetX = clientX - widget.x;
            this.offsetY = clientY - widget.y;

            // NEU: Verhindert, dass der Browser während des Klicks Text markieren will
            document.body.style.userSelect = 'none';
        },

        onDrag(e) {
            if (e.type === 'touchmove' && (this.draggingIndex !== null || this.resizingIndex !== null)) {
                e.preventDefault();
            }

            let clientX, clientY;
            if (e.type === 'touchmove') {
                clientX = e.touches[0].clientX;
                clientY = e.touches[0].clientY;
            } else {
                clientX = e.clientX;
                clientY = e.clientY;
            }

            // 1. Fall: Wir verschieben das Widget
            if (this.draggingIndex !== null) {
                const w = this.widgets[this.draggingIndex];
                let newX = clientX - this.offsetX;
                let newY = clientY - this.offsetY;

                // NEU: Grenzen großzügig erweitern!
                // Es bleiben nur noch 50 Pixel sichtbar, damit man das Fenster wieder zurückholen kann.
                const safeZone = 50;

                if (newX < -w.width + safeZone) newX = -w.width + safeZone;
                if (newX > window.innerWidth - safeZone) newX = window.innerWidth - safeZone;

                // Auch nach oben darf geschoben werden (60px ist die obere Toolbar)
                if (newY < -w.height + safeZone + 60) newY = -w.height + safeZone + 60;
                if (newY > window.innerHeight - safeZone) newY = window.innerHeight - safeZone;

                w.x = newX;
                w.y = newY;

                // NEU: Löscht blaue Markierungen, falls doch irgendwo Text erwischt wurde
                if (window.getSelection) {
                    window.getSelection().removeAllRanges();
                }
            }
            // 2. Fall: Wir machen das Widget größer/kleiner (iPad Fix)
            else if (this.resizingIndex !== null) {
                const w = this.widgets[this.resizingIndex];
                let diffX = clientX - this.offsetX;
                let diffY = clientY - this.offsetY;

                let newWidth = this.startWidth + diffX;
                let newHeight = this.startHeight + diffY;

                if (newWidth < 200) newWidth = 200;
                if (newHeight < 150) newHeight = 150;

                w.width = newWidth;
                w.height = newHeight;
            }
        },

        stopDrag() {
            if (this.draggingIndex !== null || this.resizingIndex !== null) {
                this.draggingIndex = null;
                this.resizingIndex = null;
                this.saveToLocal();

                // NEU: Textauswahl im Browser wieder ganz normal erlauben
                document.body.style.userSelect = '';
            }
        },

        exportBoard() {
            // 1. Grundgerüst für das Backup erstellen
            const backupData = {
                settings: this.settings,
                aktiveKlasse: this.aktiveKlasse, // NEU: Speichert, welche Klasse gerade geöffnet ist!
                boards: {},
                backgrounds: {},
                designs: {}
            };

            // 2. Standard-Klasse sichern
            const standardBoard = localStorage.getItem('board_Standard');
            if (standardBoard) backupData.boards['Standard'] = JSON.parse(standardBoard);

            const standardBg = localStorage.getItem('hintergrund_Standard');
            if (standardBg) backupData.backgrounds['Standard'] = standardBg;

            const standardDesign = localStorage.getItem('design_Standard');
            if (standardDesign) backupData.designs['Standard'] = JSON.parse(standardDesign);

            // 3. Alle anderen Klassen aus den Settings durchgehen und sichern
            if (this.settings.klassen) {
                this.settings.klassen.forEach(klasse => {
                    const boardData = localStorage.getItem('board_' + klasse.name);
                    if (boardData) backupData.boards[klasse.name] = JSON.parse(boardData);

                    const bgData = localStorage.getItem('hintergrund_' + klasse.name);
                    if (bgData) backupData.backgrounds[klasse.name] = bgData;

                    const designData = localStorage.getItem('design_' + klasse.name);
                    if (designData) backupData.designs[klasse.name] = JSON.parse(designData);
                });
            }

            // 4. Datei herunterladen
            const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupData));
            const downloadAnchorNode = document.createElement('a');
            downloadAnchorNode.setAttribute("href", dataStr);
            downloadAnchorNode.setAttribute("download", "wirtschaftslab_backup.json");
            document.body.appendChild(downloadAnchorNode);
            downloadAnchorNode.click();
            downloadAnchorNode.remove();
        },

        importBoard(event) {
            const file = event.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const importedData = JSON.parse(e.target.result);

                    // Prüfen, ob es eine gültige Datei ist
                    if (importedData.settings && importedData.boards) {
                        this.settings = importedData.settings;
                        this.saveSettings();

                        // NEU: Setzt die aktive Klasse wieder auf den Stand vom Backup
                        if (importedData.aktiveKlasse) {
                            this.aktiveKlasse = importedData.aktiveKlasse;
                        } else {
                            this.aktiveKlasse = 'Standard'; // Fallback für alte Backups
                        }

                        // Boards wiederherstellen
                        for (const [klasseName, boardData] of Object.entries(importedData.boards)) {
                            localStorage.setItem('board_' + klasseName, JSON.stringify(boardData));
                        }

                        // Hintergründe wiederherstellen
                        if (importedData.backgrounds) {
                            for (const [klasseName, bgData] of Object.entries(importedData.backgrounds)) {
                                localStorage.setItem('hintergrund_' + klasseName, bgData);
                            }
                        }

                        // Designs wiederherstellen
                        if (importedData.designs) {
                            for (const [klasseName, designData] of Object.entries(importedData.designs)) {
                                localStorage.setItem('design_' + klasseName, JSON.stringify(designData));
                            }
                        }

                        this.loadBoard(); // Lädt jetzt sofort die "aktiveKlasse" aus dem Backup!
                        alert("Backup erfolgreich importiert!");
                    } else {
                        alert("Ungültiges Backup-Format.");
                    }
                } catch (err) {
                    alert("Fehler beim Importieren. Ist das die richtige Datei?");
                    console.error(err);
                }
                event.target.value = '';
            };
            reader.readAsText(file);
        },

        async toggleFullscreen() {
            if (!document.fullscreenElement) {
                try {
                    await document.documentElement.requestFullscreen();
                    this.isFullscreen = true;
                } catch (err) {
                    console.error("Vollbild Fehler:", err);
                }
            } else {
                if (document.exitFullscreen) {
                    await document.exitFullscreen();
                    this.isFullscreen = false;
                }
            }
        },
        onFullscreenChange() {
            this.isFullscreen = !!document.fullscreenElement;
        }
    },

    watch: {
        'settings.design': {
            deep: true,
            handler(newDesign) {
                if (this.aktiveKlasse && newDesign) {
                    localStorage.setItem('design_' + this.aktiveKlasse, JSON.stringify(newDesign));
                }
                // FEHLERBEHEBUNG: Wir rufen einfach deine fertige Funktion auf,
                // damit ALLE Farben (inklusive Widget-Hintergrund) live angewendet werden!
                this.applyDesign();
            }
        }
    }
});

app.component('uhr-widget', UhrWidget);
app.component('notiz-widget', NotizWidget);
app.component('countdown-widget', CountdownWidget);
app.component('stoppuhr-widget', StoppuhrWidget);
app.component('zufall-widget', ZufallWidget);
app.component('qr-widget', QrWidget);
app.component('handlungsplan-widget', HandlungsplanWidget);
app.component('gruppen-widget', GruppenWidget);
app.component('arbeitsphase-widget', ArbeitsphaseWidget);
app.component('medien-widget', MedienWidget);
app.component('ampel-widget', AmpelWidget);
app.component('stundenziel-widget', StundenzielWidget);
app.component('dateimanagement-widget', DateimanagementWidget);

app.mount('#app');