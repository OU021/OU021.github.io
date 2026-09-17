"""Generate original stochastic point illustrations. numpy and Pillow required.

The flower is illustrated from the owner's photograph, not reconstructed depth.
Baymax is fan art of the character from Disney's Big Hero 6.
"""
from pathlib import Path
import struct
import numpy as np
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / 'assets/scene'
PREVIEW = Path('/tmp/point-story')
OUT.mkdir(exist_ok=True); PREVIEW.mkdir(exist_ok=True)
N = 16_000
rng = np.random.default_rng(20260917)
LIGHT = np.array([-.48, .70, .67]); LIGHT /= np.linalg.norm(LIGHT)
BG = np.array([247, 244, 238])

def colorize(normals, color, variation=2, white=False):
    normals = np.asarray(normals)
    normals = normals / np.maximum(np.linalg.norm(normals, axis=1)[:, None], 1e-8)
    if white:
        lum = 139 + 46*np.clip(normals@LIGHT,0,1) + 12*np.abs(normals[:,2])
        c = lum[:, None] + np.array([7, 3, -3])
    else:
        shade = .73 + .27 * np.clip(normals @ LIGHT, 0, 1)
        c = np.broadcast_to(color, normals.shape) * shade[:, None]
    return np.clip(c + rng.normal(0, variation, (len(normals), 1)), 0, 255)

class Cloud:
    def __init__(self): self.p, self.c = [], []
    def add(self, p, normals, color, white=False):
        p = np.asarray(p); normals = np.broadcast_to(normals, p.shape)
        self.p.append(p); self.c.append(colorize(normals, color, white=white))
    def arrays(self): return np.concatenate(self.p), np.concatenate(self.c)

def random_sphere(n):
    p = rng.normal(size=(n, 3)); return p / np.linalg.norm(p, axis=1)[:, None]

def rounded_box(cloud, center, size, radius, color, n):
    """Random rounded-box surface samples, without rows or contour lattice."""
    size=np.array(size);half=size/2;core=half-radius
    weights=np.array([size[1]*size[2],size[0]*size[2],size[0]*size[1]])
    axes=rng.choice(3,n,p=weights/weights.sum())
    p=rng.uniform(-1,1,(n,3))*half
    p[np.arange(n),axes]=half[axes]*rng.choice([-1,1],n)
    q=np.clip(p,-core,core);normal=p-q;normal/=np.linalg.norm(normal,axis=1)[:,None]
    cloud.add(q+radius*normal+center,normal,color)

def barrel(cloud,z0,z1,r0,r1,color,n,center=(.02,-.03),rough=False):
    a=rng.uniform(0,2*np.pi,n);t=rng.uniform(0,1,n);r=r0+(r1-r0)*t
    if rough:r+=rng.normal(0,.004,n)
    p=np.column_stack((center[0]+r*np.cos(a),center[1]+r*np.sin(a),z0+(z1-z0)*t))
    normal=np.column_stack((np.cos(a),np.sin(a),np.full(n,-(r1-r0)/(z1-z0))))
    cloud.add(p,normal,color)

def ring(cloud,z,r0,r1,color,n,center=(.02,-.03)):
    a=rng.uniform(0,2*np.pi,n);r=np.sqrt(rng.uniform(r0*r0,r1*r1,n))
    cloud.add(np.column_stack((center[0]+r*np.cos(a),center[1]+r*np.sin(a),z+rng.normal(0,.001,n))),[0,0,1],color)

def dial(cloud,x,y,z,r,height,color,n):
    a=rng.uniform(0,2*np.pi,n);top=rng.random(n)<.55;rr=np.where(top,r*np.sqrt(rng.random(n)),r)
    p=np.column_stack((x+rr*np.cos(a),y+np.where(top,height,rng.uniform(0,height,n)),z+rr*np.sin(a)))
    normals=np.column_stack((np.cos(a),np.zeros(n),np.sin(a)));normals[top]=[0,1,0]
    cloud.add(p,normals,color)

