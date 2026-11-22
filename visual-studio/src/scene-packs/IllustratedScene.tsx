/**
 * Three original, self-contained, layered vector illustration scenes.
 * No remote images, icons or fonts. The artwork, shapes and animation are LW-original.
 * Animation is deterministic and frame-driven for Remotion export.
 */
import React from 'react';
import {useCurrentFrame, useVideoConfig, interpolate} from 'remotion';

export type IllustrationId = 'ILLUS-STUDIO-01' | 'ILLUS-CITY-01' | 'ILLUS-NATURE-01';
export const illustrationIds: IllustrationId[] = ['ILLUS-STUDIO-01','ILLUS-CITY-01','ILLUS-NATURE-01'];
const clamp = (n: number) => Math.max(0, Math.min(1, n));
const easing = (n: number) => 1 - Math.pow(1 - clamp(n), 3);

const Studio: React.FC<{t:number; w:number; h:number}> = ({t}) => {
 const dx = Math.sin(t*0.5)*13, dx2 = Math.sin(t*0.65)*5;
 return <g>
  <defs>
   <linearGradient id="lw-studio-wall" x2="1" y2="1"><stop stopColor="#F5EDDD"/><stop offset=".64" stopColor="#DCE6E1"/><stop offset="1" stopColor="#B8C7C9"/></linearGradient>
   <linearGradient id="lw-studio-floor" y2="1"><stop stopColor="#D3C5B1"/><stop offset="1" stopColor="#8C9DA3"/></linearGradient>
   <linearGradient id="lw-studio-monitor" x2=".8" y2="1"><stop stopColor="#123C50"/><stop offset="1" stopColor="#207985"/></linearGradient>
   <radialGradient id="lw-studio-lamp"><stop stopColor="#FFD999" stopOpacity=".68"/><stop offset="1" stopColor="#FFD999" stopOpacity="0"/></radialGradient>
   <filter id="lw-studio-shadow" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="26"/></filter>
  </defs>
  <rect width="1920" height="1080" fill="url(#lw-studio-wall)"/>
  <path d="M0 750H1920V1080H0Z" fill="url(#lw-studio-floor)"/>
  <path d="M0 746H1920" stroke="#809899" strokeWidth="6" opacity=".35"/>
  <g transform={'translate('+dx2+' 0)'}>
   <rect x="1180" y="90" width="560" height="490" rx="9" fill="#F9F9F0" stroke="#648F98" strokeWidth="13"/>
   <rect x="1209" y="118" width="500" height="433" fill="#B6D4DC"/>
   <path d="M1209 475 Q1280 330 1428 386T1709 280V551H1209Z" fill="#7B9FA7"/>
   <path d="M1209 515Q1350 390 1480 448T1709 360V551H1209Z" fill="#466C7A"/>
   <circle cx="1595" cy="230" r="61" fill="#F7E1B8"/>
   <path d="M1455 118V550M1209 335H1709" stroke="#F9F9F0" strokeWidth="15"/>
   <path d="M1290 119L1480 552H1580L1390 119Z" fill="#FFFFFF" opacity=".19"/>
  </g>
  <path d="M1390 583L1798 590V1050L1641 1080L1420 952Z" fill="#637F7A" opacity=".14"/>
  <ellipse cx="950" cy="995" rx="800" ry="62" fill="#223D44" opacity=".16" filter="url(#lw-studio-shadow)"/>
  <path d="M315 695H1660L1715 736H270Z" fill="#DAB693"/>
  <path d="M280 732H1720V780H280Z" fill="#986A50"/>
  <path d="M380 770H425L399 1080H352ZM1545 770H1590L1635 1080H1590Z" fill="#755C4C"/>
  <rect x="680" y="330" width="700" height="420" rx="27" fill="#243A43" stroke="#E1D5BF" strokeWidth="15"/>
  <rect x="710" y="365" width="640" height="336" rx="10" fill="url(#lw-studio-monitor)"/>
  <rect x="740" y="394" width="576" height="278" rx="9" fill="#0F2E3A" opacity=".5"/>
  <g transform={'translate('+dx+' 0)'}>
   <path d="M762 590L878 502L990 558L1110 436L1320 569V702H762Z" fill="#2B8290" opacity=".7"/>
   <path d="M744 635L860 544L954 605L1094 504L1215 559L1340 458V701H744Z" fill="#77B5AD" opacity=".58"/>
   <circle cx="1186" cy="457" r="51" fill="#F7C78C"/>
  </g>
  <rect x="981" y="747" width="96" height="67" rx="6" fill="#566B70"/>
  <path d="M879 826H1180L1194 839H867Z" fill="#6B787A"/>
  <rect x="804" y="802" width="458" height="25" rx="12" fill="#D8CABC"/>
  <g transform={'translate('+(Math.sin(t*.8)*3)+' 0)'}>
   <path d="M525 342L645 188" stroke="#334C54" strokeWidth="21" strokeLinecap="round"/>
   <path d="M646 187L800 284" stroke="#334C54" strokeWidth="17" strokeLinecap="round"/>
   <circle cx="645" cy="188" r="27" fill="#C38359"/>
   <path d="M785 264L891 316L824 380L735 321Z" fill="#E2AB6E"/>
   <ellipse cx="829" cy="496" rx="165" ry="156" fill="url(#lw-studio-lamp)"/>
  </g>
  <path d="M430 752L545 619L690 694L642 760Z" fill="#F6EFE2" stroke="#C7B6A4" strokeWidth="6"/>
  <path d="M468 737L577 643M482 748L591 657" stroke="#89B3B1" strokeWidth="9" opacity=".8"/>
  <rect x="1380" y="660" width="178" height="92" rx="9" fill="#C16D51"/>
  <rect x="1390" y="636" width="164" height="29" rx="7" fill="#F0D5A2"/>
  <rect x="1420" y="614" width="117" height="22" fill="#79939A"/>
  <g transform={'translate(0 '+(Math.sin(t*1.15)*5)+')'}>
   <path d="M1620 646Q1590 544 1650 453" fill="none" stroke="#4C806E" strokeWidth="11" strokeLinecap="round"/>
   <path d="M1620 646Q1690 533 1726 494" fill="none" stroke="#3C7567" strokeWidth="10" strokeLinecap="round"/>
   <path d="M1650 526Q1595 498 1610 468Q1655 463 1650 526Z" fill="#4A987C"/>
   <path d="M1710 544Q1717 497 1765 493Q1764 536 1710 544Z" fill="#397B69"/>
   <path d="M1611 591Q1550 572 1557 538Q1601 535 1611 591Z" fill="#7AB291"/>
  </g>
  <path d="M1592 648H1699L1675 740H1617Z" fill="#B8795E"/>
  <rect width="1920" height="1080" fill="#1B3742" opacity=".05"/>
 </g>;
};

