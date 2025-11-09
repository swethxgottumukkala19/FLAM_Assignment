const canvas = new CanvasManager('canvas');
const wsManager = new WebSocketManager();

const userColors = {};
let throttleTimer = null;

// toolbar controls
document.getElementById('brush').addEventListener('click', () => {
  canvas.setTool('brush');
  setActiveTool('brush');
});

document.getElementById('eraser').addEventListener('click', () => {
  canvas.setTool('eraser');
  setActiveTool('eraser');
});

document.getElementById('size').addEventListener('input', (e) => {
  canvas.setSize(parseInt(e.target.value));
  document.getElementById('size-value').textContent = e.target.value;
});

document.getElementById('color').addEventListener('input', (e) => {
  canvas.setColor(e.target.value);
  canvas.setTool('brush');
  setActiveTool('brush');
});

document.getElementById('undo').addEventListener('click', () => {
    canvas.undo();
});

document.getElementById('redo').addEventListener('click', () => {
    canvas.redo();
});

document.getElementById('clear').addEventListener('click', () => {
  if (confirm('Clear entire canvas? This affects all users.')) {
    wsManager.sendClear();
  }
});

// keyboard shortcuts
document.addEventListener('keydown', (e) => {
  if (e.ctrlKey || e.metaKey) {
    if (e.key === 'z') {
      e.preventDefault();
      wsManager.sendUndo();
    } else if (e.key === 'y') {
      e.preventDefault();
      wsManager.sendRedo();
    }
  }
});

function setActiveTool(tool) {
  document.querySelectorAll('.tool').forEach(t => t.classList.remove('active'));
  document.getElementById(tool).classList.add('active');
}

// canvas events
canvas.onDraw = (segment) => {
  wsManager.sendDraw([segment]);
};

canvas.onDrawEnd = (path) => {
  // path already sent in chunks during drawing
};

// track mouse for cursor sharing
canvas.canvas.addEventListener('mousemove', (e) => {
  if (!throttleTimer) {
    throttleTimer = setTimeout(() => {
      const rect = canvas.canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      wsManager.sendCursor(x, y);
      throttleTimer = null;
    }, 50);
  }
});

// websocket events
wsManager.on('connected', () => {
  updateStatus('Connected', 'connected');
});

wsManager.on('disconnected', () => {
  updateStatus('Disconnected', 'error');
});

wsManager.on('reconnecting', (attempt) => {
  updateStatus(`Reconnecting... (${attempt}/5)`, '');
});

wsManager.on('error', () => {
  updateStatus('Connection error', 'error');
});

wsManager.on('init', (data) => {
  // load initial canvas state
  canvas.operations = data.operations || [];
  canvas.redrawAll();
  updateUsers(data.users);
});

wsManager.on('draw', (data) => {
  if (data.userId !== wsManager.userId) {
    canvas.drawPath(data.data);
    canvas.operations.push({
      userId: data.userId,
      data: data.data,
      id: Date.now() + Math.random()
    });
  }
});

wsManager.on('cursor', (data) => {
  updateCursor(data.userId, data.x, data.y);
});

wsManager.on('undo', (data) => {
  canvas.removeOperation(data.operationId);
});

wsManager.on('redo', (data) => {
  canvas.addOperation(data.operation);
});

wsManager.on('clear', () => {
  canvas.clear();
});

wsManager.on('user_joined', (data) => {
  updateUsers(data.users);
});

wsManager.on('user_left', (data) => {
  updateUsers(data.users);
  removeCursor(data.userId);
});

function updateStatus(message, className) {
  const status = document.getElementById('status');
  status.textContent = message;
  status.className = 'status ' + className;
}

function getUserColor(userId) {
  if (!userColors[userId]) {
    const hue = Object.keys(userColors).length * 137.5;
    userColors[userId] = `hsl(${hue % 360}, 70%, 60%)`;
  }
  return userColors[userId];
}

function updateUsers(users) {
  const container = document.getElementById('users');
  container.innerHTML = '';
  
  users.forEach(userId => {
    const indicator = document.createElement('div');
    indicator.className = 'user-indicator';
    indicator.style.backgroundColor = getUserColor(userId);
    indicator.textContent = userId.substr(-2).toUpperCase();
    indicator.title = userId;
    container.appendChild(indicator);
  });
}

function updateCursor(userId, x, y) {
  let cursor = document.getElementById(`cursor-${userId}`);
  
  if (!cursor) {
    cursor = document.createElement('div');
    cursor.id = `cursor-${userId}`;
    cursor.className = 'cursor';
    cursor.style.backgroundColor = getUserColor(userId);
    
    const label = document.createElement('div');
    label.className = 'cursor-label';
    label.textContent = userId.substr(0, 8);
    cursor.appendChild(label);
    
    document.getElementById('cursors').appendChild(cursor);
  }
  
  cursor.style.left = x + 'px';
  cursor.style.top = y + 'px';
}

function removeCursor(userId) {
  const cursor = document.getElementById(`cursor-${userId}`);
  if (cursor) cursor.remove();
}

// start connection
wsManager.connect();