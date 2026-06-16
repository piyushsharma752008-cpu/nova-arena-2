import React from 'react';
import { DeliverableSection } from '../types';
import { PrototypeCanvas } from '../components/PrototypeCanvas';
import { CodeBlock } from '../components/CodeBlock';

export function ContentRenderer({ activeId }: { activeId: DeliverableSection }) {
  switch (activeId) {
    case 'overview':
      return (
        <div className="space-y-6 text-slate-300">
          <p className="text-lg leading-relaxed">
            Welcome to the Studio OS design portal for our upcoming Browser-Based Open-World Sandbox. 
            This document outlines the entire technical architecture and implementation strategy for 
            a massive, cartoon-styled city environment optimized for WebGPU/WebGL.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl">
              <h3 className="text-emerald-400 font-bold mb-3 uppercase font-mono text-sm">Target Aesthetics</h3>
              <ul className="space-y-2 list-disc list-inside">
                <li>Cartoon/anime-inspired visual style</li>
                <li>Strong cel-shading and outline rendering</li>
                <li>Bright, vibrant color palettes</li>
                <li>Stylized blocky architecture and vehicles</li>
              </ul>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl">
              <h3 className="text-emerald-400 font-bold mb-3 uppercase font-mono text-sm">Core Engine tech</h3>
              <ul className="space-y-2 list-disc list-inside">
                <li>Babylon.js 7.0+ (WebGPU primary, WebGL2 fallback)</li>
                <li>Havok Physics Engine (WASM)</li>
                <li>Node.js + Colyseus (Multiplayer)</li>
                <li>PostgreSQL (Durable persistence)</li>
              </ul>
            </div>
          </div>
        </div>
      );

    case 'architecture':
      return (
        <div className="space-y-6 text-slate-300">
          <p>The system is split into three primary layers: **Client Engine**, **Real-Time Multiplayer Server**, and **Persistence Layer**.</p>
          
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl overflow-hidden">
             <CodeBlock language="mermaid" title="Architecture Flow" code={`
graph TD
    Client[Browser Game Client / Babylon.js]
    Auth[Firebase Auth]
    Colyseus[Colyseus Socket Server]
    API[Express REST API]
    DB[(PostgreSQL)]

    Client -->|WebSocket| Colyseus
    Client -->|OAuth Token| Auth
    Client -->|HTTP| API
    
    Colyseus -->|State Sync| API
    API -->|Drizzle ORM| DB
             `} />
          </div>
        </div>
      );

    case 'structure':
      return (
        <div className="space-y-4">
          <CodeBlock language="bash" title="Monorepo Structure" code={`
/repo-root
├── /packages
│   ├── /client           # React + Babylon.js Web App
│   │   ├── /src
│   │   │   ├── /core     # Babylon Engine wrappers
│   │   │   ├── /entities # Player, Vehicle, NPC classes
│   │   │   ├── /network  # Colyseus Client
│   │   │   ├── /ui       # React HUD components
│   │   │   └── /world    # Chunk manager, LODs
│   │   └── package.json
│   │
│   ├── /server           # Colyseus + Express backend
│   │   ├── /src
│   │   │   ├── /rooms    # GameRooms, Lobby
│   │   │   ├── /schema   # Colyseus State schemas
│   │   │   ├── /api      # REST endpoints
│   │   │   └── /db       # Drizzle schema & migrations
│   │   └── package.json
│   │
│   └── /shared           # Common types and math
│       ├── /types
│       ├── /math
│       └── package.json
└── package.json
          `} />
        </div>
      );

    case 'database':
      return (
        <div className="space-y-4">
          <p className="text-slate-300">
            Using PostgreSQL + Drizzle ORM. The relational schema is optimal for complex query requirements (player properties, inventories, mission states).
          </p>
          <CodeBlock language="typescript" title="packages/server/src/db/schema.ts" code={`
import { pgTable, text, timestamp, integer, jsonb, boolean } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const users = pgTable('users', {
  id: text('id').primaryKey(), // Firebase UID
  username: text('username').notNull().unique(),
  createdAt: timestamp('created_at').defaultNow(),
  lastLogin: timestamp('last_login'),
});

export const characters = pgTable('characters', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.id).notNull(),
  money: integer('money').default(0),
  health: integer('health').default(100),
  transform: jsonb('transform').default({ x: 0, y: 10, z: 0 }), // Last saved position
  clothingConfig: jsonb('clothing_config'), // Customization choices
});

export const properties = pgTable('properties', {
  id: text('id').primaryKey(),
  ownerId: text('owner_id').references(() => characters.id),
  type: text('type').notNull(), // 'apartment', 'garage', 'business'
  locked: boolean('locked').default(true),
});

export const inventory = pgTable('inventory', {
  id: text('id').primaryKey(),
  characterId: text('character_id').references(() => characters.id).notNull(),
  itemId: text('item_id').notNull(),
  quantity: integer('quantity').default(1),
});
          `} />
        </div>
      );

    case 'network':
      return (
        <div className="space-y-4">
          <p className="text-slate-300">
            Colyseus manages authoritative state using Delta encoding. We do optimistic client-prediction for the player's own controller, while resolving remote entities purely via state synchronization.
          </p>
          <CodeBlock language="typescript" title="packages/server/src/schema/GameState.ts" code={`
import { Schema, type, MapSchema } from "@colyseus/schema";

export class Transform extends Schema {
  @type("number") x: number = 0;
  @type("number") y: number = 0;
  @type("number") z: number = 0;
  @type("number") rotY: number = 0;
}

export class Player extends Schema {
  @type("string") username: string;
  @type(Transform) transform = new Transform();
  @type("int8") state: number = 0; // 0=Idle, 1=Walk, 2=Run, 3=Driving
  @type("string") currentVehicleId: string = ""; 
}

export class CityRoomState extends Schema {
  @type({ map: Player }) players = new MapSchema<Player>();
  
  createPlayer(sessionId: string, username: string) {
    const p = new Player();
    p.username = username;
    this.players.set(sessionId, p);
  }

  removePlayer(sessionId: string) {
    this.players.delete(sessionId);
  }
}
          `} />
        </div>
      );

    case 'controller':
      return (
        <div className="space-y-4">
          <p className="text-slate-300">
            A kinematic physics-driven rigid body controller powered by Havok. The player body is a vertical capsule. Friction is disabled on the physics material, and handled manually so we can instantly stop when releasing inputs.
          </p>
          <CodeBlock language="typescript" title="CharacterController.ts" code={`
import { Vector3, PhysicsAggregate, PhysicsShapeType, TransformNode, Scene } from "@babylonjs/core";

export class CharacterController {
    public aggregate: PhysicsAggregate;
    public mesh: TransformNode;
    
    private speed = 12;
    private jumpForce = 15;
    private isGrounded = false;

    constructor(mesh: TransformNode, scene: Scene) {
        this.mesh = mesh;
        // Capsule shape for sliding along walls
        this.aggregate = new PhysicsAggregate(
            mesh, 
            PhysicsShapeType.CAPSULE, 
            { mass: 1, friction: 0, restitution: 0 }, 
            scene
        );
        
        // Lock rotations so physics doesn't tip the player over
        this.aggregate.body.setMassProperties({
            inertia: new Vector3(0, 0, 0)
        });
    }

    public update(inputDir: Vector3, jumpTarget: boolean) {
        const vel = this.aggregate.body.getLinearVelocity();
        
        // Move
        const targetVelX = inputDir.x * this.speed;
        const targetVelZ = inputDir.z * this.speed;
        
        // Instant acceleration/deceleration interpolation
        this.aggregate.body.setLinearVelocity(new Vector3(
            targetVelX,
            vel.y,
            targetVelZ
        ));

        // Jump
        if (jumpTarget && this.checkGrounded()) {
            this.aggregate.body.applyImpulse(
                new Vector3(0, this.jumpForce, 0), 
                this.mesh.getAbsolutePosition()
            );
        }
    }

    private checkGrounded(): boolean {
        // Simple raycast down from center
        return Math.abs(this.aggregate.body.getLinearVelocity().y) < 0.1; 
    }
}
          `} />
        </div>
      );

    case 'vehicle':
      return (
        <div className="space-y-4 text-slate-300">
           <p>
            Vehicles use a simple arcade physics model rather than full simulation wheel raycasts. We apply forces to a box rigid body and fake the wheel rotation visually.
           </p>
           <CodeBlock language="typescript" title="ArcadeVehicle.ts" code={`
// Pseudo-code implementation for arcade driving
export function updateArcadeVehicle(
    carBody: PhysicsBody, 
    forwardInput: number, 
    turnInput: number
) {
    const transform = carBody.transformNode;
    const forward = transform.forward;
    const up = transform.up;
    
    const acceleration = 50;
    const topSpeed = 30;
    const steeringMultiplier = 2.0;

    // Apply forward force
    if (forwardInput !== 0) {
        const speedRatio = carBody.getLinearVelocity().length() / topSpeed;
        const accelFactor = Math.max(0, 1 - speedRatio); // Less force at high speeds
        
        carBody.applyImpulse(
            forward.scale(forwardInput * acceleration * accelFactor),
            transform.getAbsolutePosition()
        );
    }
    
    // Applying Torque for steering (only works if moving)
    const currentSpeed = carBody.getLinearVelocity().length();
    if (Math.abs(turnInput) > 0.1 && currentSpeed > 1) {
        carBody.setAngularVelocity(new Vector3(0, turnInput * steeringMultiplier, 0));
    } else {
        carBody.setAngularVelocity(Vector3.Zero()); // Stop spinning if no input
    }
}
           `}/>
        </div>
      );
      
    case 'streaming':
      return (
        <div className="space-y-4">
          <p className="text-slate-300">
            For low-end PCs and browsers, loading the entire city is impossible. We use a 2D grid chunk system.
          </p>
          <ul className="list-disc list-inside space-y-2 text-slate-400">
             <li>City split into 250m x 250m chunks.</li>
             <li>Asset Container system in Babylon.js allows loading a glTF once and instancing it.</li>
             <li>Only 9 chunks are active at once (current chunk + 8 surrounding).</li>
             <li>Far LODs (impostors) are rendered for distance buildings.</li>
          </ul>
          <CodeBlock language="typescript" title="ChunkManager.ts" code={`
// Calculate player chunk coordinates
const chunkSize = 250;
const playerCx = Math.floor(playerPos.x / chunkSize);
const playerCz = Math.floor(playerPos.z / chunkSize);

// Unload distant chunks
activeChunks.forEach((chunk) => {
    if (Math.abs(chunk.cx - playerCx) > 1 || Math.abs(chunk.cz - playerCz) > 1) {
        chunk.hide();
    }
});

// Load new chunks
for (let x = -1; x <= 1; x++) {
    for (let z = -1; z <= 1; z++) {
        const cx = playerCx + x;
        const cz = playerCz + z;
        if (!isChunkLoaded(cx, cz)) {
            loadChunkAsync(cx, cz);
        }
    }
}
          `} />
        </div>
      );

    case 'prototype':
      return (
        <div className="space-y-4">
          <p className="text-slate-300">
            Below is a live Babylon.js instance using Havok physics to demonstrate the minimal required Character Controller logic.
          </p>
          <PrototypeCanvas />
        </div>
      );

    case 'performance':
      return (
        <div className="space-y-4 text-slate-300">
           <ul className="space-y-3">
             <li><strong className="text-emerald-400">Instanced Rendering:</strong> Pedestrians, traffic cars, trees, and streetlights use `InstancedMesh` or `ThinInstances`.</li>
             <li><strong className="text-emerald-400">Asset Compression:</strong> All textures compressed using KTX2 with Basis Universal.</li>
             <li><strong className="text-emerald-400">Collision Simplification:</strong> Visual models do not have collision meshes. Collision relies on primitive boxes matching city blocks.</li>
             <li><strong className="text-emerald-400">Material Pooling:</strong> The cel-shaded style allows sharing exactly ONE master NodeMaterial across thousands of meshes, only swapping instanced colors.</li>
           </ul>
        </div>
      );
      
    case 'npc':
      return (
         <div className="space-y-4 text-slate-300">
            <p>NPCs use a node-based waypoint graph mapped overlaying the sidewalk navmesh.</p>
            <CodeBlock language="json" title="Waypoints JSON" code={`
{
  "nodes": [
    { "id": "A1", "pos": [0, 0, 10], "neighbors": ["A2", "B1"] },
    { "id": "A2", "pos": [0, 0, 20], "neighbors": ["A1"], "activity": "cross_street" }
  ]
}
            `} />
         </div>
      );
      
    case 'missions':
      return (
         <div className="space-y-4 text-slate-300">
            <p>Missions are structured as Directed Acyclic Graphs (DAG).</p>
            <CodeBlock language="typescript" title="Mission Engine" code={`
interface Objective {
    type: "reach_location" | "steal_vehicle" | "talk_npc";
    targetId: string;
    completed: boolean;
}

interface Mission {
    id: string;
    objectives: Objective[];
    onComplete: () => void;
}
            `} />
         </div>
      );

    case 'roadmap':
      return (
          <div className="space-y-6 text-slate-300">
              <div className="border-l-2 border-emerald-500 pl-4 py-2">
                 <h4 className="font-bold text-white">Phase 1: Vertical Slice (Months 1-3)</h4>
                 <p className="text-sm">Babylon.js engine init, character controller, 1 city block chunk.</p>
              </div>
              <div className="border-l-2 border-slate-700 pl-4 py-2 opacity-70">
                 <h4 className="font-bold text-white">Phase 2: Networking & Systems (Months 4-6)</h4>
                 <p className="text-sm">Colyseus integration, vehicles, NPC traffic algorithms.</p>
              </div>
              <div className="border-l-2 border-slate-700 pl-4 py-2 opacity-70">
                 <h4 className="font-bold text-white">Phase 3: Content Expansion (Months 7-10)</h4>
                 <p className="text-sm">Full city streaming, mission logic, economy.</p>
              </div>
          </div>
      );

    default:
      return <div>Section coming soon.</div>;
  }
}
