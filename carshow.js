
var TheOneCar;

class carstate
{
	constructor(x,y,h,sl,rl,ix,iy,slope,b,cpn,th)
	{
	  this.x=x;
	  this.y=y;
	  this.h=h;
	  this.slidar=sl;
	  this.rlidar=rl;
	  this.cix=ix;
	  this.ciy=iy;
	  this.sl=slope;
	  this.b=b;
	  this.cpn=cpn;
	  this.th=th;
	}
};


function distance_pt(p1,p2)
{
return Math.sqrt((p1.x-p2.x)*(p1.x-p2.x)+(p1.y-p2.y)*(p1.y-p2.y));

}

class Measurement
{
 constructor(sp,ep)
 {
 this.start=sp;
 this.end=ep;
 this.recalculate();
 }
 recalculate()
 {
  this.dist=distance_pt(this.start,this.end);
  if(this.dist>4) 
	this.value=this.dist.toFixed(2);
  else
	this.value='('+this.start.x.toFixed(2)+','+this.start.y.toFixed(2)+')';
 }
}

class Path
{
 constructor(ep)
 {
 this.pt=ep;
 this.Edgev=null;
 this.corner_d=null;
 this.next_seq=null;
 this.bStop=false;;
 this.Options=null;
 this.Speed=null;
 this.Arc=false;
 this.head=null;
 }

 recalculate()
 {
  for(let i=0; i<TheOneCar.Paths.length; i++)
  {
	if(TheOneCar.Paths[i]===this) 
	{
    if(i==0) return;
	let prev_pt=TheOneCar.Paths[i-1].pt;
	let pt=this.pt;
	let head=Calc_HeadDeg(prev_pt,pt);
	//So we are going from prev_pt to pt.
	this.head=head;
	if(this.Arc)
	{

		if((i+1)==TheOneCar.Paths.length) return;
        let EndHead=Calc_HeadDeg(pt,TheOneCar.Paths[i+1].pt); 
		if(i < 2 ) return;
		let pprev_pt=TheOneCar.Paths[i-2].pt;
		let StartHead=Calc_HeadDeg(pprev_pt,prev_pt);  
		let ChordAngle=(EndHead-StartHead);
		if(ChordAngle>=360) ChordAngle-=360;
		if(ChordAngle<=(-360)) ChordAngle+=360;

		if(Math.abs(ChordAngle)<5) return;
	    //Calc unit chord
		
		let x2=Math.cos(ChordAngle*Math.PI/180.0);
		let y2=Math.sin(ChordAngle*Math.PI/180.0);
		let unit_c_dist=Math.sqrt((x2-1)*(x2-1)+(y2*y2)); //Y0 =0;
		let d=distance_pt(prev_pt,pt);
		let Arc_R=d/unit_c_dist;
		//Now solve for center...


		let a=(d*d)/(2*d);

		let hsq=(Arc_R*Arc_R)-(a*a);

		let h=Math.sqrt(hsq);
		x2=(prev_pt.x+pt.x)/2;
		y2=(prev_pt.y+pt.y)/2;

		let center_x=x2+h*(pt.y-prev_pt.y)/d;
		let center_y=y2-h*(pt.x-prev_pt.x)/d;
		
		
		this.ChordAngle=ChordAngle;
		this.arc_r=Arc_R;
		this.center_arc={'x':center_x, 'y':center_y};

	}//We were an arc

	 return;
	}//Found point

  }//Searching
 }//recalc
}

class Wall
{
 constructor(sp,ep)
 {
 this.start=sp;
 this.end=ep;
 }
}

class Edge
{
	constructor(intercept,adj_dist, adj_head,pt)
	{
	  this.inter=intercept;
	  this.adj_dist=adj_dist;
	  this.adj_head=adj_head;
	  this.pt=pt;
	}
}

class CornerDetect
{
	constructor(adj_l_r, adj_dist,corner_pt,indent, path_pt)
	{
	  this.adj_lr=adj_l_r;
	  this.adj_dist=adj_dist;
	  this.corner_pt=corner_pt
	  this.path_pt=path_pt;
	  this.indent=indent;

	}

}





const ODOSCALE = 4.58;

const TrackColor   = 'rgba(0,255,0,1.0)';
const WallColor    = 'rgba(0,255,0,1.0)';
const RLidarColor  = 'rgba(0,0,255,0.5)';
const MySlopeColor = 'rgba(255,0,255,1.0)'; 
const CarBodyColor = 'rgba(255,0,0,1.0)'; 
const SLidarColor  = 'rgba(0,255,0,1.0)'; 
const PathColor    = 'rgba(128,0,128,1.0)'; 
const CurPathColor = 'rgba(255,0,128,1.0)';  
const SelectColor  = 'rgba(255,0,0,1.0)'; 
const CornerColor  = 'rgba(0,0,0,1.0)'; 
const MeasColor    =  'rgba(0,0,128,1.0)';                                                                                                                                                                                         
const EdgeColor    = 'rgba(255,0,255,1.0)'; 
const CornerPropColor = 'rgba(255,0,255,1.0)';                                                                                                                                                                          
const PathLoopColor = 'rgba(255,0,0,1.0)'; 




const car_corner = [ [8,-6],[8,6],[-19,6],[-19,-6],[8,-6]];

