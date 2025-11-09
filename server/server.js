const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');
const RoomManager = require('./rooms');
const StateManager = require('./drawing-state');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const rooms = new RoomManager();
const stateManager = new StateManager();

app.use(express.static(path.join(__dirname, '../client')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/index.html'));
});

wss.on('connection', (ws) => {
  let userId = null;
  let currentRoom = 'default';
  
  ws.on('message', (data) => {
    try {
      const msg = JSON.parse(data);
      
      switch(msg.type) {
        case 'join':
          userId = msg.userId;
          rooms.addUser(currentRoom, userId, ws);
          
          // send current canvas state to new user
          const state = stateManager.getState(currentRoom);
          ws.send(JSON.stringify({
            type: 'init',
            operations: state.operations,
            users: rooms.getUsers(currentRoom)
          }));
          
          // notify others
          broadcast(currentRoom, {
            type: 'user_joined',
            userId: userId,
            users: rooms.getUsers(currentRoom)
          }, userId);
          break;
          
        case 'draw':
          // add to operation history
          stateManager.addOperation(currentRoom, {
            type: 'draw',
            userId: userId,
            data: msg.data,
            timestamp: Date.now()
          });
          
          broadcast(currentRoom, {
            type: 'draw',
            userId: userId,
            data: msg.data
          });
          break;
          
        case 'cursor':
          broadcast(currentRoom, {
            type: 'cursor',
            userId: userId,
            x: msg.x,
            y: msg.y
          }, userId);
          break;
          
        case 'undo':
          const undoOp = stateManager.undo(currentRoom);
          if (undoOp) {
            broadcast(currentRoom, {
              type: 'undo',
              operationId: undoOp.id
            });
          }
          break;
          
        case 'redo':
          const redoOp = stateManager.redo(currentRoom);
          if (redoOp) {
            broadcast(currentRoom, {
              type: 'redo',
              operation: redoOp
            });
          }
          break;
          
        case 'clear':
          stateManager.clear(currentRoom);
          broadcast(currentRoom, { type: 'clear' });
          break;
      }
    } catch (err) {
      console.error('Message parse error:', err);
    }
  });
  
  ws.on('close', () => {
    if (userId) {
      rooms.removeUser(currentRoom, userId);
      broadcast(currentRoom, {
        type: 'user_left',
        userId: userId,
        users: rooms.getUsers(currentRoom)
      });
    }
  });
});

function broadcast(room, message, excludeUserId = null) {
  const users = rooms.getRoomUsers(room);
  const msgStr = JSON.stringify(message);
  
  users.forEach(user => {
    if (user.id !== excludeUserId && user.ws.readyState === WebSocket.OPEN) {
      user.ws.send(msgStr);
    }
  });
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Sckribidi running on port ${PORT}`);
});