def orientation(p,yaw=0,pitch=0):
    right=np.array([np.cos(yaw),0,-np.sin(yaw)])
    front=np.array([np.sin(yaw)*np.cos(pitch),np.sin(pitch),np.cos(yaw)*np.cos(pitch)])
    up=np.cross(front,right)
    return np.column_stack((p@right,p@up,p@front))

def build_camera():
    c=Cloud()
    rounded_box(c,[0,0,0],[3.3,1.83,.78],.19,[158,146,131],6000)
    rounded_box(c,[1.30,-.03,.44],[.51,1.6,.44],.15,[119,109,97],1000)
    rounded_box(c,[-.08,1.00,-.02],[1.04,.39,.67],.11,[167,157,141],650)
    rounded_box(c,[-.08,1.215,-.04],[.48,.07,.38],.025,[172,160,143],180)
    dial(c,1.18,.915,.1,.23,.14,[132,120,105],400)
    dial(c,1.22,1.06,.13,.115,.045,[176,164,147],160)
    dial(c,-1.04,.915,-.03,.27,.10,[148,135,117],360)
    barrel(c,.40,.56,.77,.83,[125,115,104],500)
    ring(c,.565,.71,.83,[176,163,143],300)
    barrel(c,.56,.78,.72,.72,[148,134,112],500)
    barrel(c,.76,1.1,.785,.785,[112,100,86],1700,rough=True)
    ring(c,1.105,.71,.80,[183,167,140],430)
    barrel(c,1.10,1.30,.80,.74,[152,134,107],700)
    ring(c,1.305,.56,.745,[117,102,86],1050)
    barrel(c,1.24,1.31,.555,.57,[89,81,72],230)
    a=rng.uniform(0,2*np.pi,1300);r=.553*np.sqrt(rng.random(1300))
    p=np.column_stack((.02+r*np.cos(a),-.03+r*np.sin(a),1.27-.055*(1-(r/.553)**2)))
    c.add(p,[0,0,1],[100,103,98]);ring(c,1.279,.25,.265,[162,150,127],140)
    rounded_box(c,[-.86,.49,.405],[.31,.15,.025],.011,[76,73,67],250)
    rounded_box(c,[.91,-.33,.425],[.1,.17,.05],.023,[178,161,138],150)
    p,col=c.arrays();idx=rng.choice(len(p),N,replace=False);p,col=p[idx],col[idx]
    p=orientation(p,.43,.23);p-=(p.min(0)+p.max(0))/2;p*=1.86/np.ptp(p[:,0])
    return p,col

def build_photo():
    image=np.asarray(Image.open(ROOT/'assets/photos/digital7.webp').convert('RGB'))
    x,y=np.meshgrid(np.arange(160),np.arange(100))
    u=(x.ravel()+rng.uniform(.02,.98,N))/160;v=(y.ravel()+rng.uniform(.02,.98,N))/100
    p=np.column_stack(((u-.5)*1.86,(.5-v)*1.24,np.zeros(N)))
    c=image[np.minimum((v*image.shape[0]).astype(int),image.shape[0]-1),np.minimum((u*image.shape[1]).astype(int),image.shape[1]-1)]
    return p,c

