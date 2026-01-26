# Frontend Socket.IO Real-time Updates Guide

This guide shows how to connect to Socket.IO in your frontend to receive real-time parking entry updates.

## Socket.IO Server

**Connection URL:**
```
http://103.143.40.46:8084
```
or
```
https://amarhome.mn
```

## Installation

### React / Next.js

```bash
npm install socket.io-client
```

### Vanilla JavaScript

```html
<script src="https://cdn.socket.io/4.5.4/socket.io.min.js"></script>
```

---

## Connection Setup

### React Hook Example

```javascript
import { useEffect, useState } from 'react';
import io from 'socket.io-client';

function useParkingSocket(baiguullagiinId, barilgiinId = null) {
  const [socket, setSocket] = useState(null);
  const [parkingEntries, setParkingEntries] = useState([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Connect to Socket.IO server
    const socketInstance = io('http://103.143.40.46:8084', {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    // Connection events
    socketInstance.on('connect', () => {
      console.log('✅ Socket.IO connected:', socketInstance.id);
      setIsConnected(true);
    });

    socketInstance.on('disconnect', () => {
      console.log('❌ Socket.IO disconnected');
      setIsConnected(false);
    });

    socketInstance.on('connect_error', (error) => {
      console.error('❌ Socket.IO connection error:', error);
    });

    // Listen for new parking entries - Organization level
    socketInstance.on(`parkingEntry/${baiguullagiinId}`, (data) => {
      console.log('📥 New parking entry (org level):', data);
      setParkingEntries(prev => [data, ...prev]);
    });

    // Listen for new parking entries - Building level (if barilgiinId provided)
    if (barilgiinId) {
      socketInstance.on(`parkingEntry/${baiguullagiinId}/${barilgiinId}`, (data) => {
        console.log('📥 New parking entry (building level):', data);
        setParkingEntries(prev => [data, ...prev]);
      });
    }

    setSocket(socketInstance);

    // Cleanup on unmount
    return () => {
      socketInstance.disconnect();
    };
  }, [baiguullagiinId, barilgiinId]);

  return {
    socket,
    parkingEntries,
    isConnected,
  };
}

export default useParkingSocket;
```

### Usage in Component

```javascript
import React from 'react';
import useParkingSocket from './hooks/useParkingSocket';

function ParkingDashboard({ baiguullagiinId, barilgiinId }) {
  const { parkingEntries, isConnected } = useParkingSocket(baiguullagiinId, barilgiinId);

  return (
    <div>
      <div className="connection-status">
        Status: {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
      </div>

      <h2>Real-time Parking Entries</h2>
      <div className="parking-entries">
        {parkingEntries.map((entry, index) => (
          <div key={index} className="parking-entry">
            <div className="plate-number">
              <strong>Plate:</strong> {entry.mashiniiDugaar}
            </div>
            <div className="camera-ip">
              <strong>Camera:</strong> {entry.CAMERA_IP}
            </div>
            <div className="timestamp">
              <strong>Time:</strong> {new Date(entry.timestamp).toLocaleString()}
            </div>
            {entry.data && (
              <div className="entry-data">
                <pre>{JSON.stringify(entry.data, null, 2)}</pre>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default ParkingDashboard;
```

---

## Vanilla JavaScript Example

```javascript
// Connect to Socket.IO
const socket = io('http://103.143.40.46:8084', {
  transports: ['websocket', 'polling'],
  reconnection: true,
});

// Connection status
socket.on('connect', () => {
  console.log('✅ Connected:', socket.id);
  document.getElementById('status').textContent = '🟢 Connected';
});

socket.on('disconnect', () => {
  console.log('❌ Disconnected');
  document.getElementById('status').textContent = '🔴 Disconnected';
});

// Listen for parking entries
const baiguullagiinId = '697723dc3e77b46e52ccf577';
const barilgiinId = '697723f73e77b46e52ccf745';

// Organization level (all buildings)
socket.on(`parkingEntry/${baiguullagiinId}`, (data) => {
  console.log('New parking entry:', data);
  addParkingEntryToUI(data);
});

// Building level (specific building)
socket.on(`parkingEntry/${baiguullagiinId}/${barilgiinId}`, (data) => {
  console.log('New parking entry (this building):', data);
  addParkingEntryToUI(data);
});

function addParkingEntryToUI(entry) {
  const container = document.getElementById('parking-entries');
  const entryDiv = document.createElement('div');
  entryDiv.className = 'parking-entry';
  entryDiv.innerHTML = `
    <div><strong>Plate:</strong> ${entry.mashiniiDugaar}</div>
    <div><strong>Camera:</strong> ${entry.CAMERA_IP}</div>
    <div><strong>Time:</strong> ${new Date(entry.timestamp).toLocaleString()}</div>
  `;
  container.insertBefore(entryDiv, container.firstChild);
}
```

