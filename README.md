import React from 'react';
import type { DocContent } from './types';

export const docs: DocContent[] = [
  {
    id: 'overview',
    title: 'Project Overview',
    description: 'High-level game design document and technical stack.',
    content: null, // We'll render custom components here
  },
  {
    id: 'architecture',
    title: '1. Project Architecture',
    description: 'High-level system architecture and data flow.',
    content: null,
  },
  {
    id: 'structure',
    title: '2. Folder Structure',
    description: 'Monorepo organization for client, server, and shared logic.',
    content: null,
  },
  {
    id: 'database',
    title: '3. Database Schema',
    description: 'PostgreSQL schema for player data, inventory, and properties.',
    content: null,
  },
  {
    id: 'network',
    title: '4. Network Architecture',
    description: 'Colyseus multiplayer state sync and latency compensation.',
    content: null,
  },
  {
    id: 'controller',
    title: '5. Character Controller',
    description: 'Implementation details of third-person physics-based controller.',
    content: null,
  },
  {
    id: 'vehicle',
    title: '6. Vehicle System',
    description: 'Raycast vehicle implementation and mounting logic.',
    content: null,
  },
  {
    id: 'streaming',
    title: '7. Open-World Streaming',
    description: 'Dynamic chunk loading and LOD management.',
    content: null,
  },
  {
    id: 'npc',
    title: '8. NPC AI System',
    description: 'State machine for pedestrian behavior and traffic.',
    content: null,
  },
  {
    id: 'missions',
    title: '9. Mission Framework',
    description: 'Quest graph, objectives, and event triggers.',
    content: null,
  },
  {
    id: 'performance',
    title: '10. Performance Strategy',
    description: 'Optimization for low-end browsers and WebGPU.',
    content: null,
  },
  {
    id: 'roadmap',
    title: '11. Development Roadmap',
    description: 'Milestones from prototype to global release.',
    content: null,
  },
  {
    id: 'prototype',
    title: 'Interactive Prototype',
    description: 'Live testing environment for character physics.',
    content: null,
  }
];