const City: React.FC<{t:number}> = ({t})=>{
 const drift = Math.sin(t*.36)*13;
 const windows = Array.from({length:130},(_,i)=>{const x=240+(i%26)*55;const y=320+Math.floor(i/26)*88;return {x,y,lit:((i*13+7)%9)<6}});
 return <g>
  <defs>
   <linearGradient id="lw-city-night" x2="0" y2="1"><stop stopColor="#091B2F"/><stop offset=".6" stopColor="#17445C"/><stop offset="1" stopColor="#296E79"/></linearGradient>
   <linearGradient id="lw-city-water" x2="0" y2="1"><stop stopColor="#10344E"/><stop offset="1" stopColor="#07192A"/></linearGradient>
   <radialGradient id="lw-city-glow"><stop stopColor="#DDAE86" stopOpacity=".6"/><stop offset="1" stopColor="#DDAE86" stopOpacity="0"/></radialGradient>
  </defs>
  <rect width="1920" height="1080" fill="url(#lw-city-night)"/>
  <ellipse cx="1510" cy="235" rx="540" ry="380" fill="url(#lw-city-glow)" opacity=".36"/>
  <circle cx="1470" cy="202" r="72" fill="#FAD9AC" opacity=".93"/>
  <g fill="#DDEDF1" opacity=".7">{Array.from({length:29},(_,i)=><circle key={i} cx={(i*193+41)%1890} cy={((i*59+33)%300)+30} r={i%7===0?2.9:1.4}/>)}</g>
  <g transform={'translate('+drift+' 0)'} opacity=".4">
   <path d="M0 570V410H110V500H220V366H320V540H420V300H570V477H675V355H770V535H935V420H1015V570Z" fill="#476D7B"/>
   <path d="M970 580V450H1115V335H1196V479H1290V362H1410V502H1525V392H1662V505H1790V425H1920V590Z" fill="#456A78"/>
  </g>
  <path d="M0 600V420H175V590H276V355H435V593H535V269H711V590H830V328H982V600H1090V392H1240V600H1375V309H1577V590H1714V410H1920V652Z" fill="#122D40"/>
  <path d="M535 269L625 210L711 269M1375 309L1470 238L1577 309" fill="none" stroke="#396E84" strokeWidth="17"/>
  <path d="M619 210V153M1470 240V168" stroke="#E7BB8A" strokeWidth="8" strokeLinecap="round"/>
  {windows.filter(({x,y})=>x<1900&&y<590).map(({x,y,lit},i)=><rect key={i} x={x} y={y} width="20" height="34" rx="2" fill={lit?'#F2C58F':'#5B92A0'} opacity={lit?.82:.22}/>)}
  <path d="M0 640Q970 608 1920 650V1080H0Z" fill="url(#lw-city-water)"/>
  <g opacity=".5">
  {Array.from({length:28},(_,i)=>{const x=(i*111)%2050;const y=655+Math.floor(i/7)*93;return <rect key={i} x={x-80} y={y} width={55+(i%3)*52} height={3+(i%4)*2} rx="5" fill={i%3===0?'#F6B883':'#66C5CF'} opacity={.2+(i%4)*.1} transform={'translate('+(Math.sin(t*.9+i)*18)+' 0)'}/>})}
  </g>
  <g transform={'translate('+(Math.sin(t*.75)*10)+' 0)'}>
   <path d="M235 727Q850 650 1730 739" stroke="#B9D5CF" strokeWidth="4" opacity=".45" fill="none"/>
   <path d="M166 758L1906 816" stroke="#93AFB4" strokeWidth="12" opacity=".3"/>
   <path d="M390 770L840 787L775 799L360 782Z" fill="#E5AC79" opacity=".75"/>
  </g>
  <rect x="0" y="951" width="1920" height="129" fill="#071725" opacity=".5"/>
 </g>;
};

