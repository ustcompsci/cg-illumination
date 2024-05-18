import { Scene } from '@babylonjs/core/scene';
import { UniversalCamera } from '@babylonjs/core/Cameras/universalCamera';
import { PointLight } from '@babylonjs/core/Lights/pointLight';
import { CreateSphere } from '@babylonjs/core/Meshes/Builders/sphereBuilder';
import { CreateBox } from '@babylonjs/core/Meshes/Builders/boxBuilder';
import { CreateCylinder } from '@babylonjs/core/Meshes/Builders/cylinderBuilder';
import { Mesh } from '@babylonjs/core/Meshes/mesh';
import { VertexData } from '@babylonjs/core/Meshes/mesh.vertexData';
import { Texture } from '@babylonjs/core/Materials/Textures/texture';
import { RawTexture } from '@babylonjs/core/Materials/Textures/rawTexture';
import { Color3, Color4 } from '@babylonjs/core/Maths/math.color';
import { Vector2, Vector3 } from '@babylonjs/core/Maths/math.vector';
import { NoiseProceduralTexture } from '@babylonjs/core/Materials/Textures/Procedurals/noiseProceduralTexture';
import { FireProceduralTexture } from '@babylonjs/procedural-textures';

const BASE_URL = import.meta.env.BASE_URL || '/';

class Renderer {
    constructor(canvas, engine, material_callback, ground_mesh_callback) {
        this.canvas = canvas;
        this.engine = engine;
        this.scenes = [
            {
                scene: new Scene(this.engine),
                background_color: new Color4(0.1, 0.1, 0.1, 1.0),
                materials: null,
                ground_subdivisions: [50, 50],
                ground_mesh: null,
                camera: null,
                ambient: new Color3(0.2, 0.2, 0.2),
                lights: [],
                models: []
            }
        ];
        this.active_scene = 0;
        this.active_light = 0;
        this.shading_alg = 'gouraud';

        this.scenes.forEach((scene, idx) => {
            scene.materials = material_callback(scene.scene);
            scene.ground_mesh = ground_mesh_callback(scene.scene, scene.ground_subdivisions);
            this['createScene' + idx](idx);
        });

        for (let i = 1; i <= 3; i++) {
            this.scenes.push({
                scene: new Scene(this.engine),
                background_color: new Color4(0.1, 0.1, 0.1, 1.0),
                materials: null,
                ground_subdivisions: [50, 50],
                ground_mesh: null,
                camera: null,
                ambient: new Color3(0.2, 0.2, 0.2),
                lights: [],
                models: []
            });
            let idx = this.scenes.length - 1;
            this.scenes[idx].materials = material_callback(this.scenes[idx].scene);
            this.scenes[idx].ground_mesh = ground_mesh_callback(this.scenes[idx].scene, this.scenes[idx].ground_subdivisions);
            this['createScene' + i](idx);
        }

        window.addEventListener('keydown', this.handleKeyDown.bind(this));
    }

    handleKeyDown(event) {
        const key = event.key.toLowerCase();
        const currentScene = this.scenes[this.active_scene];
        const activeLight = currentScene.lights[this.active_light];

        const translationSpeed = 0.1;

        switch (key) {
            case 'a':
                activeLight.position.x -= translationSpeed;
                break;
            case 'd':
                activeLight.position.x += translationSpeed;
                break;
            case 'f':
                activeLight.position.y -= translationSpeed;
                break;
            case 'r':
                activeLight.position.y += translationSpeed;
                break;
            case 'w':
                activeLight.position.z -= translationSpeed;
                break;
            case 's':
                activeLight.position.z += translationSpeed;
                break;
        }
    }

