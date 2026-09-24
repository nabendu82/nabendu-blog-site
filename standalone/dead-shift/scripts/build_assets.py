"""Original DEAD//SHIFT assets. Run inside Blender; only owns its named scene."""
import bpy, math, random, os, json, struct
from mathutils import Vector
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'public', 'assets')
random.seed(43)
scene = bpy.data.scenes.new('DEAD_SHIFT_AssetWorkshop')
bpy.context.window.scene = scene
materials = {}
def mat(name, color, metal=0, rough=.65, glow=0):
    m = bpy.data.materials.new('DS_' + name)
    m.diffuse_color = (*color, 1)
    m.use_nodes = True
    p = next(n for n in m.node_tree.nodes if n.type == 'BSDF_PRINCIPLED')
    p.inputs['Base Color'].default_value = (*color, 1)
    p.inputs['Metallic'].default_value = metal
    p.inputs['Roughness'].default_value = rough
    if glow:
        p.inputs['Emission Color'].default_value = (*color, 1)
        p.inputs['Emission Strength'].default_value = glow
    materials[name] = m
    return m
mat('orange', (.55,.15,.045)); mat('cloth', (.065,.10,.115)); mat('boots',(.027,.034,.036))
mat('skin',(.57,.38,.24)); mat('infected',(.36,.49,.33)); mat('steel',(.17,.22,.24),.75,.38)
mat('tape',(.38,.34,.22)); mat('glass',(.035,.16,.20),.65,.22); mat('light',(.96,.55,.16),0,.4,2)
mat('concrete',(.30,.32,.30)); mat('asphalt',(.075,.092,.10)); mat('paint',(.64,.56,.37))
mat('rust',(.22,.075,.035),.5); mat('brick',(.24,.15,.12)); mat('green',(.12,.24,.19),.4)
mat('eyes',(.58,.91,.23),0,.4,1.5); mat('cracks',(.025,.034,.037))
parts=[]
def box(name, loc, size, material, bevel=.035, bone=None):
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc)
    o=bpy.context.object; o.name=name; o.scale=size
    bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    if bevel:
        mod=o.modifiers.new('Worn edges','BEVEL'); mod.width=bevel; mod.segments=2
        bpy.ops.object.modifier_apply(modifier=mod.name)
    o.data.materials.append(materials[material]); parts.append(o)
    if bone:
        g=o.vertex_groups.new(name=bone); g.add(list(range(len(o.data.vertices))),1,'REPLACE')
    return o
def cyl(name, loc, radius, depth, material, rotation=(0,0,0), bone=None):
    bpy.ops.mesh.primitive_cylinder_add(vertices=10, radius=radius, depth=depth, location=loc, rotation=rotation)
    o=bpy.context.object; o.name=name
    bpy.ops.object.transform_apply(location=False,rotation=True,scale=True)
    o.data.materials.append(materials[material]); parts.append(o)
    if bone:
        g=o.vertex_groups.new(name=bone); g.add(list(range(len(o.data.vertices))),1,'REPLACE')
    return o
def join(name):
    bpy.ops.object.select_all(action='DESELECT')
    for p in parts: p.select_set(True)
    bpy.context.view_layer.objects.active=parts[0]; bpy.ops.object.join()
    obj=bpy.context.object; obj.name=name
    scene.cursor.location=(0,0,0); bpy.ops.object.origin_set(type='ORIGIN_CURSOR')
    return obj
def export(folder,name,objects,animated=False):
    os.makedirs(os.path.join(OUT,folder),exist_ok=True)
    for o in bpy.data.objects: o.select_set(False)
    bpy.ops.object.select_all(action='DESELECT')
    for o in objects:
        o.hide_set(False)
        o.select_set(True)
    bpy.ops.export_scene.gltf(filepath=os.path.join(OUT,folder,name+'.glb'),use_selection=True,use_active_scene=True,export_format='GLB',export_animations=animated,export_animation_mode='NLA_TRACKS',export_force_sampling=True)
    # Blender appends scene-global suffixes on repeated builds. Keep socket API stable.
    if name=='scrap-rifle':
        path=os.path.join(OUT,folder,name+'.glb')
        with open(path,'rb') as f: payload=f.read()
        length=struct.unpack_from('<I',payload,12)[0]
        doc=json.loads(payload[20:20+length])
        for node in doc.get('nodes',[]):
            base=node.get('name','').split('.')[0]
            if base in ['BARREL','CORE','MAGAZINE','UNDERBARREL','SIDE_MODULE','Muzzle']: node['name']=base
        block=json.dumps(doc,separators=(',',':')).encode(); block+=b' '*((-len(block))%4)
        tail=payload[20+length:]
        with open(path,'wb') as f: f.write(struct.pack('<III',0x46546c67,2,20+len(block)+len(tail))+struct.pack('<II',len(block),0x4e4f534a)+block+tail)
    for o in objects: o.hide_set(True)
    parts.clear()

