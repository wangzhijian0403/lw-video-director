export const fredDefaults={steps:['原料浸泡','蒸煮软化','捣制纸浆','抄纸成形','压榨脱水','晾晒成纸'],title:'造纸术的制作流程',accent:'#85c4c4',background:'#f5f3eb',highlight:3,speed:1};
export function validateFredProps(input){
  if(!input||typeof input!=='object'||Array.isArray(input))throw new Error('FredTalk 参数必须是对象');
  const p={...fredDefaults,...input};
  if(!Array.isArray(p.steps)||p.steps.length<3||p.steps.length>9||p.steps.some(s=>typeof s!=='string'||!s.trim()||Array.from(s).length>16))throw new Error('步骤须为3–9条，每条1–16字');
  if(typeof p.title!=='string'||Array.from(p.title).length>30)throw new Error('标题最多30字');
  if(!/^#[0-9a-f]{6}$/i.test(p.accent)||!/^#[0-9a-f]{6}$/i.test(p.background))throw new Error('颜色须为#RRGGBB');
  if(!Number.isFinite(p.speed)||p.speed<.5||p.speed>2||!Number.isInteger(p.highlight)||p.highlight<0||p.highlight>=p.steps.length)throw new Error('速度或高亮步骤超出范围');
  return {steps:p.steps.map(s=>s.trim()),title:p.title,accent:p.accent,background:p.background,highlight:p.highlight,speed:p.speed};
}
