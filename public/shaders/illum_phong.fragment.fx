#version 300 es
precision mediump float;

// Input
in vec3 model_position;
in vec3 model_normal;
in vec2 model_uv;

// Uniforms
// material
uniform vec3 mat_color;
uniform vec3 mat_specular;
uniform float mat_shininess;
uniform sampler2D mat_texture;
// camera
uniform vec3 camera_position;
// lights
uniform vec3 ambient; // Ia
uniform int num_lights;
uniform vec3 light_positions[8];
uniform vec3 light_colors[8]; // Ip

// Output
out vec4 FragColor;

void main() {
    vec3 tex_color = texture(mat_texture, model_uv).rgb;
    vec3 viewDir = normalize(camera_position - model_position);
    vec3 normal = normalize(model_normal);
    vec3 result = ambient * tex_color * mat_color;
    vec3 specular_result = vec3(0.0);
    vec3 diffuse_result = vec3(0.0);

    for (int i = 0; i < num_lights; i++) {
        vec3 lightDir = normalize(light_positions[i] - model_position);
        float diff = max(dot(normal, lightDir), 0.0);

        vec3 reflectDir = reflect(-lightDir, normal);
        float spec = pow(max(dot(viewDir, reflectDir), 0.0), mat_shininess);

        diffuse_result += light_colors[i] * diff * tex_color * mat_color;
        specular_result += spec * light_colors[i] * mat_specular;
    }

    // Color
    // FragColor = vec4(mat_color * texture(mat_texture, model_uv).rgb, 1.0);
    FragColor = vec4(result + diffuse_result + specular_result, 1.0);
}
