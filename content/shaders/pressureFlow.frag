
#version 400
uniform sampler2D previous_frame;
uniform sampler2D previous_status;
uniform vec2 size;
uniform vec2 force_direction=vec2(0,-1);//we can instead get this from a material or formula if we want
uniform int materialIndex;
uniform int ticks;
const vec2 neighbors[8]=vec2[](vec2(0,1),
	vec2(0,-1),
	vec2(1,0),
	vec2(-1,0),
	vec2(1,-1),
	vec2(-1,-1),
	vec2(1,1),
	vec2(-1,1));
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
	return y==0? 1: 
		   //either neighbor or 2 steps away
		   y==1?
				x==0? 3 : 5
		   // implicit y==2, opposite direction from "gravity", middle easier to fill than corners
		   :    x==0||x==2? 6: 8;
				
}

int getPotential(Status status)
{
	//return status.pressure;
	return status.debt>0 ? -1 : status.pressure;
	//return status.pressure-status.debt;
}



void main()
{
	Status selfstat=unpack_status(vTexCoord);
	//not empty, not current material, not our problem
	if(selfstat.mat_id>0 && selfstat.mat_id!=materialIndex)
	{
		fragColor=texture2D(previous_frame, vTexCoord);
		outStatus=texture2D(previous_status,vTexCoord);
		return;
	}
	//death of 'living' water happens in debtProcessing
	
	//Status[8] statuses;
	int potential=getPotential(selfstat);
	if (selfstat.mat_id==materialIndex)
	{
	//don't do any of this, because flow only creates new cells, death happens on debt
//		int cost=0;
//		for (int i=0;i<8;i++)
//		{
//			Status neighborStatus=unpack_status(vTexCoord+neighbors[i]/size);
//			if(neighborStatus.mat_id==0 && potential>=required_potential(neighbors[i]))
//			{
//				//cost+=1;
//			}
//		}
		outStatus=pack_status(selfstat);
		fragColor=texture2D(previous_frame, vTexCoord);
	}
	else //empty square, flow into it!
	{
		int fill=0;
		vec4 lastNeighborColor;
		for (int i=0;i<8;i++)
		{
			Status neighborStatus=unpack_status(vTexCoord+neighbors[i]/size);
			if(neighborStatus.mat_id==materialIndex && getPotential(neighborStatus)>=required_potential(-neighbors[i]))
			{
				fill+=1;
				lastNeighborColor=texture2D(previous_frame,vTexCoord+neighbors[i]/size);
				
			}
		}
		if(fill>0)
		{
			selfstat.pressure=1;// have the simulation catch us up
			selfstat.debt=1;
			selfstat.age=0;
			selfstat.mat_id=materialIndex;
			fragColor=lastNeighborColor;//mat color + random offset?
			outStatus=pack_status(selfstat);
		}
	}
}