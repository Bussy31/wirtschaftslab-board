const MedienWidget = {
    props: ['widgetData'],
    template: `
        <div style="width: 100%; height: 100%; display: flex; flex-direction: column; padding: 10px; box-sizing: border-box; overflow: hidden; position: relative; container-type: size;">
            
            <div v-if="showList" style="display: flex; flex-direction: column; height: 100%; overflow: hidden;">        
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(90px, 1fr)); gap: 8px; overflow-y: auto; flex-grow: 1; padding: 2px;" class="custom-scrollbar">
                    <div v-for="medium in medien" :key="medium.id" 
                         @click="toggleMedium(medium.id)"
                         @mousedown.stop
                         @touchstart.stop
                         :style="{ 
                            backgroundColor: isSelected(medium.id) ? medium.color + '30' : 'rgba(255,255,255,0.05)',
                            borderColor: isSelected(medium.id) ? medium.color : 'rgba(255,255,255,0.1)'
                         }"
                         style="display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 10px 5px; border-radius: 8px; border: 2px solid; cursor: pointer; transition: all 0.2s ease; text-align: center;">
                         
                         <span style="font-size: 2rem; margin-bottom: 4px;">{{ medium.icon }}</span>
                         <span style="font-size: 0.8rem; font-weight: 600; color: #e2e8f0; line-height: 1.1;">{{ medium.label }}</span>
                    </div>
                </div>

                <button @click="showList = false" 
                        @mousedown.stop @touchstart.stop
                        style="margin-top: 10px; padding: 10px; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.3); color: white; border-radius: 8px; cursor: pointer; font-weight: bold; flex-shrink: 0; transition: all 0.2s; display: flex; align-items: center; justify-content: center; gap: 8px;">
                    <span>übernehmen</span> 
                </button>
            </div>

            <div v-else 
                 @click="showList = true"
                 @mousedown.stop
                 @touchstart.stop
                 style="width: 95%; height: 95%; margin: auto; display: grid; gap: 8px; cursor: pointer; transition: all 0.3s ease;"
                 :style="{ 
                    gridTemplateColumns: selectedMediaData.length > 1 ? '1fr 1fr' : '1fr', 
                    gridTemplateRows: selectedMediaData.length > 2 ? '1fr 1fr' : '1fr' 
                 }">
                 
                 <div v-if="selectedMediaData.length === 0" style="display: flex; align-items: center; justify-content: center; color: #94a3b8; font-size: clamp(1rem, 10cqmin, 2rem); text-align: center;">
                    Klicke hier, um <br>Medien zu wählen
                 </div>

                 <div v-for="medium in selectedMediaData" :key="medium.id"
                      :style="getDisplayModeStyle(medium)"
                      style="display: flex; flex-direction: column; align-items: center; justify-content: center; border-radius: 12px; transition: all 0.3s ease; text-align: center; overflow: hidden; padding: 5px;">
                      
                      <span :style="{ fontSize: selectedMediaData.length > 2 ? 'clamp(1.5rem, 15cqmin, 4rem)' : 'clamp(2.5rem, 25cqmin, 8rem)' }" style="filter: drop-shadow(0 4px 8px rgba(0,0,0,0.4)); line-height: 1.2;">{{ medium.icon }}</span>
                      
                      <span :style="{ color: medium.color, fontSize: selectedMediaData.length > 2 ? 'clamp(0.8rem, 8cqmin, 1.5rem)' : 'clamp(1rem, 10cqmin, 2.5rem)' }" style="font-weight: bold; margin-top: 5px; letter-spacing: 0.5px; text-shadow: 0 2px 4px rgba(0,0,0,0.5);">
                          {{ medium.label }}
                      </span>
                 </div>
                 
            </div>

        </div>
    `,
    data() {
        return {
            showList: false,
            medien: [
                { id: 'verbot', icon: '📵', label: 'Geräte wegpacken', color: '#ef4444' },
                { id: 'analog', icon: '📚', label: 'Analoges Arbeiten', color: '#f59e0b' },
                { id: 'tablet', icon: '📱', label: 'Tablets / iPads', color: '#3b82f6' },
                { id: 'laptop', icon: '💻', label: 'Laptops nutzen', color: '#8b5cf6' },
                { id: 'kopfhoerer', icon: '🎧', label: 'Kopfhörer erlaubt', color: '#10b981' },
                { id: 'ki_ok', icon: '🤖', label: 'KI-Tools erlaubt', color: '#0ea5e9' },
                { id: 'ki_verbot', icon: '🚫', label: 'Keine KI-Nutzung', color: '#f43f5e' }
            ]
        }
    },
    computed: {
        selectedMediaData() {
            let activeIDs = this.widgetData.activeMedia || [];
            if (this.widgetData.activeMedium && activeIDs.length === 0) {
                activeIDs = [this.widgetData.activeMedium];
                this.widgetData.activeMedia = activeIDs;
            }
            return this.medien.filter(m => activeIDs.includes(m.id));
        }
    },
    created() {
        if (!this.widgetData.activeMedia && !this.widgetData.activeMedium) {
            this.widgetData.activeMedia = ['verbot'];
            this.showList = true;
        }
    },
    methods: {
        isSelected(id) {
            const activeIDs = this.widgetData.activeMedia || [];
            return activeIDs.includes(id);
        },
        toggleMedium(id) {
            if (!this.widgetData.activeMedia) {
                this.widgetData.activeMedia = [];
            }
            const index = this.widgetData.activeMedia.indexOf(id);
            if (index > -1) {
                this.widgetData.activeMedia.splice(index, 1);
            } else {
                this.widgetData.activeMedia.push(id);
            }
            this.$emit('save');
        },
        getDisplayModeStyle(medium) {
            const isGhost = this.widgetData.isTransparent;
            return {
                backgroundColor: isGhost ? 'transparent' : medium.color + '15',
                boxShadow: isGhost ? 'none' : '0 8px 24px ' + medium.color + '20'
            };
        }
    }
};