import {
    Engine, Scene, Vector3, ArcRotateCamera, HemisphericLight, DirectionalLight,
    MeshBuilder, StandardMaterial, Color3, PhysicsShapeType, TransformNode,
    PhysicsAggregate, HavokPlugin, KeyboardEventTypes, Quaternion
} from '@babylonjs/core';
import HavokPhysics from '@babylonjs/havok';

export const inputMap: Record<string, boolean> = {};

export async function initGameEngine(canvas: HTMLCanvasElement) {
    const engine = new Engine(canvas, true, { preserveDrawingBuffer: true, stencil: true });
    
    // Scene setup
    const scene = new Scene(engine);
    scene.clearColor = new Color3(0.4, 0.8, 1.0).toColor4(1); // Cartoon bright sky

    // Gravity & Physics Engine
    const havokInstance = await HavokPhysics({ locateFile: () => 'https://cdn.babylonjs.com/havok/HavokPhysics.wasm' });
    const hk = new HavokPlugin(true, havokInstance);
    // Extra snappy gravity for platformer feel
    scene.enablePhysics(new Vector3(0, -25, 0), hk); 

    // Lighting
    const hemiLight = new HemisphericLight("hemiLight", new Vector3(0, 1, 0), scene);
    hemiLight.intensity = 0.5;
    hemiLight.groundColor = new Color3(0.3, 0.4, 0.3);

    const dirLight = new DirectionalLight("dirLight", new Vector3(-1, -2, -1), scene);
    dirLight.intensity = 0.8;
    dirLight.position = new Vector3(20, 40, 20);

    // Ground
    const ground = MeshBuilder.CreateGround("ground", { width: 500, height: 500 }, scene);
    const groundMat = new StandardMaterial("groundMat", scene);
    groundMat.diffuseColor = new Color3(0.35, 0.75, 0.35); // Grass
    groundMat.specularColor = new Color3(0, 0, 0); 
    ground.material = groundMat;
    new PhysicsAggregate(ground, PhysicsShapeType.BOX, { mass: 0 }, scene);

    // --- City Generation ---
    generateCity(scene);

    // --- Player Setup ---
    // 1. Visual player node (decoupled from physics for smooth rotation)
    const playerVisual = new TransformNode("playerVisual", scene);
    playerVisual.rotationQuaternion = Quaternion.Identity();

    // Body mesh
    const playerMesh = MeshBuilder.CreateCapsule("visualMesh", { radius: 0.5, height: 2 }, scene);
    playerMesh.parent = playerVisual;
    playerMesh.position.y = 1; // Center mesh on bottom reference
    
    const playerMat = new StandardMaterial("playerMat", scene);
    playerMat.diffuseColor = new Color3(1, 0.3, 0.2); // Hero Red
    playerMat.specularColor = new Color3(0, 0, 0);
    playerMesh.material = playerMat;
    
    // Outline for cartoon aesthetic
    playerMesh.renderOutline = true;
    playerMesh.outlineColor = Color3.Black();
    playerMesh.outlineWidth = 0.05;

    // Face / Visor (to show direction)
    const visor = MeshBuilder.CreateBox("visor", { width: 0.6, height: 0.2, depth: 0.25 }, scene);
    visor.parent = playerVisual;
    visor.position = new Vector3(0, 1.5, 0.45);
    const visorMat = new StandardMaterial("visorMat", scene);
    visorMat.diffuseColor = new Color3(0.1, 0.1, 0.1);
    visor.material = visorMat;

    // 2. Physics Collider (invisible)
    const collider = MeshBuilder.CreateCapsule("collider", { radius: 0.5, height: 2 }, scene);
    collider.position = new Vector3(0, 10, 0);
    collider.isVisible = false; // Hide actual physics mesh

    const colliderAgg = new PhysicsAggregate(
        collider, 
        PhysicsShapeType.CAPSULE, 
        { mass: 1, friction: 0, restitution: 0 }, 
        scene
    );
    // Lock rotation on physics body to prevent tipping over
    colliderAgg.body.setMassProperties({ inertia: new Vector3(0,0,0) }); 

    // --- Camera Setup ---
    const camera = new ArcRotateCamera("camera", -Math.PI / 2, Math.PI / 3, 15, Vector3.Zero(), scene);
    camera.attachControl(canvas, true);
    camera.lowerRadiusLimit = 4;
    camera.upperRadiusLimit = 30;
    // Follow the physics collider directly
    camera.lockedTarget = collider;

    // --- Input Handling ---
    scene.onKeyboardObservable.add((kbInfo) => {
        if (kbInfo.type === KeyboardEventTypes.KEYDOWN) {
            inputMap[kbInfo.event.key.toLowerCase()] = true;
        } else if (kbInfo.type === KeyboardEventTypes.KEYUP) {
            inputMap[kbInfo.event.key.toLowerCase()] = false;
        }
    });

    // --- Game Loop ---
    const moveSpeed = 16;
    const jumpForce = 18;

    scene.onBeforeRenderObservable.add(() => {
        // Synchronize visual position to physics mesh smoothly
        playerVisual.position.copyFrom(collider.position);
        playerVisual.position.y -= 1; // offset visual offset from center

        const vel = colliderAgg.body.getLinearVelocity();
        // Simple grounded check 
        const isGrounded = Math.abs(vel.y) < 0.2;

        const forward = camera.getForwardRay().direction;
        forward.y = 0;
        forward.normalize();
        const right = Vector3.Cross(new Vector3(0,1,0), forward).normalize();

        let moveX = 0; 
        let moveZ = 0;

        if (inputMap["w"]) moveZ += 1;
        if (inputMap["s"]) moveZ -= 1;
        if (inputMap["a"]) moveX -= 1; 
        if (inputMap["d"]) moveX += 1; 

        // Input vector
        const dir = forward.scale(moveZ).add(right.scale(moveX)).normalize();

        if (dir.length() > 0) {
            // Apply horizontal velocity immediately
            colliderAgg.body.setLinearVelocity(new Vector3(dir.x * moveSpeed, vel.y, dir.z * moveSpeed));
            
            // Smoothly rotate visual mesh to facing direction
            const angle = Math.atan2(dir.x, dir.z);
            const targetRot = Quaternion.RotationAxis(Vector3.Up(), angle);
            
            playerVisual.rotationQuaternion = Quaternion.Slerp(
                playerVisual.rotationQuaternion as Quaternion,
                targetRot,
                0.2 // lerp speed
            );
        } else {
            // Friction/Deceleration
            colliderAgg.body.setLinearVelocity(new Vector3(vel.x * 0.7, vel.y, vel.z * 0.7));
        }

        // Jump
        if (inputMap[" "] && isGrounded) {
            colliderAgg.body.applyImpulse(new Vector3(0, jumpForce, 0), collider.getAbsolutePosition());
            inputMap[" "] = false; // block continuous hold
        }
    });

    engine.runRenderLoop(() => {
        scene.render();
    });

    const resize = () => engine.resize();
    window.addEventListener("resize", resize);

    return () => {
        window.removeEventListener("resize", resize);
        scene.dispose();
        engine.dispose();
    };
}

