#version 400
uniform sampler2D previous_frame;
uniform sampler2D previous_status;
uniform vec3 simulatedColor;
//uniform int max_pressure;
const int max_pressure=2;
uniform float colorTolerance;
uniform vec2 size;
uniform vec2 move_direction;
uniform float move_angle;


uniform float spread_rate;
uniform float max_spread;

in vec2 vTexCoord;
out vec4 fragColor;
out vec4 outStatus;

struct status_info
{
	float angle;
	float angleTolerance;
	int pressure;
};

status_info get_status(vec2 coordinate)
{
	vec4 data=texture2D(previous_status, coordinate);
	status_info result;
	result.angle=data.x*2-1;
	result.angleTolerance=data.y;
	result.pressure=int(255*data.z);
	return result;
}

vec4 pack_status(status_info data)
{
	return vec4((data.angle+1)/2,
		data.angleTolerance,
		float(data.pressure)/255,
		1);
}

//const float force_angle=0;
//const float force_fraction=0.5;

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
int getPressureTransfer(status_info from, status_info to)
{
	//return 0;
	int trasnferred=from.pressure==0?1:(from.pressure+1)/2;
	return min(trasnferred, max_pressure-to.pressure);
}
bool canPressureFlow(status_info from, status_info to)
{
	return to.pressure<max_pressure && from.angleTolerance==max_spread;
}

void main()
{
	//fragColor=texture2D(previous_frame, vTexCoord);
	vec2 oneStepAway=move_direction/size;
	//vec2 oneStepAway=vec2(0/640.0,1)/vec2(1,480);
	
	vec4 this_square=texture2D(previous_frame,vTexCoord);
	vec4 from_square=texture2D(previous_frame, vTexCoord-oneStepAway);
	vec4 to_square=texture2D(previous_frame, vTexCoord+oneStepAway);
	
	//status_info
	status_info this_status=get_status( vTexCoord);
	status_info from_status=get_status(vTexCoord-oneStepAway);
	status_info to_status=get_status(vTexCoord+oneStepAway);
	
	
//	float angle=this_status.x*2-1; //range is now from -1 to 1
//	
//	float angleTolerance=this_status.y; //no scaleing
//	int pressure=int(255*this_status.z);
//	float fromangle=from_status.x*2-1;
//	float fromtolerance=from_status.y;
//	int from_pressure=int()
//
	
	if(has_anything(this_square))
	{
		if(isSimulated(this_square))
		{
			fragColor=this_square;

			if(near(move_angle, this_status.angle,this_status.angleTolerance))
			{
				if(has_anything(to_square))
				{
					if(isSimulated(to_square) && canPressureFlow(this_status, to_status))
					{
						int removed=getPressureTransfer(this_status, to_status);
						this_status.pressure-=removed;
						this_status.angleTolerance=0;
						//this_status.pressure=-1;
						fragColor=this_square;
					}
					else
					{
						this_status.angleTolerance=min(this_status.angleTolerance+spread_rate, max_spread);
					}

				}
				//we're aiming into an empty square
				else
				{
					this_status.pressure=this_status.pressure>0?0:-1;
					//this_status.pressure-=min(this_status.pressure,1);
				}
			}
			//we're trying to get into the next square, but it's occupied by not fully pressured same-material
			//AND we have looked everywhere for a place to go
			else
			{
				this_status.angleTolerance=min(this_status.angleTolerance+spread_rate, max_spread);
			}
			
			//next if we're being fed
			if(isSimulated(from_square) && near(move_angle, from_status.angle, from_status.angleTolerance) && canPressureFlow(from_status,this_status))
			{
				this_status.pressure+=getPressureTransfer(from_status,this_status);
				//this_status.angleTolerance=0;
			}
			//clean up: pressure hits below zero, we're dead
			outStatus=pack_status(this_status);
			if(this_status.pressure<0)
			{
				outStatus=vec4(0,0,0,1);
				fragColor=vec4(0,0,0,1);
			}
			


		}
		//some other material, leave it alone
		else
		{
			outStatus=pack_status(this_status);
			fragColor=this_square;
		}
	}
	//pull is no longer an else
	else if(isSimulated(from_square) && near(move_angle, from_status.angle, from_status.angleTolerance))
	{
		//from_status.pressure=0;
		from_status.pressure=from_status.pressure>0?from_status.pressure-1:0;
		from_status.angleTolerance=0.0;
		outStatus=pack_status(from_status);
		fragColor=from_square;
	}
	else
	{
		discard;
	}
}