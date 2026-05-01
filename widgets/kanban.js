const KanbanWidget = {
    props: ['widgetData'],
    emits: ['save'],
    data() {
        return {
            ws: null,
            sessionId: null,
            sessionActive: false,
            studentCount: 0,
            showQr: false,
            qrModalOffen: false,
            wsStatus: 'idle',
            neueKarteText: '',
            neueKarteAutor: '',
            neueKarteFarbe: '#fbbf24',
            neueKarteSpalte: null,
            dragCardId: null,
            dragOverSpalte: null,
            freeDragState: { active: false },
            freeDragOverSpalte: null,
            spaltenRefs: {},
            expandedCanvasHeights: {},
            farben: ['#fbbf24','#f87171','#86efac','#93c5fd','#c4b5fd','#f9a8d4','#5eead4','#fdba74','#ffffff','#475569'],
        }
    },
    computed: {
        spalten() { return this.widgetData.spalten || ['Aufgabe', 'In Bearbeitung', 'Erledigt']; },
        karten() { return this.widgetData.karten || []; },
        studentUrl() {
            if (!this.sessionId) return '';
            const path = window.location.pathname.replace('board.html', 'student-kanban.html');
            return `${window.location.origin}${path}?session=${this.sessionId}`;
        },
        qrSrc() {
            if (!this.studentUrl) return '';
            return `https://api.qrserver.com/v1/create-qr-code/?size=160x160&format=svg&data=${encodeURIComponent(this.studentUrl)}`;
        },
        kartenPerSpalte() {
            const result = {};
            this.spalten.forEach(s => { result[s] = []; });
            this.karten.forEach(k => {
                if (result[k.spalte] !== undefined) result[k.spalte].push(k);
                else result[this.spalten[0]].push(k);
            });
            return result;
        },
        aktiveSpalte() {
            return this.neueKarteSpalte || this.spalten[0];
        },
        dragSourceSpalte() {
            if (this.freeDragState.active && this.freeDragState.cardId) {
                const c = this.widgetData.karten.find(k => k.id === this.freeDragState.cardId);
                return c ? c.spalte : null;
            }
            if (this.dragCardId) {
                const c = this.widgetData.karten.find(k => k.id === this.dragCardId);
                return c ? c.spalte : null;
            }
            return null;
        },
    },
    mounted() {
        if (!this.widgetData.spalten) this.widgetData.spalten = ['Aufgabe', 'In Bearbeitung', 'Erledigt'];
        if (!this.widgetData.karten) this.widgetData.karten = [];
        const posPerSpalte = {};
        (this.widgetData.karten || []).forEach(k => {
            if (!posPerSpalte[k.spalte]) posPerSpalte[k.spalte] = 0;
            const idx = posPerSpalte[k.spalte]++;
            if (k.x == null) k.x = 10 + (idx % 2) * 150;
            if (k.y == null) k.y = 20 + Math.floor(idx / 2) * 150;
            if (!k.w) k.w = 130;
            if (!k.h) k.h = 130;
        });
        this._onMousemove = this.onMousemove.bind(this);
        this._onMouseup = this.onMouseup.bind(this);
        document.addEventListener('mousemove', this._onMousemove);
        document.addEventListener('mouseup', this._onMouseup);
    },
    beforeUnmount() {
        document.removeEventListener('mousemove', this._onMousemove);
        document.removeEventListener('mouseup', this._onMouseup);
        this.stopSession();
    },
    methods: {
        generateId() {
            const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
            return Array.from({length: 6}, () => chars[Math.floor(Math.random() * chars.length)]).join('');
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
                    this.widgetData._sessionActive = true;
                    this.studentCount = msg.studentCount || 0;
                    this.showQr = true;
                    this.ws.send(JSON.stringify({
                        type: 'kanban_board_set',
                        board: { columns: this.spalten, cards: this.karten }
                    }));
                }
                if (msg.type === 'student_count') {
                    this.studentCount = msg.count;
                }
                if (msg.type === 'kanban_update') {
                    const newCards = msg.board.cards;
                    newCards.forEach((nc) => {
                        const existing = (this.widgetData.karten || []).find(k => k.id === nc.id);
                        if (Number.isFinite(nc.x) && Number.isFinite(nc.y)) {
                            // Server hat Position (vom Schüler oder Lehrer) → direkt verwenden
                            nc.w = existing ? (existing.w || 130) : 130;
                            nc.h = existing ? (existing.h || 130) : 130;
                        } else if (existing && existing.x != null) {
                            // Server hat keine Position → lokale behalten
                            nc.x = existing.x; nc.y = existing.y;
                            nc.w = existing.w || 130; nc.h = existing.h || 130;
                        } else {
                            // Fallback: Gitter-Layout pro Spalte
                            const inSpalte = newCards.filter(c => c.spalte === nc.spalte);
                            const idx = inSpalte.findIndex(c => c.id === nc.id);
                            nc.x = 10 + (idx % 2) * 150;
                            nc.y = 20 + Math.floor(idx / 2) * 150;
                            nc.w = 130; nc.h = 130;
                        }
                    });
                    this.widgetData.karten = newCards;
                    this.$emit('save');
                }
            };
            this.ws.onclose = () => {
                this.sessionActive = false;
                this.widgetData._sessionActive = false;
                this.wsStatus = 'idle';
                this.showQr = false;
            };
            this.ws.onerror = () => {
                this.wsStatus = 'error';
                this.sessionActive = false;
                this.widgetData._sessionActive = false;
            };
        },
        stopSession() {
            if (this.ws) { this.ws.close(); this.ws = null; }
            this.sessionActive = false;
            this.widgetData._sessionActive = false;
            this.sessionId = null;
            this.studentCount = 0;
            this.showQr = false;
            this.wsStatus = 'idle';
        },
        wsSend(data) {
            if (this.ws && this.ws.readyState === 1) this.ws.send(JSON.stringify(data));
        },
        karteHinzufuegen() {
            if (!this.neueKarteText.trim()) return;
            if (!this.widgetData.karten) this.widgetData.karten = [];
            const spalte = this.aktiveSpalte;
            const existing = this.widgetData.karten.filter(k => k.spalte === spalte);
            const w = 130, h = 130;
            const card = {
                id: Date.now() + '-' + Math.random().toString(36).slice(2, 7),
                text: this.neueKarteText.trim(),
                autor: this.neueKarteAutor.trim(),
                farbe: this.neueKarteFarbe,
                spalte,
                x: 10 + (existing.length % 2) * (w + 15) + Math.round(Math.random() * 8),
                y: 20 + Math.floor(existing.length / 2) * (h + 15) + Math.round(Math.random() * 8),
                w, h
            };
            this.widgetData.karten.push(card);
            this.$emit('save');
            this.wsSend({ type: 'kanban_card_add', text: card.text, autor: card.autor, farbe: card.farbe, spalte: card.spalte, x: card.x, y: card.y });
            this.autoExpandCanvas(card.spalte);
            this.neueKarteText = '';
            this.neueKarteAutor = '';
        },
        karteLoeschen(id) {
            this.widgetData.karten = this.widgetData.karten.filter(k => k.id !== id);
            this.$emit('save');
            this.wsSend({ type: 'kanban_card_delete', cardId: id });
        },
        dragStart(id) { this.dragCardId = id; },
        dragEnd() {
            this.dragCardId = null;
            this.dragOverSpalte = null;
        },
        dropOnSpalte(spalte, e) {
            if (!this.dragCardId) return;
            const card = this.widgetData.karten.find(k => k.id === this.dragCardId);
            if (card && card.spalte !== spalte) {
                const outerEl = this.spaltenRefs[spalte];
                if (outerEl) {
                    const innerEl = outerEl.querySelector('.karten-inner');
                    const rect = (innerEl || outerEl).getBoundingClientRect();
                    const w = card.w || 130, h = card.h || 130;
                    card.x = Math.max(0, e.clientX - rect.left - w / 2);
                    card.y = Math.max(20, e.clientY - rect.top - h / 2);
                }
                card.spalte = spalte;
                this.$emit('save');
                this.wsSend({ type: 'kanban_card_move', cardId: card.id, spalte, x: card.x, y: card.y });
            }
            this.dragCardId = null;
            this.dragOverSpalte = null;
        },
        cardMousedown(card, e) {
            const cardEl = e.currentTarget.parentElement;
            const rect = cardEl.getBoundingClientRect();
            // Ghost: Clone als position:fixed ans Body → kein Clipping, Scroll möglich
            const ghost = cardEl.cloneNode(true);
            ghost.style.cssText += `;position:fixed;left:${rect.left}px;top:${rect.top}px;width:${rect.width}px;height:${rect.height}px;z-index:9999;pointer-events:none;box-shadow:6px 10px 24px rgba(0,0,0,0.55);transition:none;`;
            document.body.appendChild(ghost);
            cardEl.style.opacity = '0.2';
            this.freeDragState = {
                active: true,
                cardId: card.id,
                type: 'move',
                startMouseX: e.clientX,
                startMouseY: e.clientY,
                startCardX: card.x || 0,
                startCardY: card.y || 0,
                startClientX: rect.left,
                startClientY: rect.top,
                ghost,
                originalEl: cardEl,
            };
        },
        resizeMousedown(card, e) {
            this.freeDragState = {
                active: true,
                cardId: card.id,
                type: 'resize',
                startMouseX: e.clientX,
                startMouseY: e.clientY,
                startW: card.w || 130,
                startH: card.h || 130,
            };
        },
        onMousemove(e) {
            if (!this.freeDragState.active) return;
            const state = this.freeDragState;
            const card = this.widgetData.karten.find(k => k.id === state.cardId);
            if (!card) return;
            const dx = e.clientX - state.startMouseX;
            const dy = e.clientY - state.startMouseY;
            if (state.type === 'move') {
                // Ghost bewegen statt card.x/y (Vue-DOM bleibt unberührt während Drag)
                if (state.ghost) {
                    state.ghost.style.left = (state.startClientX + dx) + 'px';
                    state.ghost.style.top  = (state.startClientY + dy) + 'px';
                }
                let hover = null;
                for (const [spalte, el] of Object.entries(this.spaltenRefs)) {
                    if (!el) continue;
                    const rect = el.getBoundingClientRect();
                    if (e.clientX >= rect.left && e.clientX <= rect.right &&
                        e.clientY >= rect.top && e.clientY <= rect.bottom) {
                        hover = spalte;
                        break;
                    }
                }
                this.freeDragOverSpalte = hover;
                // Auto-Scroll (expandedCanvasHeights reaktiv → überlebt Vue Re-renders)
                if (hover && this.spaltenRefs[hover]) {
                    const outer = this.spaltenRefs[hover];
                    const rect = outer.getBoundingClientRect();
                    const THRESH = 70, SPEED = 10;
                    if (e.clientY > rect.bottom - THRESH) {
                        outer.scrollTop += SPEED;
                        const needed = outer.scrollTop + outer.clientHeight + 200;
                        if (needed > (this.expandedCanvasHeights[hover] || 0)) {
                            this.expandedCanvasHeights = { ...this.expandedCanvasHeights, [hover]: needed };
                        }
                    } else if (e.clientY < rect.top + THRESH) {
                        outer.scrollTop = Math.max(0, outer.scrollTop - SPEED);
                    }
                }
            } else if (state.type === 'resize') {
                card.w = Math.max(80, state.startW + dx);
                card.h = Math.max(80, state.startH + dy);
            }
        },
        onMouseup(e) {
            if (!this.freeDragState.active) return;
            const state = this.freeDragState;
            if (state.type === 'move') {
                const card = this.widgetData.karten.find(k => k.id === state.cardId);
                if (card) {
                    const dx = e.clientX - state.startMouseX;
                    const dy = e.clientY - state.startMouseY;
                    const ghostLeft = state.startClientX + dx;
                    const ghostTop  = state.startClientY + dy;
                    let targetSpalte = null;
                    for (const [spalte, el] of Object.entries(this.spaltenRefs)) {
                        if (!el) continue;
                        const rect = el.getBoundingClientRect();
                        if (e.clientX >= rect.left && e.clientX <= rect.right &&
                            e.clientY >= rect.top && e.clientY <= rect.bottom) {
                            targetSpalte = spalte;
                            break;
                        }
                    }
                    if (targetSpalte) {
                        const outerEl = this.spaltenRefs[targetSpalte];
                        const innerEl = outerEl?.querySelector('.karten-inner');
                        const rect = (innerEl || outerEl)?.getBoundingClientRect();
                        if (rect) {
                            card.x = Math.max(0, ghostLeft - rect.left);
                            card.y = Math.max(20, ghostTop  - rect.top);
                        }
                        if (targetSpalte !== card.spalte) card.spalte = targetSpalte;
                        this.wsSend({ type: 'kanban_card_move', cardId: card.id, spalte: card.spalte, x: card.x, y: card.y });
                        this.autoExpandCanvas(card.spalte);
                    } else {
                        card.x = state.startCardX;
                        card.y = state.startCardY;
                    }
                    this.$emit('save');
                }
                // Ghost entfernen, Original wieder einblenden
                if (state.ghost) state.ghost.remove();
                if (state.originalEl) state.originalEl.style.opacity = '';
            } else if (state.type === 'resize') {
                this.$emit('save');
            }
            this.freeDragState = { active: false };
            this.freeDragOverSpalte = null;
            this.expandedCanvasHeights = {};
        },
        alleLoeschen() {
            if (confirm('Alle Karten löschen?')) {
                this.widgetData.karten = [];
                this.$emit('save');
                if (this.sessionActive) {
                    this.wsSend({ type: 'kanban_board_set', board: { columns: this.spalten, cards: [] } });
                }
            }
        },
        colStyle(spalte) {
            const dragging = this.freeDragState.active || !!this.dragCardId;
            const hovered = this.dragOverSpalte || this.freeDragOverSpalte;
            let bg, border;
            if (dragging) {
                if (spalte === hovered) {
                    bg = 'rgba(59,130,246,0.13)';
                    border = '1px solid rgba(59,130,246,0.45)';
                } else if (spalte !== this.dragSourceSpalte) {
                    bg = 'rgba(59,130,246,0.05)';
                    border = '1px solid rgba(59,130,246,0.2)';
                } else {
                    bg = 'rgba(0,0,0,0.06)';
                    border = '1px solid rgba(255,255,255,0.04)';
                }
            } else {
                bg = 'rgba(0,0,0,0.10)';
                border = '1px solid rgba(255,255,255,0.06)';
            }
            return {
                flex: 1, display: 'flex', flexDirection: 'column',
                background: bg, borderRadius: '12px', border,
                overflow: 'visible', minWidth: 0, position: 'relative',
                transition: 'background 0.15s, border-color 0.15s'
            };
        },
        canvasSize(spalte) {
            const karten = this.kartenPerSpalte[spalte] || [];
            const maxX = karten.reduce((m, k) => Math.max(m, (k.x || 0) + (k.w || 130) + 20), 300);
            const maxY = karten.reduce((m, k) => Math.max(m, (k.y || 0) + (k.h || 130) + 20), 50);
            const h = Math.max(maxY, this.expandedCanvasHeights[spalte] || 0);
            return { width: maxX + 'px', height: `max(100%, ${h}px)` };
        },
        autoExpandCanvas(spalte) {
            this.$nextTick(() => {
                const outer = this.spaltenRefs[spalte];
                if (!outer) return;
                const viewH = outer.clientHeight;
                const karten = this.kartenPerSpalte[spalte] || [];
                const maxBottom = karten.reduce((m, k) => Math.max(m, (k.y || 0) + (k.h || 130) + 20), 0);
                const curH = Math.max(this.expandedCanvasHeights[spalte] || 0, viewH);
                if (maxBottom > curH * 0.8) {
                    const newH = maxBottom + Math.max(viewH * 0.3, 100);
                    this.expandedCanvasHeights = { ...this.expandedCanvasHeights, [spalte]: newH };
                }
            });
        },
        textfarbe(hex) {
            if (!hex || hex.length < 7) return '#1e293b';
            const r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16);
            return (r*299 + g*587 + b*114) / 1000 > 128 ? '#1e293b' : '#ffffff';
        },
    },
    template: `
    <div @mousedown.stop style="display:flex; flex-direction:column; height:100%; gap:10px; overflow:hidden;">

        <!-- SESSION-PANEL (inaktiv) -->
        <div v-if="!sessionActive"
             style="background:color-mix(in srgb, var(--button-color) 8%, transparent); border:1px dashed var(--button-color); border-radius:10px; padding:10px 14px; display:flex; align-items:center; justify-content:space-between; flex-shrink:0;">
            <span style="font-size:0.85rem; opacity:0.7;">Schüler können noch nicht am Kanban-Board arbeiten.</span>
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
                <span style="font-size:0.85rem; opacity:0.7;">👥 {{ studentCount }}</span>
                <div style="margin-left:auto; display:flex; gap:6px;">
                    <button @click="showQr = !showQr"
                            style="background:rgba(255,255,255,0.1); border:none; color:var(--text-color); padding:5px 10px; border-radius:6px; cursor:pointer; font-size:0.8rem; font-family:inherit;">
                        {{ showQr ? '🫣' : '📱 QR' }}
                    </button>
                    <button @click="stopSession"
                            style="background:rgba(239,68,68,0.15); border:1px solid rgba(239,68,68,0.3); color:#f87171; padding:5px 10px; border-radius:6px; cursor:pointer; font-size:0.8rem; font-family:inherit;">
                        ✕ Stop
                    </button>
                </div>
            </div>
            <div v-if="showQr"
                 style="display:flex; gap:16px; align-items:flex-start; margin-top:12px; padding-top:12px; border-top:1px solid rgba(255,255,255,0.08);">
                <img :src="qrSrc" @click="qrModalOffen = true"
                     style="width:110px; height:110px; border-radius:8px; background:white; flex-shrink:0; cursor:zoom-in;"
                     alt="QR Code" title="Klicken zum Vergrößern">
                <div style="display:flex; flex-direction:column; gap:5px; min-width:0;">
                    <div style="font-size:0.78rem; opacity:0.55;">Schüler scannen diesen Code:</div>
                    <div style="font-size:0.72rem; word-break:break-all; opacity:0.6; background:rgba(0,0,0,0.2); padding:5px 8px; border-radius:6px;">{{ studentUrl }}</div>
                    <div style="font-size:0.75rem; opacity:0.45; margin-top:2px;">Schüler können Karten verschieben und hinzufügen.</div>
                </div>
            </div>
        </div>

        <!-- KARTE HINZUFÜGEN -->
        <div style="border-bottom:1px solid rgba(255,255,255,0.08); padding-bottom:10px; flex-shrink:0;">
            <div style="display:flex; gap:5px; margin-bottom:6px; align-items:center; flex-wrap:wrap;">
                <span style="font-size:0.72rem; opacity:0.45; flex-shrink:0;">Spalte:</span>
                <button v-for="s in spalten" :key="s"
                        @click="neueKarteSpalte = s"
                        :style="{background: aktiveSpalte===s ? 'var(--button-color)' : 'rgba(255,255,255,0.07)', fontWeight: aktiveSpalte===s ? '700' : '400'}"
                        style="border:none; color:var(--text-color); padding:3px 9px; border-radius:5px; cursor:pointer; font-size:0.75rem; font-family:inherit; flex-shrink:0;">
                    {{ s }}
                </button>
                <div style="margin-left:auto; display:flex; gap:3px; flex-wrap:wrap;">
                    <button v-for="f in farben" :key="f"
                            @click="neueKarteFarbe = f"
                            :style="{background:f, width:'17px', height:'17px', borderRadius:'50%', border: neueKarteFarbe===f ? '2px solid white' : '2px solid transparent', cursor:'pointer', padding:0, flexShrink:0, outline: neueKarteFarbe===f ? '1px solid rgba(255,255,255,0.4)' : 'none', outlineOffset:'1px'}">
                    </button>
                </div>
            </div>
            <div style="display:flex; gap:5px;">
                <input v-model="neueKarteAutor"
                       placeholder="Name (optional)"
                       @keyup.enter="karteHinzufuegen"
                       style="width:110px; background:rgba(255,255,255,0.08); border:1px solid rgba(255,255,255,0.15); border-radius:6px; padding:6px 8px; color:var(--text-color); font-size:0.82rem; font-family:inherit; outline:none; flex-shrink:0;">
                <input v-model="neueKarteText"
                       placeholder="Kartentext eingeben..."
                       @keyup.enter="karteHinzufuegen"
                       style="flex:1; background:rgba(255,255,255,0.08); border:1px solid rgba(255,255,255,0.15); border-radius:6px; padding:6px 8px; color:var(--text-color); font-size:0.82rem; font-family:inherit; outline:none; min-width:0;">
                <button @click="karteHinzufuegen"
                        style="background:var(--button-color); border:none; color:var(--text-color); padding:6px 12px; border-radius:6px; cursor:pointer; font-weight:bold; font-size:0.9rem; font-family:inherit; flex-shrink:0;">
                    +
                </button>
                <button @click="alleLoeschen"
                        style="border:none; color:#ef4444; background:rgba(239,68,68,0.08); padding:6px 8px; border-radius:6px; cursor:pointer; font-size:0.78rem; font-family:inherit; flex-shrink:0;"
                        title="Alle Karten löschen">
                    🗑️
                </button>
            </div>
        </div>

        <!-- KANBAN BOARD -->
        <div style="flex:1; display:flex; gap:10px; min-height:0; overflow:visible;">

            <div v-for="spalte in spalten" :key="spalte"
                 @dragover.prevent="dragOverSpalte = spalte"
                 @dragleave="dragOverSpalte = null"
                 @drop.prevent="dropOnSpalte(spalte, $event)"
                 :style="colStyle(spalte)">

                <!-- Spalten-Header -->
                <div style="padding:10px 12px 8px; border-bottom:1px solid rgba(255,255,255,0.08); display:flex; align-items:center; justify-content:center; flex-shrink:0; background:rgba(255,255,255,0.04); border-radius:12px 12px 0 0; position:relative; z-index:2;">
                    <span style="font-size:0.88rem; font-weight:800; opacity:0.9; letter-spacing:0.03em; text-align:center;">{{ spalte }}</span>
                    <span style="position:absolute; right:10px; font-size:0.72rem; opacity:0.4; background:rgba(255,255,255,0.1); padding:1px 8px; border-radius:10px;">{{ (kartenPerSpalte[spalte] || []).length }}</span>
                </div>

                <!-- Outer: scrollbarer Bereich -->
                <div :ref="el => { if (el) spaltenRefs[spalte] = el; else delete spaltenRefs[spalte] }"
                     style="flex:1; overflow:auto; scrollbar-width:thin; scrollbar-color:rgba(255,255,255,0.15) transparent;"
                     class="custom-scrollbar">

                    <!-- Inner: Canvas (wächst mit den Karten) -->
                    <div class="karten-inner"
                         :style="{ position:'relative', minWidth: canvasSize(spalte).width, minHeight: canvasSize(spalte).height }">

                        <div v-for="karte in (kartenPerSpalte[spalte] || [])" :key="karte.id"
                             :style="{
                                 position: 'absolute',
                                 left: (karte.x || 0) + 'px',
                                 top: (karte.y || 0) + 'px',
                                 width: (karte.w || 130) + 'px',
                                 height: (karte.h || 130) + 'px',
                                 background: karte.farbe,
                                 borderRadius: '3px',
                                 boxShadow: freeDragState.cardId === karte.id
                                     ? '6px 10px 24px rgba(0,0,0,0.55)'
                                     : '2px 5px 12px rgba(0,0,0,0.38)',
                                 zIndex: freeDragState.cardId === karte.id ? 50 : 1,
                                 transition: freeDragState.active ? 'none' : 'box-shadow 0.2s',
                                 display: 'flex',
                                 flexDirection: 'column',
                                 userSelect: 'none'
                             }">

                            <!-- Tesa-Streifen -->
                            <div draggable="true"
                                 @dragstart.stop="dragStart(karte.id)"
                                 @dragend.stop="dragEnd"
                                 style="position:absolute; left:50%; top:-8px; transform:translateX(-50%);
                                        width:44px; height:14px;
                                        background:rgba(255,255,255,0.25);
                                        border-left:1px solid rgba(255,255,255,0.18);
                                        border-right:1px solid rgba(255,255,255,0.18);
                                        border-bottom:1px solid rgba(255,255,255,0.12);
                                        cursor:grab; z-index:5;">
                            </div>

                            <!-- Karten-Inhalt -->
                            <div @mousedown.prevent="cardMousedown(karte, $event)"
                                 style="flex:1; display:flex; flex-direction:column; gap:3px;
                                        padding:6px 8px 20px; cursor:grab;">
                                <div v-if="karte.autor"
                                     :style="{fontSize:'0.68rem', fontWeight:'700', color:textfarbe(karte.farbe), opacity:0.65}">
                                    {{ karte.autor }}
                                </div>
                                <div :style="{
                                    color: textfarbe(karte.farbe),
                                    fontSize: '0.88rem',
                                    lineHeight: '1.35',
                                    wordBreak: 'break-word',
                                    fontWeight: '500',
                                    flex: 1,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    textAlign: 'center'
                                }">
                                    {{ karte.text }}
                                </div>
                            </div>

                            <!-- Löschen -->
                            <button @click.stop="karteLoeschen(karte.id)"
                                    @mousedown.stop
                                    :style="{
                                        position:'absolute', top:'2px', right:'3px',
                                        background:'rgba(0,0,0,0.15)', border:'none',
                                        borderRadius:'4px', cursor:'pointer',
                                        padding:'1px 4px', fontSize:'0.6rem',
                                        color:textfarbe(karte.farbe), zIndex:6, lineHeight:1
                                    }">✕</button>

                            <!-- Resize-Griff -->
                            <div @mousedown.prevent.stop="resizeMousedown(karte, $event)"
                                 :style="{
                                     position:'absolute', bottom:'2px', right:'2px',
                                     width:'13px', height:'13px',
                                     cursor:'se-resize', zIndex:6,
                                     opacity:0.4,
                                     color:textfarbe(karte.farbe),
                                     fontSize:'11px', lineHeight:'13px',
                                     textAlign:'center', userSelect:'none'
                                 }">⌟</div>
                        </div>

                        <!-- Leer-Hinweis -->
                        <div v-if="!(kartenPerSpalte[spalte] || []).length"
                             style="position:absolute; inset:0; display:flex; align-items:center;
                                    justify-content:center; text-align:center;
                                    opacity:0.2; font-size:0.75rem; padding:20px; pointer-events:none;">
                            Leer
                        </div>
                    </div>
                </div>
            </div>
        </div>

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
