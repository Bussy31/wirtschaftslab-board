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
            dragOverCardId: null,
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
        }
    },
    mounted() {
        if (!this.widgetData.spalten) this.widgetData.spalten = ['Aufgabe', 'In Bearbeitung', 'Erledigt'];
        if (!this.widgetData.karten) this.widgetData.karten = [];
    },
    beforeUnmount() {
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
                    this.widgetData.karten = msg.board.cards;
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
            const card = {
                id: Date.now() + '-' + Math.random().toString(36).slice(2, 7),
                text: this.neueKarteText.trim(),
                autor: this.neueKarteAutor.trim(),
                farbe: this.neueKarteFarbe,
                spalte: this.aktiveSpalte
            };
            if (!this.widgetData.karten) this.widgetData.karten = [];
            this.widgetData.karten.push(card);
            this.$emit('save');
            this.wsSend({ type: 'kanban_card_add', text: card.text, autor: card.autor, farbe: card.farbe, spalte: card.spalte });
            this.neueKarteText = '';
            this.neueKarteAutor = '';
        },
        karteLoeschen(id) {
            this.widgetData.karten = this.widgetData.karten.filter(k => k.id !== id);
            this.$emit('save');
            this.wsSend({ type: 'kanban_card_delete', cardId: id });
        },
        dragStart(id) {
            this.dragCardId = id;
        },
        dragEnd() {
            this.dragCardId = null;
            this.dragOverSpalte = null;
            this.dragOverCardId = null;
        },
        dropOnCard(targetId) {
            if (!this.dragCardId || this.dragCardId === targetId) {
                this.dragCardId = null;
                this.dragOverCardId = null;
                return;
            }
            const cards = this.widgetData.karten;
            const dragged = cards.find(k => k.id === this.dragCardId);
            const target = cards.find(k => k.id === targetId);
            if (!dragged || !target) return;

            const targetSpalte = target.spalte;
            const fromIdx = cards.indexOf(dragged);
            cards.splice(fromIdx, 1);
            const toIdx = cards.indexOf(target);
            dragged.spalte = targetSpalte;
            cards.splice(toIdx, 0, dragged);

            this.$emit('save');
            this.wsSend({ type: 'kanban_card_move', cardId: dragged.id, spalte: targetSpalte });
            this.dragCardId = null;
            this.dragOverCardId = null;
            this.dragOverSpalte = null;
        },
        dropOnSpalte(spalte) {
            if (!this.dragCardId) return;
            const card = this.widgetData.karten.find(k => k.id === this.dragCardId);
            if (card && card.spalte !== spalte) {
                const fromIdx = this.widgetData.karten.indexOf(card);
                this.widgetData.karten.splice(fromIdx, 1);
                card.spalte = spalte;
                this.widgetData.karten.push(card);
                this.$emit('save');
                this.wsSend({ type: 'kanban_card_move', cardId: card.id, spalte });
            }
            this.dragCardId = null;
            this.dragOverSpalte = null;
            this.dragOverCardId = null;
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
             style="background:rgba(59,130,246,0.08); border:1px dashed rgba(59,130,246,0.35); border-radius:10px; padding:10px 14px; display:flex; align-items:center; justify-content:space-between; flex-shrink:0;">
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

        <!-- KANBAN BOARD -->
        <div style="flex:1; display:flex; gap:10px; min-height:0; overflow:hidden;">
            <div v-for="spalte in spalten" :key="spalte"
                 @dragover.prevent="dragOverSpalte = spalte"
                 @dragleave="dragOverSpalte = null"
                 @drop.prevent="dropOnSpalte(spalte)"
                 :style="{
                     flex: 1,
                     display: 'flex',
                     flexDirection: 'column',
                     background: dragOverSpalte === spalte ? 'rgba(59,130,246,0.07)' : 'rgba(0,0,0,0.10)',
                     borderRadius: '12px',
                     border: dragOverSpalte === spalte ? '1px solid rgba(59,130,246,0.35)' : '1px solid rgba(255,255,255,0.06)',
                     overflow: 'hidden',
                     transition: 'background 0.15s, border-color 0.15s',
                     minWidth: 0
                 }">

                <!-- Spalten-Header -->
                <div style="padding:10px 12px 8px; border-bottom:1px solid rgba(255,255,255,0.08); display:flex; align-items:center; justify-content:center; flex-shrink:0; background:rgba(255,255,255,0.04); position:relative;">
                    <span style="font-size:0.88rem; font-weight:800; opacity:0.9; letter-spacing:0.03em; text-align:center;">{{ spalte }}</span>
                    <span style="position:absolute; right:10px; font-size:0.72rem; opacity:0.4; background:rgba(255,255,255,0.1); padding:1px 8px; border-radius:10px;">{{ (kartenPerSpalte[spalte] || []).length }}</span>
                </div>

                <!-- Karten -->
                <div style="flex:1; overflow-y:auto; padding:10px 8px; display:flex; flex-direction:column; gap:10px;" class="custom-scrollbar">
                    <div v-for="karte in (kartenPerSpalte[spalte] || [])" :key="karte.id"
                         draggable="true"
                         @dragstart="dragStart(karte.id)"
                         @dragend="dragEnd"
                         @dragover.prevent="dragOverCardId = karte.id"
                         @drop.prevent.stop="dropOnCard(karte.id)"
                         :style="{
                             position: 'relative',
                             background: karte.farbe,
                             borderRadius: '3px',
                             padding: '16px 10px 8px',
                             cursor: dragCardId === karte.id ? 'grabbing' : 'grab',
                             opacity: dragCardId === karte.id ? 0.35 : 1,
                             boxShadow: dragCardId === karte.id ? '4px 8px 20px rgba(0,0,0,0.55)' : '2px 5px 12px rgba(0,0,0,0.38)',
                             outline: dragOverCardId === karte.id && dragCardId !== karte.id ? '2px solid rgba(255,255,255,0.8)' : 'none',
                             outlineOffset: '2px',
                             transition: 'opacity 0.15s, box-shadow 0.15s',
                             flexShrink: 0,
                             display: 'flex',
                             flexDirection: 'column',
                             gap: '4px',
                             userSelect: 'none'
                         }">
                        <!-- Tesa-Streifen -->
                        <div style="position:absolute; left:50%; top:0; transform:translateX(-50%); width:44px; height:14px; background:rgba(255,255,255,0.25); border-left:1px solid rgba(255,255,255,0.18); border-right:1px solid rgba(255,255,255,0.18); border-bottom:1px solid rgba(255,255,255,0.12); pointer-events:none; z-index:2;"></div>
                        <div v-if="karte.autor"
                             :style="{fontSize:'0.7rem', fontWeight:'700', color:textfarbe(karte.farbe), opacity:0.65, position:'relative', zIndex:3}">
                            {{ karte.autor }}
                        </div>
                        <div :style="{color:textfarbe(karte.farbe), fontSize:'0.9rem', lineHeight:'1.4', wordBreak:'break-word', flex:1, position:'relative', zIndex:3, fontWeight:'500', textAlign:'center', display:'flex', alignItems:'center', justifyContent:'center', minHeight:'30px'}">
                            {{ karte.text }}
                        </div>
                        <div style="display:flex; justify-content:flex-end; flex-shrink:0; position:relative; z-index:3;">
                            <button @click.stop="karteLoeschen(karte.id)"
                                    @mousedown.stop
                                    :style="{background:'rgba(0,0,0,0.15)', border:'none', borderRadius:'4px', cursor:'pointer', padding:'2px 6px', fontSize:'0.65rem', color:textfarbe(karte.farbe)}">
                                ✕
                            </button>
                        </div>
                    </div>

                    <div v-if="!(kartenPerSpalte[spalte] || []).length"
                         style="text-align:center; opacity:0.2; font-size:0.75rem; padding:20px 4px;">
                        Leer
                    </div>
                </div>
            </div>
        </div>

        <!-- KARTE HINZUFÜGEN -->
        <div style="border-top:1px solid rgba(255,255,255,0.08); padding-top:10px; flex-shrink:0;">
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