def character(zombie=False):
    skin='infected' if zombie else 'skin'; coat='green' if zombie else 'orange'
    box('Torso',(0,0,1.3),(.65,.38,.67),coat,.09,'Spine')
    box('Vest',(0,-.23,1.29),(.53,.14,.44),'cloth',.025,'Spine')
    box('Backpack',(0,.27,1.3),(.48,.25,.53),'cloth',.06,'Spine')
    for x in [-.18,0,.18]: box('Utility pouch',(x,-.325,1.15),(.13,.10,.16),'tape',.015,'Spine')
    box('Belt',(0,0,.95),(.61,.40,.12),'boots',.015,'Spine')
    box('Head',(0,-.025,1.88),(.39,.36,.46),skin,.10,'Head')
    if not zombie:
        box('Hood',(0,.055,1.95),(.43,.32,.35),'cloth',.07,'Head')
        box('Goggles',(0,-.22,1.98),(.38,.055,.10),'glass',.02,'Head')
        box('Face wrap',(0,-.20,1.8),(.32,.08,.13),'tape',.025,'Head')
        box('Shoulder armor',(.4,0,1.52),(.27,.41,.22),'steel',.06,'ArmR')
    else:
        for x in [-.105,.105]: box('Infected eye',(x,-.215,1.94),(.06,.035,.045),'eyes',.005,'Head')
        box('Jaw',(0,-.17,1.71),(.28,.12,.13),'cloth',.025,'Head')
        for x in [-.2,.13]: box('Torn fabric',(x,-.22,1.48),(.08,.04,.18),'rust',.01,'Spine')
    for side,x in [('L',-.23),('R',.23)]:
        box('Trouser '+side,(x,0,.65),(.25,.30,.62),'cloth',.05,'Leg'+side)
        box('Boot '+side,(x,-.10,.17),(.29,.48,.29),'boots',.055,'Leg'+side)
        box('Knee guard '+side,(x,-.18,.56),(.22,.09,.22),'steel',.025,'Leg'+side)
        ax=-.45 if side=='L' else .45
        box('Upper arm '+side,(ax,-.05,1.38),(.23,.26,.43),coat,.055,'Arm'+side)
        box('Forearm '+side,(ax,-.27,1.20),(.20,.50,.21),skin if zombie else 'cloth',.05,'Arm'+side)
        box('Hand '+side,(ax,-.54,1.20),(.19,.19,.19),skin,.045,'Arm'+side)
    mesh=join('Walker' if zombie else 'Survivor')
    rigdata=bpy.data.armatures.new('WalkerSkeleton' if zombie else 'SurvivorSkeleton')
    rig=bpy.data.objects.new('Rig',rigdata); scene.collection.objects.link(rig)
    bpy.context.view_layer.objects.active=rig; rig.select_set(True)
    bpy.ops.object.mode_set(mode='EDIT')
    for name,head,tail,parent in [('Root',(0,0,0),(0,0,.3),None),('Spine',(0,0,.95),(0,0,1.6),'Root'),('Head',(0,0,1.65),(0,0,2.1),'Spine'),('LegL',(-.23,0,.95),(-.23,0,.2),'Root'),('LegR',(.23,0,.95),(.23,0,.2),'Root'),('ArmL',(-.4,0,1.55),(-.45,-.5,1.2),'Spine'),('ArmR',(.4,0,1.55),(.45,-.5,1.2),'Spine')]:
        b=rigdata.edit_bones.new(name); b.head=head; b.tail=tail
        if parent: b.parent=rigdata.edit_bones[parent]
    bpy.ops.object.mode_set(mode='OBJECT')
    mesh.parent=rig; modifier=mesh.modifiers.new('Skeleton','ARMATURE'); modifier.object=rig
    rig.animation_data_create()
    clips=['Idle','Walk','Attack','Hit','Death'] if zombie else ['Idle','Run','Shoot','Hit','Death']
    for clip in clips:
        action=bpy.data.actions.new(clip); rig.animation_data.action=action
        duration=32 if clip in ['Run','Walk'] else 48 if clip=='Idle' else 24
        for f in range(1,duration+1,2):
            t=(f-1)/(duration-1); wave=math.sin(t*math.pi*2)
            for b in rig.pose.bones:
                b.rotation_mode='XYZ'; b.rotation_euler=(0,0,0); b.location=(0,0,0); b.scale=(1,1,1)
            if clip in ['Run','Walk']:
                amount=.5 if zombie else .85
                rig.pose.bones['LegL'].rotation_euler.x=wave*amount
                rig.pose.bones['LegR'].rotation_euler.x=-wave*amount
                rig.pose.bones['Spine'].location.z=abs(wave)*(.04 if zombie else .075)
                rig.pose.bones['Spine'].rotation_euler.x=.15 if zombie else .12
                rig.pose.bones['Spine'].rotation_euler.z=wave*(.10 if zombie else .065)
                rig.pose.bones['Head'].rotation_euler.z=wave*.10 if zombie else -wave*.035
                rig.pose.bones['Head'].rotation_euler.x=.1 if zombie else -.06
                rig.pose.bones['ArmL'].rotation_euler.x=wave*(.13 if zombie else .08)
                rig.pose.bones['ArmR'].rotation_euler.x=-wave*(.18 if zombie else .08)
            elif clip=='Idle': rig.pose.bones['Spine'].scale=(1,1,1+wave*.018)
            elif clip in ['Shoot','Attack']:
                rig.pose.bones['Spine'].rotation_euler.x=math.sin(t*math.pi)*(-.16 if clip=='Shoot' else .32)
                for n in ['ArmL','ArmR']: rig.pose.bones[n].rotation_euler.x=-math.sin(t*math.pi)*.25
            elif clip=='Hit': rig.pose.bones['Spine'].rotation_euler.z=math.sin(t*math.pi)*.22
            elif clip=='Death':
                rig.pose.bones['Root'].rotation_euler.x=-min(t*2,1)*1.5
                rig.pose.bones['Root'].location.z=-min(t*2,1)*.08
            for b in rig.pose.bones:
                b.keyframe_insert(data_path='rotation_euler',frame=f)
                b.keyframe_insert(data_path='location',frame=f)
                b.keyframe_insert(data_path='scale',frame=f)
        track=rig.animation_data.nla_tracks.new(); track.name=clip
        track.strips.new(clip,1,action)
        rig.animation_data.action=None
    scene.frame_set(1)
    export('zombies' if zombie else 'characters','walker' if zombie else 'survivor',[mesh,rig],True)

