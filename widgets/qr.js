const QrWidget = {
    props: ['widgetData'],
    template: `
        <div style="width: 100%; height: 100%; display: flex; flex-direction: column; padding: 5px; gap: 10px; box-sizing: border-box; align-items: center;">
            
            <input 
                type="text" 
                v-model="url" 
                @input="saveState"
                placeholder="Link einfügen (z.B. kahoot.it)..." 
                style="width: 100%; background: rgba(0,0,0,0.2); color: white; border: 1px solid rgba(255,255,255,0.2); border-radius: 8px; padding: 8px; text-align: center; font-size: 0.9rem; box-sizing: border-box;">
            
            <div style="flex: 1; display: flex; align-items: center; justify-content: center; width: 100%; background: white; border-radius: 8px; padding: 10px; box-sizing: border-box;">
                <img v-if="url" :src="'https://api.qrserver.com/v1/create-qr-code/?size=300x300&margin=0&data=' + encodeURIComponent(url)" style="width: 100%; height: 100%; object-fit: contain;">
                <span v-else style="color: #64748b; font-size: 0.9rem; text-align: center;">QR-Code erscheint hier</span>
            </div>
        </div>
    `,
    data() {
        return {
            url: this.widgetData.url || ''
        }
    },
    methods: {
        saveState() {
            this.widgetData.url = this.url;
            this.$emit('save');
        }
    }
};