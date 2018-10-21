#version 400
uniform sampler2D previous_frame;
uniform sampler2D previous_status;

in vec2 vTexCoord;
out vec4 fragColor;
out vec4 status;
void main()
{
	fragColor=texture2D(previous_frame, vTexCoord);

	status=ivec4(texture2D(previous_status,vTexCoord)*256);
}