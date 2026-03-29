const HandlungsplanWidget = {
    props: ['widgetData'],
    template: `
        <div style="display: flex; flex-direction: column; height: 100%; width: 100%; padding: 5px; box-sizing: border-box; overflow: hidden;">
            
            <div v-if="schritte.length > 0" 
                 style="height: 10px; min-height: 10px; background: rgba(0,0,0,0.6); border-radius: 5px; overflow: hidden; margin-bottom: 12px; border: 1px solid rgba(255,255,255,0.2); flex-shrink: 0; box-shadow: 0 2px 4px rgba(0,0,0,0.3);">
                <div :style="{ width: progress + '%', background: progress === 100 ? '#10b981' : '#3b82f6', height: '100%', transition: 'width 0.4s ease, background 0.4s ease' }"></div>
            </div>

            <div style="flex-grow: 1; overflow-y: auto; min-height: 0; padding-right: 5px; margin-bottom: 10px;" class="custom-scrollbar">
                
                <div v-if="!widgetData.isVisual" style="display: flex; flex-direction: column; gap: 8px;">
                    <div v-for="(schritt, index) in schritte" :key="index" 
                         :style="{
                             display: 'flex', alignItems: 'center', gap: '10px', 
                             background: widgetData.isTransparent ? 'rgba(15, 23, 42, 0.9)' : 'rgba(255,255,255,0.1)', 
                             padding: '10px 12px', borderRadius: '8px', transition: 'all 0.2s', 
                             border: widgetData.isTransparent ? '1px solid rgba(255,255,255,0.2)' : '1px solid rgba(255,255,255,0.05)',
                             boxShadow: widgetData.isTransparent ? '0 4px 8px rgba(0,0,0,0.6)' : 'none'
                         }">
                        
                        <input type="checkbox" :checked="schritt.done" @change="toggleSchritt(index)" style="cursor: pointer; width: 20px; height: 20px; accent-color: #10b981; flex-shrink: 0;">
                        
                        <span :style="{ textDecoration: schritt.done ? 'line-through' : 'none', color: schritt.done ? 'rgba(255,255,255,0.5)' : 'white', flexGrow: 1, fontSize: '1.05rem', cursor: 'pointer', textShadow: widgetData.isTransparent ? '0px 1px 3px rgba(0,0,0,0.8)' : 'none' }"
                              @click="toggleSchritt(index)">
                            {{ schritt.text }}
                        </span>

                        <button v-if="!widgetData.isTransparent" @click.stop="removeSchritt(index)" style="background: transparent; border: none; color: #ef4444; cursor: pointer; font-size: 1.2rem; opacity: 0.6; padding: 0; flex-shrink: 0;">✖</button>
                    </div>
                </div>

                <div v-if="widgetData.isVisual" style="display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 10px; background: widgetData.isTransparent ? 'transparent' : 'rgba(0,0,0,0.15)'; border-radius: 8px;">
                    <template v-for="(schritt, index) in schritte" :key="'vis_'+index">
                        
                        <div @click="toggleSchritt(index)" 
                             :style="{
                                width: '90%',
                                background: schritt.done ? 'rgba(16, 185, 129, 0.95)' : 'rgba(37, 99, 235, 0.95)',
                                border: schritt.done ? '2px solid #059669' : '2px solid #1d4ed8',
                                color: schritt.done ? 'rgba(255,255,255,0.6)' : 'white',
                                textDecoration: schritt.done ? 'line-through' : 'none',
                                padding: '10px 15px',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                fontWeight: 'bold',
                                textAlign: 'center',
                                transition: 'all 0.3s',
                                boxShadow: '0 4px 8px rgba(0,0,0,0.5)',
                                textShadow: schritt.done ? 'none' : '0 1px 2px rgba(0,0,0,0.5)'
                             }">
                            {{ index + 1 }}. {{ schritt.text }}
                        </div>
                        
                        <div v-if="index < schritte.length - 1" 
                             :style="{ 
                                color: schritt.done ? '#10b981' : (widgetData.isTransparent ? 'white' : 'rgba(255,255,255,0.5)'), 
                                fontSize: '1.5rem', fontWeight: 'bold', margin: '-4px 0',
                                textShadow: widgetData.isTransparent ? '0 2px 4px rgba(0,0,0,0.8)' : 'none'
                             }">
                            ⬇
                        </div>
                    </template>
                </div>

                <div v-if="schritte.length === 0" style="text-align: center; color: rgba(255,255,255,0.4); margin-top: 20px; font-style: italic;">
                    Noch keine Schritte geplant...
                </div>
            </div>

            <div v-if="!widgetData.isTransparent" style="display: flex; gap: 8px; flex-shrink: 0; padding-top: 5px; border-top: 1px solid rgba(255,255,255,0.1);">
                <input type="text" v-model="neuerSchritt" @keyup.enter="addSchritt" placeholder="Neuer Schritt..." 
                       style="flex-grow: 1; background: rgba(0,0,0,0.2); color: white; border: 1px solid rgba(255,255,255,0.2); border-radius: 8px; padding: 10px; font-size: 1rem; outline: none;">
                <button @click="addSchritt" style="background: #3b82f6; border: none; padding: 0 15px; border-radius: 8px; color: white; cursor: pointer; font-size: 1.2rem;">
                    ➕
                </button>
            </div>
        </div>
    `,
    data() {
        return {
            schritte: this.widgetData.schritte || [],
            neuerSchritt: ''
        }
    },
    computed: {
        progress() {
            if (this.schritte.length === 0) return 0;
            const doneCount = this.schritte.filter(s => s.done).length;
            return Math.round((doneCount / this.schritte.length) * 100);
        }
    },
    methods: {
        addSchritt() {
            if (this.neuerSchritt.trim() === '') return;
            this.schritte.push({ text: this.neuerSchritt.trim(), done: false });
            this.neuerSchritt = '';
            this.saveState();
        },
        toggleSchritt(index) {
            this.schritte[index].done = !this.schritte[index].done;
            this.saveState();
        },
        removeSchritt(index) {
            this.schritte.splice(index, 1);
            if(this.schritte.length === 0) this.widgetData.isVisual = false;
            this.saveState();
        },
        saveState() {
            this.widgetData.schritte = this.schritte;
            this.$emit('save');
        }
    }
};