import { useEffect, useState } from "react";
import "./App.css";

const API = "https://wifisentinel-backend.onrender.com";

function App() {
  const [events, setEvents] = useState([]);
  const [status, setStatus] = useState("Connecting...");
   
  const [stats, setStats] = useState({
    networksDetected: 0,
    trustedNetworks: 0,
    suspiciousEvents: 0,
    activeThreats: 0
    });

  useEffect(() => {
  Promise.all([
    fetch(`${API}/api/events`).then((res) => res.json()),
    fetch(`${API}/api/dashboard/stats`).then((res) => res.json())
  ])
    .then(([eventsData, statsData]) => {
      setEvents(eventsData);
      setStats(statsData);
      setStatus("Connected");
    })
    .catch((error) => {
      console.error(error);
      setStatus("Backend connection failed");
    });
}, []);

 
  return (
    <div className="app">

      {/* SIDEBAR */}
      <aside className="sidebar">
        <div className="logo">
          <div className="logo-icon">◉</div>
          <div>
            <h2>WiFiSentinel</h2>
            <span>Security Monitor</span>
          </div>
        </div>

        <nav>
          <a className="active">Dashboard</a>
          <a>Live Scanner</a>
          <a>Threat Alerts</a>
          <a>Event History</a>
          <a>Trusted Networks</a>
          <a>Sensor Status</a>
        </nav>

        <div className="sidebar-bottom">
          <span>System Status</span>
          <strong className="online">● Online</strong>
        </div>
      </aside>

      {/* MAIN */}
      <main className="main">

        <header className="topbar">
          <div>
            <h1>Security Dashboard</h1>
            <p>IoT-based Wi-Fi threat monitoring system</p>
          </div>

          <div className="connection">
            <span className="dot"></span>
            {status}
          </div>
        </header>

        {/* STAT CARDS */}
        <section className="stats">

          <div className="card">
            <span>Networks Detected</span>
            <strong>{stats.networksDetected}</strong>
            <small>Live scanner</small>
          </div>

          <div className="card">
            <span>Trusted Networks</span>
            <strong>{stats.trustedNetworks}</strong>
            <small>Configured</small>
          </div>

          <div className="card warning">
            <span>Suspicious</span>
            <strong>{stats.suspiciousEvents}</strong>
            <small>Detected events</small>
          </div>

          <div className="card danger">
            <span>Active Threats</span>
            <strong>{stats.activeThreats}</strong>
            <small>Requires attention</small>
          </div>

        </section>

        {/* CONTENT GRID */}
        <section className="grid">

          {/* THREAT PANEL */}
          <div className="panel threat-panel">
            <div className="panel-header">
              <div>
                <h2>Recent Threat Events</h2>
                <p>Security events detected by ESP8266 sensors</p>
              </div>

              <span className="badge">LIVE</span>
            </div>

            {events.length === 0 ? (
              <div className="empty">
                <div className="empty-icon">✓</div>
                <h3>No events loaded</h3>
                <p>
                  Dashboard API endpoints will be connected next.
                </p>
              </div>
            ) : (
              <div className="events">
                {events.map((event, index) => (
                  <div className="event" key={index}>
                    <div className="event-icon">!</div>

                    <div className="event-info">
                      <strong>
                        {event.event_type || "Security Event"}
                      </strong>

                      <span>
                        {event.ssid || "Unknown SSID"}
                      </span>

                      <small>
                        BSSID: {event.bssid || "Unknown"}
                      </small>
                    </div>

                    <div className="event-status">
                      {event.classification || "SUSPICIOUS"}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* SENSOR PANEL */}
          <div className="panel">
            <div className="panel-header">
              <div>
                <h2>Sensor Status</h2>
                <p>WiFiSentinel hardware</p>
              </div>
            </div>

            <div className="sensor">
              <div className="sensor-icon">ESP</div>

              <div>
                <strong>ESP8266-01</strong>
                <span>Wi-Fi Security Sensor</span>
              </div>

              <div className="sensor-online">
                ● Online
              </div>
            </div>

            <div className="sensor-details">
              <div>
                <span>Connection</span>
                <strong>Wi-Fi</strong>
              </div>

              <div>
                <span>Database</span>
                <strong>PostgreSQL</strong>
              </div>

              <div>
                <span>Backend</span>
                <strong>Node.js</strong>
              </div>
            </div>
          </div>

        </section>

        {/* TRUSTED NETWORK */}
        <section className="panel trusted">
          <div className="panel-header">
            <div>
              <h2>Trusted Network</h2>
              <p>Configured network baseline</p>
            </div>

            <span className="trusted-badge">TRUSTED</span>
          </div>

          <div className="network-row">
            <div>
              <strong>Jagtap_4G</strong>
              <span>Trusted Wi-Fi network</span>
            </div>

            <div>
              <span>BSSID</span>
              <strong>40:33:06:E0:99:31</strong>
            </div>

            <div>
              <span>Status</span>
              <strong className="online"> Active</strong>
            </div>
          </div>
        </section>

        <footer>
          WiFiSentinel • IoT-Based Wi-Fi Threat Detection & Security Monitoring
        </footer>

      </main>
    </div>
  );
}

export default App;