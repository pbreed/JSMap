


function RunButtonsVis(b)
{
	var divs = document.getElementsByClassName('RunButtons');
	for (var i = 0, l = divs.length; i < l; i++)
	{
	if(b)
		divs[i].style.visibility = 'visible';
	else
		divs[i].style.visibility = 'hidden';
	}

}



const KEY_START =(250);
const KEY_ESCAPE =(249);
const ELEMENT_DESCRIBE =(99);
const KEY_DESCRIBE     =(98);
const KEY_EVENTN       =(97);
const KEY_MESSAGE      =(96);

var Parse32 = function (val , o ) {
   if(val & 0x80)
       {
         o.i=(o.i<<7)|(val & 0x7F);
         return false;
        }
   else
        {
        o.i=(o.i<<7)|(val & 0x7F);
        return true;
        }
}

var ParseString= function (val, o)
 {
  if(val>0)
      {o.s=o.s+String.fromCharCode(val);
       return false;
      }
   return true;
 }


class Parser {

	constructor()
	{
		this.state=0;
		this.AccumlatedThings=[];
		this.AccumlatedData=[];
		this.DataCount=0;
		this.ObjDescription=[];

	}


DispatchMessage(val)
{

if(!this.omsg) this.omsg= {'s':''};

if(ParseString(val,this.omsg))
 {
	if(this.omsg.s.length>0)
		{this.AccumlatedThings.push({'message':this.omsg.s});
	     //console.log('Message'+ this.omsg.s+'\n');
	    }
    this.omsg.s='';
 }
}

DispatchEvent(val)
{
if (val==-1)
  {
	  this.AccumlatedThings.push({'event':true});
//	  console.log('Event\n');
  }
}


ParseField(pObj, val)
{
var field;

if(this.pf_state==undefined) this.pf_state=0;

if(pObj==undefined) return false;

 if(val==-1)
 {
  this.pf_field={'s':'', 'i':0, 'name':'','vtype':'?'};
  this.pf_state=0;
 }
 else
 {
  switch(this.pf_state)
  {
  case 0:
      if(val==ELEMENT_DESCRIBE) this.pf_state++;
      break;

  case 1:
      if(ParseString(val,this.pf_field))
      {
	   this.pf_field.name=this.pf_field.s;
       this.pf_state++;
      }
      break;
  case 2:
       this.pf_field.vtype=String.fromCharCode(val);
       this.pf_state++;
      break;
  case 3:
      if(Parse32(val,this.pf_field))
	  {
		this.pf_field.offset=this.pf_field.i;
		this.pf_field.i=0;
          this.pf_state++;
	  }
      break;
  case 4:
      if(Parse32(val,this.pf_field))
         {
		  this.pf_field.len=this.pf_field.i;
		  this.pf_state++;
		  pObj.field.push(this.pf_field);
//		  console.log('push this.pf_field');
          return true;
          }
      break;
  case 5:
      if(val==ELEMENT_DESCRIBE)
      {
         this.pf_state=1;
		 this.pf_field={'s':'', 'i':0, 'name':'','vtype':'?'};
      }
  }
 }
 return false;
}

//
//  LogRaw32(pDesc->KeyValue); ///Key
//  LogRaw32(pend-pstart);//Len
//  const char * cp=m_name;
//    while(*cp)
//        LogRawByte(*cp++);
//    LogRawByte(0);
DispatchDescribe(val)
{


if(this.d_state==undefined) this.d_state=0;


if(val==-1)
{
   if(this.pObj)
       {
	   if(!this.ObjectDescriptionMap) this.ObjectDescriptionMap=new Map();;
	   this.ObjectDescriptionMap.set(this.pObj.key,this.pObj);
//	   console.log('Doing save description\n');
       }

   this.pObj={'i':0, 's':'', 'key':0, 'len':0, 'field':[]};
   this.d_state=0;
   return;
}
else
{
 if(!this.pObj)
 {
	 this.pObj={'i':0, 's':'', 'key':0, 'len':0, 'field':[]};
 }

 if(this.pObj)
 {
 switch (this.d_state)
 {
 case 0:
 if (Parse32(val,this.pObj))
	 {
	 this.pObj.key=this.pObj.i;
	 this.pObj.i=0;
	 this.d_state=1; }
 break;
 case 1:
 if (Parse32(val,this.pObj))
     {this.pObj.len=(this.pObj.i)*4;
	  this.pObj.i=0;
      this.d_state=2;
     }
 break;
 case 2:
     {
        if(ParseString(val,this.pObj))
            {
			 this.pObj.name=this.pObj.s;
             this.d_state=3;
             this.ParseField(this.pObj,-1);
            }
     }
   break;
 case 3: //Parsing individual fields
        this.ParseField(this.pObj,val);
     break;

 }
 }
 else
 {
   //printf("Trying to dispatch null object state=%d obj=%p\n",state,pObj);
 }
}
}