    createScene0(scene_idx) {
        let current_scene = this.scenes[scene_idx];
        let scene = current_scene.scene;
        let materials = current_scene.materials;
        let ground_mesh = current_scene.ground_mesh;

        // Set scene-wide / environment values
        scene.clearColor = current_scene.background_color;
        scene.ambientColor = current_scene.ambient;
        scene.useRightHandedSystem = true;

        // Create camera
        current_scene.camera = new UniversalCamera('camera', new Vector3(0.0, 1.8, 10.0), scene);
        current_scene.camera.setTarget(new Vector3(0.0, 1.8, 0.0));
        current_scene.camera.upVector = new Vector3(0.0, 1.0, 0.0);
        current_scene.camera.attachControl(this.canvas, true);
        current_scene.camera.fov = 35.0 * (Math.PI / 180);
        current_scene.camera.minZ = 0.1;
        current_scene.camera.maxZ = 100.0;

        // Create point light sources
        let light0 = new PointLight('light0', new Vector3(1.0, 1.0, 5.0), scene);
        light0.diffuse = new Color3(1.0, 1.0, 1.0);
        light0.specular = new Color3(1.0, 1.0, 1.0);
        current_scene.lights.push(light0);

        let light1 = new PointLight('light1', new Vector3(0.0, 3.0, 0.0), scene);
        light1.diffuse = new Color3(1.0, 1.0, 1.0);
        light1.specular = new Color3(1.0, 1.0, 1.0);
        current_scene.lights.push(light1);

        // Create ground mesh
        let white_texture = RawTexture.CreateRGBTexture(new Uint8Array([255, 255, 255]), 1, 1, scene);
        let ground_heightmap = new Texture(BASE_URL + 'heightmaps/default.png', scene);
        ground_mesh.scaling = new Vector3(20.0, 1.0, 20.0);
        ground_mesh.metadata = {
            mat_color: new Color3(0.10, 0.65, 0.15),
            mat_texture: white_texture,
            mat_specular: new Color3(0.0, 0.0, 0.0),
            mat_shininess: 1,
            texture_scale: new Vector2(1.0, 1.0),
            height_scalar: 1.0,
            heightmap: ground_heightmap
        };
        ground_mesh.material = materials['ground_' + this.shading_alg];

        // Create other models
        let sphere = CreateSphere('sphere', { segments: 32 }, scene);
        sphere.position = new Vector3(1.0, 0.5, 3.0);
        sphere.metadata = {
            mat_color: new Color3(0.10, 0.35, 0.88),
            mat_texture: white_texture,
            mat_specular: new Color3(0.8, 0.8, 0.8),
            mat_shininess: 16,
            texture_scale: new Vector2(1.0, 1.0)
        };
        sphere.material = materials['illum_' + this.shading_alg];
        current_scene.models.push(sphere);

        let box = CreateBox('box', { width: 2, height: 1, depth: 1 }, scene);
        box.position = new Vector3(-1.0, 0.5, 2.0);
        box.metadata = {
            mat_color: new Color3(0.75, 0.15, 0.05),
            mat_texture: white_texture,
            mat_specular: new Color3(0.4, 0.4, 0.4),
            mat_shininess: 4,
            texture_scale: new Vector2(1.0, 1.0)
        };
        box.material = materials['illum_' + this.shading_alg];
        current_scene.models.push(box);


        // Animation function - called before each frame gets rendered
        scene.onBeforeRenderObservable.add(() => {
            // update models and lights here (if needed)
            // ...

            // update uniforms in shader programs
            this.updateShaderUniforms(scene_idx, materials['illum_' + this.shading_alg]);
            this.updateShaderUniforms(scene_idx, materials['ground_' + this.shading_alg]);
        });
    }

