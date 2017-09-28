
class carstate
{
	constructor(x,y,h,sl,rl)
	{
	  this.x=x;
	  this.y=y;
	  this.h=h;
	  this.slidar=sl;
	  this.rlidar=rl;
	}
};

const ODOSCALE = 4.58*.93;

const car_corner = [ [8,-6],[8,6],[-19,6],[-19,-6],[8,-6]];

class carshow
{
constructor(data)
  {
  this.lastOdo=null;
  this.carx=0;
  this.cary=0;
  this.extent={};
  this.extent.minx=99999999999;
  this.extent.miny=9999999999;
  this.extent.maxx=-9999999999;
  this.extent.maxy=-9999999999;
  this.LastLidar=[];
  this.car_States=[];
  this.corners=[];
  for(var i=0; i<data.length; i++)
	{
	this.scanone(data[i]);
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
  case 'IMUReportObj':
	  {
	 if(this.lastOdo==null)
		{
		 this.lastOdo=v.Odo;
		}
	 if(this.lastOdo!=v.Odo)
	  {
		 let dist=(v.Odo-this.lastOdo)*ODOSCALE;
		 let dx=dist*Math.sin(v.head*Math.PI/180.0);
		 let dy=dist*Math.cos(v.head*Math.PI/180.0);
		 this.carx+=dx;
		 this.cary+=dy;
		
		 if((this.carx==NaN) || (this.cary==NaN))
		 {
		   console.log('NAN??\n');
		 }
		 this.car_States.push(new carstate(this.carx,this.cary,v.head,v.lidar,this.LastLidar));
		 this.LastLidar=[];
		 this.expand_extent(this.carx,this.cary);
		 this.lastOdo=v.Odo;

	  }
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
	let arrayLength = this.car_States.length;
	ctx.beginPath();
	ctx.moveTo(this.car_States[0].x+xo,-this.car_States[0].y+yo);

	for(let i=1; i<arrayLength; i++)
	{
	  ctx.lineTo(this.car_States[i].x+xo,-this.car_States[i].y+yo);
	}
	ctx.stroke();

}




drawLidar(ctx,x,y,h,rl,nl)
{
if(rl==undefined) return;
ctx.save();
ctx.beginPath();
ctx.strokeStyle= 'rgba(0,0,255,1.0)';

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
ctx.strokeStyle= 'rgba(255,0,255,1.0)';

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
nl=6+nl/(1250*2.54);

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
ctx.strokeStyle= 'rgba(255,0,0,1.0)';
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

let dist=6+l/(1250*2.54);//    1250=1cm

ctx.beginPath();
ctx.strokeStyle= 'rgba(0,255,0,1.0)';
ctx.moveTo(x,+y);
yy=-dist;
ctx.lineTo((-s*yy)+x,(-c*yy)+y);
ctx.stroke();
ctx.restore();
}




drawState(ctx,pos,xo,yo)
{
this.drawLidar(ctx,this.car_States[pos].x+xo,-this.car_States[pos].y+yo,this.car_States[pos].h,this.car_States[pos].rlidar,this.car_States[pos].slidar);
this.drawCar(ctx,this.car_States[pos].x+xo,-this.car_States[pos].y+yo,this.car_States[pos].h,this.car_States[pos].slidar);
  if(this.corners.length>0)
  {
	for(let i=0; i<this.corners.length; i++)
	{
		ctx.beginPath();
		ctx.arc(this.corners[i].x,this.corners[i].y,10,0,2*Math.PI);
		ctx.stroke();

	}
  }

}



}
