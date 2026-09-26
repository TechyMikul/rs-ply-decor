/**
 * RS Ply & Decor - Cloud Sync Configuration (Supabase & Cloudinary)
 * Auto-generated and synced with Admin Portal settings and website/data/cloud-config.json.
 */
(function() {
    const serverConfig = {
  "supabase": {
    "url": "",
    "anonKey": "",
    "tableName": "products"
  },
  "cloudinary": {
    "cloudName": "",
    "uploadPreset": "",
    "folder": "rs-ply-decor"
  }
};
    let stored = null;
    try {
        const raw = localStorage.getItem('rs_cloud_config');
        if (raw) stored = JSON.parse(raw);
    } catch(e) {}

    window.RS_CLOUD_CONFIG = {
        supabase: Object.assign({}, serverConfig.supabase || {}, (stored && stored.supabase) || {}),
        cloudinary: Object.assign({}, serverConfig.cloudinary || {}, (stored && stored.cloudinary) || {})
    };

    window.saveRSCloudConfig = async function(newConfig) {
        window.RS_CLOUD_CONFIG = {
            supabase: Object.assign({}, window.RS_CLOUD_CONFIG.supabase, newConfig.supabase || {}),
            cloudinary: Object.assign({}, window.RS_CLOUD_CONFIG.cloudinary, newConfig.cloudinary || {})
        };
        try {
            localStorage.setItem('rs_cloud_config', JSON.stringify(window.RS_CLOUD_CONFIG));
        } catch(e) {}
        try {
            await fetch('/api/config', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(window.RS_CLOUD_CONFIG)
            });
        } catch(e) {}
        return window.RS_CLOUD_CONFIG;
    };
})();