    createScene1(scene_idx) {
        let current_scene = this.scenes[scene_idx];
        let scene = current_scene.scene;
        let materials = current_scene.materials;
        let ground_mesh = current_scene.ground_mesh;

        // Set scene-wide / environment values
        scene.clearColor = current_scene.background_color;
        scene.ambientColor = current_scene.ambient;
        scene.useRightHandedSystem = true;

        // Create camera
        current_scene.camera = new UniversalCamera('camera', new Vector3(0.0, 1.8, 10.0), scene);
        current_scene.camera.setTarget(new Vector3(0.0, 1.8, 0.0));
        current_scene.camera.upVector = new Vector3(0.0, 1.0, 0.0);
        current_scene.camera.attachControl(this.canvas, true);
        current_scene.camera.fov = 35.0 * (Math.PI / 180);
        current_scene.camera.minZ = 0.1;
        current_scene.camera.maxZ = 100.0;

        // Create point light sources
        let light0 = new PointLight('light0', new Vector3(1.0, 1.0, 5.0), scene);
        light0.diffuse = new Color3(1.0, 1.0, 1.0);
        light0.specular = new Color3(1.0, 1.0, 1.0);
        current_scene.lights.push(light0);

        let light1 = new PointLight('light1', new Vector3(0.0, 3.0, 0.0), scene);
        light1.diffuse = new Color3(1.0, 1.0, 1.0);
        light1.specular = new Color3(1.0, 1.0, 1.0);
        current_scene.lights.push(light1);

        // Create ground mesh
        let white_texture = RawTexture.CreateRGBTexture(new Uint8Array([255, 255, 255]), 1, 1, scene);
        let noiseTexture = new NoiseProceduralTexture("perlin", 256, scene);
        ground_mesh.scaling = new Vector3(20.0, 1.0, 20.0);
        ground_mesh.metadata = {
            mat_color: new Color3(Math.random(), Math.random(), Math.random()),
            mat_texture: noiseTexture,
            mat_specular: new Color3(0.0, 0.0, 0.0),
            mat_shininess: 1,
            texture_scale: new Vector2(1.0, 1.0),
            height_scalar: 1.0,
            heightmap: white_texture
        };
        ground_mesh.material = materials['ground_' + this.shading_alg];

        // Create other models
        let icosahedron = createIcosahedron('icosahedron', scene);
        icosahedron.position = new Vector3(2.0, 1.0, -2.0);
        icosahedron.scaling = new Vector3(1.5, 1.5, 1.5);
        icosahedron.metadata = {
            mat_color: new Color3(Math.random(), Math.random(), Math.random()),
            mat_texture: noiseTexture,
            mat_specular: new Color3(0.8, 0.8, 0.8),
            mat_shininess: 16,
            texture_scale: new Vector2(1.0, 1.0)
        };
        icosahedron.material = materials['illum_' + this.shading_alg];
        current_scene.models.push(icosahedron);

        let cylinder = CreateCylinder('cylinder', { height: 2, diameterTop: 1, diameterBottom: 1, tessellation: 32 }, scene);
        cylinder.position = new Vector3(-2.0, 1.0, -2.0);
        cylinder.scaling = new Vector3(2, 1, 1);
        cylinder.metadata = {
            mat_color: new Color3(Math.random(), Math.random(), Math.random()),
            mat_texture: noiseTexture,
            mat_specular: new Color3(0.8, 0.8, 0.8),
            mat_shininess: 32,
            texture_scale: new Vector2(1.0, 1.0)
        };
        cylinder.material = materials['illum_' + this.shading_alg];
        current_scene.models.push(cylinder);

        let sphere = CreateSphere('sphere', { segments: 32 }, scene);
        sphere.position = new Vector3(0.0, 1.5, 2.0);
        sphere.metadata = {
            mat_color: new Color3(Math.random(), Math.random(), Math.random()),
            mat_texture: noiseTexture,
            mat_specular: new Color3(0.8, 0.8, 0.8),
            mat_shininess: 16,
            texture_scale: new Vector2(1.0, 1.0)
        };
        sphere.material = materials['illum_' + this.shading_alg];
        current_scene.models.push(sphere);

        // Animation variables
        let icosahedronRotationSpeed = 0.01;
        let cylinderScalingSpeed = 0.005;
        let spherePositionAmplitude = 1.0;
        let spherePositionSpeed = 0.02;

        // Animation function - called before each frame gets rendered
        scene.onBeforeRenderObservable.add(() => {
            // update models and lights here (if needed)
            // ...
            icosahedron.rotation.y += icosahedronRotationSpeed;

            cylinder.scaling.y += cylinderScalingSpeed;
            if (cylinder.scaling.y > 2 || cylinder.scaling.y < 1) {
                cylinderScalingSpeed = -cylinderScalingSpeed;
            }

            sphere.position.y = 1.5 + Math.sin(performance.now() * spherePositionSpeed) * spherePositionAmplitude;

            // update uniforms in shader programs
            this.updateShaderUniforms(scene_idx, materials['illum_' + this.shading_alg]);
            this.updateShaderUniforms(scene_idx, materials['ground_' + this.shading_alg]);
        });
    }

