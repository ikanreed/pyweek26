
#version 400
uniform sampler2D previous_frame;
uniform sampler2D previous_status;
uniform sampler2D previous_velocity;
uniform vec2 size;
uniform vec2 force_direction=vec2(0,-1);//we can instead get this from a material or formula if we want
uniform int materialIndex;
uniform int ticks;

uniform float max_velocity;

const vec2 neighbors[8]=vec2[](
	vec2(0,-1),
	vec2(1,-1),
	vec2(-1,-1),
	vec2(-1,0),
	vec2(1,0),
	vec2(1,1),
	vec2(-1,1),
	vec2(0,1));
in vec2 vTexCoord;


out vec4 fragColor;
out vec4 outStatus;
out vec4 force;
out vec4 outVelocity;
struct Status
{
	int pressure;
	int debt;
	int age;
	int mat_id;
};

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


int required_potential(vec2 neighborStep)
{
	vec2 difference=abs(force_direction-neighborStep);
	int x=int(min(difference.x, difference.y));
	int y=int(max(difference.x,difference.y));
	//     SAME as direction we want most? 0
	return y==0? 40: 
		   //either neighbor or 2 steps away
		   y==1?
				x==0? 80 : 80
		   // implicit y==2, opposite direction from "gravity", middle easier to fill than corners
		   :    x==0||x==2? 640: 640;
				
}

int getPotential(Status status)
{
	//return status.pressure;
	return status.debt>0 || status.age<12 ? -1 : status.pressure;
	//return status.pressure-status.debt;
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


int findFirstEmpty(vec2 fullCoord)
{
	for(int i=0;i<8;i++)
	{
		vec2 neighbor=neighbors[i];
		Status nstat=unpack_status(neighbor/size+fullCoord);
		if(nstat.mat_id==0)
			return i;
		
	}
	return -1;
}

vec2 getStepDir(vec2 vel)
{
	vec2 result=vec2(0,0);
	if(vel.x<=-1)
		result.x=-1;
	if(vel.x>=1)
		result.x=1;
	if(vel.y<=-1)
		result.y=-1;
	if(vel.y>=1)
		result.y=1;
	return result;
	
}

vec2 getVelocity(vec2 coordinate)
{
	return (texture2D(previous_velocity, coordinate).xy-vec2(.5,.5))*2*max_velocity;
}

int findDirectionsWithVelocityAtAll(vec2 emptyCoord)
{
	int result=0;
	for(int i=0;i<8;i++)//take from the top first, then the bottom
	{
		result<<=1;
		vec2 neighbor=neighbors[i];
		Status nstat=unpack_status(neighbor/size+emptyCoord);
		vec2 vel=getVelocity(neighbor/size+emptyCoord);
		if(nstat.mat_id==materialIndex && length(vel)>0 && vel.x<-1 && vel.y>1)
		{
			result+=1;
		}
		
		//int pressureval=nstat.pressure+pressure_effect(neighbor);
	}
	return result;
}

int findHighestInboundVelocity(vec2 emptyCoord)
{
	int result=-1;
	float maxVel=-1;
	for(int i=0;i<8;i++)//take from the top first, then the bottom
	{
		vec2 neighbor=neighbors[i];
		Status nstat=unpack_status(neighbor/size+emptyCoord);
		vec2 vel=getVelocity( neighbor/size+emptyCoord);
		if(nstat.mat_id==materialIndex && length(vel)>maxVel && getStepDir(vel)==-neighbor)
		{
			result=i;
			maxVel=length(vel);
		}
		//int pressureval=nstat.pressure+pressure_effect(neighbor);
	}
	return result;
}



void main()
{
	Status selfstat=unpack_status(vTexCoord);
	//not empty, not current material, not our problem
	if(selfstat.mat_id>0 && selfstat.mat_id!=materialIndex)
	{
		fragColor=texture2D(previous_frame, vTexCoord);
		outStatus=texture2D(previous_status,vTexCoord);
		outVelocity=texture2D(previous_velocity,vTexCoord);
		return;
	}
	
	if (selfstat.mat_id==materialIndex)
	{
		vec2 cur_vel=getVelocity( vTexCoord);
		vec2 flowdir=getStepDir(cur_vel);
		if(flowdir.x!=0 || flowdir.y!=0)
		{
			Status target_status=unpack_status(flowdir/size+vTexCoord);
			if(target_status.mat_id==0 )
			{
				if(neighbors[findHighestInboundVelocity(flowdir/size+vTexCoord)]==-flowdir)
				{
					outStatus=vec4(0,0,0,1);
					fragColor=vec4(0,0,0,1);//consider showing this in red
					//if(getStepDir(vec2(-10,10))==vec2(-1,1)) fragColor.y=1;
					outVelocity=vec4(0,0,0,1);
					return;
				}

//				}
			}
		}

		outVelocity=vec4(cur_vel/max_velocity/2+vec2(0.5,0.5),0,1);
		outStatus=pack_status(selfstat);
		//fragColor=vec4(0,0,1,1);
		fragColor=texture2D(previous_frame, vTexCoord);
		fragColor.y=0;
		//fragColor.x=0;
	}
	else //empty square, flow into it?
	{
		int highestDir=findHighestInboundVelocity(vTexCoord);
		if(highestDir>-1)
		{
			vec2 neighbor=neighbors[highestDir];
			Status inheritedStatus=unpack_status(neighbor/size+vTexCoord);

			
			vec2 in_vel=getVelocity(neighbor/size+vTexCoord);
			in_vel+=neighbor;

			selfstat.pressure=inheritedStatus.pressure*3/4;// have the simulation catch us up
			selfstat.debt=0;
			selfstat.age=0;
			selfstat.mat_id=materialIndex;
			//outVelocity=vec4(0.5,0.5,0,1);
			outVelocity=vec4(in_vel/max_velocity/2+vec2(0.5,0.5),0,1);
			//fragColor=vec4(in_vel/max_velocity/2+vec2(0.5,0.5),0,1);
			fragColor=texture2D(previous_frame,neighbor/size+vTexCoord) ;//mat color + random offset?
			outStatus=pack_status(selfstat);
			
		}
		else
		{
			fragColor=vec4(0,0,0,1);
			for(int i=0;i<8;i++)
			{
				vec2 nlocation=neighbors[i]/size+vTexCoord;
				if(unpack_status(nlocation).mat_id==materialIndex)
				{
					fragColor+=texture2D(previous_frame,nlocation)/3;
				}
			}
		}

		

	}
}