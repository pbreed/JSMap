
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
 this.value=distance_pt(sp,ep).toFixed(2);
 }
}

class Path
{
 constructor(ep)
 {
 this.pt=ep;
 }
}

class Wall
{
 constructor(sp,ep)
 {
 this.start=sp;
 this.end=ep;
 }
}


var TheOneCar;


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
  this.last_p=null;
  this.down_p=null;
  this.MouseDown='?';
  this.Measurements=[];
  this.Paths=[];
  this.Walls=[];
  TheOneCar=this;

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
     ctx.strokeStyle= 'rgba(0,255,0,1.0)';
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
ctx.strokeStyle= 'rgba(0,0,255,0.5)';

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

let dist=2+l/(1250*2.54);//    1250=1cm

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

  if(this.MouseDown!=null)
  {
	switch(this.MouseDown)
	{
	case 'P': //measure
	case 'W': //measure
	case 'M': //measure
		{
		 ctx.beginPath();
		 ctx.moveTo(this.down_p.x,this.down_p.y);
		 ctx.lineTo(this.last_p.x,this.last_p.y);
		 ctx.stroke();
		}
	}
  }

 
  if(this.Measurements.length)
  {
	ctx.save();
	ctx.strokeStyle= 'rgba(0,0,128,1.0)';
	ctx.font = '14px Palatino';
	ctx.textAlign = 'center';
	ctx.textBaseline = 'middle';

	for(let i=0; i<this.Measurements.length; i++)
	{  let m=this.Measurements[i];
		 ctx.beginPath();
		 ctx.moveTo(m.start.x,m.start.y);
		 ctx.lineTo(m.end.x,m.end.y);
		 ctx.stroke();
		 ctx.strokeText(m.value,(m.start.x+m.end.x)/2,(m.start.y+m.end.y)/2);
	}
	ctx.restore();

  }

  if(this.Walls.length)
{
  ctx.save();
  ctx.strokeStyle= 'rgba(0,0,0,1.0)';
  ctx.lineWidth=5;

  for(let i=0; i<this.Walls.length; i++)
  {  let m=this.Walls[i];
	   ctx.beginPath();
	   ctx.moveTo(m.start.x,m.start.y);
	   ctx.lineTo(m.end.x,m.end.y);
	   ctx.stroke();
  }
  ctx.restore();

}


  if(this.Paths.length)
  {
	  ctx.save();
	  ctx.strokeStyle= 'rgba(0,128,0,1.0)';
	  ctx.font = '14px Palatino';
	  ctx.textAlign = 'center';
	  ctx.textBaseline = 'middle';
	  ctx.beginPath();
	  let m=this.Paths[0];

	  ctx.moveTo(m.pt.x,m.pt.y);
	  
	  for(let i=0; i<this.Paths.length; i++)
	  {    let m=this.Paths[i];
		   ctx.lineTo(m.pt.x,m.pt.y);
		   ctx.stroke();
	  }
	  ctx.restore();
  }


/*  if(this.last_m_x!=null)
  {
      ctx.strokeStyle= 'rgba(255,0,0,1.0)';
	  ctx.beginPath();
	  ctx.moveTo(this.last_m_x-5,this.last_m_y-5);
	  ctx.lineTo(this.last_m_x+5,this.last_m_y+5);
	  ctx.stroke();
	  ctx.beginPath();
	  ctx.moveTo(this.last_m_x-5,this.last_m_y+5);
	  ctx.lineTo(this.last_m_x+5,this.last_m_y-5);
	  ctx.stroke();

  }

*/
}

mousedown(e,adjusted_loc,t)
{
this.MouseDown=t;
this.last_p=loc;
this.down_p=loc;

if(t=='P')
{
 if(this.Paths.length)
	 this.down_p=this.Paths[this.Paths.length-1].pt;
 else
  {
    this.down_p=this.Starting_Position;
	this.Paths.push(new Path(this.down_p));
  }
}

return e.preventDefault() && false;
}

mousemove(e,adjusted_loc,t)
{
if(this.MouseDown!=null)
{
this.last_p=loc;
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
	break;
	case 'W': //measure
	  this.Walls.push(new Wall(this.down_p,adjusted_loc));
    break;


	}
this.MouseDown=null;
return e.preventDefault() && false;
}


}


function Copy()
{
  var obj={'Path':TheOneCar.Paths,'Walls':TheOneCar.Walls};
  var text=JSON.stringify(obj);

  window.prompt("Copy to clipboard: Ctrl+C, Enter", text);
}