 DispatchProcess(id, value)
{
	
	if(!this.dp_blen) this.dp_blen=0;
	if(!this.dp_otint) this.dp_otint=({'i':0});
	if(!this.dp_ObjBuffer) this.dp_ObjBuffer= new DataView(new ArrayBuffer(500));

//	if(this.rawd==undefined) this.rawd='R:';

switch(id)
    {
 case KEY_MESSAGE:
    this.DispatchMessage(value);
    break;

 case KEY_EVENTN:
    this.DispatchEvent(value);
    break;

case KEY_DESCRIBE:
	this.DispatchDescribe(value);
    break;

default:
	{
	

     if(value==-1)
     {


        if(id)
         {
			var pO=this.ObjectDescriptionMap.get(id);
         if(pO)
           {
			 var v={'name':pO.name};
			 var val=-1;
             var dataView = this.dp_ObjBuffer;
			 val=0;
			
/*			if(pO.name=='IMUReportObj')
			{
            var rsp='Data[';
			 for (let nn=0; nn<32; nn++)
		     {
		      let vc=dataView.getUint8(nn);
			  if(vc<10) rsp+='0';
			  rsp+=vc.toString(16)+',';
			 }

			 console.log(rsp);
			 console.log(this.rawd);
			}
*/			
             for (let f of pO.field)
		     {
				switch (f.vtype)
				{
				case 's':
					 switch(f.len)
						{
						 case 1:val=dataView.getInt8(f.offset);break;
						 case 2:val=dataView.getInt16(f.offset);break;
					     case 4:val=dataView.getInt32(f.offset);break;
					   }
					break;
				case 'u':
					switch(f.len)
						{
						 case 1:val=dataView.getUint8(f.offset); break;
						 case 2:val=dataView.getUint16(f.offset); break;
					     case 4:val=dataView.getUint32(f.offset); break;
					   }
					break;
				case 'f':
    				switch(f.len)
						{
						 case 4:val=dataView.getFloat32(f.offset); break;
					     case 8:val=dataView.getFloat64(f.offset); break;
					   }
					break;
				default:val='?';
				}
				v[f.name]=val;
			 }
		     this.AccumlatedData.push(v);

           }
          else
           {
             console.log('Unknown object ID '+id.toString()+' \n');
           }
         }
       this.dp_blen=0;
       this.dp_otint.i=0;
//	   this.rawd='R:';
     }
     else
     {
  /*     if((value>0) && (value<10))
		   this.rawd+='0';
	    this.rawd+=value.toString(16)+',';
  */
		 if(Parse32(value,this.dp_otint))
         {
			 this.dp_ObjBuffer.setUint32(this.dp_blen,this.dp_otint.i);
			 this.dp_blen+=4;


             //this.dp_ObjBuffer[this.dp_blen++]=((this.dp_otint.i >>24) &0xFF);
             //this.dp_ObjBuffer[this.dp_blen++]=((this.dp_otint.i >>16) &0xFF);
            // this.dp_ObjBuffer[this.dp_blen++]=((this.dp_otint.i >>8) &0xFF);
            // this.dp_ObjBuffer[this.dp_blen++]=((this.dp_otint.i) &0xFF);
          this.dp_otint.i=0;
         }
     }
	}//default
   }//switch
 }




RawProcess(v)
  {
	  if(v==-1) //Start
	  {
		  this.DispatchProcess(this.id_state,-1);
		  this.id_state=-1;
		  return false;
	  }
	  else
		  if(this.id_state==-1)
		  {
			//  console.log('ID'+v.toString()+'\n');
			  this.id_state=v;
			  return false;
		  }
		  else
	   this.DispatchProcess(this.id_state,v);
		  return false;
   }



parse_char(b)
  {
	  if(this.last_escape==undefined) this.last_escape=false;

	  if(b==KEY_START)
	  {
		  this.RawProcess(-1);
		  return;
	  }
	  else
		  if(b==KEY_ESCAPE)
	  {
       this.last_escape=true;
       return;
      }

	if(this.last_escape)
      {
       if(b==0) this.RawProcess(KEY_START);
       if(b==1) this.RawProcess(KEY_ESCAPE);
       this.last_escape=false;
	   return
      }

	this.RawProcess(b);

}

}


function setprog(width)
{
    var elem = document.getElementById("myBar");
        elem.style.width = width + '%';
}

function ReadFile()
{
  var input = document.getElementById('hidden_file');

  RunButtonsVis(false);

  var fr = new FileReader();
  fr.onload = function()
  {
	var start_Time=new Date();
    var data =new Uint8Array( fr.result);
    var arrayLength = data.length;
	var par=new Parser();
    var i=0;
	var mto=setInterval( function cb()
   {//interval function
	let endv=i+1000;
	
	if(endv>=arrayLength) endv=arrayLength;
	
	for(; i<endv; i++)
	{
	 par.parse_char(data[i]);
	}
	
	setprog(100*i/data.length);
	
	if(i==arrayLength)
	{
		var et=new Date();
		var t=et-start_Time;
		
		clearInterval(mto);
		RunButtonsVis(true);
		var flbut= document.getElementById('VisFileButton');
	    flbut.style.visibility = 'hidden';



		var car_show=new carshow(par.AccumlatedData,par.AccumlatedThings);
		adddata(car_show);

	}

	}//interval function
	,1);

  }


  fr.readAsArrayBuffer(input.files[0]);

}

class StartTheWorld {
	constructor()
	{
		startcanvas();
	}
}