    createScene2(scene_idx) {
        let current_scene = this.scenes[scene_idx];
        let scene = current_scene.scene;
        let materials = current_scene.materials;
        let ground_mesh = current_scene.ground_mesh;

        // Set scene-wide / environment values
        scene.clearColor = current_scene.background_color;
        scene.ambientColor = current_scene.ambient;
        scene.useRightHandedSystem = true;

        // Create camera
        current_scene.camera = new UniversalCamera('camera', new Vector3(0.0, 1.8, 10.0), scene);
        current_scene.camera.setTarget(new Vector3(0.0, 1.8, 0.0));
        current_scene.camera.upVector = new Vector3(0.0, 1.0, 0.0);
        current_scene.camera.attachControl(this.canvas, true);
        current_scene.camera.fov = 35.0 * (Math.PI / 180);
        current_scene.camera.minZ = 0.1;
        current_scene.camera.maxZ = 100.0;

        // Create point light sources
        let light0 = new PointLight('light0', new Vector3(-2.0, 2.0, 4.0), scene);
        light0.diffuse = new Color3(0.8, 0.2, 0.2);
        light0.specular = new Color3(0.8, 0.2, 0.2);
        current_scene.lights.push(light0);

        let light1 = new PointLight('light1', new Vector3(2.0, 2.0, 4.0), scene);
        light1.diffuse = new Color3(0.2, 0.2, 0.8);
        light1.specular = new Color3(0.2, 0.2, 0.8);
        current_scene.lights.push(light1);

        // Create ground mesh
        let white_texture = RawTexture.CreateRGBTexture(new Uint8Array([255, 255, 255]), 1, 1, scene);
        let ground_heightmap = new Texture(BASE_URL + 'heightmaps/default.png', scene);
        ground_mesh.scaling = new Vector3(20.0, 1.0, 20.0);
        ground_mesh.metadata = {
            mat_color: new Color3(0.10, 0.65, 0.15),
            mat_texture: white_texture,
            mat_specular: new Color3(0.0, 0.0, 0.0),
            mat_shininess: 1,
            texture_scale: new Vector2(1.0, 1.0),
            height_scalar: 1.0,
            heightmap: ground_heightmap
        };
        ground_mesh.material = materials['ground_' + this.shading_alg];

        // Create other models
        let box1 = CreateBox('box1', { width: 1, height: 3, depth: 1 }, scene);
        box1.position = new Vector3(0.0, 1.5, 2.0);
        box1.scaling = new Vector3(2, 1.5, 1);
        let fireTexture1 = new FireProceduralTexture("fireTexture1", 256, scene);
        box1.metadata = {
            mat_color: new Color3(0.9, 0.5, 0.1),
            mat_texture: fireTexture1,
            mat_specular: new Color3(0.3, 0.3, 0.3),
            mat_shininess: 8,
            texture_scale: new Vector2(2.0, 2.0)
        };
        box1.material = materials['illum_' + this.shading_alg];
        current_scene.models.push(box1);

        let box2 = CreateBox('box2', { width: 2, height: 1, depth: 2 }, scene);
        box2.position = new Vector3(0.0, 0.5, -2.0);
        let fireTexture2 = new FireProceduralTexture("fireTexture2", 256, scene);
        box2.metadata = {
            mat_color: new Color3(0.1, 0.5, 0.1),
            mat_texture: fireTexture2,
            mat_specular: new Color3(0.6, 0.6, 0.6),
            mat_shininess: 16,
            texture_scale: new Vector2(1.0, 1.0)
        };
        box2.material = materials['illum_' + this.shading_alg];
        current_scene.models.push(box2);

        let cylinder = CreateCylinder('cylinder', { height: 3, diameterTop: 1, diameterBottom: 1, tessellation: 32 }, scene);
        cylinder.position = new Vector3(3.0, 1.5, -3.0);
        cylinder.metadata = {
            mat_color: new Color3(0.4, 0.2, 0.8),
            mat_texture: white_texture,
            mat_specular: new Color3(0.7, 0.7, 0.7),
            mat_shininess: 32,
            texture_scale: new Vector2(2.0, 2.0)
        };
        cylinder.material = materials['illum_' + this.shading_alg];
        current_scene.models.push(cylinder);

        let sphere = CreateSphere('sphere', { segments: 32 }, scene);
        sphere.position = new Vector3(-3.0, 1, 3.0);
        sphere.scaling = new Vector3(2, 1, 1);
        sphere.metadata = {
            mat_color: new Color3(0.1, 0.9, 0.1),
            mat_texture: white_texture,
            mat_specular: new Color3(0.5, 0.5, 0.5),
            mat_shininess: 8,
            texture_scale: new Vector2(1.0, 1.0)
        };
        sphere.material = materials['illum_' + this.shading_alg];
        current_scene.models.push(sphere);

        // Animation function - called before each frame gets rendered
        scene.onBeforeRenderObservable.add(() => {
            // Update models and lights here (if needed)
            // ...

            // update uniforms in shader programs
            this.updateShaderUniforms(scene_idx, materials['illum_' + this.shading_alg]);
            this.updateShaderUniforms(scene_idx, materials['ground_' + this.shading_alg]);
        });
    }

