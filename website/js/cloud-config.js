/**
 * RS Ply & Decor - Cloud Sync Configuration (Supabase & Cloudinary)
 * Auto-generated and synced with Admin Portal settings and website/data/cloud-config.json.
 */
(function() {
    const serverConfig = {
      "supabase": {
        "url": "https://ngvzcgkavebsrcxqkgsc.supabase.co",
        "anonKey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ndnpjZ2thdmVic3JjeHFrZ3NjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAzOTI4MzUsImV4cCI6MjEwNTk2ODgzNX0.jh4HOGSxQz3NKHjiHc2MDt4TYDifYcK1j5omRSirc7Y",
        "tableName": "products"
      },
      "cloudinary": {
        "cloudName": "citxomfv",
        "uploadPreset": "RSPLYPHOTO",
        "folder": "rs-ply-decor"
      }
    };
    let stored = null;
    try {
        const raw = localStorage.getItem('rs_cloud_config');
        if (raw) stored = JSON.parse(raw);
    } catch(e) {}

    const cleanStoredSupabase = (stored && stored.supabase && stored.supabase.url) ? stored.supabase : {};
    const cleanStoredCloudinary = (stored && stored.cloudinary && stored.cloudinary.cloudName) ? stored.cloudinary : {};

    window.RS_CLOUD_CONFIG = {
        supabase: Object.assign({}, serverConfig.supabase, cleanStoredSupabase),
        cloudinary: Object.assign({}, serverConfig.cloudinary, cleanStoredCloudinary)
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
