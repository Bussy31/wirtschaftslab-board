const MedienWidget = {
    props: ['widgetData'],
    template: `
        <div style="width: 100%; height: 100%; display: flex; flex-direction: column; padding: 10px; box-sizing: border-box; overflow: hidden; position: relative; container-type: size;">
            
            <div v-if="showList" style="display: flex; flex-direction: column; gap: 6px; height: 100%; overflow-y: auto;" class="custom-scrollbar">
                <div style="text-align: center; color: #94a3b8; font-size: 0.9rem; margin-bottom: 5px; font-weight: 600;">Medienfreigabe:</div>
                
                <div v-for="medium in medien" :key="medium.id" 
                     @click="selectMedium(medium.id)"
                     @mousedown.stop
                     @touchstart.stop
                     style="flex: 1; min-height: 35px; display: flex; align-items: center; justify-content: flex-start; padding-left: 10%; gap: 15px; border-radius: 8px; cursor: pointer; transition: background 0.2s ease; background-color: rgba(255,255,255,0.05);">
                     
                     <span style="font-size: 1.5rem;">{{ medium.icon }}</span>
                     <span style="font-size: 1rem; font-weight: 600; color: #e2e8f0;">{{ medium.label }}</span>
                </div>
            </div>

            <div v-else 
                 @click="showList = true"
                 @mousedown.stop
                 @touchstart.stop
                 :style="displayModeStyle"
                 style="width: 80%; height: 80%; margin: auto; display: flex; flex-direction: column; align-items: center; justify-content: center; border-radius: 12px; border: none; cursor: pointer; transition: all 0.3s ease; text-align: center; position: relative;">
                 
                 <span style="font-size: clamp(2.5rem, 30cqmin, 8rem); filter: drop-shadow(0 4px 8px rgba(0,0,0,0.4)); line-height: 1.2;">{{ activeMediumData.icon }}</span>
                 
                 <span :style="{ color: activeMediumData.color }" style="font-size: clamp(1rem, 10cqmin, 3rem); font-weight: bold; margin-top: 5px; letter-spacing: 0.5px; text-shadow: 0 2px 4px rgba(0,0,0,0.5);">
                     {{ activeMediumData.label }}
                 </span>
                 
            </div>

        </div>
    `,
    data() {
        return {
            showList: false,
            medien: [
                { id: 'verbot', icon: '📵', label: 'Geräte wegpacken', color: '#ef4444' },     // Rot
                { id: 'analog', icon: '📚', label: 'Analoges Arbeiten', color: '#f59e0b' },    // Orange
                { id: 'tablet', icon: '📱', label: 'Tablets / iPads', color: '#3b82f6' },      // Blau
                { id: 'laptop', icon: '💻', label: 'Laptops nutzen', color: '#8b5cf6' },       // Lila
                { id: 'kopfhoerer', icon: '🎧', label: 'Kopfhörer erlaubt', color: '#10b981' } // Grün
            ]
        }
    },
    computed: {
        activeMediumData() {
            return this.medien.find(m => m.id === this.widgetData.activeMedium) || this.medien[0];
        },
        displayModeStyle() {
            const medium = this.activeMediumData;
            const isGhost = this.widgetData.isTransparent;

            return {
                backgroundColor: isGhost ? 'transparent' : medium.color + '15',
                boxShadow: isGhost ? 'none' : '0 8px 24px ' + medium.color + '20'
            };
        }
    },
    created() {
        // Standardmäßig "Geräte wegpacken" setzen, falls neu
        if (!this.widgetData.activeMedium) {
            this.widgetData.activeMedium = 'verbot';
            this.showList = true;
        }
    },
    methods: {
        selectMedium(id) {
            this.widgetData.activeMedium = id;
            this.$emit('save');
            this.showList = false;
        }
    }
};