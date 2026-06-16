import { io } from "socket.io-client";
import { state } from "./state.js";
import { authState } from "./firebase.js";

export const network = {
  socket: null,
  connected: false,
  others: new Map(), // socketId -> player data
  
  connect() {
    // Connect to the same host using port 3000
    // Actually in production it's just the same origin for socket.io
    this.socket = io();
    
    this.socket.on("connect", () => {
      this.connected = true;
      console.log("Connected to server:", this.socket.id);
      
      const profile = authState.profile;
      this.socket.emit("join", {
        name: profile ? profile.username : "Player",
        team: state.team // 'alpha' or 'omega'
      });
    });

    this.socket.on("initPlayers", (players) => {
      players.forEach(p => {
        this.others.set(p.id, p);
        // We'll spawn meshes for them in main.js
      });
    });

    this.socket.on("playerJoined", (p) => {
      this.others.set(p.id, p);
    });

    this.socket.on("playerMoved", (data) => {
      const p = this.others.get(data.id);
      if (p) {
        Object.assign(p, data);
      }
    });

    this.socket.on("playerShot", (data) => {
      // Show bullet trace for others
      if (window.handleOtherPlayerShot) {
        window.handleOtherPlayerShot(data);
      }
    });

    this.socket.on("playerHit", (data) => {
      const p = this.others.get(data.id);
      if (p) p.health = data.health;
      
      if (data.id === this.socket.id) {
        state.health = data.health;
        if (window.updateHealthUI) window.updateHealthUI();
      }
    });

    this.socket.on("playerDied", (data) => {
      if (data.id === this.socket.id) {
        state.health = 0;
        state.isDead = true;
        if (window.handleDeath) window.handleDeath(data.attackerId);
      } else {
        const p = this.others.get(data.id);
        if (p) p.isDead = true;
        if (window.handleKillFeed) window.handleKillFeed(data);
      }
    });

    this.socket.on("playerRespawn", (data) => {
      if (data.id === this.socket.id) {
        state.health = 100;
        state.isDead = false;
        if (window.handleRespawn) window.handleRespawn();
      } else {
        const p = this.others.get(data.id);
        if (p) {
          p.health = 100;
          p.isDead = false;
        }
      }
    });

    this.socket.on("playerLeft", (id) => {
      this.others.delete(id);
      if (window.removeOtherPlayerMesh) window.removeOtherPlayerMesh(id);
    });
  },

  updatePosition(pos, rotationY, playerState) {
    if (!this.connected) return;
    this.socket.emit("updatePosition", {
      x: pos.x,
      y: pos.y,
      z: pos.z,
      rotationY: rotationY,
      state: playerState
    });
  },

  shoot(origin, dir) {
    if (!this.connected) return;
    this.socket.emit("shoot", { origin, dir });
  },

  hitTarget(targetId, damage) {
    if (!this.connected) return;
    this.socket.emit("hit", { targetId, damage });
  }
};
