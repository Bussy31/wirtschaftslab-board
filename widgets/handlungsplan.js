const HandlungsplanWidget = {
    props: ['widgetData'],
    template: `
        <div style="display: flex; flex-direction: column; height: 100%; width: 100%; padding: 5px; box-sizing: border-box; overflow: hidden;">
            
            <div v-if="schritte.length > 0" 
                 style="position: relative; height: 22px; min-height: 22px; background: rgba(0,0,0,0.6); border-radius: 11px; overflow: hidden; margin-bottom: 12px; border: 1px solid rgba(255,255,255,0.2); flex-shrink: 0; box-shadow: 0 2px 4px rgba(0,0,0,0.3);">
                
                <div :style="{ width: progress + '%', background: progress === 100 ? '#10b981' : '#3b82f6', height: '100%', transition: 'width 0.4s ease, background 0.4s ease' }"></div>
                
                <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; display: flex; align-items: center; justify-content: center; font-size: 0.8rem; font-weight: bold; color: white; text-shadow: 0 1px 3px rgba(0,0,0,0.9); pointer-events: none;">
                    Fortschritt ({{ progress }}%)
                </div>
            </div>

            <div style="position: relative; flex-grow: 1; margin-bottom: 10px;">
                <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; overflow-y: auto; padding-right: 5px;" class="custom-scrollbar">
                    
                    <div v-if="!widgetData.isVisual" style="display: flex; flex-direction: column; gap: 8px;">
                        <div v-for="(schritt, index) in schritte" :key="index" 
                             :style="{
                                 display: 'flex', alignItems: 'center', gap: '8px', 
                                 background: widgetData.isTransparent ? 'rgba(15, 23, 42, 0.9)' : 'rgba(255,255,255,0.1)', 
                                 padding: '10px 12px', borderRadius: '8px', transition: 'all 0.2s', 
                                 border: widgetData.isTransparent ? '1px solid rgba(255,255,255,0.2)' : '1px solid rgba(255,255,255,0.05)',
                                 boxShadow: widgetData.isTransparent ? '0 4px 8px rgba(0,0,0,0.6)' : 'none'
                             }">
                            <input type="checkbox" :checked="schritt.done" @change="toggleSchritt(index)" style="cursor: pointer; width: 20px; height: 20px; accent-color: #3b82f6; flex-shrink: 0;">
                            <span :style="{ textDecoration: schritt.done ? 'line-through' : 'none', color: schritt.done ? 'rgba(255,255,255,0.5)' : 'white', flexGrow: 1, fontSize: '1.05rem', cursor: 'pointer', textShadow: widgetData.isTransparent ? '0px 1px 3px rgba(0,0,0,0.8)' : 'none' }"
                                  @click="toggleSchritt(index)">
                                {{ schritt.text }}
                            </span>
                            <div v-if="!widgetData.isTransparent" style="display: flex; gap: 5px; flex-shrink: 0; align-items: center;">
                                <button @click.stop="moveUp(index)" :disabled="index === 0" :style="{ opacity: index === 0 ? 0.3 : 0.8, background: 'transparent', border: 'none', color: 'white', cursor: index === 0 ? 'default' : 'pointer', fontSize: '1.2rem' }">⬆️</button>
                                <button @click.stop="moveDown(index)" :disabled="index === schritte.length - 1" :style="{ opacity: index === schritte.length - 1 ? 0.3 : 0.8, background: 'transparent', border: 'none', color: 'white', cursor: index === schritte.length - 1 ? 'default' : 'pointer', fontSize: '1.2rem' }">⬇️</button>
                                <button @click.stop="removeSchritt(index)" style="background: transparent; border: none; color: #ef4444; cursor: pointer; font-size: 1.2rem; opacity: 0.8;">✖</button>
                            </div>
                        </div>
                    </div>

                    <div v-if="widgetData.isVisual" style="display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 10px; background: widgetData.isTransparent ? 'transparent' : 'rgba(0,0,0,0.15)'; border-radius: 8px;">
                        <template v-for="(schritt, index) in schritte" :key="'vis_'+index">
                            <div @click="toggleSchritt(index)" 
                                 :style="{
                                    width: '90%',
                                    background: widgetData.isTransparent ? 'rgba(15, 23, 42, 0.9)' : (schritt.done ? 'rgba(16, 185, 129, 0.2)' : 'rgba(59, 130, 246, 0.2)'),
                                    border: widgetData.isTransparent ? '1px solid rgba(255,255,255,0.2)' : (schritt.done ? '2px solid rgba(16, 185, 129, 0.4)' : '2px solid rgba(59, 130, 246, 0.6)'),
                                    color: schritt.done ? 'rgba(255,255,255,0.5)' : 'white',
                                    textDecoration: schritt.done ? 'line-through' : 'none',
                                    padding: '10px 15px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', textAlign: 'center', transition: 'all 0.3s',
                                    boxShadow: widgetData.isTransparent ? '0 4px 8px rgba(0,0,0,0.6)' : 'none'
                                 }">
                                {{ index + 1 }}. {{ schritt.text }}
                            </div>
                            <div v-if="index < schritte.length - 1" 
                                 :style="{ 
                                    color: (widgetData.isTransparent ? 'white' : 'rgba(255,255,255,0.5)'), 
                                    fontSize: '1.5rem', fontWeight: 'bold', margin: '-4px 0',
                                    textShadow: widgetData.isTransparent ? '0 2px 4px rgba(0,0,0,0.8)' : 'none'
                                 }">
                                ⬇
                            </div>
                        </template>
                    </div>
                </div>
            </div>

            <div v-if="!widgetData.isTransparent" style="display: flex; gap: 8px; flex-shrink: 0; padding-top: 5px; border-top: 1px solid rgba(255,255,255,0.1);">
                <input type="text" v-model="neuerSchritt" @keyup.enter="addSchritt" placeholder="Neuer Schritt..." style="flex-grow: 1; background: rgba(0,0,0,0.2); color: white; border: 1px solid rgba(255,255,255,0.2); border-radius: 8px; padding: 10px;">
                <button @click="addSchritt" style="background: #3b82f6; border: none; padding: 0 15px; border-radius: 8px; color: white; cursor: pointer;">➕</button>
            </div>
        </div>
    `,
    data() {
        return { schritte: this.widgetData.schritte || [], neuerSchritt: '' }
    },
    computed: {
        progress() {
            if (this.schritte.length === 0) return 0;
            return Math.round((this.schritte.filter(s => s.done).length / this.schritte.length) * 100);
        }
    },
    methods: {
        addSchritt() {
            if (!this.neuerSchritt.trim()) return;
            this.schritte.push({ text: this.neuerSchritt.trim(), done: false });
            this.neuerSchritt = '';
            this.saveState();
        },
        toggleSchritt(index) { this.schritte[index].done = !this.schritte[index].done; this.saveState(); },
        removeSchritt(index) { this.schritte.splice(index, 1); this.saveState(); },
        moveUp(index) { if (index === 0) return; const el = this.schritte.splice(index, 1)[0]; this.schritte.splice(index - 1, 0, el); this.saveState(); },
        moveDown(index) { if (index === this.schritte.length - 1) return; const el = this.schritte.splice(index, 1)[0]; this.schritte.splice(index + 1, 0, el); this.saveState(); },
        saveState() { this.widgetData.schritte = this.schritte; this.$emit('save'); }
    }
};