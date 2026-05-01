const KartenabfrageWidget = {
    props: ['widgetData'],
    emits: ['save'],
    data() {
        return {
            ws: null,
            sessionId: null,
            sessionActive: false,
            studentCount: 0,
            showQr: false,
            wsStatus: 'idle',
            neueKarteText: '',
            neueKarteFarbe: '#fbbf24',
            neueKarteAutor: '',
            ansicht: 'freihand',
            aktuelleKarteIdx: 0,
            farben: ['#fbbf24','#f87171','#86efac','#93c5fd','#c4b5fd','#f9a8d4','#5eead4','#fdba74','#ffffff','#475569'],
            dragState: { active: false, id: null },
            verstecktModus: false,
            qrModalOffen: false,
            freihandCanvasW: 800,
            freihandCanvasH: 600
        }
    },
    computed: {
        karten() { return this.widgetData.karten || []; },
        freihandCanvasStyle() {
            return {
                position: 'relative',
                minWidth: 'max(100%, ' + this.freihandCanvasW + 'px)',
                minHeight: 'max(100%, ' + this.freihandCanvasH + 'px)'
            };
        },
        aktuelleKarte() { return this.karten[this.aktuelleKarteIdx] || null; },
        alleVerborgen() {
            return this.karten.length > 0 && this.karten.every(k => k.sichtbar === false);
        },
        studentUrl() {
            if (!this.sessionId) return '';
            const path = window.location.pathname.replace('board.html', 'student-kartenabfrage.html');
            return `${window.location.origin}${path}?session=${this.sessionId}`;
        },
        qrSrc() {
            if (!this.studentUrl) return '';
            return `https://api.qrserver.com/v1/create-qr-code/?size=160x160&format=svg&data=${encodeURIComponent(this.studentUrl)}`;
        }
    },
    mounted() {
        (this.widgetData.karten || []).forEach((k, i) => {
            if (k.x == null || k.y == null) {
                const col = i % 4;
                const row = Math.floor(i / 4);
                k.x = 20 + col * 175;
                k.y = 20 + row * 125;
            }
            if (!k.w) k.w = 160;
            if (!k.h) k.h = 110;
        });
        const karten = this.widgetData.karten || [];
        this.freihandCanvasW = Math.max(800, karten.reduce((m, k) => Math.max(m, (k.x || 0) + (k.w || 160) + 40), 800));
        this.freihandCanvasH = Math.max(600, karten.reduce((m, k) => Math.max(m, (k.y || 0) + (k.h || 110) + 40), 600));
    },
    beforeUnmount() { this.stopSession(); },
    methods: {
        generateId() {
            const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
            return Array.from({length: 6}, () => chars[Math.floor(Math.random() * chars.length)]).join('');
        },
        _neuPosition() {
            const count = (this.widgetData.karten || []).length;
            const col = count % 4;
            const row = Math.floor(count / 4);
            return {
                x: 20 + col * 175 + Math.round(Math.random() * 15),
                y: 20 + row * 125 + Math.round(Math.random() * 15)
            };
        },
        startSession() {
            this.sessionId = this.generateId();
            this.wsStatus = 'connecting';
            const wsUrl = `wss://${window.location.hostname}/ws`;
            this.ws = new WebSocket(wsUrl);
            this.ws.onopen = () => {
                this.ws.send(JSON.stringify({ type: 'join', role: 'teacher', sessionId: this.sessionId }));
            };
            this.ws.onmessage = (e) => {
                const msg = JSON.parse(e.data);
                if (msg.type === 'joined') {
                    this.wsStatus = 'connected';
                    this.sessionActive = true;
                    this.studentCount = msg.studentCount || 0;
                    this.showQr = true;
                }
                if (msg.type === 'card') {
                    if (!this.widgetData.karten) this.widgetData.karten = [];
                    const pos = this._neuPosition();
                    msg.card.x = pos.x;
                    msg.card.y = pos.y;
                    msg.card.w = 160;
                    msg.card.h = 110;
                    msg.card.sichtbar = !this.verstecktModus;
                    this.widgetData.karten.push(msg.card);
                    this.$emit('save');
                }
                if (msg.type === 'student_count') {
                    this.studentCount = msg.count;
                }
            };
            this.ws.onclose = () => {
                this.sessionActive = false;
                this.wsStatus = 'idle';
                this.showQr = false;
            };
            this.ws.onerror = () => {
                this.wsStatus = 'error';
                this.sessionActive = false;
            };
        },
        stopSession() {
            if (this.ws) { this.ws.close(); this.ws = null; }
            this.sessionActive = false;
            this.sessionId = null;
            this.studentCount = 0;
            this.showQr = false;
            this.wsStatus = 'idle';
        },
        karteHinzufuegen() {
            if (!this.neueKarteText.trim()) return;
            if (!this.widgetData.karten) this.widgetData.karten = [];
            const pos = this._neuPosition();
            this.widgetData.karten.push({
                id: Date.now() + '-local',
                text: this.neueKarteText.trim(),
                farbe: this.neueKarteFarbe,
                autor: this.neueKarteAutor.trim(),
                sichtbar: !this.verstecktModus,
                x: pos.x,
                y: pos.y,
                w: 160,
                h: 110
            });
            this.neueKarteText = '';
            this.neueKarteAutor = '';
            this.$emit('save');
        },
        karteLoeschen(id) {
            this.widgetData.karten = this.widgetData.karten.filter(k => k.id !== id);
            if (this.aktuelleKarteIdx >= this.karten.length) {
                this.aktuelleKarteIdx = Math.max(0, this.karten.length - 1);
            }
            this.$emit('save');
        },
        karteToggle(karte) { karte.sichtbar = !karte.sichtbar; this.$emit('save'); },
        alleEinblenden() { (this.widgetData.karten || []).forEach(k => k.sichtbar = true); this.$emit('save'); },
        alleAusblenden() { (this.widgetData.karten || []).forEach(k => k.sichtbar = false); this.$emit('save'); },
        toggleVerstecktModus() {
            this.verstecktModus = !this.verstecktModus;
            if (this.verstecktModus) this.alleAusblenden();
            else this.alleEinblenden();
        },
        mischen() {
            if (!this.widgetData.karten || this.widgetData.karten.length < 2) return;
            for (let i = this.widgetData.karten.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [this.widgetData.karten[i], this.widgetData.karten[j]] =
                    [this.widgetData.karten[j], this.widgetData.karten[i]];
            }
            this.aktuelleKarteIdx = 0;
            this.$emit('save');
        },
        naechste() { if (this.aktuelleKarteIdx < this.karten.length - 1) this.aktuelleKarteIdx++; },
        vorherige() { if (this.aktuelleKarteIdx > 0) this.aktuelleKarteIdx--; },
        freihandDragStart(karte, e) {
            e.preventDefault();
            const id = karte.id;
            const outer = this.$refs.freihandOuter;
            if (!outer) return;
            const startClientX = e.clientX, startClientY = e.clientY;
            const startCardX = karte.x || 0, startCardY = karte.y || 0;
            const startScrollLeft = outer.scrollLeft, startScrollTop = outer.scrollTop;
            this.dragState = { active: true, id };
            const THRESH = 60, SPEED = 12;
            const move = (ev) => {
                const k = this.widgetData.karten.find(c => c.id === id);
                if (!k) return;
                const dScroll = { x: outer.scrollLeft - startScrollLeft, y: outer.scrollTop - startScrollTop };
                k.x = Math.max(0, startCardX + (ev.clientX - startClientX) + dScroll.x);
                k.y = Math.max(0, startCardY + (ev.clientY - startClientY) + dScroll.y);
                // Auto-Scroll an Containerkanten
                const rect = outer.getBoundingClientRect();
                if (ev.clientX > rect.right - THRESH) outer.scrollLeft += SPEED;
                else if (ev.clientX < rect.left + THRESH) outer.scrollLeft = Math.max(0, outer.scrollLeft - SPEED);
                if (ev.clientY > rect.bottom - THRESH) outer.scrollTop += SPEED;
                else if (ev.clientY < rect.top + THRESH) outer.scrollTop = Math.max(0, outer.scrollTop - SPEED);
                // Auto-Expand bei 80%-Schwelle
                const cardRight  = k.x + (k.w || 160) + 20;
                const cardBottom = k.y + (k.h || 110) + 20;
                if (cardRight  > this.freihandCanvasW * 0.8) this.freihandCanvasW = Math.max(this.freihandCanvasW, cardRight  + 200);
                if (cardBottom > this.freihandCanvasH * 0.8) this.freihandCanvasH = Math.max(this.freihandCanvasH, cardBottom + 200);
            };
            const up = () => {
                this.dragState = { active: false, id: null };
                this.recalcCanvas();
                this.$emit('save');
                document.removeEventListener('mousemove', move);
                document.removeEventListener('mouseup', up);
            };
            document.addEventListener('mousemove', move);
            document.addEventListener('mouseup', up);
        },
        recalcCanvas() {
            const karten = this.widgetData.karten || [];
            this.freihandCanvasW = karten.reduce((m, k) => Math.max(m, (k.x || 0) + (k.w || 160) + 40), 100);
            this.freihandCanvasH = karten.reduce((m, k) => Math.max(m, (k.y || 0) + (k.h || 110) + 40), 100);
        },
        freihandResizeStart(karte, e) {
            e.preventDefault();
            e.stopPropagation();
            const id = karte.id;
            const startX = e.clientX, startY = e.clientY;
            const startW = karte.w || 160, startH = karte.h || 110;
            const move = (ev) => {
                const k = this.widgetData.karten.find(c => c.id === id);
                if (k) {
                    k.w = Math.max(100, startW + (ev.clientX - startX));
                    k.h = Math.max(70, startH + (ev.clientY - startY));
                    const cardRight  = (k.x || 0) + k.w + 20;
                    const cardBottom = (k.y || 0) + k.h + 20;
                    if (cardRight  > this.freihandCanvasW * 0.8) this.freihandCanvasW = Math.max(this.freihandCanvasW, cardRight  + 200);
                    if (cardBottom > this.freihandCanvasH * 0.8) this.freihandCanvasH = Math.max(this.freihandCanvasH, cardBottom + 200);
                }
            };
            const up = () => {
                this.recalcCanvas();
                this.$emit('save');
                document.removeEventListener('mousemove', move);
                document.removeEventListener('mouseup', up);
            };
            document.addEventListener('mousemove', move);
            document.addEventListener('mouseup', up);
        },
        exportTxt() {
            const frage = this.widgetData.frage || 'Kartenabfrage';
            let text = frage + '\n' + '='.repeat(40) + '\n\n';
            (this.widgetData.karten || []).forEach((k, i) => {
                text += `${i + 1}. ${k.autor ? '[' + k.autor + '] ' : ''}${k.text}\n`;
            });
            this._download(text, 'kartenabfrage.txt', 'text/plain;charset=utf-8');
        },
        exportCsv() {
            let csv = 'Nr.,Autor,Antwort\n';
            (this.widgetData.karten || []).forEach((k, i) => {
                csv += `${i + 1},"${k.autor || ''}","${k.text.replace(/"/g, '""')}"\n`;
            });
            this._download(csv, 'kartenabfrage.csv', 'text/csv;charset=utf-8');
        },
        async exportBild() {
            if (!window.html2canvas) { alert('Bild-Export nicht verfügbar.'); return; }
            const el = this.$refs.kartenBereich;
            const canvas = await html2canvas(el, {
                backgroundColor: '#1e293b',
                scale: 2,
                useCORS: true,
                logging: false
            });
            const name = (this.widgetData.frage || 'kartenabfrage').slice(0, 40) + '.png';
            const a = document.createElement('a');
            a.href = canvas.toDataURL('image/png');
            a.download = name;
            document.body.appendChild(a); a.click(); document.body.removeChild(a);
        },
        _download(content, name, mime) {
            const blob = new Blob([content], { type: mime });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url; a.download = name;
            document.body.appendChild(a); a.click();
            document.body.removeChild(a); URL.revokeObjectURL(url);
        },
        alleLoeschen() {
            if (confirm('Alle Karten löschen?')) {
                this.widgetData.karten = [];
                this.aktuelleKarteIdx = 0;
                this.$emit('save');
            }
        },
        setFrage(e) { this.widgetData.frage = e.target.value; this.$emit('save'); },
        textfarbe(hex) {
            if (!hex || hex.length < 7) return '#ffffff';
            const r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16);
            return (r*299 + g*587 + b*114) / 1000 > 128 ? '#1e293b' : '#ffffff';
        },
        postItRotation(id) {
            let h = 0;
            const s = String(id);
            for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) & 0xFFFF;
            return ((h % 7) - 3) + 'deg';
        },
        darkenFarbe(hex) {
            if (!hex || hex.length < 7) return hex;
            const r = Math.max(0, parseInt(hex.slice(1,3),16) - 35);
            const g = Math.max(0, parseInt(hex.slice(3,5),16) - 35);
            const b = Math.max(0, parseInt(hex.slice(5,7),16) - 35);
            return `rgb(${r},${g},${b})`;
        }
    },
    template: `
    <div @mousedown.stop style="display:flex; flex-direction:column; height:100%; gap:10px; overflow:hidden;">

        <!-- SESSION-PANEL (inaktiv) -->
        <div v-if="!sessionActive"
             style="background:color-mix(in srgb, var(--button-color) 8%, transparent); border:1px dashed var(--button-color); border-radius:10px; padding:10px 14px; display:flex; align-items:center; justify-content:space-between; flex-shrink:0;">
            <span style="font-size:0.85rem; opacity:0.7;">Schüler können noch keine Karten einreichen.</span>
            <button @click="startSession"
                    :disabled="wsStatus==='connecting'"
                    style="background:var(--button-color); border:none; color:var(--text-color); padding:6px 14px; border-radius:8px; cursor:pointer; font-size:0.85rem; font-family:inherit; font-weight:600; white-space:nowrap; flex-shrink:0;">
                {{ wsStatus === 'connecting' ? '⏳ Verbinde...' : '🔗 Session starten' }}
            </button>
        </div>

        <!-- SESSION-PANEL (aktiv) -->
        <div v-if="sessionActive"
             style="background:rgba(34,197,94,0.08); border:1px solid rgba(34,197,94,0.25); border-radius:10px; padding:10px 14px; flex-shrink:0;">
            <div style="display:flex; align-items:center; gap:10px; flex-wrap:wrap;">
                <span style="font-size:0.78rem; opacity:0.6;">SESSION</span>
                <code style="background:rgba(255,255,255,0.1); padding:3px 8px; border-radius:5px; font-size:0.95rem; letter-spacing:0.1em; font-weight:bold;">{{ sessionId }}</code>
                <span style="font-size:0.85rem; opacity:0.7;">👥 {{ studentCount }} Schüler</span>
                <div style="margin-left:auto; display:flex; gap:6px;">
                    <button @click="showQr = !showQr"
                            style="background:rgba(255,255,255,0.1); border:none; color:var(--text-color); padding:5px 10px; border-radius:6px; cursor:pointer; font-size:0.8rem; font-family:inherit;"
                            :title="showQr ? 'QR Code verstecken' : 'QR Code anzeigen'">
                        {{ showQr ? '🫣' : '📱 QR' }}
                    </button>
                    <button @click="stopSession"
                            style="background:rgba(239,68,68,0.15); border:1px solid rgba(239,68,68,0.3); color:#f87171; padding:5px 10px; border-radius:6px; cursor:pointer; font-size:0.8rem; font-family:inherit;">
                        ✕ Stop
                    </button>
                </div>
            </div>

            <!-- QR + Link -->
            <div v-if="showQr"
                 style="display:flex; gap:16px; align-items:flex-start; margin-top:12px; padding-top:12px; border-top:1px solid rgba(255,255,255,0.08);">
                <img :src="qrSrc" @click="qrModalOffen = true" style="width:120px; height:120px; border-radius:8px; background:white; flex-shrink:0; cursor:zoom-in;" alt="QR Code" title="Klicken zum Vergrößern">
                <div style="display:flex; flex-direction:column; gap:6px; min-width:0;">
                    <div style="font-size:0.78rem; opacity:0.55; margin-bottom:2px;">Schüler scannen diesen Code:</div>
                    <div style="font-size:0.75rem; word-break:break-all; opacity:0.7; background:rgba(0,0,0,0.2); padding:6px 8px; border-radius:6px;">{{ studentUrl }}</div>
                    <div style="font-size:0.78rem; opacity:0.5; margin-top:4px;">Karten erscheinen sofort unten.</div>
                </div>
            </div>
        </div>

        <!-- NEUE KARTE (manuell) -->
        <div style="border-top:1px solid rgba(255,255,255,0.08); padding-top:10px; display:flex; flex-direction:column; gap:8px; flex-shrink:0;">
            <div style="display:flex; gap:5px; align-items:center; flex-wrap:wrap;">
                <span style="font-size:0.75rem; opacity:0.5; flex-shrink:0;">Manuell:</span>
                <div style="display:flex; gap:4px; flex-wrap:wrap; flex-shrink:0;">
                    <button v-for="f in farben" :key="f"
                            @click="neueKarteFarbe=f"
                            :style="{
                                background: f,
                                width: '20px', height: '20px', borderRadius: '50%',
                                border: neueKarteFarbe===f ? '2px solid white' : '2px solid rgba(255,255,255,0.15)',
                                cursor: 'pointer', padding: 0, flexShrink: 0,
                                outline: neueKarteFarbe===f ? '1px solid rgba(255,255,255,0.4)' : 'none',
                                outlineOffset: '1px'
                            }">
                    </button>
                </div>
                <!-- Toolbar rechts -->
                <div style="margin-left:auto; display:flex; gap:3px; align-items:center; flex-wrap:wrap; flex-shrink:0;">
                    <button @click="ansicht='freihand'"
                        :style="{background: ansicht==='freihand' ? 'var(--button-color)' : 'rgba(255,255,255,0.08)'}"
                        style="border:none; color:var(--text-color); padding:4px 8px; border-radius:5px; cursor:pointer; font-size:0.78rem; font-family:inherit;"
                        title="Frei anordnen (Drag & Drop)">Frei</button>
                    <button @click="ansicht='grid'"
                        :style="{background: ansicht==='grid' ? 'var(--button-color)' : 'rgba(255,255,255,0.08)'}"
                        style="border:none; color:var(--text-color); padding:4px 8px; border-radius:5px; cursor:pointer; font-size:0.78rem; font-family:inherit;"
                        title="Rasteransicht">Grid</button>
                    <button @click="ansicht='einzeln'"
                        :style="{background: ansicht==='einzeln' ? 'var(--button-color)' : 'rgba(255,255,255,0.08)'}"
                        style="border:none; color:var(--text-color); padding:4px 8px; border-radius:5px; cursor:pointer; font-size:0.78rem; font-family:inherit;"
                        title="Einzelkarte anzeigen">Einzeln</button>
                    <span style="width:1px; height:14px; background:rgba(255,255,255,0.15); display:inline-block; flex-shrink:0;"></span>
                    <button @click="mischen"
                        style="border:none; color:var(--text-color); background:rgba(255,255,255,0.08); padding:4px 7px; border-radius:5px; cursor:pointer; font-size:0.78rem; font-family:inherit;"
                        title="Reihenfolge zufällig mischen">🔀</button>
                    <button @click="toggleVerstecktModus"
                        :style="{background: verstecktModus ? 'rgba(239,68,68,0.15)' : 'rgba(255,255,255,0.08)'}"
                        style="border:none; color:var(--text-color); padding:4px 7px; border-radius:5px; cursor:pointer; font-size:0.78rem; font-family:inherit;"
                        :title="verstecktModus ? 'Modus: Karten verborgen – klicken zum Einblenden' : 'Alle verbergen (neue Karten sofort unsichtbar)'">
                        {{ verstecktModus ? '👁️' : '🙈' }}
                    </button>
                    <span style="width:1px; height:14px; background:rgba(255,255,255,0.15); display:inline-block; flex-shrink:0;"></span>
                    <button @click="exportTxt"
                        style="border:none; color:var(--text-color); background:rgba(255,255,255,0.08); padding:4px 7px; border-radius:5px; cursor:pointer; font-size:0.78rem; font-family:inherit;"
                        title="Als Textdatei exportieren">📄</button>
                    <button @click="exportCsv"
                        style="border:none; color:var(--text-color); background:rgba(255,255,255,0.08); padding:4px 7px; border-radius:5px; cursor:pointer; font-size:0.78rem; font-family:inherit;"
                        title="Als CSV exportieren (Excel)">📊</button>
                    <button @click="exportBild"
                        style="border:none; color:var(--text-color); background:rgba(255,255,255,0.08); padding:4px 7px; border-radius:5px; cursor:pointer; font-size:0.78rem; font-family:inherit;"
                        title="Als Bild exportieren (PNG)">📷</button>
                    <button @click="alleLoeschen"
                        style="border:none; color:#ef4444; background:rgba(239,68,68,0.08); padding:4px 7px; border-radius:5px; cursor:pointer; font-size:0.78rem; font-family:inherit;"
                        title="Alle Karten löschen">🗑️</button>
                    <span style="opacity:0.4; font-size:0.75rem; padding-left:2px;">{{ karten.length }}</span>
                </div>
            </div>
            <div style="display:flex; gap:6px;">
                <input v-model="neueKarteAutor"
                       placeholder="Name"
                       @keyup.enter="karteHinzufuegen"
                       style="width:110px; background:rgba(255,255,255,0.08); border:1px solid rgba(255,255,255,0.15); border-radius:6px; padding:7px 10px; color:var(--text-color); font-size:0.85rem; font-family:inherit; outline:none; flex-shrink:0;">
                <input v-model="neueKarteText"
                       placeholder="Antwort eingeben..."
                       @keyup.enter="karteHinzufuegen"
                       style="flex:1; background:rgba(255,255,255,0.08); border:1px solid rgba(255,255,255,0.15); border-radius:6px; padding:7px 10px; color:var(--text-color); font-size:0.85rem; font-family:inherit; outline:none; min-width:0;">
                <button @click="karteHinzufuegen"
                        style="background:var(--button-color); border:none; color:var(--text-color); padding:7px 12px; border-radius:6px; cursor:pointer; font-weight:bold; font-size:0.9rem; font-family:inherit; white-space:nowrap; flex-shrink:0;">
                    +
                </button>
            </div>
        </div>

        <!-- KARTEN-BEREICH (Screenshot-Bereich) -->
        <div ref="kartenBereich" style="flex:1; overflow:hidden; min-height:0; display:flex; flex-direction:column; gap:8px; background:rgba(0,0,0,0.06); border-radius:8px; padding:8px;">

            <!-- FRAGE / TITEL (im Screenshot sichtbar) -->
            <div style="background:rgba(255,255,255,0.07); border-radius:6px; padding:7px 12px; border:1px solid rgba(255,255,255,0.1); flex-shrink:0;">
                <input
                    :value="widgetData.frage || ''"
                    @input="setFrage"
                    placeholder="Frage oder Thema eingeben..."
                    style="width:100%; background:transparent; border:none; outline:none; color:var(--text-color); font-size:1.05rem; font-weight:bold; font-family:inherit;"
                >
            </div>

            <!-- Karten-Ansichten -->
            <div style="flex:1; overflow:hidden; min-height:0; position:relative;">

            <!-- Freihand (Drag & Drop) -->
            <div v-if="ansicht==='freihand'"
                 ref="freihandOuter"
                 style="width:100%; height:100%; overflow:auto; background:rgba(0,0,0,0.08); border-radius:8px;"
                 class="custom-scrollbar">
                <!-- Scrollbarer Canvas -->
                <div :style="freihandCanvasStyle">
                <div v-if="karten.length===0"
                     style="position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:6px; opacity:0.4; font-size:0.9rem; text-align:center; padding:20px; pointer-events:none;">
                    Noch keine Karten.
                    <span style="font-size:0.8rem;">Session starten → Schüler reichen ein, oder unten manuell hinzufügen.</span>
                </div>
                <div v-for="karte in karten" :key="karte.id"
                     @mousedown.prevent="freihandDragStart(karte, $event)"
                     :style="{
                         position: 'absolute',
                         left: (karte.x || 0) + 'px',
                         top: (karte.y || 0) + 'px',
                         background: karte.farbe,
                         width: (karte.w || 160) + 'px',
                         height: (karte.h || 110) + 'px',
                         borderRadius: '3px',
                         cursor: dragState.id === karte.id ? 'grabbing' : 'grab',
                         userSelect: 'none',
                         opacity: karte.sichtbar !== false ? 1 : 0.25,
                         boxShadow: dragState.id === karte.id ? '4px 8px 20px rgba(0,0,0,0.55)' : '2px 5px 12px rgba(0,0,0,0.38)',
                         zIndex: dragState.id === karte.id ? 10 : 1,
                         display: 'flex',
                         flexDirection: 'column',
                         transition: dragState.active ? 'none' : 'box-shadow 0.2s'
                     }">
                    <!-- Tesa-Streifen -->
                    <div style="position:absolute; left:50%; top:-8px; transform:translateX(-50%); width:44px; height:14px; background:rgba(255,255,255,0.25); border-left:1px solid rgba(255,255,255,0.18); border-right:1px solid rgba(255,255,255,0.18); border-bottom:1px solid rgba(255,255,255,0.12); pointer-events:none; z-index:2;"></div>
                    <!-- X-Button oben rechts -->
                    <button @click.stop="karteLoeschen(karte.id)"
                            @mousedown.stop
                            :style="{position:'absolute', top:'2px', right:'3px', background:'rgba(0,0,0,0.15)', border:'none', borderRadius:'4px', cursor:'pointer', padding:'1px 4px', fontSize:'0.6rem', color:textfarbe(karte.farbe), zIndex:6, lineHeight:1}">✕</button>
                    <!-- Inhalt -->
                    <div style="flex:1; display:flex; flex-direction:column; gap:3px; padding:6px 8px 4px;">
                        <div v-if="karte.autor"
                             :style="{fontSize:'0.68rem', fontWeight:'700', color:textfarbe(karte.farbe), opacity:0.65}">
                            {{ karte.autor }}
                        </div>
                        <div :style="{color:textfarbe(karte.farbe), fontSize:'0.88rem', lineHeight:'1.35', wordBreak:'break-word', flex:1, display:'flex', alignItems:'center', justifyContent:'center', textAlign:'center', fontWeight:'500'}">
                            {{ karte.sichtbar !== false ? karte.text : '???' }}
                        </div>
                    </div>
                    <!-- Resize-Griff unten rechts -->
                    <div @mousedown.prevent.stop="freihandResizeStart(karte, $event)"
                         :style="{position:'absolute', bottom:'2px', right:'2px', width:'13px', height:'13px', cursor:'se-resize', zIndex:6, opacity:0.4, color:textfarbe(karte.farbe), fontSize:'11px', lineHeight:'13px', textAlign:'center', userSelect:'none'}">⌟</div>
                </div>
                </div><!-- end canvas -->
            </div><!-- end freihandOuter -->

            <!-- Grid -->
            <div v-if="ansicht==='grid'"
                 style="height:100%; overflow-y:auto;"
                 class="custom-scrollbar">
                <div v-if="karten.length===0"
                     style="height:100%; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:6px; opacity:0.4; font-size:0.9rem; text-align:center; padding:20px;">
                    Noch keine Karten.
                    <span style="font-size:0.8rem;">Session starten → Schüler reichen ein, oder unten manuell hinzufügen.</span>
                </div>
                <div v-if="karten.length>0" style="display:grid; grid-template-columns:repeat(auto-fill,minmax(150px,1fr)); gap:14px; padding:6px 4px;">
                    <div v-for="karte in karten" :key="karte.id"
                         :style="{
                             position: 'relative',
                             background: karte.farbe,
                             opacity: karte.sichtbar !== false ? 1 : 0.25,
                             borderRadius: '3px',
                             minHeight: '90px',
                             display: 'flex',
                             flexDirection: 'column',
                             boxShadow: '2px 5px 12px rgba(0,0,0,0.35)',
                             transition: 'opacity 0.2s'
                         }">
                        <div style="position:absolute; left:50%; top:-8px; transform:translateX(-50%); width:44px; height:14px; background:rgba(255,255,255,0.25); border-left:1px solid rgba(255,255,255,0.18); border-right:1px solid rgba(255,255,255,0.18); border-bottom:1px solid rgba(255,255,255,0.12); pointer-events:none; z-index:2;"></div>
                        <!-- X-Button oben rechts -->
                        <button @click.stop="karteLoeschen(karte.id)"
                                @mousedown.stop
                                :style="{position:'absolute', top:'2px', right:'3px', background:'rgba(0,0,0,0.15)', border:'none', borderRadius:'4px', cursor:'pointer', padding:'1px 4px', fontSize:'0.6rem', color:textfarbe(karte.farbe), zIndex:6, lineHeight:1}">✕</button>
                        <div style="flex:1; display:flex; flex-direction:column; gap:3px; padding:6px 8px 8px;">
                            <div v-if="karte.autor"
                                 :style="{fontSize:'0.68rem', fontWeight:'700', color:textfarbe(karte.farbe), opacity:0.65}">
                                {{ karte.autor }}
                            </div>
                            <div :style="{color:textfarbe(karte.farbe), fontSize:'0.88rem', lineHeight:'1.35', wordBreak:'break-word', flex:1, display:'flex', alignItems:'center', justifyContent:'center', textAlign:'center', fontWeight:'500'}">
                                {{ karte.sichtbar !== false ? karte.text : '???' }}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Einzelkarte -->
            <div v-if="ansicht==='einzeln'"
                 style="height:100%; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:15px; padding:10px;">
                <div v-if="karten.length===0"
                     style="display:flex; flex-direction:column; align-items:center; justify-content:center; gap:6px; opacity:0.4; font-size:0.9rem; text-align:center; padding:20px;">
                    Noch keine Karten.
                    <span style="font-size:0.8rem;">Session starten → Schüler reichen ein, oder unten manuell hinzufügen.</span>
                </div>
                <template v-else>
                    <div :style="{
                        position: 'relative',
                        background: aktuelleKarte.farbe,
                        borderRadius: '2px',
                        padding: '30px 35px',
                        width: '80%',
                        maxWidth: '420px',
                        minHeight: '160px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '10px',
                        opacity: aktuelleKarte.sichtbar !== false ? 1 : 0.4,
                        boxShadow: '3px 5px 20px rgba(0,0,0,0.4)',
                        transition: 'all 0.25s ease'
                    }">
                        <div style="position:absolute; left:50%; top:-8px; transform:translateX(-50%); width:54px; height:16px; background:rgba(255,255,255,0.22); border:1px solid rgba(255,255,255,0.15); pointer-events:none; z-index:2;"></div>
                        <div v-if="aktuelleKarte.autor"
                             :style="{fontSize:'0.82rem', fontWeight:'700', color:textfarbe(aktuelleKarte.farbe), opacity:0.65}">
                            {{ aktuelleKarte.autor }}
                        </div>
                        <div :style="{color:textfarbe(aktuelleKarte.farbe), fontSize:'1.45rem', textAlign:'center', lineHeight:'1.45', fontWeight:'500'}">
                            {{ aktuelleKarte.sichtbar !== false ? aktuelleKarte.text : '???' }}
                        </div>
                    </div>
                    <div style="display:flex; align-items:center; gap:15px;">
                        <button @click="vorherige"
                                :disabled="aktuelleKarteIdx===0"
                                :style="{opacity: aktuelleKarteIdx===0 ? 0.25 : 1}"
                                style="background:rgba(255,255,255,0.1); border:none; color:var(--text-color); padding:8px 18px; border-radius:8px; cursor:pointer; font-size:1rem; font-family:inherit;">◀</button>
                        <span style="opacity:0.6; font-size:0.9rem; min-width:60px; text-align:center;">
                            {{ aktuelleKarteIdx+1 }} / {{ karten.length }}
                        </span>
                        <button @click="naechste"
                                :disabled="aktuelleKarteIdx===karten.length-1"
                                :style="{opacity: aktuelleKarteIdx===karten.length-1 ? 0.25 : 1}"
                                style="background:rgba(255,255,255,0.1); border:none; color:var(--text-color); padding:8px 18px; border-radius:8px; cursor:pointer; font-size:1rem; font-family:inherit;">▶</button>
                    </div>
                </template>
            </div>

            </div><!-- end Karten-Ansichten -->
        </div><!-- end KARTEN-BEREICH -->

    </div>

    <!-- QR-Modal -->
    <div v-if="qrModalOffen"
         @click="qrModalOffen = false"
         style="position:fixed; inset:0; z-index:9999; background:rgba(0,0,0,0.75); display:flex; flex-direction:column; align-items:center; justify-content:center; gap:16px; cursor:zoom-out;">
        <img :src="qrSrc.replace('160x160','400x400')" @click.stop style="width:280px; height:280px; border-radius:16px; background:white; box-shadow:0 20px 60px rgba(0,0,0,0.6);" alt="QR Code groß">
        <div style="font-size:0.8rem; opacity:0.5; color:white;">Klicken zum Schließen</div>
        <div style="font-size:0.72rem; word-break:break-all; opacity:0.55; color:white; max-width:320px; text-align:center;">{{ studentUrl }}</div>
    </div>
    `
};
