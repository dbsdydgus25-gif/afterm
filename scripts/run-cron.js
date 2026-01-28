import http from 'http'; // Using http for localhost

console.log("=== AFTERM LOCAL CRON SIMULATOR ===");
console.log("Simulating periodic checks every 60 seconds...");
console.log("Press Ctrl+C to stop.\n");

function triggerCron() {
    const req = http.request('http://localhost:3000/api/cron/process', { method: 'GET' }, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
            console.log(`[${new Date().toLocaleTimeString()}] Triggered: Status ${res.statusCode}`);
            // Optional: Print details if needed
            try {
                const json = JSON.parse(data);
                if (json.processed > 0) {
                    console.log("   -> Processed actions:", JSON.stringify(json.details));
                }
            } catch (e) { }
        });
    });

    req.on('error', (e) => {
        console.error(`[${new Date().toLocaleTimeString()}] Error: Is the server running? (${e.message})`);
    });

    req.end();
}

// Initial run
triggerCron();

// Setup interval
setInterval(triggerCron, 60 * 1000);
