# Vlastní ilustrace typů plesů (generováno kódem, bez fotografií). Spuštění: python3 tools/make_images.py
from PIL import Image,ImageDraw,ImageFilter
import math,random,os
W,H,S=1200,630,2
GOLD=(214,175,95);CREAM=(250,240,220)
PAL={'maturitni':((42,20,51),(122,31,75)),'hasicsky':((60,12,18),(170,45,35)),'myslivecky':((18,40,28),(70,95,50)),
'rybarsky':((10,30,55),(30,100,120)),'sportovni':((20,30,60),(40,90,150)),'reprezentacni':((30,15,40),(90,40,90)),
'skolni':((40,30,80),(200,90,110)),'spolkovy':((35,22,45),(120,50,80))}
def base(k):
    a,b=PAL[k];im=Image.new('RGB',(W*S,H*S));d=ImageDraw.Draw(im)
    for y in range(H*S):
        t=y/(H*S);d.line([(0,y),(W*S,y)],fill=tuple(int(a[i]+(b[i]-a[i])*t) for i in range(3)))
    bok=Image.new('RGBA',im.size,(0,0,0,0));bd=ImageDraw.Draw(bok);random.seed(k)
    for _ in range(45):
        x,y,r=random.randint(0,W*S),random.randint(0,H*S),random.randint(10,70)*S;bd.ellipse([x-r,y-r,x+r,y+r],fill=GOLD+(random.randint(12,35),))
    bok=bok.filter(ImageFilter.GaussianBlur(8*S));im=Image.alpha_composite(im.convert('RGBA'),bok)
    return im,ImageDraw.Draw(im)
cx,cy=W*S//2,H*S//2;L=6*S
def P(x,y):return (cx+x*S,cy+y*S)
def arc(d,x,y,r,a0,a1,w=L):d.arc([P(x-r,y-r),P(x+r,y+r)],a0,a1,fill=GOLD,width=w)
def ln(d,pts,w=L):d.line([P(*p) for p in pts],fill=GOLD,width=w,joint='curve')
def leaf(d,x,y,ang,l=40):
    a=math.radians(ang);ex,ey=x+l*math.cos(a),y+l*math.sin(a);n=math.radians(ang+90)
    mx,my=(x+ex)/2,(y+ey)/2;o=l*.28
    d.polygon([P(x,y),P(mx+o*math.cos(n),my+o*math.sin(n)),P(ex,ey),P(mx-o*math.cos(n),my-o*math.sin(n))],fill=GOLD)
def laurel(d,r=200):
    for s in(-1,1):
        arc(d,0,40,r,90 if s<0 else 0,180 if s<0 else 90,4*S) if False else None
        for i in range(9):
            t=math.radians(110+i*14);x,y=s*r*math.cos(t)*-1,40+r*math.sin(t)*-1
            x=s*r*math.sin(math.radians(i*15+20));y=60-r*math.cos(math.radians(i*15+20))*-.15-i*22
            leaf(d,x,y+120,(-60 if s>0 else -120)-i*5*s,46)
def maturitni(d):
    d.polygon([P(0,-120),P(220,-50),P(0,20),P(-220,-50)],fill=GOLD)
    d.polygon([P(-120,-10),P(120,-10),P(120,80),P(0,110),P(-120,80)],fill=GOLD)
    ln(d,[(150,-40),(150,90)],5*S);d.ellipse([P(138,85),P(162,130)],fill=GOLD)
    ln(d,[(-300,170),(-100,230),(100,170),(300,230)],10*S)
def hasicsky(d):
    d.chord([P(-170,-150),P(170,190)],180,360,fill=GOLD);d.rectangle([P(-230,15),P(230,45)],fill=GOLD)
    ln(d,[(0,-150),(0,15)],14*S);d.ellipse([P(-35,-80),P(35,-10)],outline=PAL['hasicsky'][0],width=6*S)
    for i,x in enumerate((-60,0,60)):d.polygon([P(x-25,200),P(x,120-(i%2)*40),P(x+25,200)],fill=GOLD)
def myslivecky(d):
    for s in(-1,1):
        ln(d,[(s*20,120),(s*60,40),(s*90,-60),(s*110,-170)],12*S)
        for (a,b) in(((60,40),(150,10)),((80,-20),(170,-60)),((95,-90),(60,-180)),((75,-10),(10,-80))):ln(d,[(s*a[0],a[1]),(s*b[0],b[1])],9*S)
    for i in range(6):leaf(d,-250+i*100,200,-90+(i%2)*30-15,55)
def rybarsky(d):
    d.ellipse([P(-170,-70),P(130,70)],fill=GOLD);d.polygon([P(110,0),P(220,-80),P(220,80)],fill=GOLD)
    d.ellipse([P(-120,-20),P(-90,10)],fill=PAL['rybarsky'][0])
    for k in range(3):
        pts=[(-320+x*8,150+k*35+12*math.sin(x/3)) for x in range(81)];ln(d,pts,5*S)
def sportovni(d):
    arc(d,0,-30,120,0,360,10*S);ln(d,[(-120,-30),(120,-30)],8*S);arc(d,0,-30,60,0,360,7*S) if False else None
    d.arc([P(-60,-150),P(60,90)],0,360,fill=GOLD,width=8*S);laurel(d,250)
def reprezentacni(d):
    ln(d,[(0,-240),(0,-130)],5*S);d.ellipse([P(-30,-150),P(30,-90)],fill=GOLD)
    for r,y in((220,-40),(140,30)):
        arc(d,0,y-80,r,20,160,7*S)
        for i in range(7):
            x=-r*.9+i*r*.3;d.polygon([P(x-10,y-5),P(x,y-50),P(x+10,y-5)],fill=GOLD);ln(d,[(x,y+5),(x,y+40)],3*S);d.ellipse([P(x-9,y+40),P(x+9,y+65)],fill=CREAM)
def skolni(d):
    for x,y,c in((-150,-60,GOLD),(0,-120,CREAM),(150,-50,(230,150,160))):
        d.ellipse([P(x-75,y-95),P(x+75,y+95)],fill=c);ln(d,[(x,y+95),(x+15*(x//150 or 1),y+170),(0,230)],3*S)
def spolkovy(d):
    for s in(-1,1):
        d.polygon([P(s*40,-160),P(s*160,-160),P(s*120,-10),P(s*70,-10)],fill=GOLD) if False else None
        g=[(s*20,-170),(s*150,-150),(s*110,-20),(s*45,-40)];d.polygon([P(*p) for p in g],fill=GOLD)
        ln(d,[(s*78,-30),(s*95,150)],9*S);ln(d,[(s*40,155),(s*150,145)],9*S)
    for i in range(12):a=math.radians(i*30);ln(d,[(55*math.cos(a),-215+55*math.sin(a)),(85*math.cos(a),-215+85*math.sin(a))],5*S)
for k,f in [(k,globals()[k]) for k in PAL]:
    im,d=base(k);f(d);im=im.convert('RGB').resize((W,H),Image.LANCZOS)
    p=f'img/typ/{k}.webp';im.save(p,'WEBP',quality=80,method=6);print(p,os.path.getsize(p)//1024,'KB')
