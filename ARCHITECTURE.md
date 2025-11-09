# Sckribidi - Technical Architecture

This document outlines the technical architecture, design decisions, and implementation details of the real-time collaborative drawing canvas.

## 🏗️ System Architecture Overview

```
┌─────────────────┐    WebSocket     ┌─────────────────┐
│   Client A      │◄────────────────►│                 │
│   (Browser)     │                  │   Node.js       │
└─────────────────┘                  │   Server        │
                                     │                 │
┌─────────────────┐    WebSocket     │  ┌──────────────┤
│   Client B      │◄────────────────►│  │ RoomManager  │
│   (Browser)     │                  │  │ StateManager │
└─────────────────┘                  │  │ WebSocket    │
                                     │  │ Handler      │
┌─────────────────┐    WebSocket     │  └──────────────┤
│   Client N      │◄────────────────►│                 │
│   (Browser)     │                  └─────────────────┘
└─────────────────┘
```

## 📊 Data Flow Diagram

### Drawing Event Flow
```
User draws on canvas
        ↓
CanvasManager captures mouse/touch events
        ↓
Creates drawing segments with coordinates
        ↓
WebSocketManager sends to server
        ↓
Server broadcasts to all other clients
        ↓
Other clients receive and render drawing
```

### State Synchronization Flow
```
New user joins
        ↓
Server sends complete operation history
        ↓
Client reconstructs canvas state
        ↓
User sees current drawing state
        ↓
Real-time updates continue
```

## 🔌 WebSocket Protocol

### Message Types

#### Client → Server Messages

```javascript
// User joins room
{
  type: 'join',
  userId: 'user_abc123'
}

// Drawing data
{
  type: 'draw',
  data: [
    {
      x0: 100, y0: 150,
      x1: 102, y1: 152,
      color: '#ff0000',
      size: 5,
      erase: false
    }
  ]
}

// Cursor position
{
  type: 'cursor',
  x: 250,
  y: 300
}

// Global operations
{
  type: 'undo'
}
{
  type: 'redo'
}
{
  type: 'clear'
}
```

#### Server → Client Messages

```javascript
// Initial state for new users
{
  type: 'init',
  operations: [...], // Complete operation history
  users: ['user_1', 'user_2']
}

// Broadcast drawing to other users
{
  type: 'draw',
  userId: 'user_abc123',
  data: [...] // Drawing segments
}

// Cursor updates
{
  type: 'cursor',
  userId: 'user_abc123',
  x: 250,
  y: 300
}

// Global undo/redo
{
  type: 'undo',
  operationId: 'op_12345'
}
{
  type: 'redo',
  operation: {...}
}

// User management
{
  type: 'user_joined',
  userId: 'user_new',
  users: ['user_1', 'user_2', 'user_new']
}
```

## 🎯 Global Undo/Redo Strategy

### The Challenge
Implementing undo/redo in a collaborative environment is complex because:
- Multiple users can draw simultaneously
- Operations must be synchronized across all clients
- Undo should work on the most recent operation globally, not per-user

### Our Solution

#### Server-Side Operation Management
```javascript
class StateManager {
  constructor() {
    this.states = new Map(); // roomId -> state
  }
  
  // Each room maintains:
  // - operations: Array of all drawing operations
  // - currentIndex: Points to the current state
}
```

#### Operation Structure
```javascript
{
  id: 'unique_operation_id',
  type: 'draw',
  userId: 'user_who_drew',
  data: [...], // Drawing segments
  timestamp: 1234567890
}
```

#### Undo Process
1. Server decrements `currentIndex`
2. Identifies operation to undo
3. Broadcasts `undo` message with operation ID
4. All clients remove that operation and redraw

#### Redo Process
1. Server increments `currentIndex`
2. Retrieves operation to redo
3. Broadcasts `redo` message with operation data
4. All clients add operation and redraw

### Conflict Resolution
- **Last-operation-wins**: Undo always affects the most recent global operation
- **No per-user undo**: Maintains consistency across all users
- **Immediate synchronization**: All clients see undo/redo instantly

## 🎨 Canvas Implementation Details

### Drawing Architecture

#### CanvasManager Class Structure
```javascript
class CanvasManager {
  // Core properties
  canvas: HTMLCanvasElement
  ctx: CanvasRenderingContext2D
  operations: Array // All drawing operations
  
  // Drawing state
  drawing: boolean
  currentPath: Array // Current stroke being drawn
  
  // Tools
  tool: 'brush' | 'eraser'
  color: string
  size: number
}
```

#### Drawing Process
1. **Mouse/Touch Events**: Captured and converted to coordinates
2. **Path Building**: Each stroke creates an array of line segments
3. **Real-time Rendering**: Segments drawn immediately for responsiveness
4. **Batch Transmission**: Complete paths sent to server
5. **Operation Storage**: Each complete stroke becomes an operation

#### Efficient Redrawing
```javascript
redrawAll() {
  this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  this.operations.forEach(op => {
    this.drawPath(op.data);
  });
}
```

### Touch Support Implementation
- Touch events converted to mouse events
- `preventDefault()` stops scrolling during drawing
- `touch-action: none` CSS prevents default touch behaviors

## 🚀 Performance Optimizations

### Event Throttling
```javascript
// Cursor position updates throttled to 50ms
let throttleTimer = null;
canvas.addEventListener('mousemove', (e) => {
  if (!throttleTimer) {
    throttleTimer = setTimeout(() => {
      wsManager.sendCursor(x, y);
      throttleTimer = null;
    }, 50);
  }
});
```

