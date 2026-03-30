const ArbeitsphaseWidget = {
    props: ['widgetData'],
    template: `
        <div style="width: 100%; height: 100%; display: flex; flex-direction: column; padding: 10px; box-sizing: border-box; gap: 8px; overflow-y: auto;" class="custom-scrollbar">
            
            <div v-for="phase in phasen" :key="phase.id" 
                 @click="setPhase(phase.id)"
                 :style="getPhaseStyle(phase.id)"
                 style="flex: 1; display: flex; align-items: center; justify-content: flex-start; padding-left: 15%; gap: 15px; border-radius: 8px; cursor: pointer; transition: all 0.3s ease; border: 2px solid transparent;">
                 
                 <span style="font-size: 2rem; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.2));">{{ phase.icon }}</span>
                 <span style="font-size: 1.3rem; font-weight: 600; letter-spacing: 0.5px;">{{ phase.label }}</span>
                 
            </div>

        </div>
    `,
    data() {
        return {
            phasen: [
                { id: 'plenum', icon: '🗣️', label: 'Plenum', color: '#8b5cf6' },       // Lila
                { id: 'einzel', icon: '👤', label: 'Einzelarbeit', color: '#3b82f6' }, // Blau
                { id: 'partner', icon: '👥', label: 'Partnerarbeit', color: '#10b981' }, // Grün
                { id: 'gruppe', icon: '🧑‍🤝‍🧑', label: 'Gruppenarbeit', color: '#f59e0b' }, // Orange
                { id: 'klausur', icon: '🤫', label: 'Ruhephase', color: '#ef4444' }     // Rot
            ]
        }
    },
    created() {
        // Standardmäßig Plenum setzen, falls das Widget neu ist
        if (!this.widgetData.activePhase) {
            this.widgetData.activePhase = 'plenum';
        }
    },
    methods: {
        setPhase(id) {
            this.widgetData.activePhase = id;
            this.$emit('save'); // Speichert den Zustand in deinem Board
        },
        getPhaseStyle(id) {
            const isActive = this.widgetData.activePhase === id;
            const phase = this.phasen.find(p => p.id === id);

            if (isActive) {
                return {
                    backgroundColor: phase.color + '33', // Leicht transparenter Hintergrund in der Akzentfarbe
                    borderColor: phase.color,
                    color: '#ffffff',
                    transform: 'scale(1.02)',
                    boxShadow: '0 4px 12px ' + phase.color + '40',
                    filter: 'grayscale(0)'
                }
            } else {
                return {
                    backgroundColor: 'rgba(255, 255, 255, 0.03)',
                    borderColor: 'transparent',
                    color: '#94a3b8',
                    filter: 'grayscale(0.8)',
                    transform: 'scale(1)'
                }
            }
        }
    }
};