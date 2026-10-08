const express = require("express");
const cors = require("cors");
const pool = require("./db");

const app = express();

app.use(express.json());
app.use(cors());

// =====================================================
// RECEIVE SECURITY EVENTS FROM ESP8266
// =====================================================

app.post("/api/events", async (req, res) => {
    const {
        sensor_id,
        event_type,
        ssid,
        bssid,
        rssi,
        channel,
        classification
    } = req.body;

    if (!sensor_id || !event_type || !ssid || !bssid) {
        return res.status(400).json({
            success: false,
            message: "Missing required event data"
        });
    }

    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        // 1. Register sensor if it doesn't already exist
        const sensorResult = await client.query(
            `
            INSERT INTO sensors (sensor_uid, name, last_seen)
            VALUES ($1, $1, CURRENT_TIMESTAMP)
            ON CONFLICT (sensor_uid)
            DO UPDATE SET last_seen = CURRENT_TIMESTAMP
            RETURNING sensor_id
            `,
            [sensor_id]
        );

        const dbSensorId = sensorResult.rows[0].sensor_id;

        // 2. Store the Wi-Fi observation
        const observationResult = await client.query(
            `
            INSERT INTO observations
            (sensor_id, ssid, bssid, rssi, channel, classification)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING observation_id
            `,
            [
                dbSensorId,
                ssid,
                bssid,
                rssi,
                channel,
                classification
            ]
        );

        const observationId =
            observationResult.rows[0].observation_id;

        // 3. Store the security event
        const eventResult = await client.query(
            `
            INSERT INTO threat_events
            (observation_id, sensor_id, event_type, severity, status)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING event_id
            `,
            [
                observationId,
                dbSensorId,
                event_type,
                classification,
                "ACTIVE"
            ]
        );

        const eventId = eventResult.rows[0].event_id;

        await client.query("COMMIT");

        console.log("\n=== SECURITY EVENT STORED ===");
        console.log("Event ID:", eventId);
        console.log("Observation ID:", observationId);
        console.log("Sensor:", sensor_id);
        console.log("SSID:", ssid);
        console.log("BSSID:", bssid);
        console.log("Classification:", classification);

        res.status(201).json({
            success: true,
            message: "Security event stored",
            event_id: eventId,
            observation_id: observationId
        });

    } catch (error) {

        await client.query("ROLLBACK");

        console.error("Database error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to store security event",
            error: error.message
        });

    } finally {
        client.release();
    }
});


// =====================================================
// DATABASE TEST
// =====================================================

app.get("/api/db-test", async (req, res) => {
    try {
        const result = await pool.query("SELECT NOW()");

        res.json({
            success: true,
            database: "WiFiSentinel",
            time: result.rows[0].now
        });

    } catch (error) {

        console.error("Database error:", error);

        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});


// =====================================================
// HOME
// =====================================================

app.get("/", (req, res) => {
    res.send("WiFiSentinel Backend is running");
});


// =====================================================
// START SERVER
// =====================================================
// =====================================================
// DASHBOARD - RECENT THREAT EVENTS
// =====================================================

app.get("/api/events", async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT
                te.event_id,
                te.event_type,
                te.severity,
                te.status,
                te.first_seen,
                te.last_seen,
                o.ssid,
                o.bssid,
                o.rssi,
                o.channel,
                o.classification
            FROM threat_events te
            JOIN observations o
                ON te.observation_id = o.observation_id
            ORDER BY te.event_id DESC
            LIMIT 20
        `);

        res.json(result.rows);

    } catch (error) {
        console.error("Dashboard events error:", error);

        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});
// =====================================================
// DASHBOARD STATISTICS
// =====================================================

app.get("/api/dashboard/stats", async (req, res) => {
    try {
        const observations = await pool.query(`
            SELECT COUNT(*) AS count
            FROM observations
        `);

        const trusted = await pool.query(`
            SELECT COUNT(*) AS count
            FROM trusted_networks
            WHERE enabled = TRUE
        `);

        const suspicious = await pool.query(`
            SELECT COUNT(*) AS count
            FROM threat_events
            WHERE severity = 'SUSPICIOUS'
        `);

        const active = await pool.query(`
            SELECT COUNT(*) AS count
            FROM threat_events
            WHERE status = 'ACTIVE'
        `);

        res.json({
            networksDetected: Number(observations.rows[0].count),
            trustedNetworks: Number(trusted.rows[0].count),
            suspiciousEvents: Number(suspicious.rows[0].count),
            activeThreats: Number(active.rows[0].count)
        });

    } catch (error) {
        console.error("Dashboard stats error:", error);

        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});
const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
    console.log(`WiFiSentinel backend running on port ${PORT}`);
});