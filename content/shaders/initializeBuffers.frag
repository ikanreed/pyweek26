#version 400
uniform sampler2D intexture;
in vec2 vTexCoord;
out vec4 fragColor;
out ivec4 status;//"energy", direction, momentum
void main()
{
	fragColor=texture2D(intexture, vTexCoord);
	status=ivec4(10,100,255,255);
	//fragColor=vec4(vTexCoord,0,1);
}