
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
 recalculate()
 {
  this.value=distance_pt(this.start,this.end).toFixed(2);
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
  this.HighLightPathEl=null;
  this.HighLightWallPt=null;
  this.HighLightCornerPt=null;
  this.Waiting_ForContinueClick=false; 
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
		if(this.HighLightCornerPt==i)
		{
		ctx.strokeStyle= 'rgba(255,0,0,1.0)';
        ctx.beginPath();
		ctx.arc(this.corners[i].x,this.corners[i].y,10,0,2*Math.PI);
		ctx.stroke();
		ctx.strokeStyle= 'rgba(0,0,0,1.0)';
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
       if(this.HighLightWallPt==i)
	   {
	    ctx.strokeStyle= 'rgba(255,0,0,1.0)';
	   ctx.beginPath();
	   ctx.arc(m.start.x,m.start.y,3,0,2*Math.PI);
	   ctx.lineTo(m.end.x,m.end.y);
	   ctx.arc(m.end.x,m.end.y,3,0,2*Math.PI);
	   ctx.stroke();
	   ctx.strokeStyle= 'rgba(0,0,0,1.0)';

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
	  ctx.strokeStyle= 'rgba(0,128,0,1.0)';
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
		   ctx.strokeStyle= 'rgba(255,0,0,1.0)';
		   ctx.moveTo(this.Paths[i-1].pt.x,this.Paths[i-1].pt.y);
		   ctx.lineTo(m.pt.x,m.pt.y);
		   ctx.stroke();
           ctx.strokeStyle= 'rgba(0,128,0,1.0)';
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
		   ctx.strokeStyle= 'rgba(255,0,255,1.0)';
		   ctx.beginPath();
		   if(m.Edgev.inter)
		   {
			    ctx.moveTo(m.pt.x,m.pt.y);
		   }
		   else
		   {
			   ctx.moveTo((m.pt.x+this.Paths[i-1].pt.x)/2,(m.pt.y+this.Paths[i-1].pt.y)/2);

		   }

		   ctx.lineTo(m.Edgev.pt.x,m.Edgev.pt.y);
		   ctx.stroke();
           ctx.strokeStyle= 'rgba(0,128,0,1.0)';
	   }


	   if(m.corner_d!=null)
	   {
		   let c=m.corner_d;
		   ctx.strokeStyle= 'rgba(255,0,255,1.0)';
		   ctx.beginPath();
		   ctx.moveTo(c.path_pt.x,c.path_pt.y);
		   ctx.lineTo(c.corner_pt.x,c.corner_pt.y);
		   ctx.stroke();
		   ctx.beginPath();
		   ctx.arc(c.path_pt.x,c.path_pt.y,2,0,2*Math.PI);
		   ctx.stroke();
           ctx.strokeStyle= 'rgba(0,128,0,1.0)';
	   }

	   if(m.next_seq)
	   {
		   ctx.strokeStyle= 'rgba(255,0,0,1.0)';
		   ctx.beginPath();
		   ctx.beginPath();
		   ctx.moveTo(m.pt.x,m.pt.y);
		   ctx.lineTo(this.Paths[m.next_seq].pt.x,this.Paths[m.next_seq].pt.y);
		   ctx.stroke();

	   }

	  }
	  ctx.restore();
  }

/*   if(this.Edges.length>0)
  {
	  for(let i=0; i<this.Edges.length; i++)
	  {
		  let e=this.Edges[i];
		  let p1=e.prevpath;
		  let p2=e.pathpt;
		  let wa=e.wallpt;
		  let p={'x':(p1.pt.x+p2.pt.x)/2,'y':(p1.pt.y+p2.pt.y)/2};
		  let r=this.getClosestPointOnLineSeg(p,wa.start,wa.end);

		  ctx.strokeStyle= 'rgba(255,0,255,1.0)';
		  ctx.beginPath();
		  ctx.moveTo(p.x,p.y);
		  ctx.lineTo(r.pt.x,r.pt.y);
		  ctx.stroke();

	  }


  }

*/

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


