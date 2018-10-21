#version 400
layout (location=0) in vec2 position;

out vec2 vTexCoord;

void main()
{
	gl_Position=vec4(position,1,1);
	vTexCoord=vec2((position.x+1)/2, (position.y+1)/2);
}