class carshow
{
constructor(data,things)
  {
  this.lastOdo=null;
  this.carx=0;
  this.cary=0;
  this.cars_idea_of_x=null;
  this.cars_idea_of_y=null;
  this.cars_idea_off_x=null;
  this.cars_idea_off_y=null;
  this.extent={};
  this.extent.minx=99999999999;
  this.extent.miny=9999999999;
  this.extent.maxx=-9999999999;
  this.extent.maxy=-9999999999;
  this.LastLidar=[];
  this.car_States=[];
  this.corners=[];
  this.last_p=null;
  this.down_p=null;
  this.MouseDown='?';
  this.Measurements=[];
  this.Paths=[];
  this.Walls=[];
  this.HighLightPathEl=null;
  this.HighLightWallPt=null;
  this.HighLightCornerPt=null;
  this.Waiting_ForContinueClick=false;
  this.DontUseMag=false;
  TheOneCar=this;
  for(var i=0; i<things.length; i++)
  {
	if(things[i].message!=undefined)
	{
	 if(things[i].message.indexOf('"UseMag":false')>0)
	 {
		 this.DontUseMag=true;
	 }
	}
  }

  for(var i=0; i<data.length; i++)
	{
	this.scanone(data[i]);
	}
  if(this.car_States.length==0)
  {
	 let vv={'name':'onepush'};
	 this.scanone(vv);
  }

  this.sina=[];
  this.cosa=[];

  for(let a=0; a<360; a++)
  {
	  this.sina.push(Math.sin(a*Math.PI/180));
	  this.cosa.push(Math.cos(a*Math.PI/180));

  }


  }

scanone(v){
  switch (v.name)
  {
  case 'onepush':
	  this.car_States.push(new carstate(0,0,0,this.last_slidar,this.LastLidar));
	  this.car_States.push(new carstate(0,0,0,this.last_slidar,this.LastLidar));
	  this.car_States.push(new carstate(0,0,0,this.last_slidar,this.LastLidar));
	  this.expand_extent(-5,-5);
	  this.expand_extent(5,5);
	  break;

  case 'NextPointRec':
	  {

	   this.cars_current_point_number=v.cp;
	  }
	  break;

  case 'SteerLoopObj':
	   this.cars_target_head=v.targ;
	  break;

  case 'CurPosObj':
		  if(this.cars_idea_off_x==null)
		  {
		   this.cars_idea_off_x=(this.carx-v.x);
		   this.cars_idea_off_y=(this.cary-v.y);
		  }
		  this.cars_idea_of_x=v.x+this.cars_idea_off_x;
		  this.cars_idea_of_y=v.y+this.cars_idea_off_y;
		  if(v.sn>0)
		  {
			this.car_slope=(v.sn-128)/128;
			if (typeof v.b === "undefined")
				{
				this.car_b=0;
				}
			else
				this.car_b=v.b;
		  }


	  break;
  case 'PathOrigin':
       this.PathOrg_x=v.x;
	   this.PathOrg_y=v.y;
      break;


  case 'IMUReportObj':
	  {
	 if(this.lastOdo==null)
		{
		 this.lastOdo=v.Odo;
		}
	 if(this.lastOdo!=v.Odo)
	  {
		 let use_head=v.head;
		 if (this.DontUseMag)
			  use_head=v.rhead;

		 let dist=(v.Odo-this.lastOdo)*ODOSCALE;
		 let dx=dist*Math.sin(use_head*Math.PI/180.0);
		 let dy=dist*Math.cos(use_head*Math.PI/180.0);
		 this.carx+=dx;
		 this.cary+=dy;
		
		
		 if((this.carx==NaN) || (this.cary==NaN))
		 {
		   console.log('NAN??\n');
		 }
		 this.car_States.push(new carstate(this.carx,this.cary,use_head,v.lidar,this.LastLidar,this.cars_idea_of_x,this.cars_idea_of_y,this.car_slope,this.car_b,this.cars_current_point_number,this.cars_target_head));
		 this.car_slope=null;
		 this.LastLidar=[];
		 this.expand_extent(this.carx,this.cary);
		 this.lastOdo=v.Odo;

	  }
	 else
		 this.last_slidar=v.lidar;
	 }
	break;
case 'LidarReadingObj':
	{
	 let ax=v.ax128/128;
	 let d =v.dx40/(40*2.54);
	 if(this.LastLidar[Math.round(ax)]==undefined)
	 {
		 this.LastLidar[Math.round(ax)]=d;
	 }
	 else
	 {
	   if((d>10) && (d<this.LastLidar[Math.round(ax)]))
	   {
		   this.LastLidar[Math.round(ax)]=d;
	   }
	 }
	}


	break;
   }//Switch
  }//function


expand_extent(x,y)
  {
	  if(x>this.extent.maxx) this.extent.maxx=x;
	  if(y>this.extent.maxy) this.extent.maxy=y;
	  if(x<this.extent.minx) this.extent.minx=x;
	  if(y<this.extent.miny) this.extent.miny=y;
  }


getExtents()
{
 return this.extent;
}

getMaxState()
{
 return this.car_States.length;
}

drawBase(ctx,xo,yo)
{
	this.saved_xo=xo;
	this.saved_yo=yo;
	let arrayLength = this.car_States.length;
	ctx.beginPath();
	ctx.moveTo(this.car_States[0].x+xo,-this.car_States[0].y+yo);

	for(let i=1; i<arrayLength; i++)
	{
	  ctx.lineTo(this.car_States[i].x+xo,-this.car_States[i].y+yo);
	}
	ctx.stroke();

	this.Starting_Position={'x':this.car_States[0].x+xo,'y':-this.car_States[0].y+yo};

	for(let i=1; i<arrayLength; i++)
    { let h=this.car_States[i].h
	h-=90;
    let s=Math.sin(-h*Math.PI/180.0);
    let c=Math.cos(-h*Math.PI/180.0);
    let yy=2+this.car_States[i].slidar/(1250*2.54);//    1250=1cm
	let x=this.car_States[i].x+xo;
	let y=-this.car_States[i].y+yo;
	if(yy>12)
	{
	
     ctx.beginPath();
     ctx.strokeStyle=TrackColor;
     ctx.arc((s*yy)+x,(c*yy)+y,2,0,2*Math.PI);
     ctx.stroke();
     ctx.restore();
	}
	}


}



drawLidar(ctx,x,y,h,rl,nl)
{
if(rl==undefined) return;
ctx.save();
ctx.beginPath();
ctx.strokeStyle=RLidarColor;

for(let j=0; j<360; j++)
{
if(rl[j]!=undefined)
 {
   let xx=rl[j];
   let yy=0;
   let hu=((h+j)-90)*(-Math.PI/180);
   let s=Math.sin(hu);
   let c=Math.cos(hu);
   ctx.moveTo(x,y);
   ctx.lineTo((c*xx)+x,(-((s*xx)))+y);
 }
}

ctx.stroke();
ctx.restore();

//Theil-Sen Estimator to find straight segments in data

let points=[];
for( let n=45; n<135; n++)
{
   if(rl[n]!=undefined)
   {
	let dist=rl[n];
	let point=[];
	point.x=dist*this.cosa[n];
	point.y=-dist*this.sina[n];
	points.push(point);
   }
}

if(points.length>10)
{
let slopes=[];
for( let nn=0; nn<(points.length-1); nn++)
{
for(let qq=nn+1; qq<points.length; qq++)
 {
	let p={'nn':nn, 'qq':qq,'m':(points[qq].y-points[nn].y)/(points[qq].x-points[nn].x)};
	slopes.push(p);

 }
}

slopes= slopes.sort(function (a, b) {  return a.m - b.m;  });
let p=slopes[Math.round(slopes.length/2)];

//y=mx+b
//b=y-mx

var b=points[p.qq].y-p.m*points[p.qq].x;
b+=points[p.nn].y-p.m*points[p.nn].x;
b/=2;

ctx.save();
ctx.beginPath();
ctx.strokeStyle= MySlopeColor;

var yy=(p.m*-100)+b;
var xx=-100;

h-=90;
let s=Math.sin(-h*Math.PI/180.0);
let c=Math.cos(-h*Math.PI/180.0);
ctx.moveTo((c*xx)+(-s*yy)+x,(-((c*yy)+(s*xx)))+y);
yy=(p.m*100)+b;
xx=100;
ctx.lineTo((c*xx)+(-s*yy)+x,(-((c*yy)+(s*xx)))+y);
ctx.stroke();
ctx.restore();
nl=2+nl/(1250*2.54);

if( (nl> Math.abs(2*b)) && (p.m>-0.2) && (p.m < 0.2))
{
 let cl=this.corners.length;

 if(points[p.nn].x > 0)
{

	xx=0;
	yy=b;
	if ((cl==0) || (this.corners[cl-1].indent==false))
   	{
	this.corners.push({'x':(c*xx)+(-s*yy)+x ,'y':(-((c*yy)+(s*xx)))+y,'indent':true});
	}
}
else
 if(points[p.nn].x<0)
{
 xx=0;
 yy=b;
 if ((cl==0) || (this.corners[cl-1].indent))
 {
 this.corners.push({'x':(c*xx)+(-s*yy)+x ,'y':(-((c*yy)+(s*xx)))+y,'indent':false});
 }
}

}


}//if


}



drawCar(ctx,x,y,h,l)
{
h-=90;
let s=Math.sin(-h*Math.PI/180.0);
let c=Math.cos(-h*Math.PI/180.0);

ctx.save();
ctx.beginPath();
ctx.strokeStyle= CarBodyColor;
let xx=car_corner[0][0];
let yy=car_corner[0][1];
ctx.moveTo((c*xx)+(-s*yy)+x,(-((c*yy)+(s*xx)))+y);
var arrayLength = car_corner.length;
for (var i = 1; i < arrayLength; i++)
{
xx=car_corner[i][0];
yy=car_corner[i][1];
ctx.lineTo((c*xx)+(-s*yy)+x,(-((c*yy)+(s*xx)))+y);
}
ctx.stroke();

let dist=2+l/(1250*2.54);//    1250=1cm

ctx.beginPath();
ctx.strokeStyle= SLidarColor;
ctx.moveTo(x,+y);
yy=-dist;
ctx.lineTo((-s*yy)+x,(-c*yy)+y);
ctx.stroke();
ctx.restore();
}



GetCenterOfInterest(pos,xo,yo)
{
let loc={'x':this.car_States[pos].x+xo,'y':-this.car_States[pos].y+yo};
return loc;
}

drawState(ctx,pos,xo,yo)
{
this.drawLidar(ctx,this.car_States[pos].x+xo,-this.car_States[pos].y+yo,this.car_States[pos].h,this.car_States[pos].rlidar,this.car_States[pos].slidar);
this.drawCar(ctx,this.car_States[pos].x+xo,-this.car_States[pos].y+yo,this.car_States[pos].h,this.car_States[pos].slidar);

if(this.car_States[pos].cix!=null)
{
 	ctx.strokeStyle=CarBodyColor; 
    ctx.beginPath();
	ctx.arc(this.car_States[pos].cix+xo,-this.car_States[pos].ciy+yo,2,0,2*Math.PI);
	ctx.stroke();
    if(this.car_States[pos].th!=null)
	{
		let h=this.car_States[pos].th;
		let xc=this.car_States[pos].x+xo;
		let yc=(-this.car_States[pos].y)+yo;
		let s=Math.sin(-h*Math.PI/180.0);
		let c=Math.cos(-h*Math.PI/180.0);
		ctx.beginPath();
		ctx.moveTo(xc,yc);
		let y1=200;
		let x1=0;
		ctx.lineTo((c*x1)+(-s*y1)+xc,(-((c*y1)+(s*x1)))+yc);
		ctx.stroke();
	}

}



if((this.car_States[pos].sl!=null) && (this.car_States[pos].sl!=undefined))
{//We hav a slope!

 let xc=this.car_States[pos].x+xo;
 let yc=(-this.car_States[pos].y)+yo;
 let x1=this.car_States[pos].b;
 let y1=0;
 let y2=300;
 let x2=(this.car_States[pos].sl*300)+x1;
 //Now rotate by heading...
 let h=this.car_States[pos].h;
 //h-=90;
 let s=Math.sin(-h*Math.PI/180.0);
 let c=Math.cos(-h*Math.PI/180.0);
 let x1c=(c*x1)+(-s*y1)+xc;
 let y1c=(-((c*y1)+(s*x1)))+yc;
 let x2c=(c*x2)+(-s*y2)+xc;
 let y2c=(-((c*y2)+(s*x2)))+yc;
 ctx.beginPath();
 ctx.moveTo(x1c,y1c);
 ctx.lineTo(x2c,y2c);
 ctx.stroke();

}
									




if(this.corners.length>0)
  {
	for(let i=0; i<this.corners.length; i++)
	{
		if(this.HighLightCornerPt==i)
		{
		ctx.strokeStyle= SelectColor;
        ctx.beginPath();
		ctx.arc(this.corners[i].x,this.corners[i].y,10,0,2*Math.PI);
		ctx.stroke();
		ctx.strokeStyle= CornerColor;
		}
		else
		{
		ctx.beginPath();
		ctx.arc(this.corners[i].x,this.corners[i].y,10,0,2*Math.PI);
		ctx.stroke();

		}

	}
  }

  if(this.MouseDown!=null)
  {
	switch(this.MouseDown)
	{
	case 'P': //Path
	case 'W': //Wall
	case 'M': //measure
		{
		 ctx.beginPath();
		 ctx.moveTo(this.down_p.x,this.down_p.y);
		 ctx.lineTo(this.last_p.x,this.last_p.y);
		 ctx.stroke();
		}
		break;
	case 'D': //Drag
        break;
	}
  }


  if(this.Measurements.length)
  {
	ctx.save();
	ctx.strokeStyle=MeasColor;
    ctx.font = '14px Palatino';
	ctx.textAlign = 'center';
	ctx.textBaseline = 'middle';

	for(let i=0; i<this.Measurements.length; i++)
	{  let m=this.Measurements[i];
	  if(m.dist<4)
	  {
	      ctx.beginPath();
		  ctx.moveTo(m.start.x-2,m.start.y-2);
		  ctx.lineTo(m.start.x+2,m.start.y+2);
		  ctx.moveTo(m.start.x+2,m.start.y-2);
		  ctx.lineTo(m.start.x-2,m.start.y+2);
		  ctx.stroke();
		  ctx.strokeText(m.value,(m.start.x+m.end.x)/2,(m.start.y+m.end.y)/2-10);

	  }
	  else
     {   ctx.beginPath();
		 ctx.moveTo(m.start.x,m.start.y);
		 ctx.lineTo(m.end.x,m.end.y);
		 ctx.stroke();
		 ctx.strokeText(m.value,(m.start.x+m.end.x)/2,(m.start.y+m.end.y)/2);
	  }
	}
	ctx.restore();

  }

  if(this.Walls.length)
{
  ctx.save();
  ctx.strokeStyle= WallColor;
  ctx.lineWidth=5;

  for(let i=0; i<this.Walls.length; i++)
  {  let m=this.Walls[i];
       if(this.HighLightWallPt==i)
	   {
	    ctx.strokeStyle=SelectColor;
	   ctx.beginPath();
	   ctx.arc(m.start.x,m.start.y,3,0,2*Math.PI);
	   ctx.lineTo(m.end.x,m.end.y);
	   ctx.arc(m.end.x,m.end.y,3,0,2*Math.PI);
	   ctx.stroke();
	   ctx.strokeStyle=WallColor;

	   }
	   else
	   {
	   ctx.beginPath();
	   ctx.arc(m.start.x,m.start.y,3,0,2*Math.PI);
	   ctx.lineTo(m.end.x,m.end.y);
	   ctx.arc(m.end.x,m.end.y,3,0,2*Math.PI);
	   ctx.stroke();
	   }
  }


  ctx.restore();

}


  if(this.Paths.length>0)
  {


	  ctx.save();
	  ctx.strokeStyle=PathColor; 
	  ctx.font = '14px Palatino';
	  ctx.textAlign = 'center';
	  ctx.textBaseline = 'middle';
	  ctx.beginPath();
	  let m=this.Paths[0];

	  ctx.moveTo(m.pt.x,m.pt.y);
	
	  for(let i=1; i<this.Paths.length; i++)
	  {    let m=this.Paths[i];


		
	   if(this.HighLightPathEl===m)
	   {
		   ctx.stroke();
		   ctx.beginPath();
		   ctx.strokeStyle=SelectColor;
		   ctx.moveTo(this.Paths[i-1].pt.x,this.Paths[i-1].pt.y);
		   ctx.lineTo(m.pt.x,m.pt.y);
		   ctx.stroke();
           ctx.strokeStyle=PathColor;
		   ctx.beginPath();
		   ctx.moveTo(m.pt.x,m.pt.y);

	   }
	   else
		if(this.car_States[pos].cpn==i)
	   {
			ctx.stroke();
			ctx.beginPath();
			ctx.strokeStyle= CurPathColor;
			ctx.moveTo(this.Paths[i-1].pt.x,this.Paths[i-1].pt.y);
			ctx.lineTo(m.pt.x,m.pt.y);
			ctx.stroke();
			ctx.strokeStyle=PathColor;
			ctx.beginPath();
			ctx.moveTo(m.pt.x,m.pt.y);

	   }
	   else
	   {
        ctx.lineTo(m.pt.x,m.pt.y);
	   }
		   ctx.stroke();
	  }
	

	  for(let i=0; i<this.Paths.length; i++)
	  {    let m=this.Paths[i];
   	   if(m.bStop)
		   {
		    ctx.beginPath();
			ctx.moveTo(m.pt.x+3,m.pt.y+3);
			ctx.lineTo(m.pt.x-3,m.pt.y-3);
            ctx.stroke();
		    ctx.beginPath();
			ctx.moveTo(m.pt.x+3,m.pt.y-3);
			ctx.lineTo(m.pt.x-3,m.pt.y+3);
            ctx.stroke();
		   }
		   else
		   {
			ctx.beginPath();
			ctx.arc(m.pt.x,m.pt.y,3,0,2*Math.PI);
            ctx.stroke();
		   }

	   if(m.Edgev!=null)
	   {
		   ctx.strokeStyle= EdgeColo;
		   ctx.beginPath();
		   let p1=m.pt;

		   if(m.Edgev.inter)
		   {
		   p1=m.pt;
		   }
		   else
		   {
			   p1={'x':(m.pt.x+this.Paths[i-1].pt.x)/2, 'y':(m.pt.y+this.Paths[i-1].pt.y)/2};
		   }
		   ctx.moveTo(p1.x,p1.y);
           ctx.lineTo(m.Edgev.pt.x,m.Edgev.pt.y);
		   ctx.stroke();
		   if((m.Edgev.adj_dist) ||(m.Edgev.adj_head!=null))
		   {
			 let lab;
             if(m.Edgev.adj_dist)
			 {
				 if(m.Edgev.adj_head!=null) lab='H:D';
				 else lab='D';
			 }
			 else
				 lab='H';
			 ctx.font = '14px Palatino';
			 ctx.textAlign = 'center';
			 ctx.textBaseline = 'middle';
			 ctx.beginPath();
			 ctx.strokeText(lab,(m.Edgev.pt.x+p1.x)/2 ,(m.Edgev.pt.y+p1.y)/2 );
		   }

	   }


	   if(m.corner_d!=null)
	   {
		   let c=m.corner_d;
		   ctx.strokeStyle=CornerPropColor;
		   ctx.beginPath();
		   ctx.moveTo(c.path_pt.x,c.path_pt.y);
		   ctx.lineTo(c.corner_pt.x,c.corner_pt.y);
		   ctx.stroke();
		   ctx.beginPath();
		   ctx.arc(c.path_pt.x,c.path_pt.y,2,0,2*Math.PI);
		   ctx.stroke();


		   if((m.corner_d.adj_lr) ||(m.corner_d.adj_dist))
		   {
			   let lab;
			   if(m.corner_d.adj_lr)
			   {
				   if(m.corner_d.adj_dist) lab='L:F';
				   else lab='L';
			   }
			   else
				   lab='F';
			   ctx.font = '14px Palatino';
			   ctx.textAlign = 'center';
			   ctx.textBaseline = 'middle';
			   ctx.beginPath();
			   ctx.strokeText(lab,(c.path_pt.x+c.corner_pt.x)/2,(c.path_pt.y+c.corner_pt.y)/2);
		   }


	   }

	   if(m.next_seq)
	   {
		   ctx.strokeStyle= PathLoopColor;
		   ctx.beginPath();
		   ctx.moveTo(m.pt.x,m.pt.y);
		   ctx.lineTo(this.Paths[m.next_seq].pt.x,this.Paths[m.next_seq].pt.y);
		   ctx.stroke();

	   }

	  }
	  ctx.font = '14px Palatino';
		  ctx.textAlign = 'center';
		  ctx.textBaseline = 'middle';

	  for(let i=1; i<this.Paths.length; i++)
	  {    let m=this.Paths[i];
	  if((m.head!=null) && (m.head!=undefined))
	  {
	   let  px=(this.Paths[i].pt.x+this.Paths[i-1].pt.x)/2; 
	   let  py=(this.Paths[i].pt.y+this.Paths[i-1].pt.y)/2;
	   ctx.beginPath();
	   ctx.strokeText(m.head.toFixed(0),px,py);
	   if(m.arc_r>0)
	   {
		  let n=this.Paths[i-1];
		  ctx.beginPath();
		  ctx.moveTo(n.pt.x,n.pt.y);
		  let sa=(n.head)*Math.PI/180;
		  let ea=sa+(m.ChordAngle*Math.PI/180);
		  if(m.ChordAnlgle>0) 
			  ctx.arc(m.center_arc.x,m.center_arc.y,m.arc_r,sa,ea,false);
		  else
			  ctx.arc(m.center_arc.x,m.center_arc.y,m.arc_r,sa,ea,true);
		  
		  ctx.arc(m.center_arc.x,m.center_arc.y,m.arc_r,0,Math.PI*2);

		  ctx.stroke();

	   }
	  }
	  }


	  if(this.Waiting_ForContinueClick)
	  {
		  ctx.strokeStyle= SelectColor;
		  ctx.font = '34px Palatino';
		  ctx.textAlign = 'left';
		  ctx.textBaseline = 'top';
		  ctx.beginPath();
		  ctx.strokeText("CLICK on next Path point",10,10);
	
	  }



	  ctx.restore();
  }

}

mousedown(e,adjusted_loc,t)
{
this.MouseDown=t;
this.last_p=loc;
this.down_p=loc;

switch(t)
{
case 'P':
{
 if(this.Paths.length)
	 this.down_p=this.Paths[this.Paths.length-1].pt;
 else
  {
    this.down_p=this.Starting_Position;
	this.Paths.push(new Path(this.down_p));
  }
}
break;
case 'D':
{
  this.StartPointDrag(loc);
  //canvas.style.cursor='move';
}
break;
case 'F':
	  if(this.Waiting_ForContinueClick)
	  {
	   break;
	  }
case 'E':
case 'C':
	{

	   if(this.Paths.length)
	   {
		   let Pathd=this.getClosestPointOnLines(adjusted_loc,this.Paths);
		   this.HighLightPathEl=this.Paths[Pathd.i];
	   }
	}
break;
}


return e.preventDefault() && false;
}

mousemove(e,adjusted_loc,t)
{
if(this.MouseDown!=null)
{
this.last_p=loc;
if(this.MouseDown=='D')
   {
	   this.EndPointMove(adjusted_loc);
   }
}
return e.preventDefault() && false;
}


mouseup(e,adjusted_loc,t)
{
	switch(this.MouseDown)
	{
	case 'M': //measure
		 this.Measurements.push(new Measurement(this.down_p,adjusted_loc));
	break;
	case 'P':
		this.Paths.push(new Path(adjusted_loc));
		this.Paths[this.Paths.length-1].recalculate();

	break;
	case 'W': //measure
	  this.Walls.push(new Wall(this.down_p,adjusted_loc));
    break;
	case 'X':
		this.DoDeleteObject(adjusted_loc);
	break;

	case 'D':
	     this.EndPointDrag(adjusted_loc);
//		 canvas.style.cursor='pointer';
    break;
	case 'C':
		{
			if(this.corners.length>0)
			{
			let dp=99999999;
				for(let i=0; i<this.corners.length; i++)
				{
		          let d=distance_pt(this.corners[i],adjusted_loc);
				  if(d<dp)
				  {
					dp=d;
		            this.HighLightCornerPt=i;
				  }
				}
			}
			this.CornerDialog();

		 }
	break;
	
	case 'E':
	{
	
	 if(this.Walls.length>0)
	 {
		 let Walld=null;

		for(let i=0; i<this.Walls.length; i++)
		{
		 let d=this.getdisttoline(this.Walls[i].start,this.Walls[i].end,adjusted_loc);
		 if(Walld==null)
		 {
			 Walld={'md':d,'i':i};
		 }
		 else
		 {
			if(Walld.md>d) {Walld.i=i; Walld.md=d;};
		 }

		}
		this.HighLightWallPt=Walld.i;
     	this.EdgeDialog();

	}

	}
	break;
	case 'F':
		{
   	
			if(this.Waiting_ForContinueClick)
				{
				this.Waiting_ForContinueClick=false;
				this.FinishFeature(this.down_p);
				}
			else
			{
            this.FeatureDialog();
			}

		}
	  break;

	case 'S':
		this.DoSplitObject(adjusted_loc);
	break



	}
this.MouseDown=null;
return e.preventDefault() && false;
}


getdisttoline(l1,l2,pXy)
{
 let dist;
	if (l2.x != l1.x)
 {
	 var a = (l2.y - l1.y) / (l2.x - l1.x);
	 var b = l2.y - a * l2.x;
	 dist = Math.abs(a * pXy.x + b - pXy.y) / Math.sqrt(a * a + 1);
 }
 else
	 dist = Math.abs(pXy.x - l2.x);

 return dist;


}

getClosestPointOnLines(pXy,aXys)
{

    let minDist=999999999;
    let fTo;
    let fFrom;
    let x=9999999999;
    let y=9999999999;
    let i=-1;
    let dist;

    if (aXys.length > 1) {

        for (var n = 1 ; n < aXys.length ; n++) {

			dist=this.getdisttoline(aXys[n - 1].pt, aXys[n ].pt,pXy);

            // length^2 of line segment
            var rl2 = Math.pow(aXys[n].pt.y - aXys[n - 1].pt.y, 2) + Math.pow(aXys[n].pt.x - aXys[n - 1].pt.x, 2);

            // distance^2 of pt to end line segment
            var ln2 = Math.pow(aXys[n].pt.y - pXy.y, 2) + Math.pow(aXys[n].pt.x - pXy.x, 2);

            // distance^2 of pt to begin line segment
            var lnm12 = Math.pow(aXys[n - 1].pt.y - pXy.y, 2) + Math.pow(aXys[n - 1].pt.x - pXy.x, 2);

            // minimum distance^2 of pt to infinite line
            var dist2 = Math.pow(dist, 2);

            // calculated length^2 of line segment
            var calcrl2 = ln2 - dist2 + lnm12 - dist2;

            // redefine minimum distance to line segment (not infinite line) if necessary
            if (calcrl2 > rl2)
                dist = Math.sqrt(Math.min(ln2, lnm12));

            if ((minDist == null) || (minDist > dist))
				{
                if (calcrl2 > rl2) {
                    if (lnm12 < ln2) {
                        fTo = 0;//nearer to previous point
                        fFrom = 1;
                    }
                    else {
                        fFrom = 0;//nearer to current point
                        fTo = 1;
                    }
                }
                else {
                    // perpendicular from point intersects line segment
                    fTo = ((Math.sqrt(lnm12 - dist2)) / Math.sqrt(rl2));
                    fFrom = ((Math.sqrt(ln2 - dist2)) / Math.sqrt(rl2));
                }
                minDist = dist;
                i = n;
            }
        }

        var dx = aXys[i - 1].pt.x - aXys[i].pt.x;
        var dy = aXys[i - 1].pt.y - aXys[i].pt.y;

        x = aXys[i - 1].pt.x - (dx * fTo);
        y = aXys[i - 1].pt.y - (dy * fTo);

    }

    return { 'pt':{'x': x, 'y': y}, 'i': i, 'fTo': fTo, 'fFrom': fFrom ,'md':minDist};
}

getClosestPointOnLineSeg(pt,l1,l2)
{
let aa=[{'pt':{'x':l1.x,'y':l1.y}},
        {'pt':{'x':l2.x,'y':l2.y}}
	   ];
return this.getClosestPointOnLines(pt,aa);
}


GetNearestLine(loc)
{

	let Pathd=null;
	let Walld=null;
	let Measd=null;

if(this.Paths.length)
{
Pathd=this.getClosestPointOnLines(loc,this.Paths);
if(Pathd.fTo<0.5)  Pathd.i--;
Pathd['a']=this.Paths;
}


if(this.Walls.length>0)
{
	for(let i=0; i<this.Walls.length; i++)
	{
	 let d=this.getdisttoline(this.Walls[i].start,this.Walls[i].end,loc);
	 if(Walld==null)
	 {
		 Walld={'md':d,'i':i};
	 }
	 else
	 {
		if(Walld.md>d) {Walld.i=i; Walld.md=d;};
	 }

	}
	Walld['a']=this.Walls;
}


if(this.Measurements.length>0)
{
	for(let i=0; i<this.Measurements.length; i++)
	{
	 let d=this.getdisttoline(this.Measurements[i].start,this.Measurements[i].end,loc);
	 if(Measd==null)
	 {
		 Measd={'md':d,'i':i};
	 }
	 else
	 {
		if(Measd.md>d) {Measd.i=i; Measd.md=d;};
	 }

	}
	Measd['a']=this.Measurements;

}

//Pathd,Wallsd,Measd
let mind=null;

if(Pathd!=null) mind=Pathd;

if(Walld!=null)
{
if((mind==null) || (mind.md>Walld.md)) mind=Walld;
}

if(Measd!=null)
{
if((mind==null) || (mind.md>Measd.md)) mind=Measd;
}
return mind;
}


DoDeleteObject(loc)
{
let mind= this.GetNearestLine(loc);

if(mind==null) return;


mind.a.splice(mind.i,1);

}

RecalculateAllPaths()
{	  this.Paths.forEach(function (item,index)
	  {
		item.recalculate();
});
};





DoSplitObject(loc)
{
let mind= this.GetNearestLine(loc);
if(mind==null) return;

if(mind.a===this.Paths)
{
if(mind.fTo<0.5)  mind.i++;
//X.Y is between i -1 and i
this.Paths.splice(mind.i,0,new Path(loc));
RecalculateAllPaths();
}
else
if(mind.a===this.Walls)
{
let i=mind.i;
let ep={'x':this.Walls[i].end.x,'y':this.Walls[i].end.y};
this.Walls.push(new Wall(loc,ep));
this.Walls[i].end.x=loc.x;
this.Walls[i].end.y=loc.y;
}
else
if(mind.a===this.Measurements)
{
let i=mind.i;
let ep={'x':this.Measurements[i].end.x,'y':this.Measurements[i].end.y};
this.Measurements.push(new Measurement(loc,ep));
this.Measurements[i].end.x=loc.x;
this.Measurements[i].end.y=loc.y;
this.Measurements[i].recalculate();
}


}

StartPointDrag(loc)
{//Find nearest point
//Then set this.down_p= that point;
this.drag_point=null;

	if(this.Paths.length)
	{
		for(var i=1; i<this.Paths.length; i++)
		{
		 let dm=distance_pt(this.Paths[i].pt,loc);
		 if((this.drag_point==null) ||(this.drag_point.d>dm))
		 {
			 this.drag_point={'d':dm, 'pt':this.Paths[i].pt,'rc':this.Paths[i]};
		 }
		}

	}

	if(this.Walls.length)
	{
	for(var i=0; i<this.Walls.length; i++)
	{
	 let dm=distance_pt(this.Walls[i].start,loc);
	 if((this.drag_point==null) ||(this.drag_point.d>dm))
	 {
		 this.drag_point={'d':dm, 'pt':this.Walls[i].start};
	 }
	 dm=distance_pt(this.Walls[i].end,loc);
	 if((this.drag_point==null) ||(this.drag_point.d>dm))
	 {
		 this.drag_point={'d':dm, 'pt':this.Walls[i].end};
	 }

	}
	}
	
	if(this.Measurements.length)
	{
	for(var i=0; i<this.Measurements.length; i++)
	{
	 let dm=distance_pt(this.Measurements[i].start,loc);
	 if((this.drag_point==null) ||(this.drag_point.d>dm))
	 {
		 this.drag_point={'d':dm, 'pt':this.Measurements[i].start,'rc':this.Measurements[i] };
	 }
	 dm=distance_pt(this.Measurements[i].end,loc);
	 if((this.drag_point==null) ||(this.drag_point.d>dm))
	 {
		 this.drag_point={'d':dm, 'pt':this.Measurements[i].end,'rc':this.Measurements[i] };
	 }

	}
	}

}

EndPointDrag(loc)
{
	if((this.drag_point!=null) && (this.drag_point!=undefined))
		{
		this.drag_point.pt.x=loc.x;
		this.drag_point.pt.y=loc.y;
		if (typeof this.drag_point.rc === "undefined") return;
		 this.drag_point.rc.recalculate()
		 TheOneCar.RecalculateAllPaths();      
       }

}

EndPointMove(loc)
{
	if((this.drag_point!=null) && (this.drag_point!=undefined))
		{
		this.drag_point.pt.x=loc.x;
		this.drag_point.pt.y=loc.y;
		if (typeof this.drag_point.rc === "undefined") return;
	    this.drag_point.rc.recalculate();
		TheOneCar.RecalculateAllPaths();      

       }

}
NewMenuSelect(t)
{
	this.HighLightPathEl=null;
	this.HighLightWallPt=null;
	this.HighLightCornerPt=null;
	this.Waiting_ForContinueClick=false;

}


ZCornerDialog()
{
let action=window.prompt("New/Delete", "N/D");
if(action.charAt(0)=='D')
{
this.HighLightPathEl.corner_d=null;
}
else
{
let adjust_lr=(window.prompt("Adjust Left Right Distance?", "Y/n").charAt(0)=='Y');
let adjust_fa=(window.prompt("Adjust Fore Aft Distance?", "Y/n").charAt(0)=='Y');
let c=this.corners[this.HighLightCornerPt];
let cpt={'x':c.x,'y':c.y};
let pm1=null;
let p1=this.HighLightPathEl;
for(let i=1; i<this.Paths.length; i++)
	 if(this.HighLightPathEl===this.Paths[i])
	 {
		 pm1=this.Paths[i-1];
		 break;
	 }
let r=this.getClosestPointOnLineSeg(cpt,pm1.pt,p1.pt);
p1.corner_d=new CornerDetect(adjust_lr,adjust_fa,cpt,c.indent,r.pt);
}//Action add


}

GetTextContentById(id)
{
let c=document.getElementById(id);
let t=c.value;
console.log('Value =['+t.toString()+'] \n');
return t;
}

GetCheckedById(id)
{
let c=document.getElementById(id);
let t=c.checked;
console.log('Value =['+t.toString()+'] \n');
return t;
}



FeatureDialog()
{
let modal = document.getElementById('FeatureDialog');
 modal.style.display = "block";
}

FinishFeature(loc)
{
if(!this.HighLightPathEl)
{
    this.Waiting_ForContinueClick=false;
	return;
}

let bContinue= this.GetCheckedById('FeatureContinue');
let bStop= this.GetCheckedById('FeatureStop');
let bArc= this.GetCheckedById('ArcConvert');
let fOptions=this.GetTextContentById('FeatureOptions');
let fSpeed=Number(this.GetTextContentById('FeatureSpeed'));

let pe=this.HighLightPathEl;

if((loc!=null) && (bContinue))
{
let pa=null;

	if(this.Paths.length)
	{
		for(var i=0; i<this.Paths.length; i++)
		{
		 let dm=distance_pt(this.Paths[i].pt,loc);
		 if((pa==null) ||(pa.d>dm))
		 {
			 pa={'d':dm, 'i':i};
		 }
		}//For
	}//If

if(pa!=null)
	pe.next_seq=pa.i;
else
    pe.next_seq=null;

}//Loc ! null
else
{
pe.next_seq=null;
}
pe.next_seq


pe.bStop=bStop;
if(bArc ) pe.Arc=true;
else
{
		pe.ChordAngle=null;
		pe.arc_r=null;
		pe.center_arc=null;
pe.Arc=false; 
}

if(fOptions=='none') pe.Options=null;
else
pe.options=fOptions;

if(fSpeed.length) pe.Speed=fSpeed;
else
pe.Speed=null;

pe.recalculate();
}

FeatureSubmit(ok)
{
let modal = document.getElementById('FeatureDialog');
 modal.style.display = "none";

if(ok)
{
let bContinue= this.GetCheckedById('FeatureContinue');

if(bContinue)
	this.Waiting_ForContinueClick=true;
else
    this.Waiting_ForContinueClick=false;
this.FinishFeature(null);
}
else
{
this.Waiting_ForContinueClick=false;
}
}



EdgeDialog()
{
let modal = document.getElementById('EdgeDialog');
 modal.style.display = "block";
}

EdgeSubmit(ok)
{
let modal = document.getElementById('EdgeDialog');
 modal.style.display = "none";
 if(!ok) return;

let bElr= this.GetCheckedById('EdgeLeftRight');
let bEhd= this.GetCheckedById('EdgeHead');
let bPar= this.GetCheckedById('EdgePar');
let eMode=this.GetTextContentById('EdgeMode');

let wa=this.Walls[this.HighLightWallPt];
let pm1=null;
let p1=this.HighLightPathEl;
for(let i=1; i<this.Paths.length; i++)
	 if(this.HighLightPathEl===this.Paths[i])
	 {
		 pm1=this.Paths[i-1];
		 break;
	 }


if(eMode.charAt(0)=='F')
{
if(bPar)
{
//pm1 not going to move.
let r1=this.getClosestPointOnLineSeg(pm1.pt,wa.start,wa.end);
let r2=this.getClosestPointOnLineSeg(p1.pt,wa.start,wa.end);
let dx=(r2.pt.x-r1.pt.x);
let dy=(r2.pt.y-r1.pt.y);
p1.pt.x=pm1.pt.x+dx;
p1.pt.y=pm1.pt.y+dy;
}

let p={'x':(p1.pt.x+pm1.pt.x)/2,'y':(p1.pt.y+pm1.pt.y)/2};
let r=this.getClosestPointOnLineSeg(p,wa.start,wa.end);

if((bEhd) && (bPar))
   {
	this.HighLightPathEl.Edgev=new Edge(false,bElr,0,r.pt);
   }
  else
  {//No heading
	  this.HighLightPathEl.Edgev=new Edge(false,bElr,null,r.pt);
  }
}
else
if(eMode.charAt(0)=='I')
{
let wa=this.Walls[this.HighLightWallPt];
let pt=this.HighLightPathEl.pt;
let r=this.getClosestPointOnLineSeg(pt,wa.start,wa.end);
this.HighLightPathEl.Edgev=new Edge(true,false,null,r.pt);
}
}

EdgeDelete()
{
let modal = document.getElementById('EdgeDialog');
 modal.style.display = "none";
this.HighLightPathEl.Edgev=null;
}

CornerDialog()
{
let modal = document.getElementById('CornerDialog');
 modal.style.display = "block";
}

CornerSubmit(ok)
{
let modal = document.getElementById('CornerDialog');
 modal.style.display = "none";
 if(!ok) return;
let bClr= this.GetCheckedById('CornerLeftRight');
let bCfa= this.GetCheckedById('CornerForeAft');

let c=this.corners[this.HighLightCornerPt];
let cpt={'x':c.x,'y':c.y};
let pm1=null;
let p1=this.HighLightPathEl;
for(let i=1; i<this.Paths.length; i++)
	 if(this.HighLightPathEl===this.Paths[i])
	 {
		 pm1=this.Paths[i-1];
		 break;
	 }
let r=this.getClosestPointOnLineSeg(cpt,pm1.pt,p1.pt);
p1.corner_d=new CornerDetect(bClr,bCfa,cpt,c.indent,r.pt);
}

CornerDelete()
{
let modal = document.getElementById('CornerDialog');
 modal.style.display = "none";
this.HighLightPathEl.corner_d=null;
}

}//end of carshow



