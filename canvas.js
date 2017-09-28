	var cseq=0;
	var os_bgcanvas;
	var os_canvas;
	var canvas;
	var iconCanvas;
	var lab;
	var data_display;
	var bRun=false;
	var state_pos=0;
	var selectedRect;
	var ctx; 
	var ictx;
	var ZoomObj;
		
	const MARGIN_FEET=10;
	const GRID_HORIZONTAL_SPACING = 10;
	const GRID_VERTICAL_SPACING = 10;
	const GRID_LINE_COLOR = 'rgb(0, 0, 200)';

	class ScalingObject
	{
		constructor(dispcanvas,drcanvas)
	 {
	 this.zoomv=1.0;
	 this.OffsetIntoDraw ={'x':0, 'y':0,'zm':1.0};
	 this.Display_ht=dispcanvas.clientHeight;
	 this.Display_wd=dispcanvas.clientWidth;
	 this.DispCan=dispcanvas;
   	 this.Draw_ht=drcanvas.clientHeight;
	 this.Draw_wd=drcanvas.clientWidth;
	 this.DrCenter={'x':this.Draw_wd/2, 'y':this.Draw_ht/2};
	 this.DrawCan=drcanvas;
	 }
	  

	 GetOffset()
	 {
	   return this.OffsetIntoDraw; 
	 }

	 DispCanToDrawCan(loc)
	 {
	   let hx=loc.x/this.OffsetIntoDraw.zm;
	   let hy=loc.y/this.OffsetIntoDraw.zm;
	   loc.x=hx+this.OffsetIntoDraw.x;
	   loc.y=hy+this.OffsetIntoDraw.y;
	   return loc;
	 }

	 DrawCanToDispCan(loc)
	 {
	  let hx=loc.x-this.OffsetIntoDraw.x; 
	  let hy=loc.y-this.OffsetIntoDraw.x; 
	  loc.x=hx*this.OffsetIntoDraw.zm;
	  loc.y=hy*this.OffsetIntoDraw.zm;
	  return loc;
     }
	 
	 Zoom(delta,x,y)
	 {
	   let loc = windowToCanvas(this.DispCan, x, y); 
	   loc=this.DispCanToDrawCan(loc);
	   this.DRCenter=loc;
       if(delta>0) this.OffsetIntoDraw.zm*=2;
	   if(delta<0) this.OffsetIntoDraw.zm/=2;
	   
	   //We must use DR Center to calculate
	   //We want DRcenter=dispcenter...

	   loc.x-=this.Display_wd/(2*this.OffsetIntoDraw.zm); 
	   loc.y-=this.Display_ht/(2*this.OffsetIntoDraw.zm); 

	   this.OffsetIntoDraw.x=Math.round(loc.x);
	   this.OffsetIntoDraw.y=Math.round(loc.y);

	   this.DrawCanToDispCan(loc);
	   console.log('SB Center ['+loc.x.toString()+','+loc.y.toString()+']');

	 }

	};


	var OffsetCenter={'x':0, 'y':0};
	
	function startcanvas(){	
		canvas = document.getElementById('drawing-canvas');
		iconCanvas = document.getElementById('icon-canvas');
		iconCanvas.onmousedown = IconMouseDown;



		lab = document.getElementById('labme');

    	   
        
	    ctx = canvas.getContext('2d');
		ictx = iconCanvas.getContext('2d');
	  
		function redraw(ts){
			
			ictx.save();
   		    IconDraw(ictx);
			ictx.restore();
			ctx.save();
			// Clear the entire canvas
			ctx.clearRect(0,0,canvas.width,canvas.height);
			ctx.beginPath();
			ctx.lineWidth = 2;
			ctx.strokeRect(0,0,canvas.width,canvas.height);
			ctx.stroke();
            basedraw(ctx);
			ctx.restore();
       	
		}
		var handleScroll = function(evt)
		{
				var delta = evt.wheelDelta ? evt.wheelDelta/40 : evt.detail ? -evt.detail : 0;
				if ((delta) && (ZoomObj!=undefined)) ZoomObj.Zoom(delta,evt.x,evt.y);
				return evt.preventDefault() && false;
		};
		
		canvas.addEventListener('DOMMouseScroll',handleScroll,false);
		canvas.addEventListener('mousewheel',handleScroll,false);
		redraw(0);
		//requestAnimationFrame(redraw);
		setInterval(redraw,16);
	};
	

	
