import React, { useEffect, useRef, useState } from 'react';
import {
  Engine,
  Scene,
  Vector3,
  ArcRotateCamera,
  HemisphericLight,
  MeshBuilder,
  StandardMaterial,
  Color3,
  PhysicsShapeType,
  PhysicsAggregate,
  HavokPlugin,
  KeyboardEventTypes,
  Quaternion,
  TransformNode,
} from '@babylonjs/core';
import HavokPhysics from '@babylonjs/havok';

export function PrototypeCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let engine: Engine;
    let scene: Scene;

    const init = async () => {
      if (!canvasRef.current) return;

      engine = new Engine(canvasRef.current, true, {
        preserveDrawingBuffer: true,
        stencil: true,
      });

      scene = new Scene(engine);
      scene.clearColor = new Color3(0.1, 0.15, 0.25).toColor4(1);

      // Camera
      const camera = new ArcRotateCamera("camera", -Math.PI / 2, Math.PI / 3, 20, Vector3.Zero(), scene);
      camera.attachControl(canvasRef.current, true);
      camera.lowerRadiusLimit = 5;
      camera.upperRadiusLimit = 50;

      // Light
      const light = new HemisphericLight("light", new Vector3(0, 1, 0), scene);
      light.intensity = 0.7;

      // Physics
      const havokInstance = await HavokPhysics({ locateFile: () => 'https://cdn.babylonjs.com/havok/HavokPhysics.wasm' });
      const hk = new HavokPlugin(true, havokInstance);
      scene.enablePhysics(new Vector3(0, -9.81, 0), hk);

      // Ground
      const ground = MeshBuilder.CreateGround("ground", { width: 100, height: 100 }, scene);
      const groundMat = new StandardMaterial("groundMat", scene);
      groundMat.diffuseColor = new Color3(0.2, 0.8, 0.2);
      ground.material = groundMat;
      new PhysicsAggregate(ground, PhysicsShapeType.BOX, { mass: 0 }, scene);

      // Obstacles
      for (let i = 0; i < 20; i++) {
        const obs = MeshBuilder.CreateBox("obs", { size: 2 }, scene);
        obs.position.x = Math.random() * 40 - 20;
        obs.position.z = Math.random() * 40 - 20;
        obs.position.y = 1;
        const obsMat = new StandardMaterial("obsMat", scene);
        obsMat.diffuseColor = new Color3(Math.random(), Math.random(), Math.random());
        obs.material = obsMat;
        new PhysicsAggregate(obs, PhysicsShapeType.BOX, { mass: 0 }, scene);
      }

      // Player Character (Capsule)
      const playerBody = MeshBuilder.CreateCapsule("player", { radius: 0.5, height: 2 }, scene);
      playerBody.position.y = 5;
      const playerMat = new StandardMaterial("playerMat", scene);
      playerMat.diffuseColor = new Color3(1, 0.2, 0.2);
      playerBody.material = playerMat;

      const playerAggregate = new PhysicsAggregate(playerBody, PhysicsShapeType.CAPSULE, { mass: 1, friction: 0.5, restitution: 0 }, scene);
      playerAggregate.body.disablePreStep = false;
      
      // Keep upright
      playerAggregate.body.setMassProperties({
          inertia: new Vector3(0,0,0) // lock rotation
      });


      camera.lockedTarget = playerBody;

      // Input Map
      const inputMap: Record<string, boolean> = {};
      scene.onKeyboardObservable.add((kbInfo) => {
        switch (kbInfo.type) {
          case KeyboardEventTypes.KEYDOWN:
            inputMap[kbInfo.event.key.toLowerCase()] = true;
            break;
          case KeyboardEventTypes.KEYUP:
            inputMap[kbInfo.event.key.toLowerCase()] = false;
            break;
        }
      });

      // Controller logic
      const speed = 10;
      const jumpForce = 8;
      
      scene.onBeforeRenderObservable.add(() => {
        const vel = playerAggregate.body.getLinearVelocity();
        let moveX = 0;
        let moveZ = 0;

        // Use camera direction relative inputs
        const forward = camera.getForwardRay().direction;
        forward.y = 0;
        forward.normalize();
        
        const right = Vector3.Cross(new Vector3(0,1,0), forward).normalize();

        if (inputMap["w"]) { moveZ += 1; }
        if (inputMap["s"]) { moveZ -= 1; }
        if (inputMap["d"]) { moveX -= 1; } // Flipped
        if (inputMap["a"]) { moveX += 1; } // Flipped

        const dir = forward.scale(moveZ).add(right.scale(moveX)).normalize();

        if (dir.length() > 0) {
            playerAggregate.body.setLinearVelocity(new Vector3(dir.x * speed, vel.y, dir.z * speed));
        } else {
            playerAggregate.body.setLinearVelocity(new Vector3(vel.x * 0.9, vel.y, vel.z * 0.9)); // Friction
        }

        if (inputMap[" "] && Math.abs(vel.y) < 0.1) {
             playerAggregate.body.applyImpulse(new Vector3(0, jumpForce, 0), playerBody.getAbsolutePosition());
             inputMap[" "] = false; // Prevent hold to jump repeatedly immediately
        }
      });

      engine.runRenderLoop(() => {
        scene.render();
      });

      const resize = () => engine.resize();
      window.addEventListener("resize", resize);
      
      setLoading(false);

      return () => {
        window.removeEventListener("resize", resize);
        scene.dispose();
        engine.dispose();
      };
    };

    let cleanup: any;
    init().then((clean) => { cleanup = clean; });

    return () => {
      if (cleanup) cleanup();
    };
  }, []);

  return (
    <div className="relative w-full h-[600px] bg-slate-900 rounded-xl overflow-hidden border border-slate-800 shadow-2xl">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-900 z-10 text-emerald-400 font-mono">
          [ INITIALIZING HAVOK PHYSICS ENGINE ]
        </div>
      )}
      <div className="absolute top-4 left-4 z-10 bg-slate-900/80 p-4 rounded-lg border border-slate-700 backdrop-blur text-sm font-mono text-slate-300">
        <h3 className="text-emerald-400 font-bold mb-2 uppercase tracking-wide">Prototype Testing Area</h3>
        <p>Controls:</p>
        <ul className="mt-1 space-y-1">
          <li><span className="text-white bg-slate-800 px-1 rounded">W</span><span className="text-white bg-slate-800 px-1 rounded mx-1">A</span><span className="text-white bg-slate-800 px-1 rounded">S</span><span className="text-white bg-slate-800 px-1 rounded mx-1">D</span> - Move Character</li>
          <li><span className="text-white bg-slate-800 px-1 rounded">Space</span> - Jump</li>
          <li><span className="text-white bg-slate-800 px-1 rounded">Mouse</span> - Orbit Camera</li>
        </ul>
      </div>
      <canvas ref={canvasRef} className="w-full h-full touch-none" style={{ outline: 'none' }} />
    </div>
  );
}
