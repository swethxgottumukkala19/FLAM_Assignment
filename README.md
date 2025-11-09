# Sckribidi - Real-Time Collaborative Drawing Canvas

A multi-user drawing application where multiple people can draw simultaneously on the same canvas with real-time synchronization.

## 🎯 Features

### Core Drawing Features
- **Real-time collaborative drawing** - See other users' strokes as they draw
- **Drawing tools**: Brush and eraser with adjustable stroke size (1-50px)
- **Color picker** - Full color palette support
- **Touch support** - Works on mobile devices and tablets

### Collaboration Features
- **Live cursor tracking** - See where other users are drawing
- **User indicators** - Visual representation of online users with unique colors
- **Global undo/redo system** - Synchronized across all users
- **Clear canvas** - Affects all users simultaneously

### Technical Features
- **Automatic reconnection** - Handles network interruptions gracefully
- **Canvas state persistence** - New users see existing drawings
- **Performance optimization** - Throttled events and efficient redrawing
- **Cross-browser compatibility** - Works on modern browsers

## 🚀 Quick Start

### Prerequisites
- Node.js (v14 or higher)
- Modern web browser

### Installation & Setup

1. **Clone and install dependencies:**
```bash
git clone <repository-url>
cd FLAM
npm install
```

2. **Start the server:**
```bash
npm start
```

3. **Open in browser:**
   - Navigate to `http://localhost:3000`
   - The application will load immediately

### Testing Multi-User Functionality

1. **Multiple browser windows:**
   - Open `http://localhost:3000` in multiple tabs/windows
   - Draw in one window and see it appear in others instantly

2. **Multiple devices:**
   - Connect devices to the same network
   - Access `http://[your-ip]:3000` from other devices
   - All devices will share the same canvas

3. **Test features:**
   - Try drawing with different colors and sizes
   - Test undo/redo (Ctrl+Z/Ctrl+Y)
   - Watch cursor movements of other users
   - Test the clear canvas function

## 🎮 Controls

### Drawing Tools
- **Brush** (✏️) - Default drawing tool
- **Eraser** (🧹) - Remove parts of drawings
- **Size slider** - Adjust stroke width (1-50px)
- **Color picker** - Choose drawing color

### Actions
- **Undo** (↶) - Undo last operation globally
- **Redo** (↷) - Redo last undone operation
- **Clear** (🗑️) - Clear entire canvas (confirmation required)

### Keyboard Shortcuts
- `Ctrl+Z` / `Cmd+Z` - Undo
- `Ctrl+Y` / `Cmd+Y` - Redo

## 🏗️ Tech Stack

### Frontend
- **Vanilla JavaScript** - No frameworks, pure DOM manipulation
- **HTML5 Canvas API** - For drawing operations
- **WebSocket API** - Real-time communication
- **CSS3** - Modern styling with flexbox

### Backend
- **Node.js** - Server runtime
- **Express.js** - Web server framework
- **WebSocket (ws)** - Real-time bidirectional communication
- **In-memory storage** - Canvas state and user management

## 📁 Project Structure

```
FLAM/
├── client/                 # Frontend files
│   ├── index.html         # Main HTML structure
│   ├── style.css          # Styling and layout
│   ├── canvas.js          # Canvas drawing logic
│   ├── websocket.js       # WebSocket client management
│   └── main.js            # Application initialization
├── server/                # Backend files
│   ├── server.js          # Express server + WebSocket handling
│   ├── rooms.js           # User and room management
│   └── drawing-state.js   # Canvas state and operation history
├── package.json           # Dependencies and scripts
├── README.md              # This file
└── ARCHITECTURE.md        # Technical architecture details
```

## ⚡ Performance Features

- **Event throttling** - Drawing events limited to 50ms intervals
- **Efficient redrawing** - Only redraws when necessary
- **Operation batching** - Groups drawing segments for better performance
- **Memory management** - Limits operation history to 500 operations per room
- **Optimized canvas operations** - Uses efficient path rendering

## 🌐 Browser Support

Tested and working on:
- **Chrome** 90+
- **Firefox** 88+
- **Safari** 14+
- **Edge** 90+
- **Mobile browsers** (iOS Safari, Chrome Mobile)

## 🔧 Known Limitations

- **Memory storage** - Canvas state resets on server restart
- **Single room** - All users share the same canvas (extensible to multiple rooms)
- **No authentication** - Users are identified by random IDs
- **Operation limit** - Maximum 500 operations per room for performance
- **No persistence** - Drawings are not saved to disk

## 🐛 Troubleshooting

### Connection Issues
- Check if port 3000 is available
- Ensure firewall allows connections
- Try refreshing the browser

### Drawing Not Syncing
- Check browser console for WebSocket errors
- Verify network connectivity
- Try reconnecting (automatic after 2-10 seconds)

### Performance Issues
- Clear canvas if too many operations
- Close unused browser tabs
- Check system resources

## 🚀 Development

### Running in Development Mode
```bash
npm run dev  # Uses nodemon for auto-restart
```

### Adding Features
The modular architecture makes it easy to extend:
- Add new tools in `canvas.js`
- Extend WebSocket protocol in `websocket.js` and `server.js`
- Add new UI elements in `index.html` and `style.css`

## 📊 Time Investment

**Total Development Time: ~12-15 hours**

- Initial architecture planning: 2h
- Core canvas implementation: 4h
- WebSocket real-time synchronization: 3h
- Global undo/redo system: 2h
- UI polish and responsive design: 3h
- Testing and documentation: 1h

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test with multiple users
5. Submit a pull request
