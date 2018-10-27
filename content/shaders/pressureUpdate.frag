#version 400

uniform sampler2D previous_frame;
uniform sampler2D previous_status;
uniform sampler2D previous_velocity;
uniform vec2 force_direction=vec2(0,-1);
uniform int materialIndex;
uniform vec2 size;
uniform int ticks;
uniform float max_velocity;

const float force_per_frame=100.0/255;
const float decay=0.5;
const float pressure_scale=0.5;
in vec2 vTexCoord;
out vec4 fragColor;
out vec4 outStatus;
out vec4 outVelocity;

struct Status
{
	int pressure;
	int debt;
	int age;
	int mat_id;
};

const vec2 neighbors[8]=vec2[](
	vec2(0,-1),
	vec2(1,-1),
	vec2(-1,-1),
	vec2(-1,0),
	vec2(1,0),
	vec2(1,1),
	vec2(-1,1),
	vec2(0,1));

Status unpack_status(vec2 coord)
{

	vec4 data=texture2D(previous_status, coord);
	int zdata=int(data.z*255);
	
	return Status(int(data.x*255),int(data.y*255),zdata&0x0f,(zdata&0xf0)>>4 );

}

bool sameDirish(vec2 a, vec2 b)
{
	return (a.x==0&&a.y==0) ||
		(b.x==0 && b.y==0) ||
		distance(normalize(a),normalize(b))<2;
}

vec2 getVelocity(vec2 coordinate)
{
	return (texture2D(previous_velocity, coordinate).xy-vec2(.5,.5))*2*max_velocity;
}

vec4 pack_status(Status stat)
{
	float z=(min(stat.age,15)&0x0f) + ((stat.mat_id<<4)&0xf0);
	return vec4(stat.pressure/255.0,stat.debt/255.0, z/255.0, 1); 
}


int pressure_effect(vec2 neighborStep)
{
	vec2 difference=abs(force_direction-neighborStep);
	int x=int(min(difference.x, difference.y));
	int y=int(max(difference.x,difference.y));
	//     SAME as direction we want most? 0
	return y==0? -1: 
		   //either neighbor or 2 steps away
		   y==1?
				x==0? -1 : 0
		   // implicit y==2, opposite direction from "gravity", middle easier to fill than corners
		   :    1;
				
}

void main()
{
	fragColor=texture2D(previous_frame,vTexCoord);
	
	Status stat=unpack_status(vTexCoord);
	if(stat.mat_id!=materialIndex)
	{
		outStatus=pack_status(stat);
		return;
	}
	vec2 cur_vel=getVelocity(vTexCoord);
	//vec2 cur_vel=vec2(0,0);
	//cur_vel-=cur_vel*decay;
	cur_vel=cur_vel+force_direction;
	int pressureMin=stat.pressure;
	int pressureMax=stat.pressure;
	for(int i=0;i<8;i++)
	{
		Status neighborStatus=unpack_status(vTexCoord+neighbors[i]/size);
		vec2 neighborVel=getVelocity(vTexCoord+neighbors[i]/size);

		if(neighborStatus.mat_id!=0 )//&& 
		{
			float effectMagnitude=1;//max(dot(-neighborVel,neighbors[i]),0)/140;
			int npressure=int(neighborStatus.pressure*effectMagnitude)+pressure_effect(neighbors[i]);
			pressureMax=max(pressureMax, npressure);
			pressureMin=min(pressureMin,npressure);
			cur_vel.x-=neighbors[i].x*npressure*force_per_frame*pressure_scale;//*force_per_frame;
			cur_vel.y-=neighbors[i].y*npressure*force_per_frame*pressure_scale;
			
		}
		else
		{
			//pressureMin=pressure_effect(neighbors[i]);
		}
	}
	//no neighbors=no pressure ever;
	int diff=max(pressureMax,1)-stat.pressure;
	int mindiff=max(pressureMin,1)-stat.pressure;
	if(diff==0)
		stat.pressure=max(pressureMin,2);
	else if (diff<0)
		stat.pressure-=max(int(ceil(log2(abs(mindiff)))),0);
	else
		stat.pressure+=max(diff/2,1);//  diff/3+(diff%3);
	stat.age+=1;
	//stat.pressure=pressureCount>1?int(ceil(float(pressureSum)/pressureCount)):1;
	outStatus=pack_status(stat);
	outVelocity=vec4(cur_vel/max_velocity/2+vec2(0.5,0.5),0,1);
}