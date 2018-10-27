#version 400
uniform sampler2D intexture;
uniform vec3 targetColor;
uniform float colorTolerance;
uniform vec4 initialStatusColors;
in vec2 vTexCoord;
out vec4 fragColor;

out vec4 status;//pressure and material id
out vec4 velocity;
void main()
{
	vec2 sampLoc=vec2(vTexCoord.x, vTexCoord.y);
	vec4 incolor=texture2D(intexture, sampLoc);
	if(distance(incolor.xyz, targetColor)<colorTolerance)
	{
		fragColor=vec4(targetColor,1);
		status=initialStatusColors;
		velocity=vec4(0.5,0.5,0,1);
	}
	else
	{
		discard;
	}
}