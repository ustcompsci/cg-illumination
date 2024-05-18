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
uniform vec2 texture_scale;

// Output
out vec3 model_position;
out vec3 model_normal;
out vec2 model_uv;

void main() {
    // Get initial position of vertex (prior to height displacement)
    vec4 world_pos = world * vec4(position, 1.0);
    float height = texture(heightmap, uv).r;
    float d = 2.0 * height_scalar * (height - 0.5);
    world_pos.y += d;

    vec3 tangent = vec3(1.0, 2.0 * height_scalar * (texture(heightmap, uv + vec2(0.01, 0.0)).r - 0.5) - d, 0.0);
    vec3 bitangent = vec3(0.0, 2.0 * height_scalar * (texture(heightmap, uv + vec2(0.0, 0.01)).r - 0.5) - d, 1.0);
    vec3 normal = normalize(cross(bitangent, tangent));

    // Pass vertex position onto the fragment shader
    model_position = world_pos.xyz;
    // Pass vertex normal onto the fragment shader
    // model_normal = vec3(0.0, 1.0, 0.0);
    model_normal = normal;
    // Pass vertex texcoord onto the fragment shader
    model_uv = uv;

    // Transform and project vertex from 3D world-space to 2D screen-space
    gl_Position = projection * view * world_pos;
}
