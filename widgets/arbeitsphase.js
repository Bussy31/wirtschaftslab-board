const ArbeitsphaseWidget = {
    props: ['widgetData'],
    template: `
        <div style="width: 100%; height: 100%; display: flex; flex-direction: column; padding: 10px; box-sizing: border-box; overflow: hidden; position: relative; container-type: size;">
            
            <div v-if="showList" style="display: flex; flex-direction: column; gap: 6px; height: 100%; overflow-y: auto;" class="custom-scrollbar">
                <div style="text-align: center; color: #94a3b8; font-size: 0.9rem; margin-bottom: 5px; font-weight: 600;">Phase wählen:</div>
                
                <div v-for="phase in phasen" :key="phase.id" 
                     @click="selectPhase(phase.id)"
                     @mousedown.stop
                     @touchstart.stop
                     style="flex: 1; min-height: 35px; display: flex; align-items: center; justify-content: flex-start; padding-left: 10%; gap: 15px; border-radius: 8px; cursor: pointer; transition: background 0.2s ease; background-color: rgba(255,255,255,0.05);">
                     
                     <span style="font-size: 1.5rem;">{{ phase.icon }}</span>
                     <span style="font-size: 1rem; font-weight: 500; color: var(--text-color);">{{ phase.label }}</span>
                </div>
            </div>

            <div v-else 
                 @click="showList = true"
                 @mousedown.stop
                 @touchstart.stop
                 :style="[{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '15px', borderRadius: '12px', cursor: 'pointer', transition: 'all 0.3s ease' }, displayModeStyle]">
                
                <span :style="{ fontSize: 'clamp(3rem, 25cqw, 10rem)', filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.4))', transition: 'transform 0.2s ease' }">
                    {{ activePhaseData.icon }}
                </span>
                
                <span :style="{ fontSize: 'clamp(1.5rem, 12cqw, 4rem)', fontWeight: 'bold', color: 'var(--text-color)', textShadow: '0 2px 10px rgba(0,0,0,0.5)', textAlign: 'center' }">
                    {{ activePhaseData.label }}
                </span>
                 
            </div>

        </div>
    `,
    data() {
        return {
            showList: false,
            phasen: [
                { id: 'plenum', icon: '🗣️', label: 'Plenum', color: '#8b5cf6' },
                { id: 'einzel', icon: '👤', label: 'Einzelarbeit', color: '#3b82f6' },
                { id: 'partner', icon: '👥', label: 'Partnerarbeit', color: '#10b981' },
                { id: 'gruppe', icon: '💡', label: 'Gruppenarbeit', color: '#f59e0b' },
                { id: 'klausur', icon: '🤫', label: 'Ruhephase', color: '#ef4444' }
            ]
        }
    },
    computed: {
        activePhaseData() {
            return this.phasen.find(p => p.id === this.widgetData.activePhase) || this.phasen[0];
        },
        displayModeStyle() {
            const phase = this.activePhaseData;
            const isGhost = this.widgetData.isTransparent;

            return {
                backgroundColor: isGhost ? 'transparent' : phase.color + '15',
                boxShadow: isGhost ? 'none' : '0 8px 24px ' + phase.color + '20'
            };
        }
    },
    created() {
        if (!this.widgetData.activePhase) {
            this.widgetData.activePhase = 'plenum';
        }
    },
    methods: {
        selectPhase(phaseId) {
            this.widgetData.activePhase = phaseId;
            this.showList = false;
            this.$emit('save');
        }
    }
};