const pptxgen = require('pptxgenjs');
const pptx = new pptxgen();
pptx.layout = 'LAYOUT_WIDE';
pptx.author = 'Atharva Mete';
pptx.title = 'AarogyamCare AI — Project Update';
pptx.subject = 'Manager follow-up';
pptx.company = 'AarogyamCare AI';
pptx.defineSlideMaster({
  title: 'MASTER',
  background: { color: 'F8FAFC' },
  objects: [
    { rect: { x:0, y:0, w:13.333, h:0.11, fill:{color:'14B8A6'}, line:{color:'14B8A6'} } },
    { text: { text:'AarogyamCare AI', options:{x:0.55,y:7.1,w:3,h:0.16,fontSize:8,color:'64748B',margin:0} } },
    { text: { text:'Project follow-up', options:{x:10.5,y:7.1,w:2.2,h:0.16,fontSize:8,color:'64748B',align:'right',margin:0} } }
  ],
  slideNumber: { x:12.78, y:7.08, color:'64748B', fontSize:8 }
});
const C={navy:'0F172A',teal:'0D9488',blue:'2563EB',green:'059669',slate:'475569',pale:'E2E8F0',white:'FFFFFF',light:'F0FDFA',amber:'D97706'};
function title(s,t,sub=''){s.addText(t,{x:.65,y:.45,w:12,h:.4,fontSize:25,bold:true,color:C.navy,margin:0});if(sub)s.addText(sub,{x:.65,y:.98,w:12,h:.24,fontSize:11,color:C.slate,margin:0});}
function bullets(s,items,x,y,w,h,size=15){s.addText(items.map((v,i)=>({text:v,options:{bullet:{indent:18},hanging:4,breakLine:i<items.length-1}})),{x,y,w,h,fontSize:size,color:C.navy,paraSpaceAfterPt:10,margin:.03,valign:'top'});}
function card(s,x,y,w,h,head,body,color=C.teal){s.addShape(pptx.ShapeType.roundRect,{x,y,w,h,rectRadius:.06,fill:{color:'FFFFFF'},line:{color:C.pale}});s.addShape(pptx.ShapeType.rect,{x,y,w,h:.1,fill:{color},line:{color}});s.addText(head,{x:x+.25,y:y+.35,w:w-.5,h:.25,fontSize:18,bold:true,color,margin:0});s.addText(body,{x:x+.25,y:y+.9,w:w-.5,h:h-1.1,fontSize:12.5,color:C.slate,margin:0,breakLine:false});}
function metric(s,x,value,label,color){s.addShape(pptx.ShapeType.roundRect,{x,y:5.1,w:2.65,h:.9,rectRadius:.06,fill:{color:'FFFFFF'},line:{color:C.pale}});s.addText(value,{x:x+.1,y:5.25,w:2.45,h:.25,fontSize:20,bold:true,color,align:'center',margin:0});s.addText(label,{x:x+.1,y:5.62,w:2.45,h:.14,fontSize:9,color:C.slate,align:'center',margin:0});}// Slide 6: validation
{
 const s=pptx.addSlide('MASTER'); title(s,'Demonstration and validation','The live development app was checked from the browser and through the API.');
 s.addShape(pptx.ShapeType.roundRect,{x:.75,y:1.55,w:4.15,h:4.6,rectRadius:.06,fill:{color:'F0FDFA'},line:{color:'99F6E4'}});
 s.addText('Validation summary',{x:1.1,y:1.95,w:3.3,h:.3,fontSize:21,bold:true,color:C.teal,margin:0});
 s.addText('✓  Frontend served successfully\n✓  Express API running on port 3000\n✓  Local CORS support added for browser testing\n✓  Gemini chat verified with HTTP 200 response\n✓  TypeScript production build completes',{x:1.1,y:2.65,w:3.2,h:2.1,fontSize:14,color:C.navy,breakLine:false,margin:0});
 s.addShape(pptx.ShapeType.roundRect,{x:5.35,y:1.55,w:6.95,h:4.6,rectRadius:.06,fill:{color:'FFFFFF'},line:{color:C.pale}});
 s.addText('Current chat experience',{x:5.75,y:1.95,w:4,h:.28,fontSize:21,bold:true,color:C.blue,margin:0});
 s.addText('• Full-width conversation area\n• Clear-chat control\n• Direct message input\n• Persistent chat state\n• Friendly error states\n• Healthcare information disclaimer',{x:5.75,y:2.7,w:5.8,h:2,fontSize:16,color:C.navy,breakLine:false,margin:0});
 s.addShape(pptx.ShapeType.roundRect,{x:5.75,y:5.05,w:4.05,h:.42,rectRadius:.08,fill:{color:C.green},line:{color:C.green}});s.addText('Validated locally',{x:5.75,y:5.16,w:4.05,h:.12,fontSize:10,bold:true,color:C.white,align:'center',margin:0});
}
// Slide 7: next steps
{
 const s=pptx.addSlide('MASTER'); title(s,'Current scope and recommended next steps','The chat MVP is working; backend expansion is the primary next delivery area.');
 card(s,.75,1.6,5.75,4.65,'Current status','• UI and navigation are complete for planned product areas.\n\n• Gemini-backed chat is live through the Express backend.\n\n• Local session fallback supports product walkthroughs.\n\n• Reports, image analysis, profiles and appointments still need their corresponding backend APIs.',C.teal);
 card(s,6.85,1.6,5.75,4.65,'Recommended next steps','• Implement secure APIs for auth, health profiles, reports and appointments.\n\n• Add user storage, validation, audit logging and a production CORS policy.\n\n• Enable secure image/report upload and Gemini multimodal analysis.\n\n• Deploy frontend and API with managed environment secrets.',C.blue);
}
pptx.writeFile({ fileName: 'AarogyamCareAI_Project_Update.pptx' });