def build_flower():
    cloud=Cloud()
    for k in range(5):
        n=2400;s=rng.uniform(0,1,n);w=rng.uniform(-1,1,n)
        angle=2*np.pi*k/5+np.pi/2+[0,.07,-.04,.025,-.045][k];length=[.59,.56,.61,.55,.60][k]
        radial=.065+length*s;side=w*(.06+.176*np.sin(np.pi*s)**.72)
        z=.010+.12*np.sin(np.pi*s)+(.09+.025*k)*s*s+.060*np.sin(np.pi*s)*w*w
        z+=rng.choice([-1,1],n)*.008+rng.normal(0,.002,n)
        p=np.column_stack((radial*np.cos(angle)-side*np.sin(angle),radial*np.sin(angle)+side*np.cos(angle),z))
        normal=np.column_stack((np.full(n,-.18*np.cos(angle)),np.full(n,-.18*np.sin(angle)),np.ones(n)))
        cloud.add(p,normal,[188+6*(k%2),81+8*(k%2),74])
        cloud.c[-1]+=np.column_stack((12*s,-6*s,-7*s))
    stems=46;count=2300;stemid=np.arange(count)%stems
    angle=np.linspace(0,2*np.pi,stems,endpoint=False)+rng.uniform(-.04,.04,stems)
    tipradius=rng.uniform(.048,.146,stems);tipheight=rng.uniform(.18,.31,stems)
    t=rng.uniform(0,1,count);tips=rng.random(count)<.30;t[tips]=rng.uniform(.96,1,count)[tips]
    radius=.028*(1-t)+tipradius[stemid]*t
    p=np.column_stack((radius*np.cos(angle[stemid]),radius*np.sin(angle[stemid]),.035+tipheight[stemid]*t))
    p+=rng.normal(0,.0025,(count,3));c=np.tile([159,121,70],(count,1)).astype(float);c[tips]=[63,60,54]
    cloud.p.append(p);cloud.c.append(c)
    q=random_sphere(1000);cloud.add(q*np.array([.115,.115,.08])+[0,0,-.045],q,[123,116,81])
    t=rng.uniform(0,1,700);a=rng.uniform(0,2*np.pi,700)
    p=np.column_stack((.032*np.cos(a),-.025-.17*t+.018*np.sin(a),-.08-.08*t))
    cloud.add(p,np.column_stack((np.cos(a),np.sin(a),np.zeros(700))),[118,113,80])
    p,c=cloud.arrays();p=orientation(p,-.12,-.20);p[:,1]-=.015
    assert len(p)==N
    return p,np.clip(c,0,255)

def bezier(t,controls):
    t=np.asarray(t)[:,None];c=np.asarray(controls)
    return (1-t)**3*c[0]+3*(1-t)**2*t*c[1]+3*(1-t)*t*t*c[2]+t**3*c[3]

def arm_surface(t,a,controls):
    p=bezier(t,controls)
    tangent=bezier(np.minimum(t+.002,1),controls)-bezier(np.maximum(t-.002,0),controls)
    tangent/=np.linalg.norm(tangent,axis=1)[:,None]
    across=np.cross(tangent,np.tile([0,0,1.],(len(t),1)));across/=np.linalg.norm(across,axis=1)[:,None]
    front=np.cross(across,tangent)
    # Broad upper arms taper softly into the little inflatable hands.
    r=.129+.013*np.sin(np.pi*t)-.052*t**1.55
    normal=np.cos(a)[:,None]*across+np.sin(a)[:,None]*front
    return p+r[:,None]*normal,normal

def body_surface(q):
    u=q[:,1]
    p=q*np.array([.411,.505,.289])
    p[:,0]*=1-.255*u;p[:,2]*=1-.14*u;p[:,1]-=.001
    return p

def hand_surface(side):
    """A soft palm, three little fingers and an opposed thumb, in hand space."""
    sections=[];normals=[]
    q=random_sphere(350);sections.append(q*[.072,.070,.052]);normals.append(q)
    for finger in range(3):
        q=random_sphere(60)
        sections.append(q*[.021,.041,.027]+[(finger-1)*.035,-.060,.004])
        normals.append(q)
    q=random_sphere(70)
    sections.append(q*[.026,.042,.029]+[-side*.064,.001,.027]);normals.append(q)
    return np.concatenate(sections),np.concatenate(normals)

def hand_pose(p,center,turn=0,tilt=0):
    p=orientation(p,tilt,0)
    c,s=np.cos(turn),np.sin(turn)
    return np.column_stack((c*p[:,0]-s*p[:,1],s*p[:,0]+c*p[:,1],p[:,2]))+center