### Memory Management
- **Operation Limit**: Maximum 500 operations per room
- **Automatic Cleanup**: Old operations removed when limit exceeded
- **Efficient Storage**: Only essential data stored per operation

### Canvas Optimizations
- **willReadFrequently: false**: Optimizes canvas for drawing
- **Path Batching**: Multiple line segments grouped into single operations
- **Selective Redrawing**: Only redraws when necessary (undo/redo/resize)

## 🔄 Connection Management

### WebSocket Lifecycle
```javascript
class WebSocketManager {
  connect() {
    // Establish connection
    // Set up event handlers
    // Handle reconnection logic
  }
  
  attemptReconnect() {
    // Exponential backoff: 2s, 4s, 6s, 8s, 10s
    // Maximum 5 attempts
    // User feedback during reconnection
  }
}
```

### Reconnection Strategy
- **Automatic reconnection** with exponential backoff
- **State recovery** - server sends complete state on reconnect
- **User feedback** - status indicators show connection state
- **Graceful degradation** - app continues working offline

## 🏠 Room Management

### Current Implementation
```javascript
class RoomManager {
  constructor() {
    this.rooms = new Map(); // roomId -> Map(userId -> {id, ws})
  }
}
```

### Single Room Design
- All users currently join the 'default' room
- Simplified for the assignment scope
- Easily extensible to multiple rooms

### User Management
- **Unique IDs**: Generated client-side with collision resistance
- **Color Assignment**: Deterministic HSL color based on user count
- **Cleanup**: Users removed on WebSocket close

## 🔧 Error Handling & Edge Cases

### Network Issues
- **Connection loss**: Automatic reconnection with user feedback
- **Message parsing errors**: Logged but don't crash the application
- **WebSocket errors**: Graceful handling with retry logic

### Canvas Edge Cases
- **Rapid drawing**: Event throttling prevents overwhelming the server
- **Window resize**: Canvas automatically adjusts and redraws
- **Touch vs Mouse**: Unified event handling system

### Concurrent Operations
- **Simultaneous drawing**: Each user's strokes are independent
- **Undo conflicts**: Global undo affects most recent operation regardless of user
- **Clear canvas**: Immediate synchronization across all users

## 🔮 Scalability Considerations

### Current Limitations
- **In-memory storage**: State lost on server restart
- **Single server**: No horizontal scaling
- **No persistence**: Drawings not saved to database

### Scaling Solutions (Future)
```javascript
// Redis for shared state
const redis = require('redis');
const client = redis.createClient();

// Database persistence
const mongoose = require('mongoose');
const DrawingSchema = new mongoose.Schema({
  roomId: String,
  operations: [OperationSchema],
  createdAt: Date
});

// Load balancing with sticky sessions
// WebSocket clustering with Redis pub/sub
```

### Performance Metrics
- **Target**: 50+ concurrent users per room
- **Latency**: <100ms for drawing synchronization
- **Memory**: ~1MB per 500 operations
- **Bandwidth**: ~10KB/s per active user

## 🧪 Testing Strategy

### Manual Testing Scenarios
1. **Multi-user drawing**: 2-5 users drawing simultaneously
2. **Network interruption**: Disconnect/reconnect during drawing
3. **Undo/redo stress test**: Rapid undo/redo operations
4. **Mobile compatibility**: Touch drawing on various devices
5. **Browser compatibility**: Cross-browser testing

### Performance Testing
- **Load testing**: Multiple users with automated drawing
- **Memory monitoring**: Check for memory leaks during long sessions
- **Network simulation**: Test with various connection speeds

## 🔐 Security Considerations

### Current Security Measures
- **Input validation**: Message parsing with error handling
- **Rate limiting**: Event throttling prevents spam
- **No authentication**: Simplified for assignment scope

### Production Security (Future)
- **User authentication**: JWT tokens or session management
- **Rate limiting**: Server-side request throttling
- **Input sanitization**: Validate all drawing data
- **CORS configuration**: Restrict allowed origins
- **WebSocket security**: Origin validation and secure connections

## 📈 Monitoring & Debugging

### Client-Side Debugging
```javascript
// Connection status indicators
updateStatus('Connected', 'connected');
updateStatus('Reconnecting...', '');
updateStatus('Connection error', 'error');

// Console logging for development
console.error('WebSocket error:', error);
console.error('Parse error:', err);
```

### Server-Side Monitoring
```javascript
// User connection tracking
console.log(`User ${userId} joined room ${roomId}`);
console.log(`User ${userId} left room ${roomId}`);

// Operation tracking
console.log(`Operation added: ${operation.type} by ${operation.userId}`);
```

## 🎯 Design Decisions Rationale

### Why Vanilla JavaScript?
- **Learning objective**: Demonstrates raw DOM and Canvas API skills
- **Performance**: No framework overhead
- **Simplicity**: Easier to understand and debug
- **Control**: Full control over every aspect of the implementation

### Why WebSockets over Socket.io?
- **Lightweight**: Smaller bundle size
- **Native support**: Built into modern browsers
- **Simplicity**: Direct protocol without abstraction layers
- **Learning value**: Understanding the underlying technology

### Why In-Memory Storage?
- **Simplicity**: No database setup required
- **Performance**: Fastest possible access
- **Assignment scope**: Sufficient for demonstration purposes
- **Easy testing**: No external dependencies

### Global vs Per-User Undo
- **Consistency**: All users see the same state
- **Simplicity**: Single source of truth
- **Collaboration**: Encourages cooperative drawing
- **Technical challenge**: More interesting implementation

This architecture provides a solid foundation for a collaborative drawing application while maintaining simplicity and demonstrating key technical concepts.