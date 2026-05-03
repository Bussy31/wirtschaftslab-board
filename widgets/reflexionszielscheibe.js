const ReflexionszielscheibeWidget = {
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
            verborgenModus: false,
            sortiertModus: false,
            steuerungEingeklappt: false,
            frageColors: ['#3b82f6','#ef4444','#22c55e','#f59e0b','#8b5cf6','#ec4899','#14b8a6','#f97316'],
        }
    },
    computed: {
        fragen() { return this.widgetData.fragen || []; },
        ringe() { return this.widgetData.ringe || 5; },
        bewertungen() { return this.widgetData.bewertungen || []; },
        studentUrl() {
            if (!this.sessionId) return '';
            const path = window.location.pathname.replace('board.html', 'student-zielscheibe.html');
            return `${window.location.origin}${path}?session=${this.sessionId}`;
        },
        qrSrc() {
            if (!this.studentUrl) return '';
            return `https://api.qrserver.com/v1/create-qr-code/?size=160x160&format=svg&data=${encodeURIComponent(this.studentUrl)}`;
        },
        svgRinge() {
            const result = [];
            const N = this.ringe;
            const R = 175;
            for (let i = N; i >= 1; i--) {
                const r = R * i / N;
                const t = (i - 1) / Math.max(1, N - 1);
                const red   = Math.round(239 * (1 - t) + 34  * t);
                const green = Math.round( 68 * (1 - t) + 197 * t);
                const blue  = Math.round( 68 * (1 - t) + 94  * t);
                result.push({ i, r, fill: `rgba(${red},${green},${blue},0.10)` });
            }
            return result;
        },
        svgPins() {
            if (this.verborgenModus) return [];
            const R = 175, cx = 200, cy = 200;
            const N = this.ringe;
            const nQ = Math.max(1, this.fragen.length);

            if (this.sortiertModus) {
                // Group each question into its own angular sector
                const byQuestion = {};
                this.bewertungen.forEach(b => {
                    if (!b.ratings) return;
                    b.ratings.forEach((rating, qi) => {
                        if (rating < 1 || rating > N) return;
                        if (!byQuestion[qi]) byQuestion[qi] = [];
                        byQuestion[qi].push({ rating, bid: b.id });
                    });
                });
                const pins = [];
                for (let qi = 0; qi < nQ; qi++) {
                    const items = byQuestion[qi] || [];
                    if (!items.length) continue;
                    const sectorStart = (qi / nQ) * 2 * Math.PI - Math.PI / 2;
                    const sectorWidth = (2 * Math.PI) / nQ;
                    const color = this.frageColors[qi % this.frageColors.length];
                    items.forEach((item, idx) => {
                        const radius = R * (item.rating - 0.5) / N;
                        const angle = sectorStart + ((idx + 0.5) / items.length) * sectorWidth;
                        pins.push({
                            id: item.bid + '-' + qi,
                            x: cx + radius * Math.cos(angle),
                            y: cy + radius * Math.sin(angle),
                            color
                        });
                    });
                }
                return pins;
            }

            // Unsorted: spread evenly around full circle per bucket
            const buckets = {};
            this.bewertungen.forEach(b => {
                if (!b.ratings) return;
                b.ratings.forEach((r, qi) => {
                    const key = qi + '-' + r;
                    buckets[key] = (buckets[key] || 0) + 1;
                });
            });
            const bucketIdx = {};
            const pins = [];
            this.bewertungen.forEach(b => {
                if (!b.ratings) return;
                b.ratings.forEach((rating, qi) => {
                    if (rating < 1 || rating > N) return;
                    const key = qi + '-' + rating;
                    const total = buckets[key];
                    const idx = bucketIdx[key] || 0;
                    bucketIdx[key] = idx + 1;
                    const radius = R * (rating - 0.5) / N;
                    const qOffset = (qi / nQ) * (2 * Math.PI / Math.max(total, 1));
                    const angle = (idx / total) * 2 * Math.PI + qOffset;
                    pins.push({
                        id: b.id + '-' + qi,
                        x: cx + radius * Math.cos(angle),
                        y: cy + radius * Math.sin(angle),
                        color: this.frageColors[qi % this.frageColors.length]
                    });
                });
            });
            return pins;
        },
        ringLabels() {
            const labels = [];
            const R = 175, cx = 200, cy = 200;
            const N = this.ringe;
            for (let i = 1; i <= N; i++) {
                const r = R * (i - 0.5) / N;
                labels.push({ v: i, x: cx + r * Math.cos(-0.25), y: cy + r * Math.sin(-0.25) });
            }
            return labels;
        },
        averages() {
            return this.fragen.map((_, qi) => {
                const vals = this.bewertungen
                    .map(b => b.ratings && b.ratings[qi])
                    .filter(v => v >= 1 && v <= this.ringe);
                if (!vals.length) return null;
                return (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1);
            });
        }
    },
    mounted() {
        if (!this.widgetData.fragen)    this.widgetData.fragen = ['Wie gut hat dir die Stunde gefallen?', 'Wie verständlich war der Inhalt?', 'Wie gut warst du dabei?'];
        if (!this.widgetData.ringe)     this.widgetData.ringe = 5;
        if (!this.widgetData.bewertungen) this.widgetData.bewertungen = [];
    },
    beforeUnmount() { this.stopSession(); },
    methods: {
        _hash(str) {
            let h = 5381;
            for (let i = 0; i < str.length; i++) h = ((h << 5) + h) ^ str.charCodeAt(i);
            return Math.abs(h);
        },
        generateId() {
            const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
            return Array.from({length: 6}, () => chars[Math.floor(Math.random() * chars.length)]).join('');
        },
        frageHinzufuegen() {
            if (!this.widgetData.fragen) this.widgetData.fragen = [];
            if (this.widgetData.fragen.length >= 8) return;
            this.widgetData.fragen.push('Neue Frage...');
            this.$emit('save');
            if (this.sessionActive) this.pushConfig();
        },
        frageLoeschen(i) {
            this.widgetData.fragen.splice(i, 1);
            this.$emit('save');
            if (this.sessionActive) this.pushConfig();
        },
        frageAktualisieren(i, val) {
            this.widgetData.fragen[i] = val;
            this.$emit('save');
        },
        frageBlur() {
            if (this.sessionActive) this.pushConfig();
        },
        setRinge(n) {
            this.widgetData.ringe = n;
            this.$emit('save');
            if (this.sessionActive) this.pushConfig();
        },
        pushConfig() {
            if (this.ws && this.ws.readyState === 1) {
                this.ws.send(JSON.stringify({
                    type: 'set_config',
                    config: { fragen: this.widgetData.fragen, ringe: this.widgetData.ringe || 5 }
                }));
            }
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
                    this.pushConfig();
                }
                if (msg.type === 'student_count') {
                    this.studentCount = msg.count;
                }
                if (msg.type === 'bewertung') {
                    if (!this.widgetData.bewertungen) this.widgetData.bewertungen = [];
                    this.widgetData.bewertungen.push(msg.bewertung);
                    this.$emit('save');
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
        alleLoeschen() {
            if (confirm('Alle Bewertungen löschen?')) {
                this.widgetData.bewertungen = [];
                this.$emit('save');
            }
        },
        async exportBild() {
            if (!window.html2canvas) { alert('Bild-Export nicht verfügbar.'); return; }
            const el = this.$refs.zielscheibeBereich;
            const canvas = await html2canvas(el, {
                backgroundColor: '#1e293b',
                scale: 2,
                useCORS: true,
                logging: false
            });
            const a = document.createElement('a');
            a.href = canvas.toDataURL('image/png');
            a.download = 'reflexionszielscheibe.png';
            document.body.appendChild(a); a.click(); document.body.removeChild(a);
        }
    },
    template: `
    <div @mousedown.stop style="display:flex; flex-direction:column; height:100%; gap:10px; overflow:hidden;">

        <!-- SESSION-PANEL (inaktiv) -->
        <div v-if="!sessionActive"
             style="background:color-mix(in srgb, var(--button-color) 8%, transparent); border:1px dashed var(--button-color); border-radius:10px; padding:10px 14px; display:flex; align-items:center; justify-content:space-between; flex-shrink:0;">
            <span style="font-size:0.85rem; opacity:0.7;">Schüler können noch keine Rückmeldung geben.</span>
            <button @click="startSession"
                    :disabled="wsStatus==='connecting' || fragen.length===0"
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
            <div v-if="showQr"
                 style="display:flex; gap:16px; align-items:flex-start; margin-top:12px; padding-top:12px; border-top:1px solid rgba(255,255,255,0.08);">
                <img :src="qrSrc" @click="qrModalOffen = true" style="width:110px; height:110px; border-radius:8px; background:white; flex-shrink:0; cursor:zoom-in;" alt="QR Code" title="Klicken zum Vergrößern">
                <div style="display:flex; flex-direction:column; gap:5px; min-width:0;">
                    <div style="font-size:0.78rem; opacity:0.55;">Schüler scannen diesen Code:</div>
                    <div style="font-size:0.72rem; word-break:break-all; opacity:0.6; background:rgba(0,0,0,0.2); padding:5px 8px; border-radius:6px;">{{ studentUrl }}</div>
                    <div style="font-size:0.75rem; opacity:0.45; margin-top:2px;">Anonym – kein Name erforderlich.</div>
                </div>
            </div>
        </div>

        <!-- HAUPTBEREICH -->
        <div style="flex:1; display:flex; gap:8px; min-height:0; overflow:hidden;">

            <!-- EXPORT-BEREICH: Legende links + Zielscheibe (wird als PNG exportiert) -->
            <div ref="zielscheibeBereich"
                 style="flex:3; display:flex; gap:0; background:rgba(0,0,0,0.12); border-radius:10px; overflow:hidden; padding:10px; min-width:0;">

                <!-- LEGENDE LINKS -->
                <div v-if="fragen.length > 0"
                     style="width:130px; flex-shrink:0; display:flex; flex-direction:column; gap:6px; padding-right:10px; border-right:1px solid rgba(255,255,255,0.07); overflow-y:auto;">
                    <div v-for="(f, i) in fragen" :key="i" style="display:flex; align-items:flex-start; gap:5px;">
                        <span :style="{background: frageColors[i % frageColors.length]}"
                              style="width:8px; height:8px; border-radius:50%; flex-shrink:0; margin-top:3px; display:inline-block;"></span>
                        <div style="min-width:0;">
                            <div style="font-size:0.7rem; opacity:0.75; line-height:1.35; word-break:break-word;">{{ f }}</div>
                            <div v-if="averages[i] !== null" style="font-size:0.67rem; opacity:0.45;">Ø {{ averages[i] }}</div>
                        </div>
                    </div>
                </div>

                <!-- SVG-Zielscheibe -->
                <div style="flex:1; min-height:0; min-width:0; position:relative; overflow:hidden; padding-left:8px;">

                    <div v-if="bewertungen.length===0 && !verborgenModus"
                         style="position:absolute; text-align:center; opacity:0.3; pointer-events:none; z-index:1; top:50%; left:50%; transform:translate(-50%,-50%);">
                        <div style="font-size:0.85rem;">Noch keine Rückmeldungen.</div>
                    </div>

                    <svg viewBox="0 0 400 400" style="position:absolute; inset:0; width:100%; height:100%; overflow:visible;">
                        <!-- Ringe (von außen nach innen) -->
                        <circle v-for="rg in svgRinge" :key="rg.i"
                                cx="200" cy="200" :r="rg.r"
                                :fill="rg.fill"
                                stroke="rgba(255,255,255,0.14)" stroke-width="1"/>

                        <!-- Fadenkreuz -->
                        <line x1="200" y1="28" x2="200" y2="372" stroke="rgba(255,255,255,0.07)" stroke-width="1"/>
                        <line x1="28" y1="200" x2="372" y2="200" stroke="rgba(255,255,255,0.07)" stroke-width="1"/>

                        <!-- Ringbeschriftungen -->
                        <text v-for="lbl in ringLabels" :key="'l'+lbl.v"
                              :x="lbl.x" :y="lbl.y"
                              fill="rgba(255,255,255,0.28)" font-size="10" text-anchor="middle" dominant-baseline="middle"
                              style="pointer-events:none; user-select:none;">{{ lbl.v }}</text>

                        <!-- Mittelpunkt -->
                        <circle cx="200" cy="200" r="4" fill="rgba(255,255,255,0.25)"/>

                        <!-- Pins -->
                        <circle v-for="pin in svgPins" :key="pin.id"
                                cx="0" cy="0" r="7"
                                :fill="pin.color"
                                opacity="0.82"
                                stroke="rgba(0,0,0,0.45)" stroke-width="1.5"
                                :style="{ transform: 'translate(' + pin.x + 'px,' + pin.y + 'px)', transition: 'transform 0.65s cubic-bezier(0.4,0,0.2,1)' }"/>
                    </svg>

                    <!-- Verborgen-Overlay -->
                    <div v-if="verborgenModus"
                         style="position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; justify-content:center; background:rgba(15,23,42,0.75); border-radius:8px; gap:6px;">
                        <span style="font-size:1.5rem;">🙈</span>
                        <span style="opacity:0.5; font-size:0.85rem;">Ergebnisse verborgen</span>
                        <span v-if="bewertungen.length>0" style="opacity:0.4; font-size:0.75rem;">{{ bewertungen.length }} Rückmeldung{{ bewertungen.length !== 1 ? 'en' : '' }} eingegangen</span>
                    </div>
                </div>

            </div>

            <!-- STEUERUNG TOGGLE -->
            <button @click="steuerungEingeklappt = !steuerungEingeklappt"
                    style="flex-shrink:0; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.08); color:var(--text-color); border-radius:6px; cursor:pointer; width:18px; padding:0; align-self:stretch; font-size:0.65rem; opacity:0.5; transition:opacity 0.15s;"
                    :title="steuerungEingeklappt ? 'Einstellungen aufklappen' : 'Einstellungen einklappen'">{{ steuerungEingeklappt ? '›' : '‹' }}</button>

            <!-- STEUERUNG -->
            <div v-show="!steuerungEingeklappt"
                 style="flex:1.5; min-width:160px; display:flex; flex-direction:column; gap:8px; overflow-y:auto;" class="custom-scrollbar">

                <div style="font-size:0.72rem; opacity:0.45; text-transform:uppercase; letter-spacing:0.05em;">Fragen</div>

                <div v-for="(f, i) in fragen" :key="i" style="display:flex; gap:5px; align-items:center;">
                    <span :style="{background: frageColors[i % frageColors.length], width:'10px', height:'10px', borderRadius:'50%', flex:'0 0 10px'}"></span>
                    <textarea :value="f"
                           @input="e => frageAktualisieren(i, e.target.value)"
                           @blur="frageBlur"
                           rows="3"
                           style="flex:1; background:rgba(255,255,255,0.07); border:1px solid rgba(255,255,255,0.12); border-radius:6px; padding:5px 7px; color:var(--text-color); font-size:0.8rem; font-family:inherit; outline:none; min-width:0; resize:none; line-height:1.35; overflow-y:auto;"></textarea>
                    <span v-if="averages[i] !== null"
                          style="font-size:0.75rem; font-weight:700; flex-shrink:0; opacity:0.75; min-width:30px; text-align:right;">Ø {{ averages[i] }}</span>
                    <button @click="frageLoeschen(i)"
                            style="background:rgba(239,68,68,0.1); border:none; color:#f87171; border-radius:4px; cursor:pointer; padding:3px 6px; font-size:0.72rem; flex-shrink:0;">✕</button>
                </div>

                <button v-if="fragen.length < 8" @click="frageHinzufuegen"
                        style="background:rgba(255,255,255,0.06); border:1px dashed rgba(255,255,255,0.18); color:var(--text-color); border-radius:6px; padding:5px 8px; cursor:pointer; font-size:0.78rem; font-family:inherit; text-align:left; opacity:0.8;">
                    + Frage hinzufügen
                </button>

                <div style="font-size:0.72rem; opacity:0.45; text-transform:uppercase; letter-spacing:0.05em; margin-top:6px;">Skala (Ringe)</div>
                <div style="display:flex; gap:3px;">
                    <button v-for="n in [2,3,4,5,6,7,8,9,10]" :key="n"
                            @click="setRinge(n)"
                            :style="{background: ringe===n ? 'var(--button-color)' : 'rgba(255,255,255,0.07)'}"
                            style="flex:1; border:none; color:var(--text-color); padding:4px 0; border-radius:5px; cursor:pointer; font-size:0.78rem; font-family:inherit; display:flex; align-items:center; justify-content:center;">
                        {{ n }}
                    </button>
                </div>
                <div style="font-size:0.72rem; opacity:0.35; margin-top:2px; line-height:1.4;">
                    Mitte = {{ 1 }} (schwach) · Außen = {{ ringe }} (sehr gut)
                </div>

                <div style="border-top:1px solid rgba(255,255,255,0.08); padding-top:8px; margin-top:4px; font-size:0.82rem; opacity:0.6;">
                    {{ bewertungen.length }} Rückmeldung{{ bewertungen.length !== 1 ? 'en' : '' }}
                </div>

                <button @click="verborgenModus = !verborgenModus"
                        :style="{background: verborgenModus ? 'rgba(239,68,68,0.18)' : 'rgba(255,255,255,0.07)'}"
                        style="border:none; color:var(--text-color); padding:6px 10px; border-radius:6px; cursor:pointer; font-size:0.8rem; font-family:inherit; text-align:left;"
                        :title="verborgenModus ? 'Ergebnisse anzeigen' : 'Ergebnisse verbergen'">
                    {{ verborgenModus ? '👁️ Anzeigen' : '🙈 Verbergen' }}
                </button>

                <button @click="sortiertModus = !sortiertModus"
                        :style="{background: sortiertModus ? 'rgba(59,130,246,0.2)' : 'rgba(255,255,255,0.07)', borderColor: sortiertModus ? 'rgba(59,130,246,0.5)' : 'transparent'}"
                        style="border:1px solid transparent; color:var(--text-color); padding:6px 10px; border-radius:6px; cursor:pointer; font-size:0.8rem; font-family:inherit; text-align:left;"
                        :title="sortiertModus ? 'Gemischt anzeigen' : 'Nach Fragen sortieren'">
                    {{ sortiertModus ? '🔀 Gemischt' : '🗂️ Sortieren' }}
                </button>

                <button @click="exportBild"
                        style="border:none; color:var(--text-color); background:rgba(255,255,255,0.07); padding:6px 10px; border-radius:6px; cursor:pointer; font-size:0.8rem; font-family:inherit; text-align:left;">
                    📷 Als PNG exportieren
                </button>

                <button @click="alleLoeschen"
                        style="border:none; color:#ef4444; background:rgba(239,68,68,0.08); padding:6px 10px; border-radius:6px; cursor:pointer; font-size:0.8rem; font-family:inherit; text-align:left; margin-top:auto;">
                    🗑️ Alle Bewertungen löschen
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
