"""Original vector landscape and line icons. No museum imagery is used."""
from pathlib import Path
import json
from PIL import Image, ImageDraw
ROOT=Path(__file__).resolve().parents[1]/'frontend/src/static'
ICONS=ROOT/'icons'
ICONS.mkdir(parents=True,exist_ok=True)
COLORS={'paper':'#FBF5E9','sand':'#E8D6AE','sun':'#DFC896','far':'#B9BEA7','mid':'#839482','near':'#536F60','ink':'#354D43','red':'#982B28','muted':'#75604B'}
landscape='''<svg xmlns="http://www.w3.org/2000/svg" width="1440" height="680" viewBox="0 0 1440 680"><defs><linearGradient id="paper"><stop stop-color="{paper}"/><stop offset="1" stop-color="{sand}"/></linearGradient><linearGradient id="fog" x2="0" y2="1"><stop stop-color="{paper}" stop-opacity="0"/><stop offset="1" stop-color="{paper}"/></linearGradient><linearGradient id="water" x2="1" y2="1"><stop stop-color="{paper}"/><stop offset="1" stop-color="{sand}"/></linearGradient></defs><rect width="1440" height="680" fill="url(#paper)"/><circle cx="1190" cy="155" r="70" fill="{sun}" opacity=".55"/><g fill="{far}"><path d="M425 485L569 349Q590 310 604 345L656 369 701 258Q731 208 756 270L824 336 865 286 910 362 966 246Q1002 169 1031 249L1113 333 1188 217Q1220 160 1241 217L1351 297 1440 201V680H425Z"/><path d="M741 398 797 228Q824 160 842 213L876 272 936 336 954 366V680H741Z" opacity=".35"/></g><g fill="{mid}"><path d="M500 609 650 472 729 508 802 397Q823 358 846 402L910 462 958 350Q978 299 1002 352L1070 455 1160 359Q1182 326 1200 363L1281 404 1338 330Q1355 297 1372 338L1440 425V680H500Z"/><path d="M956 541 1015 460 1055 405Q1070 389 1085 416L1128 482 1248 488 1440 572V680H956Z" opacity=".45"/></g><path d="M0 546Q332 561 569 497T995 539Q1210 571 1440 475V680H0Z" fill="url(#fog)"/><path d="M0 680Q371 532 803 623T1440 591V680Z" fill="url(#water)"/><path d="M0 680 854 645 966 594 1020 605 1110 537 1143 521 1178 578 1313 607 1440 551V680Z" fill="{near}" opacity=".77"/><g fill="none" stroke="{ink}" stroke-width="2" opacity=".17"><path d="m959 254 48 86-32 80m213-179 39 47-12 47m-401-59 35 70-14 40m-60 61 24-16 26 5m142 66 30-22 18 5m162-98 33-21 42 13"/><path d="M419 641q224-24 377 13m-156-17q117-15 173 1m93-74q58-19 110-8m-611 47q120-29 239-21"/></g><g fill="none" stroke="{ink}" stroke-width="3" opacity=".7"><path d="m1284 648-12-140m8 71-59-35m54 13 47-31m-52 7-25-26m26 81 65-23"/><path d="m1220 545 42-7-27-12m54 0 41-9-29-8m-12 58 54-9-34-12"/></g><g fill="{ink}" opacity=".65"><path d="m998 610 33-14 29 10h-59Zm8 0h40v16h-40Z"/><path d="m1051 625 22-10 23 7h-40Zm7-1h29v12h-29Z"/></g></svg>'''
(ROOT/'landscape.svg').write_text(landscape.format(**COLORS),encoding='utf-8')
river='''<svg xmlns="http://www.w3.org/2000/svg" width="600" height="360" viewBox="0 0 600 360"><rect width="600" height="360" fill="{paper}"/><circle cx="490" cy="75" r="45" fill="{sun}" opacity=".6"/><path d="M0 265 61 178 102 205 156 101 197 161 229 115 303 217 356 164 419 240 464 142 501 194 563 84 600 111V360H0Z" fill="{far}"/><path d="M0 329 97 245 132 273 198 201 250 263 301 235 375 318 447 252 500 289 568 215 600 241V360H0Z" fill="{mid}" opacity=".6"/><path d="M0 360Q208 273 365 317T600 277V360Z" fill="{paper}" opacity=".8"/><path d="M0 351q224-33 412-3" stroke="{sand}" fill="none"/></svg>'''
(ROOT/'river.svg').write_text(river.format(**COLORS),encoding='utf-8')
shapes={
'home':[('line',[(3,11),(12,3),(21,11)]),('line',[(5,10),(5,21),(19,21),(19,10)]),('line',[(10,21),(10,15),(14,15),(14,21)])],
'people':[('ellipse',(8,3,16,11)),('line',[(4,21),(4,18),(6,15),(9,13),(15,13),(18,15),(20,18),(20,21)])],
'timeline':[('line',[(6,3),(6,21)]),('ellipse',(3.5,4,8.5,9)),('ellipse',(3.5,15,8.5,20)),('line',[(12,6),(21,6)]),('line',[(12,17),(21,17)]),('line',[(12,10),(17,10)])],
'bookmark':[('line',[(6,3),(18,3),(18,21),(12,17),(6,21),(6,3)])],
'pin':[('ellipse',(5,2,19,16)),('ellipse',(10,7,14,11)),('line',[(7,14),(12,22),(17,14)])],
'graph':[('line',[(6,7),(18,7),(12,19),(6,7)]),('ellipse',(3,4,9,10)),('ellipse',(15,4,21,10)),('ellipse',(9,16,15,22))],
'book':[('line',[(12,5),(7,3),(3,3),(3,20),(8,20),(12,22),(16,20),(21,20),(21,3),(17,3),(12,5),(12,22)])],
'search':[('ellipse',(3,3,16,16)),('line',[(15,15),(21,21)])]}
for name,parts in shapes.items():
    elements=[]
    for kind,points in parts:
        if kind=='line':elements.append('<polyline points="'+ ' '.join(f'{x},{y}' for x,y in points)+'"/>')
        else:
            x1,y1,x2,y2=points;elements.append(f'<ellipse cx="{(x1+x2)/2}" cy="{(y1+y2)/2}" rx="{(x2-x1)/2}" ry="{(y2-y1)/2}"/>')
    (ICONS/(name+'.svg')).write_text('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="'+COLORS['muted']+'" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">'+''.join(elements)+'</svg>',encoding='utf-8')
    if name not in ['home','people','timeline','bookmark']:continue
    for active in [False,True]:
        canvas=Image.new('RGBA',(243,243),(0,0,0,0));draw=ImageDraw.Draw(canvas);color=COLORS['red' if active else 'muted'];scale=243/24
        for kind,points in parts:
            if kind=='line':draw.line([(round(x*scale),round(y*scale)) for x,y in points],fill=color,width=15,joint='curve')
            else:draw.ellipse(tuple(round(x*scale) for x in points),outline=color,width=15)
        canvas.resize((81,81),Image.Resampling.LANCZOS).save(ICONS/(name+('-active' if active else '')+'.png'))
print('Original landscape and icons generated.')
