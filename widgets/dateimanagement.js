const DateimanagementWidget = {
    props: ['widgetData'],
    template: `
        <div style="width: 100%; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; overflow: hidden; position: relative; container-type: size;"
             @dragover.prevent="dragOver = true"
             @dragleave.prevent="dragOver = false"
             @drop.prevent="handleDrop">

            <img v-if="widgetData.dateiUrl && isImage" :src="widgetData.dateiUrl" style="max-width: 100%; max-height: 100%; object-fit: contain; pointer-events: none;" />

            <iframe v-else-if="widgetData.dateiUrl && isPdf" :src="widgetData.dateiUrl" style="width: 100%; height: 100%; border: none;"></iframe>

            <div v-else :style="{ border: dragOver ? '3px dashed var(--button-color)' : '3px dashed rgba(255,255,255,0.2)', background: dragOver ? 'rgba(255,255,255,0.05)' : 'transparent' }"
                 style="width: 90%; height: 90%; border-radius: 12px; display: flex; flex-direction: column; align-items: center; justify-content: center; cursor: pointer; text-align: center; padding: 20px; transition: all 0.2s;"
                 @click="$refs.fileInput.click()">
                <span style="font-size: 3rem; margin-bottom: 10px; opacity: 0.8;">📁</span>
                <p style="margin: 0; font-size: 1.2rem; color: var(--text-color); font-weight: bold;">Datei hierher ziehen</p>
                <p style="margin: 5px 0 0 0; font-size: 0.9rem; color: var(--text-color); opacity: 0.6;">Bild oder PDF</p>
                <input type="file" ref="fileInput" @change="handleFileUpload" accept="image/*, application/pdf" style="display: none;">
            </div>

            <button v-if="widgetData.dateiUrl" @click.stop="clearDatei" 
                style="background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); border-radius: 4px; padding: 2px 6px; font-size: 0.8rem; color: #ffffff; cursor: pointer; height: 24px; transition: background 0.2s, border-color 0.2s; margin-right: 5px;"
                onmouseover="this.style.background='rgba(239, 68, 68, 0.8)'; this.style.borderColor='rgba(239, 68, 68, 1)';" 
                onmouseout="this.style.background='rgba(255,255,255,0.1)'; this.style.borderColor='rgba(255,255,255,0.2)';"
                title="Datei entfernen">
            ✕
</button>
        </div>
    `,
    data() {
        return { dragOver: false }
    },
    computed: {
        isImage() { return this.widgetData.dateiType && this.widgetData.dateiType.startsWith('image/'); },
        isPdf() { return this.widgetData.dateiType === 'application/pdf'; }
    },
    methods: {
        handleDrop(event) {
            this.dragOver = false;
            const file = event.dataTransfer.files[0];
            if (file) this.processFile(file);
        },
        handleFileUpload(event) {
            const file = event.target.files[0];
            if (file) this.processFile(file);
        },
        processFile(file) {
            if (file.type.startsWith('image/')) {
                this.compressImage(file, (compressedBase64) => {
                    this.widgetData.dateiUrl = compressedBase64;
                    this.widgetData.dateiType = 'image/jpeg';
                    this.$emit('save');
                });
            } else if (file.type === 'application/pdf') {
                if (file.size > 2.5 * 1024 * 1024) {
                    alert("⚠️ Diese PDF ist zu groß (über 2.5 MB). PDFs können nicht automatisch komprimiert werden.");
                    return;
                }
                const reader = new FileReader();
                reader.onload = (e) => {
                    this.widgetData.dateiUrl = e.target.result;
                    this.widgetData.dateiType = file.type;
                    this.$emit('save');
                };
                reader.readAsDataURL(file);
            }
        },
        compressImage(file, callback) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    let width = img.width;
                    let height = img.height;
                    const MAX_WIDTH = 1920;
                    const MAX_HEIGHT = 1080;

                    if (width > height) {
                        if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; }
                    } else {
                        if (height > MAX_HEIGHT) { width *= MAX_HEIGHT / height; height = MAX_HEIGHT; }
                    }

                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);
                    callback(canvas.toDataURL('image/jpeg', 0.7));
                };
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
        },
        clearDatei() {
            if(confirm("Möchtest du diese Datei vom Board entfernen?")) {
                this.widgetData.dateiUrl = null;
                this.widgetData.dateiType = null;
                this.$emit('save');
            }
        }
    }
};