"""DEAD//SHIFT visual kit v2. Modular GLBs, no gameplay changes.
Run in Blender after build_assets.py; exports only this kit's selected objects.
"""
import bpy, runpy, os, math, random
from mathutils import Vector
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
lib=runpy.run_path(os.path.join(ROOT,'scripts/build_assets.py'),run_name='kit_library')
box,cyl,mat,join,export,parts,materials=[lib[k] for k in ['box','cyl','mat','join','export','parts','materials']]
scene=lib['scene'];scene.name='DEAD_SHIFT_VisualKit';random.seed(84)
mat('plaster',(.36,.39,.36));mat('charcoal',(.045,.05,.055));mat('red',(.46,.075,.04))
mat('ivory',(.62,.63,.54));mat('blue',(.045,.15,.23),.35);mat('neon',(.12,.65,.63),0,.4,2)
mat('sandbag',(.32,.30,.19));mat('oil',(.017,.023,.029),.15,.21);mat('blood',(.13,.023,.016),0,.8)
def text(label,loc,size,material='paint'):
    c=bpy.data.curves.new(label,'FONT');c.body=label;c.size=size;c.extrude=.003;c.resolution_u=2
    o=bpy.data.objects.new('Sign_'+label,c);scene.collection.objects.link(o);o.location=loc;o.rotation_euler=(math.pi/2,0,0);c.materials.append(materials[material])
    bpy.ops.object.select_all(action='DESELECT');o.select_set(True);bpy.context.view_layer.objects.active=o;bpy.ops.object.convert(target='MESH');parts.append(bpy.context.object)
def finish(name):export('environment',name,[join(name)])
def beam(name,a,b,r,material):
    a,b=Vector(a),Vector(b);o=cyl(name,(a+b)/2,r,(b-a).length,material);o.rotation_euler=(b-a).to_track_quat('Z','Y').to_euler();return o
def rubble(n=18):
    for i in range(n):
        o=box('Fractured concrete',(random.uniform(-1.7,1.7),random.uniform(-1,1),random.uniform(.1,.3)),(random.uniform(.2,.8),random.uniform(.2,.6),random.uniform(.15,.4)),'concrete',.025);o.rotation_euler=(random.random()*.5,random.random()*.3,random.random()*6)
def facade(name,floors=3,corner=False):
    # Layered piers and exposed slabs instead of a single solid building cube.
    width=8.5
    box('Rear shell',(0,1.6,floors*1.55),(width,.45,floors*3.1),'brick')
    for level in range(floors):
        z=level*3.1
        box('Floor slab',(0,0,z+.15),(width,4,.28),'concrete')
        for x in [-4,-1.4,1.4,4]:
            box('Concrete pier',(x,-1.6,z+1.5),(.34,.44,2.9),'plaster')
        for j,x in enumerate([-2.75,0,2.75]):
            if corner and level==floors-1 and j==2:continue
            box('Window breast',(x,-1.6,z+.6),(2.3,.32,.85),'plaster')
            box('Window lintel',(x,-1.6,z+2.85),(2.3,.32,.28),'brick')
            box('Dark interior',(x,-1.2,z+1.9),(2.25,.04,1.7),'charcoal',0)
            if (level+j)%3:
                box('Remaining glass',(x+.38,-1.65,z+1.95),(.65,.04,1.5),'glass',0)
            for xx in [-.85,.85]:box('Window frame',(x+xx,-1.73,z+1.9),(.06,.1,1.7),'steel',.008)
            if (j+level)%2==0:
                box('Balcony slab',(x,-2.02,z+.97),(2.4,1,.16),'concrete')
                for xx in [-1,-.5,0,.5,1]:beam('Balcony railing',(x+xx,-2.45,z+1.05),(x+xx,-2.45,z+1.9),.022,'rust')
                beam('Rail top',(x-1.1,-2.45,z+1.9),(x+1.1,-2.45,z+1.9),.03,'rust')
        box('Exposed side',(4,0,z+1.55),(.3,3.5,2.8),'brick')
    for x in [-3.5,-1,1.6,3.7]:
        box('Broken parapet',(x,.3,floors*3.1+.3),(1.2,3.7,.45),'concrete')
        beam('Exposed rebar',(x,-1.5,floors*3.1),(x+.3,-1.5,floors*3.1+1),.028,'rust')
    if floors==2:
        box('Shop sign',(0,-1.9,2.65),(7.3,.2,.6),'charcoal')
        text('NORTHLINE / PHARMACY',(-3.3,-2.03,2.51),.36,'neon')
        for x in [-2.7,0,2.7]:
            o=box('Bent shutter',(x,-1.78,1.3),(2,.1,2),'steel',.01);o.rotation_euler.y=.08
            for h in [.6,.9,1.2,1.5,1.8]:box('Shutter rib',(x,-1.85,h),(2,.04,.035),'rust',0)
        text('KEEP OUT',(-.9,-1.93,1),.25,'paint')
    rubble(12);finish(name)