    createScene3(scene_idx) {
        let current_scene = this.scenes[scene_idx];
        let scene = current_scene.scene;
        let materials = current_scene.materials;
        let ground_mesh = current_scene.ground_mesh;

        // Set scene-wide / environment values
        scene.clearColor = current_scene.background_color;
        scene.ambientColor = current_scene.ambient;
        scene.useRightHandedSystem = true;

        // Create camera
        current_scene.camera = new UniversalCamera('camera', new Vector3(0.0, 1.8, 10.0), scene);
        current_scene.camera.setTarget(new Vector3(0.0, 1.8, 0.0));
        current_scene.camera.upVector = new Vector3(0.0, 1.0, 0.0);
        current_scene.camera.attachControl(this.canvas, true);
        current_scene.camera.fov = 35.0 * (Math.PI / 180);
        current_scene.camera.minZ = 0.1;
        current_scene.camera.maxZ = 100.0;

        // Create point light sources
        for (let i = 0; i < 8; i++) {
            let light = new PointLight(`light${i}`, new Vector3(Math.random() * 10 - 5, Math.random() * 5, Math.random() * 10 - 5), scene);
            light.diffuse = new Color3(Math.random(), Math.random(), Math.random());
            light.specular = new Color3(Math.random(), Math.random(), Math.random());
            current_scene.lights.push(light);
        }

        // Create ground mesh
        let white_texture = RawTexture.CreateRGBTexture(new Uint8Array([255, 255, 255]), 1, 1, scene);
        let ground_heightmap = new Texture(BASE_URL + 'heightmaps/default.png', scene);
        ground_mesh.scaling = new Vector3(20.0, 1.0, 20.0);
        ground_mesh.metadata = {
            mat_color: new Color3(0.10, 0.65, 0.15),
            mat_texture: white_texture,
            mat_specular: new Color3(0.0, 0.0, 0.0),
            mat_shininess: 1,
            texture_scale: new Vector2(1.0, 1.0),
            height_scalar: 1.0,
            heightmap: ground_heightmap
        };
        ground_mesh.material = materials['ground_' + this.shading_alg];

        // Create other models
        let sphere = CreateSphere('sphere', { segments: 32, diameter: 4 }, scene);
        sphere.position = new Vector3(0.0, 2.0, 0.0);
        sphere.metadata = {
            mat_color: new Color3(0.8, 0.8, 0.8),
            mat_texture: white_texture,
            mat_specular: new Color3(0.5, 0.5, 0.5),
            mat_shininess: 32,
            texture_scale: new Vector2(1.0, 1.0)
        };
        sphere.material = materials['illum_' + this.shading_alg];
        current_scene.models.push(sphere);

        // Animation function - called before each frame gets rendered
        scene.onBeforeRenderObservable.add(() => {
            // update models and lights here (if needed)
            // ...

            // update uniforms in shader programs
            this.updateShaderUniforms(scene_idx, materials['illum_' + this.shading_alg]);
            this.updateShaderUniforms(scene_idx, materials['ground_' + this.shading_alg]);
        });
    }