const Nature: React.FC<{t:number}> = ({t})=>{
 const dx=Math.sin(t*.32)*13;
 const cloudShift=t*11;
 return <g>
  <defs>
   <linearGradient id="lw-nature-sky" x2="0" y2="1"><stop stopColor="#C8DFDF"/><stop offset=".7" stopColor="#E9E4C6"/><stop offset="1" stopColor="#E5D2A6"/></linearGradient>
   <linearGradient id="lw-nature-river" x2="1" y2=".7"><stop stopColor="#BEE5E1"/><stop offset="1" stopColor="#3C8392"/></linearGradient>
   <radialGradient id="lw-nature-light"><stop stopColor="#FFF5BD" stopOpacity=".9"/><stop offset="1" stopColor="#FFF5BD" stopOpacity="0"/></radialGradient>
  </defs>
  <rect width="1920" height="1080" fill="url(#lw-nature-sky)"/>
  <circle cx="1423" cy="265" r="340" fill="url(#lw-nature-light)"/>
  <circle cx="1423" cy="265" r="91" fill="#F6D69D"/>
  <g fill="#FDF9E9" opacity=".66" transform={'translate('+(cloudShift%300-150)+' 0)'}>
   <ellipse cx="215" cy="214" rx="165" ry="30"/><ellipse cx="344" cy="229" rx="100" ry="25"/>
   <ellipse cx="1115" cy="153" rx="122" ry="24"/><ellipse cx="1225" cy="160" rx="90" ry="22"/>
  </g>
  <path d="M0 625L140 465L290 542L500 335L708 576L890 395L1110 567L1370 334L1540 476L1712 338L1920 591V1080H0Z" fill="#9ABBB8" opacity=".75" transform={'translate('+(-dx*.3)+' 0)'}/>
  <path d="M0 730L210 558L408 671L620 491L810 685L990 510L1240 653L1477 470L1720 695L1920 562V1080H0Z" fill="#719B99" transform={'translate('+(-dx*.6)+' 0)'}/>
  <path d="M0 814Q315 598 605 737T1238 685T1920 738V1080H0Z" fill="#487C77" transform={'translate('+(-dx)+' 0)'}/>
  <path d="M0 904Q275 754 670 858T1395 792T1920 852V1080H0Z" fill="#285F62"/>
  <path d="M1920 963Q1560 784 1220 890T566 899T0 1080H1920Z" fill="url(#lw-nature-river)" opacity=".94"/>
  <path d="M1760 1032Q1435 889 1174 956T690 1004" fill="none" stroke="#D7F2EA" strokeWidth="17" opacity=".33"/>
  <g>
   {Array.from({length:23},(_,i)=>{
     const x=i*91+(i%3)*22,y=780+(i%4)*38,s=.78+(i%3)*.24;
     return <g key={i} transform={'translate('+x+' '+y+') scale('+s+')'}>
      <path d="M0 80V12" stroke="#284F46" strokeWidth="9"/>
      <path d="M-30 37L0 -48L35 37Z" fill={i%3===0?'#2E7266':'#3E8875'}/>
      <path d="M-27 13L1 -68L30 13Z" fill={i%2?'#3E8676':'#477B68'}/>
     </g>})}
  </g>
  <g transform={'translate('+(Math.sin(t*.5)*3)+' 0)'}>
   <path d="M1390 786L1513 665L1670 790" fill="#D9B48A" stroke="#715A49" strokeWidth="14"/>
   <path d="M1430 772V907H1630V771" fill="#E6D4B6"/>
   <rect x="1505" y="825" width="60" height="82" rx="3" fill="#375E62"/>
   <rect x="1462" y="809" width="35" height="42" fill="#83B1AE"/>
   <path d="M1400 780L1513 678L1665 780" fill="none" stroke="#6F6558" strokeWidth="16"/>
  </g>
  <g stroke="#3B5E62" strokeWidth="5" strokeLinecap="round" fill="none" opacity=".6" transform={'translate('+(Math.sin(t*.8)*17)+' 0)'}>
   <path d="M1025 265q24 -30 48 0q24 -30 48 0"/><path d="M1120 237q18 -21 38 0q19 -21 38 0"/>
  </g>
 </g>;
};