facade('apartment',3);facade('broken-shop',2);facade('corner-ruin',3,True)

# Petrol station: open canopy, pumps, hose loops, chipped kerb.
for x in [-3,3]:cyl('Canopy column',(x,0,2),.12,4,'steel')
box('Canopy',(0,0,4.1),(8,5,.4),'ivory');box('Red fascia',(0,-2.52,4.1),(8,.05,.32),'red')
text('LAST STOP // FUEL',(-3.2,-2.57,4),.38,'paint')
for x in [-2,2]:
    box('Pump island',(x,0,.16),(2,2.5,.32),'concrete');box('Pump',(x,0,1),(1,.65,1.5),'red');box('Meter',(x,-.34,1.4),(.68,.05,.5),'charcoal')
    for i in range(9):
        a=i/8*math.pi;beam('Fuel hose',(x+.6,-.1,1.4-i*.08),(x+.6+math.sin(a)*.3,-.1,1.3-i*.08),.025,'boots')
finish('petrol-station')

def car(name,kind):
    color='charcoal' if kind=='burned' else 'ivory' if kind=='ambulance' else 'blue'
    box('Bent chassis',(0,0,.55),(1.9,4.3,.6),color,.15)
    if kind=='ambulance':
        box('Medical cabin',(0,.6,1.4),(1.85,2.7,1.4),'ivory',.08)
        box('Medical stripe',(0,-.82,1.4),(1.86,.03,.3),'red')
        box('Red cross horizontal',(-.97,.5,1.55),(.03,.7,.15),'red',0);box('Red cross vertical',(-.97,.5,1.55),(.03,.15,.7),'red',0)
    else:box('Passenger cabin',(0,.2,1.1),(1.65,1.9,.75),color,.12)
    box('Windscreen',(0,-.81,1.25),(1.45,.03,.46),'glass' if kind!='burned' else 'charcoal',.01)
    for x in [-.91,.91]:
        for y in [-1.3,1.3]:
            cyl('Tire',(x,y,.4),.40,.25,'boots',(0,math.pi/2,0));cyl('Wheel hub',(x*1.05,y,.4),.22,.26,'steel',(0,math.pi/2,0))
        for y in [-.35,.48]:box('Window',(x*.92,y,1.3),(.035,.6,.4),'glass',.01)
    for x in [-.6,.6]:box('Broken headlight',(x,-2.17,.66),(.35,.03,.16),'paint',0)
    box('Bumper',(0,-2.23,.36),(1.9,.18,.18),'steel')
    if kind!='burned':
        for x,c in [(-.4,'red'),(.4,'neon')]:box('Emergency light',(x,.1,1.65 if kind=='police' else 2.2),(.5,.25,.15),c)
        text('POLICE' if kind=='police' else 'EMS',( -.62,-2.25,.85),.21,'paint')
    else:
        b=box('Peeled hood',(0,-1.4,1),(1.7,1.3,.09),'rust');b.rotation_euler.x=-.24
        rubble(7)
    finish(name)