def rifle():
    box('Receiver',(0,0,0),(.20,.48,.22),'steel')
    box('Stock',(0,.36,-.01),(.15,.35,.17),'rust')
    box('Magazine',(.015,.02,-.22),(.13,.20,.30),'steel',.025)
    box('Grip',(0,.18,-.18),(.12,.12,.24),'tape',.02)
    cyl('Barrel',(0,-.49,.02),.065,.58,'steel',(math.pi/2,0,0))
    cyl('Muzzle',(0,-.82,.02),.09,.12,'boots',(math.pi/2,0,0))
    for y in [-.3,-.2,.27]: box('Tape wrap',(0,y,0),(.215,.07,.24),'tape',.01)
    box('Top rail',(0,-.05,.14),(.09,.40,.045),'boots',.008)
    box('Core housing',(.13,-.05,.015),(.09,.17,.13),'orange',.025)
    obj=join('ScrapRifle'); sockets=[]
    for name,loc in [('BARREL',(0,-.82,.02)),('CORE',(.2,-.05,0)),('MAGAZINE',(0,0,-.35)),('UNDERBARREL',(0,-.35,-.13)),('SIDE_MODULE',(-.15,0,0)),('Muzzle',(0,-.91,.02))]:
        o=bpy.data.objects.new(name,None); scene.collection.objects.link(o); o.location=loc; o.parent=obj; sockets.append(o)
    export('weapons','scrap-rifle',[obj,*sockets])