def build_baymax(flower):
    parts=[]
    q=random_sphere(6800);p=body_surface(q)
    parts.append(('torso',p,colorize(q,[0,0,0],white=True)))
    # The characteristic small, low oval sits directly on the sloping shoulders.
    q=random_sphere(1300);p=q*np.array([.192,.098,.126])+[0,.519,.038]
    parts.append(('head',p,colorize(q,[0,0,0],white=True)))
    for side in [-1,1]:
        q=random_sphere(700)
        p=q*np.array([.139,.159,.143])+[side*.158,-.508,-.011]
        # Slightly flatten the soles; most of each leg remains inside the belly.
        p[:,1]=np.maximum(p[:,1],-.653)
        parts.append((f'leg{side}',p,colorize(q,[0,0,0],white=True)))
    armparams=[]
    for side in [-1,1]:
        t=rng.uniform(0,1,1600);a=rng.uniform(0,2*np.pi,1600);armparams.append((t,a))
        controls=np.array([[.173,.270,.0],[.473,.197,.009],[.530,-.161,.06],[.487,-.381,.094]])
        controls[:,0]*=side
        p,n=arm_surface(t,a,controls)
        parts.append((f'arm{side}',p,colorize(n,[0,0,0],white=True)))
    handdirs=[]
    for side in [-1,1]:
        q,n=hand_surface(side);handdirs.append(q)
        p=hand_pose(q,[side*.485,-.422,.101],side*.09,side*.06)
        parts.append((f'hand{side}',p,colorize(n,[0,0,0],white=True)))
    # Small eyes linked by a fine line, on the front of the oval rather than a disk.
    for side in [-1,1]:
        a=rng.uniform(0,2*np.pi,160);r=.0106*np.sqrt(rng.random(160))
        x=side*.077+r*np.cos(a);y=.519+r*np.sin(a)
        z=.038+.126*np.sqrt(np.clip(1-(x/.192)**2-((y-.519)/.098)**2,0,1))+.018
        parts.append(('face',np.column_stack((x,y,z)),np.tile([27,25,23],(160,1))))
    x=rng.uniform(-.078,.078,180);y=.519+rng.uniform(-.00125,.00125,180)
    z=.038+.126*np.sqrt(np.clip(1-(x/.192)**2-((y-.519)/.098)**2,0,1))+.019
    parts.append(('face',np.column_stack((x,y,z)),np.tile([35,31,28],(180,1))))
    a=rng.uniform(0,2*np.pi,150);r=.0175+rng.normal(0,.0011,150)
    x=-.154+r*np.cos(a);y=.247+r*np.sin(a);u=(y+.001)/.505
    z=.289*(1-.14*u)*np.sqrt(np.clip(1-u*u-(x/(.411*(1-.255*u)))**2,0,1))+.0015
    parts.append(('port',np.column_stack((x,y,z)),np.tile([144,140,130],(150,1))))
    flower_count=N-sum(len(part[1]) for part in parts)
    q=random_sphere(flower_count);parts.append(('flower',body_surface(q),colorize(q,[0,0,0],white=True)))
    assert flower_count==1450,flower_count
    standing=(np.concatenate([p for _,p,_ in parts]),np.concatenate([c for _,_,c in parts]))
    chosen=rng.choice(N,flower_count,replace=False);fp,fc=flower[0][chosen],flower[1][chosen]
    posed=[]
    for pose in [1,2]:
        changed=[];arm_index=hand_index=0
        for name,p,c in parts:
            p=p.copy();c=c.copy()
            if name.startswith('arm'):
                side=-1 if name.endswith('-1') else 1
                if side<0:
                    controls=[[-.173,.270,0],[-.49,.164,.023],[-.437,-.208,.240],[-.172,-.174+(pose-1)*.013,.388]]
                else:
                    controls=[[.173,.270,0],[.493,.163,.027],[.43,-.144+(pose-1)*.113,.271],[.151-(pose-1)*.032,-.017+(pose-1)*.064,.423]]
                p,_=arm_surface(*armparams[arm_index],controls);arm_index+=1
            elif name.startswith('hand'):
                side=-1 if name.endswith('-1') else 1
                if side<0:
                    center=[-.154,-.156+(pose-1)*.013,.405];turn=1.22;tilt=-.32
                else:
                    center=[.132-(pose-1)*.032,-.014+(pose-1)*.064,.428];turn=-1.25+(pose-1)*.12;tilt=.36
                p=hand_pose(handdirs[hand_index],center,turn,tilt);hand_index+=1
            elif name in ['head','face']:
                p-=[0,.42,.006];p=orientation(p,-.045*pose,-.105*pose);p+=[0,.42,.006]
            elif name=='flower':
                p=orientation(fp,.10+(pose-1)*.10,-.05+(pose-1)*.09)*.29+[-.024,-.043+(pose-1)*.036,.457]
                c=fc.copy()
            changed.append((p,c))
        posed.append((np.concatenate([p for p,_ in changed]),np.concatenate([c for _,c in changed])))
    # A gentle three-quarter view reveals the rounded inflated volume.
    views=[]
    for p,c in [standing,*posed]:
        p=orientation(p,-.15,.025)
        views.append((p,c))
    return tuple(views)