export const IllustratedScene:React.FC<{id: IllustrationId;title?:string;subtitle?:string;intensity?:number}>=({
 id,title,subtitle,intensity=1,
})=>{
 if(!illustrationIds.includes(id)) throw new Error('Unknown illustration scene: '+id);
 const frame=useCurrentFrame(), {fps}=useVideoConfig();
 const t=frame/fps*Math.max(0,Math.min(3,intensity));
 const appear=easing(frame/(fps*.85));
 const titleY=interpolate(appear,[0,1],[48,0]);
 const dark=id==='ILLUS-CITY-01';
 const textColor=dark?'#F4E9D7':'#173848';
 return <div style={{position:'absolute',inset:0,overflow:'hidden',background:dark?'#07192A':'#E5E8E4'}}>
   <svg viewBox="0 0 1920 1080" preserveAspectRatio="xMidYMid slice" width="100%" height="100%" style={{position:'absolute',inset:0}}>
    {id==='ILLUS-STUDIO-01'?<Studio t={t} w={1920} h={1080}/>:id==='ILLUS-CITY-01'?<City t={t}/>:<Nature t={t}/>}
   </svg>
   {title?<div style={{
    position:'absolute',left:'4.5%',top:'8%',width:'47%',
    transform:'translateY('+titleY+'px)',opacity:appear,
    padding:'38px 46px',background:dark?'linear-gradient(90deg,#0D293FEA,#0D293F66)':'linear-gradient(90deg,#F6F0E9E8,#F6F0E988)',
    borderLeft:'8px solid '+(dark?'#E4A978':'#276F7A'),
    boxShadow:'0 20px 72px #0B253328',borderRadius:6,
   }}>
    <div style={{fontFamily:'"Microsoft YaHei","Noto Sans CJK SC",sans-serif',fontSize:Math.min(76,Math.max(38,1920/(Math.max(8,[...title].length)*.8))),fontWeight:800,lineHeight:1.22,letterSpacing:1.4,color:textColor}}>{title}</div>
    {subtitle?<div style={{color:dark?'#E5CBB3':'#376477',fontSize:32,letterSpacing:1,lineHeight:1.45,marginTop:20,fontWeight:500}}>{subtitle}</div>:null}
   </div>:null}
  </div>;
};
