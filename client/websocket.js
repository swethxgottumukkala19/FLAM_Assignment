class WebSocketManager {
  constructor(url) {
    this.url = url;
    this.ws = null;
    this.userId = this.generateUserId();
    this.connected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    
    this.handlers = {};
  }
  
  generateUserId() {
    return 'user_' + Math.random().toString(36).substr(2, 9);
  }
  
  connect() {
    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.host;
      this.ws = new WebSocket(`${protocol}//${host}`);
      
      this.ws.onopen = () => {
        this.connected = true;
        this.reconnectAttempts = 0;
        this.send({ type: 'join', userId: this.userId });
        this.trigger('connected');
      };
      
      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.trigger(data.type, data);
        } catch (err) {
          console.error('Parse error:', err);
        }
      };
      
      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.trigger('error', error);
      };
      
      this.ws.onclose = () => {
        this.connected = false;
        this.trigger('disconnected');
        this.attemptReconnect();
      };
    } catch (err) {
      console.error('Connection error:', err);
      this.trigger('error', err);
    }
  }
  
  attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      setTimeout(() => {
        this.trigger('reconnecting', this.reconnectAttempts);
        this.connect();
      }, 2000 * this.reconnectAttempts);
    }
  }
  
  send(data) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }
  
  on(event, handler) {
    if (!this.handlers[event]) {
      this.handlers[event] = [];
    }
    this.handlers[event].push(handler);
  }
  
  trigger(event, data) {
    if (this.handlers[event]) {
      this.handlers[event].forEach(handler => handler(data));
    }
  }
  
  sendDraw(pathData) {
    this.send({
      type: 'draw',
      data: pathData
    });
  }
  
  sendCursor(x, y) {
    this.send({
      type: 'cursor',
      x: x,
      y: y
    });
  }
  
  sendUndo() {
    this.send({ type: 'undo' });
  }
  
  sendRedo() {
    this.send({ type: 'redo' });
  }
  
  sendClear() {
    this.send({ type: 'clear' });
  }
}