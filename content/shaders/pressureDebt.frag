#version 400

uniform sampler2D previous_frame;
uniform sampler2D previous_status;
uniform vec2 force_direction=vec2(0,-1);
uniform int materialIndex;
uniform vec2 size;
uniform int ticks;
const int debtDeath=10;//10 frames later the pressure created pixel dies
const int blockedDuration=10;


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
vec4 pack_status(Status stat)
{
	float z=(min(stat.age,15)&0x0f) + ((stat.mat_id<<4)&0xf0);
	return vec4(stat.pressure/255.0,stat.debt/255.0, z/255.0, 1); 
}


int findOldHighestPressure(vec2 coord)
{
	int result=-1;
	
	Status examined=unpack_status(coord);
	int maxPressure=examined.pressure+examined.age;
	int minPressure=1000;
	for(int i=0;i<8;i++)
	{
		vec2 neighbor=neighbors[i];
		Status nstat=unpack_status(neighbor/size+coord);
		ivec2 diff=ivec2(force_direction-neighbor);
		int diffsquare=diff.x*diff.x+diff.y*diff.y;
		//now we include a GO UP mechanic
		if(nstat.mat_id==materialIndex //big pile of conditions, it must be more pressed, as old, not already doomed, and the right material
			//&& nstat.age>=examined.age 
			&& nstat.debt==0 
			&& nstat.pressure+nstat.age>maxPressure)
			//&& nstat.pressure<minPressure)
		{
			result=i;
			maxPressure=nstat.pressure+nstat.age;
			//minPressure=nstat.pressure;
		}
	}
	return result;
}

void main()
{
	fragColor=texture2D(previous_frame,vTexCoord);
	Status stat=unpack_status(vTexCoord);
	outStatus=pack_status(stat);
	return;
	if(stat.mat_id!=materialIndex)
	{
		outStatus=pack_status(stat);
		return;
	}
	if(stat.debt>0)
	{



		bool dead=false;
		//stat.debt=0;
		if(stat.age>debtDeath && stat.debt==1)
		{
			fragColor=vec4(0,0,0,1);
			outStatus=vec4(0,0,0,1);
			stat.debt-=1;
			dead=true;
		}
		if(stat.debt>0)
		{
			int movedir=findOldHighestPressure(vTexCoord);
			if(movedir>-1)
			{
				stat.debt-=1;
			}
		}
		if(!dead)
			outStatus=pack_status(stat);

		
	}
	else
	{
		for(int i=0;i<8;i++)
		{
			vec2 neighbor=neighbors[i];
			Status source_status=unpack_status(neighbor/size+vTexCoord);
			if(((source_status.debt>0 && source_status.age<=debtDeath)
					|| source_status.debt>1)
					&& neighbors[findOldHighestPressure(neighbor/size+vTexCoord)]==-neighbor )
			{
			    
				fragColor.x=1;
				stat.debt+=1;//this CAN happen multiple times
			}
		}
		if(stat.debt>2)
		{
			fragColor.y=1;
		}
		if(stat.debt==0)
			fragColor.x=0;
		outStatus=pack_status(stat);
	}
	
}


