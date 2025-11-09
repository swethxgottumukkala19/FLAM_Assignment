class CanvasManager {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d', { willReadFrequently: false });
    
    this.drawing = false;
    this.tool = 'brush';
    this.color = '#000000';
    this.size = 3;
    
    this.lastX = 0;
    this.lastY = 0;
    
    this.operations = [];
    this.currentPath = [];
    
    this.undoStack = [];
    this.redoStack = [];
    
    this.setupCanvas();
    this.bindEvents();
  }
  
  setupCanvas() {
    const resize = () => {
      const rect = this.canvas.parentElement.getBoundingClientRect();
      this.canvas.width = rect.width;
      this.canvas.height = rect.height;
      this.redrawAll();
    };
    
    resize();
    window.addEventListener('resize', resize);
  }
  
  bindEvents() {
    // mouse events
    this.canvas.addEventListener('mousedown', (e) => this.startDrawing(e));
    this.canvas.addEventListener('mousemove', (e) => this.draw(e));
    this.canvas.addEventListener('mouseup', () => this.stopDrawing());
    this.canvas.addEventListener('mouseout', () => this.stopDrawing());
    
    // touch events
    this.canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      const touch = e.touches[0];
      const mouseEvent = new MouseEvent('mousedown', {
        clientX: touch.clientX,
        clientY: touch.clientY
      });
      this.canvas.dispatchEvent(mouseEvent);
    });
    
    this.canvas.addEventListener('touchmove', (e) => {
      e.preventDefault();
      const touch = e.touches[0];
      const mouseEvent = new MouseEvent('mousemove', {
        clientX: touch.clientX,
        clientY: touch.clientY
      });
      this.canvas.dispatchEvent(mouseEvent);
    });
    
    this.canvas.addEventListener('touchend', (e) => {
      e.preventDefault();
      const mouseEvent = new MouseEvent('mouseup', {});
      this.canvas.dispatchEvent(mouseEvent);
    });
  }
  
  getCoordinates(e) {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  }
  
  startDrawing(e) {
    this.drawing = true;
    const pos = this.getCoordinates(e);
    this.lastX = pos.x;
    this.lastY = pos.y;
    this.currentPath = [];
  }
  
  draw(e) {
    if (!this.drawing) return;
    
    const pos = this.getCoordinates(e);
    
    this.drawLine(this.lastX, this.lastY, pos.x, pos.y, 
                  this.color, this.size, this.tool === 'eraser');
    
    this.currentPath.push({
      x0: this.lastX,
      y0: this.lastY,
      x1: pos.x,
      y1: pos.y,
      color: this.color,
      size: this.size,
      erase: this.tool === 'eraser'
    });
    
    this.lastX = pos.x;
    this.lastY = pos.y;
    
    // emit draw event
    if (typeof this.onDraw === 'function') {
      this.onDraw(this.currentPath[this.currentPath.length - 1]);
    }
  }
  
  stopDrawing() {
    if (this.drawing && this.currentPath.length > 0) {
      // Save the entire operation for undo
      this.undoStack.push([...this.currentPath]);
      this.redoStack = []; // Clear redo stack on new operation
      
      if (typeof this.onDrawEnd === 'function') {
        this.onDrawEnd(this.currentPath);
      }
    }
    this.drawing = false;
    this.currentPath = [];
  }
  
  drawLine(x0, y0, x1, y1, color, size, erase = false) {
    this.ctx.beginPath();
    this.ctx.moveTo(x0, y0);
    this.ctx.lineTo(x1, y1);
    this.ctx.strokeStyle = erase ? '#FFFFFF' : color;
    this.ctx.lineWidth = size;
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';
    
    if (erase) {
      this.ctx.globalCompositeOperation = 'destination-out';
    } else {
      this.ctx.globalCompositeOperation = 'source-over';
    }
    
    this.ctx.stroke();
    this.ctx.closePath();
  }
  
  drawPath(path) {
    path.forEach(segment => {
      this.drawLine(segment.x0, segment.y0, segment.x1, segment.y1,
                   segment.color, segment.size, segment.erase);
    });
  }
  
  addOperation(op) {
    this.operations.push(op);
    this.drawPath(op.data);
  }
  
  redrawAll() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.operations.forEach(op => {
      this.drawPath(op.data);
    });
  }
  
  removeOperation(opId) {
    this.operations = this.operations.filter(op => op.id !== opId);
    this.redrawAll();
  }
  
  clear() {
    this.operations = [];
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }
  
  setTool(tool) {
    this.tool = tool;
  }
  
  setColor(color) {
    this.color = color;
  }
  
  setSize(size) {
    this.size = size;
  }
  
  undo() {
    if (this.undoStack.length > 0) {
      const lastOperation = this.undoStack.pop();
      this.redoStack.push(lastOperation);
      
      // Redraw everything except the last operation
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      this.undoStack.forEach(operation => {
        this.drawPath(operation);
      });
    }
  }

  redo() {
    if (this.redoStack.length > 0) {
      const operation = this.redoStack.pop();
      this.undoStack.push(operation);
      this.drawPath(operation);
    }
  }
}

let undoStack = [];
let redoStack = [];

function saveState() {
    undoStack.push(canvas.toDataURL());
    redoStack = []; // Clear redo stack when new action is performed
}

function undo() {
    if (undoStack.length > 1) { // Changed from undoStack.length > 0
        redoStack.push(undoStack.pop());
        let imgData = undoStack[undoStack.length - 1];
        loadState(imgData);
    }
}

function redo() {
    if (redoStack.length > 0) {
        let imgData = redoStack.pop();
        undoStack.push(imgData);
        loadState(imgData);
    }
}

function loadState(imgData) {
    let img = new Image();
    img.src = imgData;
    img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
    }
}