#version 400
uniform sampler2D previous_frame;
uniform sampler2D previous_status;
uniform vec3 simulatedColor;
uniform float pi;
uniform float colorTolerance;
uniform vec2 size;
uniform vec2 move_direction;
uniform float move_angle;

uniform float spread_rate;
uniform float max_spread;

in vec2 vTexCoord;
out vec4 fragColor;
out vec4 status;

bool has_anything(vec4 color)
{
	return (color.x + color.y + color.z) > colorTolerance;
}

bool isSimulated(vec4 color)
{
//	vec3 diff=abs(color.xyz-simulatedColor);
//	return diff.x<colorTolerance;
	return distance(color.xyz,simulatedColor)<=colorTolerance;
}
bool near(float value,float  otherval,float tolerance)
{
	return value<=otherval+tolerance && value>=otherval-tolerance;
}
void main()
{
	//fragColor=texture2D(previous_frame, vTexCoord);
	vec2 oneStepAway=move_direction/size;
	//vec2 oneStepAway=vec2(0/640.0,1)/vec2(1,480);
	vec4 from_square=texture2D(previous_frame, vTexCoord-oneStepAway);
	vec4 this_square=texture2D(previous_frame,vTexCoord);
	vec4 to_square=texture2D(previous_frame, vTexCoord+oneStepAway);
	vec4 this_status=texture2D(previous_status, vTexCoord);
	vec4 from_status=texture2D(previous_status,vTexCoord-oneStepAway);
	
	float angle=this_status.x*2-1; //range is now from -1 to 1
	float angleTolerance=this_status.y; //no scaleing
	float fromangle=from_status.x*2-1;
	float fromtolerance=from_status.y;


	
	if(has_anything(this_square))
	{
		if(isSimulated(this_square))
		{
			if(has_anything(to_square) || !near(move_angle, angle,angleTolerance))
			{
				status=texture2D(previous_status, vTexCoord);
				//status=vec4(0,0,1,0);
				//status.y+=spread_rate;
				status.y=min(status.y+spread_rate, max_spread);
				fragColor=this_square;
			}
			else
			{
				status=vec4(0,0,0,1);
				fragColor=vec4(0,0,0,1);
			}
		}
		else
		{
			status=this_status;
			//status.y=0;
			fragColor=this_square;
		}
	}
	else if(isSimulated(from_square) && near(move_angle, fromangle, fromtolerance))
	{
		status=texture2D(previous_status, vTexCoord-oneStepAway);
		status.y=0;
		fragColor=from_square;
	}
	else
	{
		//status=vec4(0.5,0,0.25,1);
		discard;
	}
}