var dobj=document.getElementById('DataSet');
var contents="This is a test file";


dobj.onclick= function (e) {
var obj={'Path':TheOneCar.Paths,'Walls':TheOneCar.Walls,'Measurements':TheOneCar.Measurements};
dobj.setAttribute('href', 'data:application/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(obj)));
};

dobj.addEventListener('contextmenu', function(ev)
{
var obj={'Path':TheOneCar.Paths,'Walls':TheOneCar.Walls,'Measurements':TheOneCar.Measurements};
dobj.setAttribute('href', 'data:application/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(obj)));
    return true;
}, false);

function FeatureSubmit(e)
{
  TheOneCar.FeatureSubmit(true);
}

function FeatureCancel(e)
{
  TheOneCar.FeatureSubmit(false);
}

function EdgeSubmit()
{
TheOneCar.EdgeSubmit(true);
}

function EdgeCancel()
{
TheOneCar.EdgeSubmit(false);
}

function EdgeDelete()
{
TheOneCar.EdgeDelete();
}

function EdgeModeChange()
{
let c=document.getElementById('EdgeMode');
let em=document.getElementById('EmpathVis');

if(c.value.charAt(0)=='F')
	{
	 em.style.display='block';
	}
else
	{
	 em.style.display='none';
	}
}


function CornerSubmit()
{
TheOneCar.CornerSubmit(true);
}

function CornerCancel()
{
TheOneCar.CornerSubmit(false);
}

function CornerDelete()
{
TheOneCar.CornerDelete();
}


function PostToCar()
{
let car_addr="192.168.0.155"
car_addr=window.prompt("Car Address",car_addr);
var obj={'Path':TheOneCar.Paths};
xhr = new XMLHttpRequest();
var url ='http:\\\\'+car_addr+'\\PATHPOST';
console.log('Posting to '+url+'\n');

xhr.open("POST",url, true);
xhr.setRequestHeader("Content-type", "application/json");

xhr.onreadystatechange = function ()
{
    if (xhr.readyState == 4 && xhr.status == 200)
	{
		console.log("Sent post succesfully\r\n");
    }
   else
    {
	   console.log("Post Failed\r\n");
    }
}
xhr.send(JSON.stringify(obj));
}



function ReadPathsFile() {
  var input = document.getElementById('hidden_json_file');

  var fr = new FileReader();
  fr.onload = function()
  {
	  var jobj=JSON.parse(fr.result);

	  if(TheOneCar.PathOrg_x!=undefined)
	  {
		let fx=jobj.Path[0].pt.x
		let fy=jobj.Path[0].pt.y;
		//fx==this.PathOrg_x==this.saved_xo;
		//fy==this.PathOrg_x==this.saved_yo;

	   for(let i=0; i< jobj.Path.length; i++)
	      {					 /* now to car coordinates*/
		   jobj.Path[i].pt.x+= (-fx)+TheOneCar.saved_xo;
		   jobj.Path[i].pt.y+= (-fy)+TheOneCar.saved_yo;
          }
	  }

	  TheOneCar.Paths=[];
	  jobj.Path.forEach(function (item,index)
	  {TheOneCar.Paths.push(new Path(item.pt));
 	   TheOneCar.Paths[index].Edgev=item.Edgev;
 	   TheOneCar.Paths[index].conrer_d=item.corner_d;
 	   TheOneCar.Paths[index].next_seq=item.next_seq;
 	   TheOneCar.Paths[index].bStop=item.bStop;
 	   TheOneCar.Paths[index].Options=item.Options;
 	   TheOneCar.Paths[index].Speed=item.Speed;
	  });

 TheOneCar.RecalculateAllPaths();      



//	  TheOneCar.Paths=jobj.Path;

	  TheOneCar.Measurements=[];

	  jobj.Measurements.forEach(function (item,index){TheOneCar.Measurements.push(new Measurement(item.start,item.end));});

	  TheOneCar.Walls=jobj.Walls;
  }

  fr.readAsText(input.files[0]);

}



function  Calc_HeadDeg(pfrom,pto)                                                                                                                                                                                     
{
if((pto==undefined) ||(pfrom==undefined))
{
Console.log("Undefined\n");
}

let dx=(pto.x-pfrom.x);
let dy=-(pto.y-pfrom.y);

if(dx==0) //North or South
{
  if(dy>0) return 0;
  else
	  return 180.0;
}
else
if(dy==0)
{
   if(dx>0) return 90.0;
   else return -90.0;
}

// So realize that atan 2 works on unit circle where 0 deg is east 
// and 90 is north
// and 180 is west
// and 270/-90 is south

let d=Math.atan2(dx,dy);
//So we need to reverse direction....
d*=(180.0/Math.PI);
//and rotate 90
//d-=90;
if(d<-180) d+=360.0;
if(d> 180) d-=360.0;
return d;
}
