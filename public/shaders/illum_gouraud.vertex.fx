#version 300 es
precision highp float;

// Attributes
in vec3 position;
in vec3 normal;
in vec2 uv;

// Uniforms
// projection 3D to 2D
uniform mat4 world;
uniform mat4 view;
uniform mat4 projection;
// material
uniform vec2 texture_scale;
uniform float mat_shininess;
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
    vec3 model_position = (world * vec4(position, 1.0)).xyz;
    vec3 model_normal = normalize(mat3(world) * normal);
    vec3 viewDir = normalize(camera_position - model_position);
    vec3 lightDir;
    float diff;
    vec3 ambientLight = vec3(0.1, 0.1, 0.1);
    vec3 diffuseLight = vec3(0.0);
    vec3 specularLight = vec3(0.0);

    for (int i = 0; i < num_lights; i++) {
        lightDir = normalize(light_positions[i] - model_position);
        diffuseLight += light_colors[i] * max(dot(model_normal, lightDir), 0.0);
        vec3 reflectDir = reflect(-lightDir, model_normal);
        specularLight += light_colors[i] * pow(max(dot(viewDir, reflectDir), 0.0), mat_shininess);
    }

    // Pass diffuse and specular illumination onto the fragment shader
    diffuse_illum = clamp(diffuseLight, vec3(0.0), vec3(1.0));
    specular_illum = clamp(specularLight, vec3(0.0), vec3(1.0));

    // Pass vertex texcoord onto the fragment shader
    model_uv = uv;

    // Transform and project vertex from 3D world-space to 2D screen-space
    gl_Position = projection * view * vec4(model_position, 1.0);
}