// Procedural City Block Generation
function generateCity(scene: Scene) {
    const colors = [
        new Color3(1.0, 0.9, 0.9), // White
        new Color3(0.9, 0.4, 0.4), // Red
        new Color3(0.3, 0.6, 0.9), // Blue
        new Color3(0.9, 0.8, 0.2), // Yellow
        new Color3(0.3, 0.8, 0.6), // Teal
        new Color3(0.8, 0.6, 0.4), // Orange
    ];

    for (let x = -100; x <= 100; x += 35) {
        for (let z = -100; z <= 100; z += 35) {
            // Keep the very center clear to spawn the player safely
            if (Math.abs(x) < 30 && Math.abs(z) < 30) continue;

            // 85% chance to spawn a block
            if (Math.random() < 0.85) {
                // Skyscraper or residential
                const isSkyscraper = Math.random() < 0.2;
                const height = isSkyscraper ? 20 + Math.random() * 40 : 8 + Math.random() * 15;
                const width = 12 + Math.random() * 10;
                const depth = 12 + Math.random() * 10;

                const bldg = MeshBuilder.CreateBox(`bldg_${x}_${z}`, { width, height, depth }, scene);
                // add slight offset so it feels more organic
                bldg.position.set(x + (Math.random()*6-3), height / 2, z + (Math.random()*6-3));

                const mat = new StandardMaterial(`mat_${x}_${z}`, scene);
                mat.diffuseColor = colors[Math.floor(Math.random() * colors.length)];
                mat.specularColor = new Color3(0.1, 0.1, 0.1);
                bldg.material = mat;

                // Heavy outline for cartoon vibe
                bldg.renderOutline = true;
                bldg.outlineColor = new Color3(0.05, 0.05, 0.05);
                bldg.outlineWidth = 0.2;

                new PhysicsAggregate(bldg, PhysicsShapeType.BOX, { mass: 0 }, scene);
            }
        }
    }
}