def save(name,p,c):
    assert p.shape==(N,3) and c.shape==(N,3),(name,p.shape,c.shape)
    assert np.all(np.max(np.abs(p),axis=0)<[.951,.691,.801]),(name,p.min(0),p.max(0))
    records=np.empty(N,dtype=[('xyz','<i2',(3,)),('rgb','u1',(3,))]);records['xyz']=np.rint(p*16384);records['rgb']=np.rint(np.clip(c,0,255))
    (OUT/f'{name}.bin').write_bytes(b'ZOP1'+struct.pack('<I',N)+records.tobytes())
    print(name,N,'bounds',np.round(p.min(0),3),np.round(p.max(0),3),flush=True)

def preview(p,c,w=960,h=680,point_radius=.95):
    ss=2;image=Image.new('RGBA',(w*ss,h*ss));draw=ImageDraw.Draw(image);fit=min(w/2.14,h/1.65)
    for i in np.argsort(p[:,2]):
        x,y,z=p[i];fade=np.clip((.3-z)*.12,0,.20);color=tuple(np.rint(c[i]*(1-fade)+BG*fade).astype(int))+(255,)
        x,y,r=(w/2+x*fit)*ss,(h/2-y*fit)*ss,point_radius*ss
        draw.ellipse((x-r,y-r,x+r,y+r),fill=color)
    return image.resize((w,h),Image.Resampling.LANCZOS)

def morton_order(p):
    """Spatial correspondence makes unrelated forms resolve without a particle knot."""
    xy=np.floor(np.clip((p[:,:2]+[.95,.69])/[1.9,1.38],0,1)*511).astype(np.uint32)
    key=np.zeros(len(p),dtype=np.uint32)
    for bit in range(9):
        key|=((xy[:,0]>>bit)&1)<<(2*bit)
        key|=((xy[:,1]>>bit)&1)<<(2*bit+1)
    return np.argsort(key,kind='stable')

def reorder(state,order=None):
    p,c=state
    if order is None:order=morton_order(p)
    return p[order],c[order]

camera=build_camera();photo=build_photo();flower=build_flower();baymax,hold,hold2=build_baymax(flower)
camera,photo,flower=map(reorder,[camera,photo,flower])
character_order=morton_order(baymax[0])
baymax,hold,hold2=[reorder(state,character_order) for state in [baymax,hold,hold2]]
states={'camera':camera,'photo':photo,'flower':flower,'baymax':baymax,'hold':hold,'hold2':hold2}
sheet=Image.new('RGB',(1920,2040),tuple(BG))
for i,(name,(p,c)) in enumerate(states.items()):
    save(name,p,c);image=preview(p,c)
    if name=='camera':image.save(OUT/'camera.webp',quality=90)
    image.save(PREVIEW/f'{name}.png');sheet.paste(image,(i%2*960,i//2*680),image)
    ImageDraw.Draw(sheet).text((i%2*960+30,i//2*680+25),name,fill=(65,57,50))
sheet.save(PREVIEW/'contact.png')