---

## Get Initial List of Active Uilchluulegch

Before connecting to Socket.IO, you should fetch the current list of active parking entries:

```javascript
// Fetch active Uilchluulegch records
async function getActiveUilchluulegch(baiguullagiinId, barilgiinId = null, token) {
  const url = barilgiinId
    ? `${API_URL}/uilchluulegch/active?baiguullagiinId=${baiguullagiinId}&barilgiinId=${barilgiinId}`
    : `${API_URL}/uilchluulegch/active?baiguullagiinId=${baiguullagiinId}`;
  
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`,
    }
  });
  
  const result = await response.json();
  
  // Returns:
  // {
  //   success: true,
  //   data: [
  //     {
  //       _id: "...",
  //       mashiniiDugaar: "0888УБУ",
  //       baiguullagiinId: "...",
  //       barilgiinId: "...",
  //       tuukh: [...],
  //       niitDun: 0,
  //       createdAt: "...",
  //       ...
  //     }
  //   ],
  //   count: 5
  // }
  
  return result.data || [];
}
```

---

## Socket Events

### Events Emitted by Backend

#### 1. New Parking Entry (Organization Level)
**Event Name:** `parkingEntry/{baiguullagiinId}`

**Payload:**
```json
{
  "type": "new_entry",
  "uilchluulegch": {
    "_id": "...",
    "mashiniiDugaar": "0888УБУ",
    "baiguullagiinId": "697723dc3e77b46e52ccf577",
    "barilgiinId": "697723f73e77b46e52ccf745",
    "tuukh": [
      {
        "tsagiinTuukh": [
          {
            "orsonTsag": "2026-01-26T12:46:35.746Z"
          }
        ],
        "zogsooliinId": "...",
        "orsonKhaalga": "192.168.1.25",
        "tuluv": 0,
        "tulbur": []
      }
    ],
    "niitDun": 0,
    "createdAt": "2026-01-26T12:46:35.795Z",
    ...
  },
  "data": {
    // Additional data from sdkData response
  },
  "mashiniiDugaar": "0888УБУ",
  "CAMERA_IP": "192.168.1.25",
  "barilgiinId": "697723f73e77b46e52ccf745",
  "baiguullagiinId": "697723dc3e77b46e52ccf577",
  "timestamp": "2026-01-26T12:46:35.795Z"
}
```

#### 2. New Parking Entry (Building Level)
**Event Name:** `parkingEntry/{baiguullagiinId}/{barilgiinId}`

**Payload:** Same as organization level, but filtered to specific building.

#### 3. Gate Open Events
**Event Name:** `zogsoolGarahTulsun{baiguullagiinId}{cameraIP}`

**Payload:**
```json
{
  "baiguullagiinId": "...",
  "khaalgaTurul": "garsan",
  "cameraIP": "192.168.1.21",
  "mashiniiDugaar": "УУА1234"
}
```

#### 4. User Notifications
**Event Name:** `orshinSuugch{orshinSuugchiinId}`

**Payload:** Notification object for specific user.

---

## Complete React Component Example

```javascript
import React, { useEffect, useState } from 'react';
import io from 'socket.io-client';

