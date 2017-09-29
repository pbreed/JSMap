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
	var bIOwnMouse=false;
    var bMouseIsDown=false;
    var pMouseLeft=null;

    var TheSelectedAction='?';
		
	const MARGIN_FEET=10;
	const GRID_HORIZONTAL_SPACING = 10;
	const GRID_VERTICAL_SPACING = 10;
	const GRID_LINE_COLOR = 'rgb(0, 0, 200)';
	const ZOOM_MIN_LIMIT= 0.25;

	class ScalingObject
	{
		constructor(dispcanvas,drcanvas)
	 {
	 this.zoomv=1.0;
	 this.OffsetIntoDraw ={'x':0, 'y':0,'zm':1.0};
	 this.Display_ht=dispcanvas.clientHeight;
	 this.Display_wd=dispcanvas.clientWidth;
	 this.DispCan=dispcanvas;
	 this.DrawCan=drcanvas;
   	 this.Draw_ht=drcanvas.height;
	 this.Draw_wd=drcanvas.width;
	 this.DrCenter={'x':this.Draw_wd/2, 'y':this.Draw_ht/2};
	 this.MouseDownInDraw={'x':0,'y':0};
	 this.MouseDownOrgCenter=this.DrCenter;
	 this.MouseDownOrgOffset=this.OffsetIntoDraw;
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
	  let hy=loc.y-this.OffsetIntoDraw.y;
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

	   if(this.OffsetIntoDraw.zm<ZOOM_MIN_LIMIT)
		   {
		    this.OffsetIntoDraw.zm=ZOOM_MIN_LIMIT;
			this.DRCenter.x=this.Draw_wd/2;
			this.DRCenter.y=this.Draw_ht/2;
			loc=this.DRCenter;
           }

	
	   //We must use DR Center to calculate
	   //We want DRcenter=dispcenter...

	   loc.x-=this.Display_wd/(2*this.OffsetIntoDraw.zm);
	   loc.y-=this.Display_ht/(2*this.OffsetIntoDraw.zm);

	   this.OffsetIntoDraw.x=Math.round(loc.x);
	   this.OffsetIntoDraw.y=Math.round(loc.y);

	   this.DrawCanToDispCan(loc);
	   console.log('SB Center ['+loc.x.toString()+','+loc.y.toString()+']');

	 }
	 DragStart(loc)
	 {
     this.MouseDownInDraw=this.DispCanToDrawCan(loc);
	 this.MouseDownOrgCenter=this.DrCenter;
	 this.MouseDownOrgOffset=this.OffsetIntoDraw;
	 }

	 DragMove(loc)
	 {
		 let cp=this.DispCanToDrawCan(loc);
		 let dx=(cp.x-this.MouseDownInDraw.x);
		 let dy=(cp.y-this.MouseDownInDraw.y);
		 this.OffsetIntoDraw.x=this.MouseDownOrgOffset.x-dx;
		 this.OffsetIntoDraw.y=this.MouseDownOrgOffset.y-dy;
		 this.DrCenter.x=this.MouseDownOrgCenter.x-dx;
		 this.DrCenter.y=this.MouseDownOrgCenter.y-dy;
	 }

	 DragEnd(loc)
	 {
      }

	 MouseEdgeTest(wloc)
	 {
	  if(wloc.x<10) {this.DrCenter.x-=2; this.OffsetIntoDraw.x-=2; };
	  if(wloc.y<10) {this.DrCenter.y-=2; this.OffsetIntoDraw.y-=2; };
	  if((wloc.x+10)>=this.Display_wd){this.DrCenter.x+=2; this.OffsetIntoDraw.x+=2; };
	  if((wloc.y+10)>=this.Display_ht){this.DrCenter.y+=2; this.OffsetIntoDraw.y+=2; };
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
		ictx.font = '36px Palatino';
		ictx.textAlign = 'center';
		ictx,textBaseline = 'middle';
	
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
			if(pMouseLeft!=null)
			{
			  ZoomObj.MouseEdgeTest(pMouseLeft);

			}
       	
		}
		var handleScroll = function(evt)
		{
				var delta = evt.wheelDelta ? evt.wheelDelta/40 : evt.detail ? -evt.detail : 0;
				if ((delta) && (ZoomObj!=undefined)) ZoomObj.Zoom(delta,evt.x,evt.y);
				return evt.preventDefault() && false;
		};
		
		canvas.addEventListener('DOMMouseScroll',handleScroll,false);
		canvas.addEventListener('mousewheel',handleScroll,false);
		canvas.addEventListener('contextmenu',
					function (e)
								{
									e.stopPropagation();
									e.preventDefault();
									return true;
								}
		);

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

	bgctx.clearRect(0,0,bgctx.canvas.width,bgctx.canvas.height);
	drawGrid(bgctx,GRID_LINE_COLOR , 12, 12);
	data_show.drawBase(bgctx,OffsetCenter.x,OffsetCenter.y);


	bgctx.beginPath();
	bgctx.strokeStyle= 'rgba(0,255,0,1.0)';
	bgctx.arc(os_bgcanvas.width/2,os_bgcanvas.height/2,10,0,2*Math.PI);
	bgctx.stroke();



	ZoomObj=new ScalingObject(canvas,os_canvas);
	canvas.onmousedown = CanvasMouseDown;
	canvas.onmousemove = CanvasMouseMove;
	canvas.onmouseup   = CanvasMouseUp;
	canvas.onmouseleave= CanvasMouseLeave;
	canvas.onmouseenter= CanvasMouseEnter;



data_display=data_show;
}