function adddata(data_show)
{
	let ext=data_show.getExtents();

	let car_cty=(ext.maxy+ext.miny)/2;
	let car_ctx=(ext.maxx+ext.minx)/2;

	os_canvas=document.createElement('canvas');

	os_canvas.width  = (ext.maxx-ext.minx)+MARGIN_FEET*2*12;
    os_canvas.height = (ext.maxy-ext.miny)+MARGIN_FEET*2*12;

	os_bgcanvas=document.createElement('canvas');

	os_bgcanvas.width  = (ext.maxx-ext.minx)+MARGIN_FEET*2*12;
	os_bgcanvas.height = (ext.maxy-ext.miny)+MARGIN_FEET*2*12;


	let can_cty=(os_canvas.height)/2;
	let can_ctx=(os_canvas.width)/2;

	//can_ctx==(off.x+car_ctx)
	OffsetCenter.x=(can_ctx-car_ctx);
	OffsetCenter.y=(can_cty+car_cty); //Car ys are neg

	let bgctx= os_bgcanvas.getContext('2d'); 

	bgctx.clearRect(0,0,bgctx.canvas.clientWidth,bgctx.canvas.clientHeight);
	drawGrid(bgctx,GRID_LINE_COLOR , 12, 12);
	data_show.drawBase(bgctx,OffsetCenter.x,OffsetCenter.y);
	ZoomObj=new ScalingObject(canvas,os_canvas);
	canvas.onmousedown = CanvasMouseDown;
	canvas.onmousemove = CanvasMouseMove;
	canvas.onmouseup   = CanvasMouseUp;



data_display=data_show;
}

function basedraw(ctx)
{
if(data_display==undefined) return;
let osctx = os_canvas.getContext('2d');

osctx.clearRect(0,0,osctx.canvas.clientWidth,osctx.canvas.clientHeight);
osctx.drawImage(os_bgcanvas,0,0);

data_display.drawState(osctx,state_pos,OffsetCenter.x,OffsetCenter.y); 

/*
let wscale=os_canvas.width/canvas.width;
let hscale=os_canvas.height/canvas.height;

if(wscale>hscale)
{
ctx.drawImage(os_canvas,0,0,os_canvas.width,os_canvas.height,0,0,canvas.width,canvas.height*(hscale/wscale));//,osctx.canvas.clientWidth,osctx.canvas.clientHeight,0,0,canvas.width,canvas.height);    
}
else
{
ctx.drawImage(os_canvas,0,0,os_canvas.width,os_canvas.height,0,0,canvas.width*(wscale/hscale),canvas.height);//,osctx.canvas.clientWidth,osctx.canvas.clientHeight,0,0,canvas.width,canvas.height);    
}
*/
//ctx.drawImage(os_canvas,0,0);

dwoff=ZoomObj.GetOffset(); 

let wd=os_canvas.width-dwoff.x;
let ht=os_canvas.height-dwoff.y;
ctx.drawImage(os_canvas,dwoff.x,dwoff.y,wd,ht,0,0,wd*dwoff.zm,ht*dwoff.zm);


if(bRun) state_pos++;
if(state_pos>=data_display.getMaxState()) 
	{
	 state_pos=data_display.getMaxState()-1;
	 bRun=false;
    }
lab.value=state_pos.toString();
};


 function Rewind()
{
state_pos=0;
}

function Run()
{
if(state_pos==data_display.getMaxState()-1) state_pos=0;
bRun=true;
}

function  Pause()
{
bRun=false;
}

function Jump()
{
state_pos+=100;
if(state_pos>=data_display.getMaxState()) state_pos=0;

}

function Step()
{
state_pos+=1;
if(state_pos>=data_display.getMaxState()) state_pos=0;

}

function BStep()
{
state_pos-=1;
if(state_pos==0) state_pos=data_display.getMaxState()-1;
}


