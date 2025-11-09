class RoomManager {
  constructor() {
    this.rooms = new Map();
  }
  
  addUser(roomId, userId, ws) {
    if (!this.rooms.has(roomId)) {
      this.rooms.set(roomId, new Map());
    }
    
    this.rooms.get(roomId).set(userId, { id: userId, ws });
  }
  
  removeUser(roomId, userId) {
    if (this.rooms.has(roomId)) {
      this.rooms.get(roomId).delete(userId);
      
      if (this.rooms.get(roomId).size === 0) {
        this.rooms.delete(roomId);
      }
    }
  }
  
  getUsers(roomId) {
    if (!this.rooms.has(roomId)) return [];
    
    return Array.from(this.rooms.get(roomId).keys());
  }
  
  getRoomUsers(roomId) {
    if (!this.rooms.has(roomId)) return [];
    
    return Array.from(this.rooms.get(roomId).values());
  }
}

module.exports = RoomManager;