def props():
    box('Barrier footing',(0,0,.15),(2.7,.85,.3),'concrete')
    box('Barrier',(0,0,.65),(2.5,.48,1),'concrete',.08)
    for x in [-.9,-.45,0,.45,.9]:
        b=box('Caution stripe',(x,-.247,.69),(.20,.02,.65),'paint',0); b.rotation_euler.y=-.35
    export('environment','barrier',[join('ConcreteBarrier')])
    box('Chassis',(0,0,.60),(1.9,4.1,.65),'green',.16)
    box('Cabin',(0,.12,1.13),(1.65,2.0,.8),'green',.14)
    box('Windshield',(0,-.92,1.22),(1.42,.05,.48),'glass',.025)
    box('Rear glass',(0,1.15,1.22),(1.42,.05,.48),'glass',.025)
    for x in [-.85,.85]:
        for y in [-.4,.5]: box('Side glass',(x,y,1.26),(.03,.73,.4),'glass',.02)
        for y in [-1.25,1.35]: cyl('Tire',(x,y,.42),.43,.24,'boots',(0,math.pi/2,0))
    for x in [-.62,.62]: box('Headlight',(x,-2.06,.72),(.42,.04,.20),'paint',.02)
    box('Bumper',(0,-2.08,.37),(1.85,.14,.16),'rust',.03)
    for x,y in [(-.4,-1.7),(.4,.7),(-.3,1.6)]: box('Rust patch',(x,y,.945),(.35,.37,.018),'rust',.01)
    export('environment','abandoned-car',[join('AbandonedCar')])
    box('Dumpster',(0,0,.7),(1.9,1.1,1.3),'green',.08)
    box('Lid',(0,0,1.40),(2,1.2,.14),'boots',.04)
    for x in [-.65,0,.65]: box('Rib',(x,-.57,.7),(.07,.05,1.1),'steel',.015)
    export('environment','dumpster',[join('Dumpster')])
    cyl('Lamp pole',(0,0,2.3),.08,4.6,'steel')
    box('Lamp arm',(0,-.5,4.5),(.12,1.1,.12),'steel')
    box('Lamp housing',(0,-1,4.45),(.45,.65,.15),'boots')
    box('Lamp lens',(0,-1,4.35),(.35,.50,.035),'light',.01)
    export('environment','streetlight',[join('Streetlight')])
    box('Facade',(0,0,2.8),(8,4,5.6),'brick',.08)
    box('Roof parapet',(0,0,5.7),(8.25,4.2,.28),'concrete')
    box('Shop fascia',(0,-2.06,2.8),(7.6,.2,.7),'green')
    for x in [-2.6,0,2.6]:
        box('Storefront',(x,-2.05,1.3),(2.1,.06,2.0),'glass',.01)
        box('Awning',(x,-2.4,2.4),(2.4,.9,.13),'rust')
        box('Upper window',(x,-2.05,4.2),(1.4,.06,1.3),'glass',.01)
        box('Window sill',(x,-2.13,3.51),(1.6,.25,.13),'concrete')
    for x in [-3,2]:
        o=box('Boarded window',(x,-2.13,1.1),(1.8,.10,.18),'tape'); o.rotation_euler.y=.3
    export('environment','shop',[join('RuinedShop')])
    for i in range(9):
        o=box('Rubble',(random.uniform(-.8,.8),random.uniform(-.8,.8),.12),(.3+random.random()*.3,.3,.24),'concrete',.04)
        o.rotation_euler.z=random.random()*6
    export('environment','debris',[join('Debris')])

def arena():
    box('Asphalt',(0,0,-.16),(48,48,.3),'asphalt',0)
    for x in [-17,17]:
        for y in [-17,17]: box('Sidewalk',(x,y,.015),(13,13,.25),'concrete',.06)
    for y in range(-22,24,4):
        for x in [-.18,.18]: box('Lane marking',(x,y,.001),(.10,2,.015),'paint',0)
    for x in range(-22,24,4):
        if abs(x)>5: box('Cross street stripe',(x,0,.002),(2,.12,.016),'paint',0)
    for x in range(-4,5):
        for y in [-8,8]: box('Crosswalk',(x*.9,y,.005),(.52,2.2,.02),'paint',0)
    for i in range(100):
        x=random.uniform(-23,23); y=random.uniform(-23,23)
        b=box('Asphalt fracture',(x,y,.006),(random.uniform(.4,2),.035,.012),'cracks',0); b.rotation_euler.z=random.random()*6
    export('environment','intersection',[join('Intersection')])

if __name__=='__main__':
    arena(); props(); character(False); rifle(); character(True)
    # Keep an editable project with every original object in its own scene.
    for o in scene.objects: o.hide_set(False)
    bpy.data.libraries.write(os.path.join(ROOT,'art','dead-shift.blend'), {scene})
    print('DEAD_SHIFT_ASSETS_READY')