DoSplitObject(loc)
{
let mind= this.GetNearestLine(loc);
if(mind==null) return;

if(mind.a===this.Paths)
{
if(mind.fTo<0.5)  mind.i++;
//X.Y is between i -1 and i
this.Paths.splice(mind.i,0,new Path(loc));
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
			 this.drag_point={'d':dm, 'pt':this.Paths[i].pt};
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
		 this.drag_point={'d':dm, 'pt':this.Measurements[i].start,'m':this.Measurements[i] };
	 }
	 dm=distance_pt(this.Measurements[i].end,loc);
	 if((this.drag_point==null) ||(this.drag_point.d>dm))
	 {
		 this.drag_point={'d':dm, 'pt':this.Measurements[i].end,'m':this.Measurements[i] };
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
		if (typeof this.drag_point.m === "undefined") return;
		 this.drag_point.m.recalculate()
       }

}

EndPointMove(loc)
{
	if((this.drag_point!=null) && (this.drag_point!=undefined))
		{
		this.drag_point.pt.x=loc.x;
		this.drag_point.pt.y=loc.y;
		if (typeof this.drag_point.m === "undefined") return;
	    this.drag_point.m.recalculate();
       }

}
NewMenuSelect(t)
{
	this.HighLightPathEl=null;
	this.HighLightWallPt=null;
	this.HighLightCornerPt=null;
	this.Waiting_ForContinueClick=false; 

}


CornerDialog()
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
let modal = document.getElementById('myModal');
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
let fOptions=this.GetTextContentById('FeatureOptions');
let fSpeed=this.GetTextContentById('FeatueSpeed');
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

if(fOptions=='none') pe.Options=null;
else
pe.options=fOptions;

pe.Speed=fSpeed;

}

FeatureSubmit(ok)
{
let modal = document.getElementById('myModal');
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
this.Waiting_ForContinueClick=true;                                                                                                                                                                                           
}
}

EdgeDialog()
{
let follow=window.prompt("Follow/Intercept/D", "F/I/D");
if(follow.charAt(0)=='F')
{
let make_par=(window.prompt("Make Path/Wall parallel?", "Y/n").charAt(0)=='Y');
let adjustd=(window.prompt("Adjust Left Right Distance?", "Y/n").charAt(0)=='Y');
let adjusth=(window.prompt("Adjust Heading?", "Y/n").charAt(0)=='Y');
let wa=this.Walls[this.HighLightWallPt];
let pm1=null;
let p1=this.HighLightPathEl;
for(let i=1; i<this.Paths.length; i++)
	 if(this.HighLightPathEl===this.Paths[i])
	 {
		 pm1=this.Paths[i-1];
		 break;
	 }
if(make_par)
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

this.HighLightPathEl.Edgev=new Edge(false,adjustd,adjusth,r.pt);
}
else
if(follow.charAt(0)=='I')

{
let adjusth=(window.prompt("Adjust Heading?", "Y/n").charAt(0)=='Y');
let wa=this.Walls[this.HighLightWallPt];
let pt=this.HighLightPathEl.pt;
let r=this.getClosestPointOnLineSeg(pt,wa.start,wa.end);
this.HighLightPathEl.Edgev=new Edge(true,false,adjusth,r.pt);
}
if(follow.charAt(0)=='D')
{
this.HighLightPathEl.Edgev=null;
}

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



function ReadPathsFile() {
  var input = document.getElementById('hidden_json_file');

  var fr = new FileReader();
  fr.onload = function()
  {
	  var jobj=JSON.parse(fr.result);
	  TheOneCar.Paths=jobj.Path;

	  TheOneCar.Measurements=[];

	  jobj.Measurements.forEach(function (item,index){TheOneCar.Measurements.push(new Measurement(item.start,item.end));});

	  TheOneCar.Walls=jobj.Walls;
  }

  fr.readAsText(input.files[0]);

}