function drawGrid(context, color, stepx, stepy) {
   context.save()

   context.strokeStyle = color;
   context.fillStyle = '#ffffff';
   context.lineWidth = 0.5;
   context.fillRect(0, 0, context.canvas.width, context.canvas.height);
   context.globalAlpha = 0.1;

   context.beginPath();
   for (var i = stepx + 0.5; i < context.canvas.width; i += stepx) {
     context.moveTo(i, 0);
     context.lineTo(i, context.canvas.height);
   }
   context.stroke();

   context.beginPath();
   for (var i = stepy + 0.5; i < context.canvas.height; i += stepy) {
     context.moveTo(0, i);
     context.lineTo(context.canvas.width, i);
   }
   context.stroke();

   context.restore();
}

  const ICON_RECTANGLES = [
      { x: 13.5, y: 13.5, w: 48, h: 48 },
      { x: 13.5, y: 71.5, w: 48, h: 48 },
      { x: 13.5, y: 129.5, w: 48, h: 48 },
      { x: 13.5, y: 187.5, w: 48, h: 48 },
      { x: 13.5, y: 245.5, w: 48, h: 48 },
      { x: 13.5, y: 303.5, w: 48, h: 48 },
      { x: 13.5, y: 361.5, w: 48, h: 48 },
      { x: 13.5, y: 419.5, w: 48, h: 48 },
      { x: 13.5, y: 477.5, w: 48, h: 48 },
      { x: 13.5, y: 477.5, w: 48, h: 48 }
   ];


const ICON_BACKGROUND_STYLE = '#eeeeee';
const ICON_BORDER_STROKE_STYLE = 'rgba(100, 140, 230, 0.5)';
const ICON_STROKE_STYLE = 'rgb(100, 140, 230)';
const ICON_FILL_STYLE = '#dddddd';
const SHADOW_COLOR = 'rgba(0,0,0,0.7)';


function windowToCanvas(canvas, x, y) 
{
	var bbox = canvas.getBoundingClientRect();
    return { x: x - bbox.left * (canvas.width  / bbox.width),y: y - bbox.top  * (canvas.height / bbox.height)};
}


function IconDraw(context)
{
	
	   context.clearRect(0,0,iconCanvas.width,iconCanvas.height);

       ICON_RECTANGLES.forEach(function(rect) 
       {
	   context.save();

	   if (selectedRect === rect) 
		   {
		   context.shadowColor = SHADOW_COLOR;
		   context.shadowOffsetX = 4;
		   context.shadowOffsetY = 4;
		   context.shadowBlur = 5;
		   }
	   else                             
		   {
		   context.shadowColor = SHADOW_COLOR;
		   context.shadowOffsetX = 1;
		   context.shadowOffsetY = 1;
		   context.shadowBlur = 2;
		   }

	   context.fillStyle = ICON_BACKGROUND_STYLE;
	   context.fillRect(rect.x, rect.y, rect.w, rect.h);
	   context.restore();
	   });
}




function CanvasMouseDown(e)
{
	x = e.x || e.clientX, 
	y = e.y || e.clientY, 
	loc = windowToCanvas(canvas, x, y);
	loc=ZoomObj.DispCanToDrawCan(loc); 
	e.x=loc.x;
	e.y=loc.y;
	data_display.mousedown(e,loc);

}

function CanvasMouseUp(e)
{
	x = e.x || e.clientX, 
	y = e.y || e.clientY, 
	loc = windowToCanvas(canvas, x, y);
	loc=ZoomObj.DispCanToDrawCan(loc); 
	e.x=loc.x;
	e.y=loc.y;
	data_display.mouseup(e,loc);

}

function CanvasMouseMove(e)
{
	x = e.x || e.clientX, 
	y = e.y || e.clientY, 
	loc = windowToCanvas(canvas, x, y);
	loc=ZoomObj.DispCanToDrawCan(loc); 
	e.x=loc.x;
	e.y=loc.y;
	data_display.mousemove(e,loc);

}






function IconMouseDown(e) 
	{var 
				x = e.x || e.clientX, 
				y = e.y || e.clientY, 
				loc = windowToCanvas(iconCanvas, x, y);
				e.preventDefault();
		   
		   ICON_RECTANGLES.forEach(function(rect) {
		   ictx.beginPath();
		   ictx.rect(rect.x, rect.y, rect.w, rect.h);
		   if (ictx.isPointInPath(loc.x, loc.y)) 
			  {
			   selectedRect =rect;
			 }
		});
	}

