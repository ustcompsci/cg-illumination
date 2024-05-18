#version 300 es
precision highp float;

// Attributes
in vec3 position;
in vec2 uv;

// Uniforms
// projection 3D to 2D
uniform mat4 world;
uniform mat4 view;
uniform mat4 projection;
// height displacement
uniform vec2 ground_size;
uniform float height_scalar;
uniform sampler2D heightmap;
// material
uniform float mat_shininess;
uniform vec2 texture_scale;
// camera
uniform vec3 camera_position;
// lights
uniform int num_lights;
uniform vec3 light_positions[8];
uniform vec3 light_colors[8]; // Ip

// Output
out vec2 model_uv;
out vec3 diffuse_illum;
out vec3 specular_illum;

void main() {
    // Get initial position of vertex (prior to height displacement)
    vec4 world_pos = world * vec4(position, 1.0);

    float height = texture(heightmap, uv).r;
    float d = 2.0 * height_scalar * (height - 0.5);
    world_pos.y += d;

    vec3 tangent = vec3(1.0, 2.0 * height_scalar * (texture(heightmap, uv + vec2(0.01, 0.0)).r - 0.5) - d, 0.0);
    vec3 bitangent = vec3(0.0, 2.0 * height_scalar * (texture(heightmap, uv + vec2(0.0, 0.01)).r - 0.5) - d, 1.0);
    vec3 normal = normalize(cross(bitangent, tangent));

    vec3 viewDir = normalize(camera_position - world_pos.xyz);
    vec3 lightDir;
    vec3 reflectDir;
    vec3 ambientLight = vec3(0.1, 0.1, 0.1);
    vec3 diffuseLight = vec3(0.0);
    vec3 specularLight = vec3(0.0);

    for (int i = 0; i < num_lights; i++) {
        lightDir = normalize(light_positions[i] - world_pos.xyz);
        reflectDir = reflect(-lightDir, normal);
        diffuseLight += light_colors[i] * max(dot(normal, lightDir), 0.0);
        specularLight += light_colors[i] * pow(max(dot(reflectDir, viewDir), 0.0), mat_shininess);
    }

    // Pass diffuse and specular illumination onto the fragment shader
    diffuse_illum = clamp(diffuseLight, vec3(0.0), vec3(1.0));
    specular_illum = clamp(specularLight, vec3(0.0), vec3(1.0));

    // Pass vertex texcoord onto the fragment shader
    model_uv = uv;

    // Transform and project vertex from 3D world-space to 2D screen-space
    gl_Position = projection * view * world_pos;
}