    updateShaderUniforms(scene_idx, shader) {
        let current_scene = this.scenes[scene_idx];
        shader.setVector3('camera_position', current_scene.camera.position);
        shader.setColor3('ambient', current_scene.scene.ambientColor);
        shader.setInt('num_lights', current_scene.lights.length);
        let light_positions = [];
        let light_colors = [];
        current_scene.lights.forEach((light) => {
            light_positions.push(light.position.x, light.position.y, light.position.z);
            light_colors.push(light.diffuse);
        });
        shader.setArray3('light_positions', light_positions);
        shader.setColor3Array('light_colors', light_colors);
    }

    getActiveScene() {
        return this.scenes[this.active_scene].scene;
    }

    setActiveScene(idx) {
        this.active_scene = idx;
    }

    setShadingAlgorithm(algorithm) {
        this.shading_alg = algorithm;

        this.scenes.forEach((scene) => {
            let materials = scene.materials;
            let ground_mesh = scene.ground_mesh;

            ground_mesh.material = materials['ground_' + this.shading_alg];
            scene.models.forEach((model) => {
                model.material = materials['illum_' + this.shading_alg];
            });
        });
    }

    setHeightScale(scale) {
        this.scenes.forEach((scene) => {
            let ground_mesh = scene.ground_mesh;
            ground_mesh.metadata.height_scalar = scale;
        });
    }

    setActiveLight(idx) {
        console.log(idx);
        this.active_light = idx;
    }
}

function createIcosahedron(name, scene) {
    const t = (1 + Math.sqrt(5)) / 2;
    const positions = [
        -1, t, 0,
        1, t, 0,
        -1, -t, 0,
        1, -t, 0,
        0, -1, t,
        0, 1, t,
        0, -1, -t,
        0, 1, -t,
        t, 0, -1,
        t, 0, 1,
        -t, 0, -1,
        -t, 0, 1,
    ];

    const indices = [
        0, 11, 5,
        0, 5, 1,
        0, 1, 7,
        0, 7, 10,
        0, 10, 11,
        1, 5, 9,
        5, 11, 4,
        11, 10, 2,
        10, 7, 6,
        7, 1, 8,
        3, 9, 4,
        3, 4, 2,
        3, 2, 6,
        3, 6, 8,
        3, 8, 9,
        4, 9, 5,
        2, 4, 11,
        6, 2, 10,
        8, 6, 7,
        9, 8, 1
    ];

    const normals = [];
    for (let i = 0; i < indices.length; i += 3) {
        const p0 = new Vector3(positions[indices[i] * 3], positions[indices[i] * 3 + 1], positions[indices[i] * 3 + 2]);
        const p1 = new Vector3(positions[indices[i + 1] * 3], positions[indices[i + 1] * 3 + 1], positions[indices[i + 1] * 3 + 2]);
        const p2 = new Vector3(positions[indices[i + 2] * 3], positions[indices[i + 2] * 3 + 1], positions[indices[i + 2] * 3 + 2]);

        const normal = Vector3.Cross(p1.subtract(p0), p2.subtract(p0)).normalize();

        for (let j = 0; j < 3; j++) {
            normals.push(normal.x, normal.y, normal.z);
        }
    }

    const uvs = [];
    for (let i = 0; i < positions.length; i += 3) {
        const x = positions[i];
        const y = positions[i + 1];
        const z = positions[i + 2];
        uvs.push((Math.atan2(x, z) / (2 * Math.PI)) + 0.5, (y / 2) + 0.5);
    }

    const icosahedron = new Mesh(name, scene);
    const vertexData = new VertexData();
    vertexData.positions = positions;
    vertexData.indices = indices;
    vertexData.normals = normals;
    vertexData.uvs = uvs;
    vertexData.applyToMesh(icosahedron);

    return icosahedron;
}

export { Renderer };
