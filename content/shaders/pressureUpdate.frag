#version 400

uniform sampler2D previous_frame;
uniform sampler2D previous_status;
uniform vec2 force_direction=vec2(0,-1);
uniform int materialIndex;
uniform vec2 size;
uniform int ticks;

in vec2 vTexCoord;
out vec4 fragColor;
out vec4 outStatus;

struct Status
{
	int pressure;
	int debt;
	int age;
	int mat_id;
};

const vec2 neighbors[8]=vec2[](vec2(0,1),
	vec2(0,-1),
	vec2(1,0),
	vec2(-1,0),
	vec2(1,-1),
	vec2(-1,-1),
	vec2(1,1),
	vec2(-1,1));

Status unpack_status(vec2 coord)
{
	vec4 data=texture2D(previous_status, coord);
	int zdata=int(data.z*255);
	
	return Status(int(data.x*255),int(data.y*255),zdata&0x0f,(zdata&0xf0)>>4 );

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
	int pressureSum=stat.pressure;
	int pressureMax=stat.pressure;
	for(int i=0;i<8;i++)
	{
		Status neighborStatus=unpack_status(vTexCoord+neighbors[i]/size);
		if(neighborStatus.mat_id==materialIndex)
		{
			int npressure=neighborStatus.pressure-neighborStatus.debt+pressure_effect(neighbors[i]);
			pressureSum+=npressure;
			pressureMax=max(pressureMax, npressure);
		}
	}
	//no neighbors=no pressure ever;
	int diff=stat.pressure-max(pressureMax,1);
	if(diff<0)
		stat.pressure=max(pressureMax,1);
	else
		stat.pressure+=diff/2+diff%2;
	stat.age+=1;
	//stat.pressure=pressureCount>1?int(ceil(float(pressureSum)/pressureCount)):1;
	outStatus=pack_status(stat);
}