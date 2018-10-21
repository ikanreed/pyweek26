#version 400
uniform sampler2D intexture;
in vec2 vTexCoord;
out vec4 fragColor;
void main()
{
	fragColor=texture2D(intexture, vTexCoord);
	//fragColor=vec4(vTexCoord,0,1);
}