function basedraw(ctx)
{
if(data_display==undefined) return;
let osctx = os_canvas.getContext('2d');

osctx.clearRect(0,0,osctx.canvas.width,osctx.canvas.height);
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
      { x: 13.5, y: 13.5, w: 48, h: 48  , t:'P','ft':'Path', 'cur':'crosshair'},
      { x: 13.5, y: 71.5, w: 48, h: 48  , t:'W','ft':'Wall','cur':'crosshair'},
      { x: 13.5, y: 129.5, w: 48, h: 48 , t:'F','ft':'Feature','cur':'default'},
      { x: 13.5, y: 187.5, w: 48, h: 48 , t:'M','ft':'Meas','cur':'crosshair'},
      { x: 13.5, y: 245.5, w: 48, h: 48 , t:'X','ft':'Delete','cur':'pointer'},
      { x: 13.5, y: 303.5, w: 48, h: 48 , t:'D','ft':'Drag','cur':'move'},
      { x: 13.5, y: 361.5, w: 48, h: 48 , t:'S','ft':'Split','cur':'row-resize'},
      { x: 13.5, y: 419.5, w: 48, h: 48 , t:'?','ft':' ','cur':'default'},
      { x: 13.5, y: 477.5, w: 48, h: 48 , t:'?','ft':' ','cur':'default'},
      { x: 13.5, y: 477.5, w: 48, h: 48 , t:'C','ft':'Curve','cur':'default'}
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
		   TheSelectedAction=rect.t;
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
	   context.font = '36px Palatino';
	   context.strokeText(rect.t, rect.x + rect.w/2,rect.y + rect.h/2 + 5);
	   context.font = '12px Arial';
	   context.strokeText(rect.ft, rect.x + rect.w/2,rect.y + rect.h - 5);
	   context.restore();
	
	   });
}




function CanvasMouseDown(e)
{
	x = e.x || e.clientX,
	y = e.y || e.clientY,
	loc = windowToCanvas(canvas, x, y);
	bMouseIsDown=true;
	 switch (event.which) {
	 case 1:
			{
				loc=ZoomObj.DispCanToDrawCan(loc);
				data_display.mousedown(e,loc,TheSelectedAction);
				bIOwnMouse=false;
			}
            break;
     case 2://Middle
	 case 3://Right
			{bIOwnMouse=true;
			ZoomObj.DragStart(loc);
			 return e.preventDefault() && false;
			}

            break;
	 }


}

function CanvasMouseUp(e)
{
	x = e.x || e.clientX,
	y = e.y || e.clientY,
	loc = windowToCanvas(canvas, x, y);
	bMouseIsDown=false;

	if(bIOwnMouse)
		{
		ZoomObj.DragEnd(loc);
	    e.stopPropagation();
        e.preventDefault();
        bIOwnMouse=false;
		}
	else
		{
	     loc=ZoomObj.DispCanToDrawCan(loc);
         data_display.mouseup(e,loc,TheSelectedAction);
	    }

}

function CanvasMouseMove(e)
{
var	x = e.x || e.clientX,
	y = e.y || e.clientY,
	wloc = windowToCanvas(canvas, x, y);
	if(bIOwnMouse)
		{
		ZoomObj.DragMove(wloc);
		e.preventDefault();
		}
	else
	    {
		loc=ZoomObj.DispCanToDrawCan(wloc);
		data_display.mousemove(e,loc,TheSelectedAction);
	    }

}


function CanvasMouseLeave(e)
{

	if(!bMouseIsDown) return;
var	x = e.x || e.clientX,
	y = e.y || e.clientY,
	wloc = windowToCanvas(canvas, x, y);
 	ZoomObj.MouseEdgeTest(wloc);
	pMouseLeft=wloc;
}

function CanvasMouseEnter(e)
{

	if(!bMouseIsDown) return;
	pMouseLeft=null;
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
			   data_display.NewMenuSelect(rect.t);
			   canvas.style.cursor=rect.cur;
			 }
		});
	}