function ParkingRealtimeView({ baiguullagiinId, barilgiinId, token }) {
  const [socket, setSocket] = useState(null);
  const [entries, setEntries] = useState([]);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');

  // Load initial active entries
  useEffect(() => {
    async function loadInitialEntries() {
      try {
        const url = barilgiinId
          ? `${API_URL}/uilchluulegch/active?baiguullagiinId=${baiguullagiinId}&barilgiinId=${barilgiinId}`
          : `${API_URL}/uilchluulegch/active?baiguullagiinId=${baiguullagiinId}`;
        
        const response = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${token}`,
          }
        });
        
        const result = await response.json();
        if (result.success) {
          setEntries(result.data || []);
        }
      } catch (error) {
        console.error('Error loading initial entries:', error);
      }
    }
    
    if (baiguullagiinId && token) {
      loadInitialEntries();
    }
  }, [baiguullagiinId, barilgiinId, token]);

  useEffect(() => {
    // Connect
    const socketInstance = io('http://103.143.40.46:8084', {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
    });

    // Connection handlers
    socketInstance.on('connect', () => {
      setConnectionStatus('connected');
      console.log('✅ Socket connected');
    });

    socketInstance.on('disconnect', () => {
      setConnectionStatus('disconnected');
      console.log('❌ Socket disconnected');
    });

    // Listen for parking entries
    const orgEvent = `parkingEntry/${baiguullagiinId}`;
    socketInstance.on(orgEvent, (data) => {
      console.log('📥 New entry:', data);
      // Add new entry if it doesn't exist, or update existing one
      if (data.uilchluulegch) {
        setEntries(prev => {
          // Check if entry already exists (by _id)
          const existingIndex = prev.findIndex(
            e => e._id === data.uilchluulegch._id
          );
          
          if (existingIndex >= 0) {
            // Update existing entry
            const updated = [...prev];
            updated[existingIndex] = data.uilchluulegch;
            return updated;
          } else {
            // Add new entry at the beginning
            return [data.uilchluulegch, ...prev.slice(0, 99)]; // Keep last 100
          }
        });
      }
    });

    // Building-specific events (optional)
    if (barilgiinId) {
      const buildingEvent = `parkingEntry/${baiguullagiinId}/${barilgiinId}`;
      socketInstance.on(buildingEvent, (data) => {
        console.log('📥 New entry (this building):', data);
        setEntries(prev => [data, ...prev.slice(0, 49)]);
      });
    }

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [baiguullagiinId, barilgiinId]);

  return (
    <div className="parking-realtime">
      <div className="status-bar">
        <span className={`status ${connectionStatus}`}>
          {connectionStatus === 'connected' ? '🟢' : '🔴'} {connectionStatus}
        </span>
        <span>Entries: {entries.length}</span>
      </div>

      <div className="entries-list">
        {entries.map((entry) => (
          <div key={entry._id} className="entry-card">
            <div className="entry-header">
              <span className="plate">{entry.mashiniiDugaar}</span>
              <span className="time">
                {new Date(entry.createdAt).toLocaleTimeString()}
              </span>
            </div>
            <div className="entry-details">
              <div>Camera: {entry.tuukh?.[0]?.orsonKhaalga || 'N/A'}</div>
              <div>Status: {entry.tuukh?.[0]?.tuluv === 0 ? 'Active' : 'Exited'}</div>
              <div>Amount: {entry.niitDun || 0}₮</div>
              {entry.tuukh?.[0]?.tsagiinTuukh?.[0]?.orsonTsag && (
                <div>Entered: {new Date(entry.tuukh[0].tsagiinTuukh[0].orsonTsag).toLocaleString()}</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ParkingRealtimeView;
```

---

## Event Types

### `parkingEntry/{baiguullagiinId}`
- **When:** New vehicle enters parking (via plate recognition)
- **Scope:** All buildings in organization
- **Use case:** Organization-wide dashboard

### `parkingEntry/{baiguullagiinId}/{barilgiinId}`
- **When:** New vehicle enters parking in specific building
- **Scope:** Single building
- **Use case:** Building-specific view

### `zogsoolGarahTulsun{baiguullagiinId}{cameraIP}`
- **When:** Gate opens after payment
- **Scope:** Specific gate/camera
- **Use case:** Gate control UI

### `orshinSuugch{orshinSuugchiinId}`
- **When:** Notification for specific user
- **Scope:** User-specific
- **Use case:** User notification center

---

## Error Handling

```javascript
socket.on('connect_error', (error) => {
  console.error('Connection error:', error);
  // Show user-friendly error message
});

socket.on('reconnect_attempt', (attemptNumber) => {
  console.log(`Reconnecting... Attempt ${attemptNumber}`);
});

socket.on('reconnect_failed', () => {
  console.error('Failed to reconnect');
  // Show error to user, maybe refresh page
});
```

---

## Best Practices

1. **Reconnection:** Always enable reconnection
2. **Cleanup:** Disconnect socket on component unmount
3. **Error Handling:** Handle connection errors gracefully
4. **Performance:** Limit entries array size (e.g., last 50 entries)
5. **Authentication:** If needed, send auth token in connection options

---

## Connection Options

```javascript
const socket = io('http://103.143.40.46:8084', {
  transports: ['websocket', 'polling'], // Try websocket first, fallback to polling
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  reconnectionAttempts: 5,
  timeout: 20000,
  // If authentication needed:
  // auth: {
  //   token: 'your_auth_token'
  // }
});
```

---

## Testing

You can test the Socket.IO connection using the browser console:

```javascript
const socket = io('http://103.143.40.46:8084');
socket.on('connect', () => console.log('Connected!'));
socket.on('parkingEntry/697723dc3e77b46e52ccf577', (data) => {
  console.log('New entry:', data);
});
```

When a new plate is recognized and sent via your exe file, you should see the event in the console!
