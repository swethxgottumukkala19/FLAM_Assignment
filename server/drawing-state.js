class StateManager {
  constructor() {
    this.states = new Map();
  }
  
  getState(roomId) {
    if (!this.states.has(roomId)) {
      this.states.set(roomId, {
        operations: [],
        undoStack: [],
        currentIndex: -1
      });
    }
    return this.states.get(roomId);
  }
  
  addOperation(roomId, operation) {
    const state = this.getState(roomId);
    
    // remove any operations after current index (they were undone)
    if (state.currentIndex < state.operations.length - 1) {
      state.operations = state.operations.slice(0, state.currentIndex + 1);
    }
    
    operation.id = Date.now() + Math.random();
    state.operations.push(operation);
    state.currentIndex = state.operations.length - 1;
    
    // keep only last 500 operations
    if (state.operations.length > 500) {
      state.operations.shift();
      state.currentIndex--;
    }
  }
  
  undo(roomId) {
    const state = this.getState(roomId);
    
    if (state.currentIndex >= 0) {
      const op = state.operations[state.currentIndex];
      state.currentIndex--;
      return op;
    }
    return null;
  }
  
  redo(roomId) {
    const state = this.getState(roomId);
    
    if (state.currentIndex < state.operations.length - 1) {
      state.currentIndex++;
      return state.operations[state.currentIndex];
    }
    return null;
  }
  
  clear(roomId) {
    this.states.set(roomId, {
      operations: [],
      undoStack: [],
      currentIndex: -1
    });
  }
}

module.exports = StateManager;