car('burned-car','burned');car('police-car','police');car('ambulance','ambulance')

for i in range(5):
    o=box('Broken wall',(i*.65-1.4,0,.5+random.random()*.35),(.7,.55,1+random.random()),'brick');o.rotation_euler.y=random.uniform(-.16,.16)
rubble();finish('collapsed-wall')
for level in range(3):
    for i in range(5):box('Sandbag',(i*.55-1.1+(level%2)*.2,0,.18+level*.29),(.65,.7,.32),'sandbag',.13)
finish('sandbags')
for x in [-2,2]:cyl('Fence post',(x,0,1.4),.05,2.8,'steel')
for z in [.3,2.6]:beam('Fence frame',(-2,0,z),(2,0,z),.035,'rust')
for i in range(12):
    x=-2+i*.35;beam('Mesh wire',(x,0,.3),(min(2,x+1),0,2.6),.008,'steel');beam('Mesh wire',(x,0,2.6),(min(2,x+1),0,.3),.008,'steel')
finish('fence')
cyl('Signpost',(0,0,1.7),.045,3.4,'steel');box('Road sign',(0,-.05,2.8),(2,.08,.7),'green')
text('EVAC / 04',(-.88,-.105,2.66),.28);finish('road-sign')
for x in [-1.2,1.2]:box('Checkpoint leg',(x,0,.35),(.18,.7,.7),'rust')
box('Checkpoint rail',(0,0,.9),(3,.18,.65),'paint')
for x in [-1.2,-.6,0,.6,1.2]:
    b=box('Warning stripe',(x,-.1,.9),(.25,.03,.65),'charcoal',0);b.rotation_euler.y=-.3
text('QUARANTINE',(-1.05,-.15,.78),.22);finish('checkpoint')
for i in range(14):
    o=box('Trash',(random.uniform(-1.1,1.1),random.uniform(-1,1),random.uniform(.03,.2)),(.3,.45,.06),'tape' if i%2 else 'ivory',.01);o.rotation_euler=(random.random(),0,random.random()*6)
finish('trash')
rubble(26);finish('rubble')
for i in range(6):
    o=box('Asphalt slab',(random.uniform(-1.6,1.6),random.uniform(-1,1),.07),(.8,1,.12),'asphalt',.05);o.rotation_euler=(random.uniform(-.2,.2),random.uniform(-.2,.2),random.random()*6)
finish('asphalt-chunks')

# Unique irregular, layered ground stains: flat exported geometry, no transparent overdraw.
for name,material in [('oil-stain','oil'),('blood-stain','blood'),('pothole','charcoal')]:
    for i in range(9):
        o=cyl('Irregular patch',(random.uniform(-.6,.6),random.uniform(-.4,.4),.013+i*.001),random.uniform(.15,.7),.006,material);o.scale.y=random.uniform(.4,.9)
    finish(name)

# Low cost city skirt extends well past any possible view from the playable bounds.
box('City substrate',(0,0,-.23),(180,180,.3),'asphalt',0);finish('city-skirt')

# Fresh higher-contrast survivor/Walker exports using the same compatible skeleton.
lib['character'](False);lib['rifle']();lib['character'](True)
scene=bpy.context.scene
for filename,meshname in [('survivor','Survivor'),('walker','Walker')]:
    mesh=next(o for o in scene.objects if o.type=='MESH' and o.name.split('.')[0]==meshname)
    for v in mesh.data.vertices:
        # Broader shoulders and backpack, while preserving foot origins and bones.
        if v.co.z>1.1:v.co.x*=1.13
    mesh.data.update()
    export('characters' if filename=='survivor' else 'zombies',filename,[mesh,mesh.parent],True)
bpy.data.libraries.write(os.path.join(ROOT,'art/visual-kit.blend'),{scene})
print('VISUAL_KIT_READY')
