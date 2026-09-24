"""Executed only inside the live Blender session through Blender MCP.

Authored cross-section meshes, UVs, skinned anatomy and baked armature clips.
No mesh primitive operators are used for either character.
"""
import bpy
import math
import os
import json
import numpy as np
from mathutils import Vector

ROOT = '/Users/nabendubiswas/Desktop/Projects/nabendu-blog-site/standalone/dead-shift'
ART = ROOT + '/art/character-rebuild'
os.makedirs(ART, exist_ok=True)


def texture(name, base, roughness, cloth=False):
    size = 512
    rng = np.random.default_rng(sum(map(ord, name)))
    yy, xx = np.mgrid[0:size, 0:size]
    grain = rng.normal(0, .026, (size, size))
    broad = .035*np.sin(xx*.039)*np.cos(yy*.029) + .025*np.sin(xx*.013+yy*.021)
    weave = .018*(np.sin(xx*math.pi/2)+np.sin(yy*math.pi/2)) if cloth else 0
    dirt = np.maximum(0, np.sin(xx*.028+np.sin(yy*.02))*np.cos(yy*.024))*.10
    color = np.ones((size,size,4),dtype=np.float32)
    for c in range(3):
        color[:,:,c] = np.clip(base[c]*(1+grain+broad+weave-dirt),0,1)
    im = bpy.data.images.new(name+'_Albedo_512',width=size,height=size)
    im.pixels.foreach_set(color.ravel()); im.pack()
    normal = np.ones_like(color); normal[:,:,0]=.5+grain*.23; normal[:,:,1]=.5+(weave+grain)*.23; normal[:,:,2]=.998
    nm=bpy.data.images.new(name+'_Normal_512',width=size,height=size)
    nm.colorspace_settings.name='Non-Color'; nm.pixels.foreach_set(normal.ravel()); nm.pack()
    rm=bpy.data.images.new(name+'_Roughness_512',width=size,height=size)
    arr=np.ones_like(color); arr[:,:,:3]=np.clip(roughness+grain[:,:,None]+broad[:,:,None],0,1)
    rm.colorspace_settings.name='Non-Color'; rm.pixels.foreach_set(arr.ravel()); rm.pack()
    mat=bpy.data.materials.new(name); mat.diffuse_color=(*base,1)
    nodes=mat.node_tree.nodes; p=next(n for n in nodes if n.type=='BSDF_PRINCIPLED')
    p.inputs['Roughness'].default_value=roughness
    for image,slot in [(im,'Base Color'),(rm,'Roughness')]:
        n=nodes.new('ShaderNodeTexImage'); n.image=image; mat.node_tree.links.new(n.outputs['Color'],p.inputs[slot])
    n=nodes.new('ShaderNodeTexImage'); n.image=nm
    normal_node=nodes.new('ShaderNodeNormalMap'); normal_node.inputs['Strength'].default_value=.35
    mat.node_tree.links.new(n.outputs['Color'],normal_node.inputs['Color']); mat.node_tree.links.new(normal_node.outputs['Normal'],p.inputs['Normal'])
    return mat


M={}
for name,base,rough,cloth in [
    ('Olive_canvas',(.20,.24,.15),.88,True),('Charcoal_ripstop',(.065,.076,.075),.9,True),
    ('Brown_leather',(.095,.063,.038),.77,False),('Skin',(.48,.31,.22),.78,False),
    ('Hair',(.032,.025,.019),.93,False),('Gunmetal',(.075,.086,.09),.44,False),
    ('Webbing',(.12,.135,.085),.9,True),('Stitch',(.30,.29,.21),.86,True),
    ('Zombie_skin',(.38,.39,.30),.86,False),('Faded_shirt',(.23,.265,.255),.94,True),
    ('Bruise',(.25,.17,.16),.86,False),('Wound',(.19,.065,.052),.78,False),
    ('Eye',(.25,.24,.20),.6,False),('Sclera',(.44,.40,.31),.63,False)]:
    M[name]=texture(name,base,rough,cloth)
next(n for n in M['Gunmetal'].node_tree.nodes if n.type=='BSDF_PRINCIPLED').inputs['Metallic'].default_value=.65

meshes=[]


def surface(name, rings, mat, bone, n=16, sub=1, blend=None):
    # Each section is (cx,cy,z,halfwidth,halfdepth), authored to anatomy/clothing.
    vertices=[]; faces=[]
    for j,(cx,cy,z,rx,ry) in enumerate(rings):
        for i in range(n):
            a=2*math.pi*i/n
            vertices.append((cx+rx*math.cos(a),cy+ry*math.sin(a),z))
    for j in range(len(rings)-1):
        for i in range(n):
            a=j*n+i; b=j*n+(i+1)%n
            faces.append((a,b,b+n,a+n))
    faces.append(tuple(reversed(range(n)))); faces.append(tuple((len(rings)-1)*n+i for i in range(n)))
    return mesh(name,vertices,faces,mat,bone,sub,blend,n)


def mesh(name,verts,faces,mat,bone,sub=1,blend=None,ring_n=None):
    if bone=='Head':
        verts=[(x,y,z-.075) for x,y,z in verts]
    data=bpy.data.meshes.new(name+'_Topology'); data.from_pydata(verts,[],faces); data.update()
    obj=bpy.data.objects.new(name,data); bpy.context.collection.objects.link(obj); meshes.append(obj)
    data.materials.append(M[mat]); uv=data.uv_layers.new(name='UVMap')
    for poly in data.polygons:
        poly.use_smooth=True
        for li in poly.loop_indices:
            vi=data.loops[li].vertex_index
            if ring_n:
                u=(vi%ring_n)/ring_n
                if any(data.loops[k].vertex_index%ring_n==ring_n-1 for k in poly.loop_indices) and vi%ring_n==0: u=1
                v=(vi//ring_n)/max(1,len(verts)//ring_n-1)
            else:
                co=data.vertices[vi].co; u=co.x*2+.5; v=co.z*.5
            uv.data[li].uv=(u,v)
    vg=obj.vertex_groups.new(name=bone)
    for i,v in enumerate(verts):
        w=blend(v) if blend else 1.0; vg.add([i],w,'REPLACE')
    if blend:
        other=obj.vertex_groups.new(name=blend.bone)
        for i,v in enumerate(verts): other.add([i],1-blend(v),'REPLACE')
    if sub:
        bpy.context.view_layer.objects.active=obj; obj.select_set(True)
        mod=obj.modifiers.new('Surface refinement','SUBSURF'); mod.levels=sub
        bpy.ops.object.modifier_apply(modifier=mod.name); obj.select_set(False)
    return obj


def panel(name,center,size,mat,bone,sub=1):
    x,y,z=center; w,d,h=size
    # Rounded sewn panels with inset corner loops; not stock primitives.
    return surface(name,[(x,y,z-h/2,w*.40,d*.40),(x,y,z-h*.44,w/2,d/2),(x,y,z+h*.44,w/2,d/2),(x,y,z+h/2,w*.40,d*.40)],mat,bone,n=8,sub=sub)


def tube(name,points,radii,mat,bone,n=8,sub=1):
    if len(points)>=3:
        start=Vector(points[0]);end=Vector(points[-1])
        start_dir=(Vector(points[1])-start).normalized();end_dir=(end-Vector(points[-2])).normalized()
        points=[tuple(start-start_dir*.012),tuple(start+start_dir*.009)]+points[1:-1]+[tuple(end-end_dir*.009),tuple(end+end_dir*.012)]
        radii=[radii[0],radii[0]]+radii[1:-1]+[radii[-1],radii[-1]]
    vs=[]; fs=[]
    for j,pt in enumerate(points):
        p=Vector(pt); direction=Vector(points[min(j+1,len(points)-1)])-Vector(points[max(j-1,0)])
        direction.normalize(); u=direction.cross(Vector((0,1,0)))
        if u.length<.01: u=direction.cross(Vector((1,0,0)))
        u.normalize(); v=direction.cross(u).normalized()
        rx,ry=radii[j] if isinstance(radii[j],tuple) else (radii[j],radii[j])
        for i in range(n):
            a=2*math.pi*i/n; vs.append(tuple(p+u*math.cos(a)*rx+v*math.sin(a)*ry))
    for j in range(len(points)-1):
        for i in range(n): fs.append((j*n+i,j*n+(i+1)%n,(j+1)*n+(i+1)%n,(j+1)*n+i))
    fs.extend([tuple(reversed(range(n))),tuple((len(points)-1)*n+i for i in range(n))])
    return mesh(name,vs,fs,mat,bone,sub,ring_n=n)


def face(zombie):
    skin='Zombie_skin' if zombie else 'Skin'; front=-.025 if zombie else 0
    # Narrow human jaw, cheekbones, temples, skull; 1:7.6 head/body ratio.
    sections=[(1.585,.032,.038),(1.605,.057,.065),(1.64,.073,.078),(1.69,.082,.083),(1.73,.083,.088),(1.77,.078,.084),(1.805,.065,.071),(1.825,.038,.041),(1.832,.004,.005)]
    head=surface('Head_Sculpt',[(0,front,z,x,y) for z,x,y in sections],skin,'Head',n=32,sub=2)
    for s in [-1,1]:
        # Cheek planes, brow ridges and inset slit eyes rather than cartoon eyeballs.
        tube('Brow_L' if s<0 else 'Brow_R',[(s*.012,-.081+front,1.737),(s*.036,-.088+front,1.738),(s*.060,-.073+front,1.729)],[.006,.009,.003],skin,'Head',sub=2)
        tube('Eye_socket',[(s*.017,-.082+front,1.717),(s*.036,-.087+front,1.716),(s*.052,-.079+front,1.718)],[(.003,.003),(.004,.004),(.002,.002)],'Bruise' if zombie else 'Hair','Head',sub=1)
        tube('Eye_slit',[(s*.024,-.087+front,1.718),(s*.036,-.090+front,1.718),(s*.045,-.085+front,1.718)],[.0015,.0025,.001], 'Sclera','Head',sub=1)
        surface('Ear',[(s*.081,front,1.676,.009,.010),(s*.088,front,1.687,.014,.015),(s*.087,front,1.714,.013,.016),(s*.08,front,1.726,.006,.008)],skin,'Head',n=12,sub=1)
        if zombie:
            tube('Sunken_cheek',[(s*.070,-.048+front,1.702),(s*.060,-.068+front,1.68),(s*.048,-.073+front,1.66)],[.008,.006,.002],'Bruise','Head')
    surface('Nose_bridge',[(0,-.078+front,1.671,.012,.007),(0,-.098+front,1.68,.015,.015),(0,-.100+front,1.692,.012,.02),(0,-.088+front,1.723,.007,.009),(0,-.078+front,1.734,.004,.004)],skin,'Head',n=12,sub=2)
    tube('Mouth_crease',[(-.027,-.076+front,1.646),(0,-.084+front,1.648),(.027,-.076+front,1.646)],[.0015,.002,.0015],'Wound' if zombie else 'Brown_leather','Head')
    tube('Lower_lip',[(-.022,-.077+front,1.643),(0,-.083+front,1.641),(.022,-.077+front,1.643)],[.002,.003,.002],skin,'Head')
    if not zombie:
        surface('Short_cropped_hair',[(0,.013,1.752,.079,.078),(0,.007,1.784,.079,.084),(0,.006,1.818,.06,.067),(0,.006,1.835,.024,.028),(0,.006,1.837,.002,.003)],'Hair','Head',n=32,sub=1)
        tube('Cheek_scar',[(.056,-.064,1.695),(.051,-.074,1.677),(.042,-.074,1.66)],[.0015,.002,.001],'Bruise','Head')
    else:
        tube('Scalp_wound',[(-.04,-.03,1.823),(-.02,-.055,1.811),(-.004,-.061,1.805)],[.007,.005,.002],'Wound','Head')


def make_character(zombie=False):
    global meshes
    meshes=[]
    scene=bpy.context.scene
    scene.render.fps=30
    skin='Zombie_skin' if zombie else 'Skin'; top='Faded_shirt' if zombie else 'Olive_canvas'
    # Body has actual waist, pelvis, rib cage, clavicles and sloped shoulders.
    surface('Torso_Shirt' if zombie else 'Tactical_Jacket',[(0,0,.90,.12,.085),(0,0,.94,.15,.105),(0,0,1.00,.155,.104),(0,.01,1.11,.145,.092),(0,.015,1.23,.172,.11),(0,.02,1.35,.208,.118),(0,.015,1.41,.202,.105),(0,.005,1.46,.16,.08),(0,0,1.48,.085,.06)],top,'Spine',n=24,sub=2)
    surface('Neck',[(0,0,1.45,.045,.045),(0,0,1.53,.045,.045),(0,-.002,1.60,.039,.04)],skin,'Head',n=16,sub=2)
    surface('Pelvis_Cargo',[(0,0,.82,.13,.08),(0,0,.90,.157,.108),(0,0,.97,.148,.1)],'Charcoal_ripstop','Hips',n=24,sub=2)
    for s,side in [(-1,'L'),(1,'R')]:
        x=s*.09
        surface('Cargo_Thigh_'+side,[(x,.012,.48,.057,.063),(x,0,.54,.068,.072),(x,0,.66,.076,.083),(x,0,.79,.084,.093),(x,0,.90,.078,.087)],'Charcoal_ripstop','Thigh.'+side,n=20,sub=2)
        surface('Cargo_Calf_'+side,[(x,.016,.12,.040,.043),(x,.018,.20,.045,.05),(x,.025,.29,.056,.067),(x,.022,.39,.059,.067),(x,.012,.51,.052,.061)],'Charcoal_ripstop','Shin.'+side,n=20,sub=2)
        surface('Boot_'+side,[(x,-.041,.018,.048,.104),(x,-.042,.032,.056,.115),(x,-.04,.068,.055,.112),(x,-.031,.105,.05,.095),(x,.012,.14,.047,.052),(x,.016,.22,.042,.046)],'Brown_leather','Foot.'+side,n=20,sub=2)
        tube('Boot_welt_'+side,[(x-.045,-.118,.04),(x,-.151,.04),(x+.045,-.118,.04)],[.005,.005,.005],'Gunmetal','Foot.'+side)
        for i in range(4):tube('Boot_lace',[(x-.022,-.076+i*.008,.097+i*.012),(x+.022,-.076+i*.008,.097+i*.012)],[.003,.003],'Stitch','Foot.'+side,sub=0)
        panel('Cargo_pocket_'+side,(x+s*.062,-.005,.70),(.034,.13,.14),'Charcoal_ripstop','Thigh.'+side)
        panel('Kneepad_'+side,(x,-.059,.51),(.108,.044,.115),'Brown_leather','Shin.'+side)
        panel('Kneepad_shell_'+side,(x,-.08,.52),(.085,.025,.073),'Gunmetal','Shin.'+side)
        # Long sleeves break at elbow and wrist; elbow posture supports hand-held rifle.
        shoulder=(s*.184,0,1.405)
        elbow=(s*.27,-.095,1.155) if not zombie else (s*.25,-.018,1.14)
        wrist=((.115,-.60,1.23) if s<0 else (.115,-.405,1.235)) if not zombie else (s*.275,-.075,.87)
        uppermid=tuple(Vector(shoulder).lerp(Vector(elbow),.5))
        tube('Sleeve_upper_'+side,[shoulder,uppermid,elbow],[.069,.060,.048] if zombie else [.077,.074,.05],top,'UpperArm.'+side,n=20,sub=2)
        foremid=tuple(Vector(elbow).lerp(Vector(wrist),.5))
        tube('Forearm_'+side,[elbow,foremid,wrist],[.044,.039,.026] if zombie else [.051,.05,.031],skin if zombie else top,'Forearm.'+side,n=20,sub=2)
        hand=tuple(Vector(wrist)+Vector((0,-.045,-.012)))
        tube('Palm_'+side,[wrist,hand,tuple(Vector(hand)+Vector((0,-.045,0)))],[.029,(.039,.025),.028],skin if zombie else 'Brown_leather','Hand.'+side,n=16,sub=2)
        for i in range(4):
            fx=hand[0]+(i-1.5)*.015
            tube('Finger_'+side+str(i),[(fx,hand[1]-.025,hand[2]),(fx,hand[1]-.062,hand[2]-.012),(fx,hand[1]-.068,hand[2]-.034)],[.009,.008,.006],skin,'Hand.'+side,n=8,sub=1)
        tube('Thumb_'+side,[wrist,(wrist[0]-s*.035,wrist[1]-.028,wrist[2]-.015),(wrist[0]-s*.027,wrist[1]-.057,wrist[2]-.029)],[.012,.01,.008],skin,'Hand.'+side,n=8,sub=1)
        if zombie:
            for j in range(4):
                tube('Torn_sleeve_'+side+str(j),[(elbow[0]+(j-1.5)*.021,elbow[1]-.037,elbow[2]+.04),(elbow[0]+(j-1.5)*.019,elbow[1]-.04,elbow[2]-.04-j%2*.018)],[.012,.001],top,'UpperArm.'+side,sub=0)
            tube('Forearm_lesion_'+side,[foremid,(wrist[0],wrist[1]-.027,wrist[2]+.04)],[.018,.004],'Wound','Forearm.'+side)
        else:
            tube('Shoulder_guard_'+side,[(s*.17,-.035,1.426),(s*.205,-.025,1.408),(s*.225,-.019,1.382)],[.035,.045,.03],'Webbing','UpperArm.'+side,n=12,sub=1)
            for j in range(3):
                z=1.16+j*.043
                tube('Sleeve_fold_'+side+str(j),[(s*.244,-.127,z),(s*.285,-.12,z+.008),(s*.306,-.082,z)],[.003,.005,.002],top,'UpperArm.'+side,n=8,sub=1)
    face(zombie)
    if zombie:
        # Exposed rib-area wounds and irregular torn hem, kept subtle.
        panel('Exposed_rib_wound',(-.11,-.102,1.23),(.056,.012,.11),'Bruise','Spine',sub=2)
        for i in range(4):tube('Rib_cut',[(-.135,-.115,1.20+i*.018),(-.095,-.12,1.205+i*.018)],[.003,.002],'Wound','Spine')
        for i in range(11):
            x=-.14+i*.028
            tube('Shirt_torn_hem',[(x,-.09,.98),(x+.009,-.086,.9+(i%3)*.017)],[.013,.001],top,'Spine',sub=1)
        panel('Trouser_tear',(.095,-.074,.65),(.057,.009,.075),'Zombie_skin','Thigh.R')
    else:
        # Jacket construction, zips, webbing and gear create a readable scavenger silhouette.
        for s in [-1,1]:
            panel('Chest_pocket',(s*.09,-.105,1.325),(.112,.028,.10),'Olive_canvas','Spine')
            tube('Pocket_flap',[(s*.04,-.126,1.353),(s*.14,-.117,1.353)],[.004,.004],'Stitch','Spine')
            tube('Jacket_collar',[(s*.012,-.075,1.397),(s*.073,-.07,1.464),(s*.056,.014,1.492)],[.018,.024,.014],'Olive_canvas','Spine',n=10)
        tube('Front_zip',[(0,-.108,.98),(0,-.099,1.15),(0,-.126,1.35),(0,-.078,1.44)],[.004]*4,'Gunmetal','Spine')
        for i in range(5):panel('Belt_pouch',((i-2)*.06,-.104,.964),(.051,.052,.070),'Webbing','Hips')
        panel('Belt_buckle',(0,-.142,.964),(.045,.012,.03),'Gunmetal','Hips',sub=0)
        panel('Compact_backpack',(0,.144,1.26),(.265,.15,.31),'Olive_canvas','Spine',sub=2)
        panel('Backpack_outer_pocket',(0,.221,1.22),(.21,.036,.15),'Webbing','Spine')
        for s in [-1,1]:tube('Backpack_strap',[(s*.09,.18,1.39),(s*.12,.018,1.47),(s*.12,-.107,1.37),(s*.14,-.099,1.13),(s*.12,.10,1.10)],[.018]*5,'Webbing','Spine',n=8,sub=1)
        tube('Diagonal_shoulder_sling',[(-.135,-.113,1.415),(-.04,-.141,1.26),(.13,-.11,1.04)],[.018]*3,'Brown_leather','Spine',n=8,sub=1)
    # Skeleton: authored joints match the actual mesh sections.
    armdata=bpy.data.armatures.new('WalkerSkeleton' if zombie else 'SurvivorSkeleton')
    rig=bpy.data.objects.new('WalkerRig' if zombie else 'SurvivorRig',armdata); scene.collection.objects.link(rig)
    bpy.context.view_layer.objects.active=rig; rig.select_set(True); bpy.ops.object.mode_set(mode='EDIT')
    specs=[('Root',(0,0,0),(0,0,.15),None),('Hips',(0,0,.87),(0,0,1.02),'Root'),('Spine',(0,0,1.02),(0,0,1.44),'Hips'),('Head',(0,0,1.48),(0,0,1.76),'Spine')]
    for s,side in [(-1,'L'),(1,'R')]:
        elbow=(s*.27,-.095,1.155) if not zombie else (s*.25,-.018,1.14)
        wrist=((.115,-.60,1.23) if s<0 else (.115,-.405,1.235)) if not zombie else (s*.275,-.075,.87)
        specs += [('Thigh.'+side,(s*.09,0,.87),(s*.09,.012,.50),'Hips'),('Shin.'+side,(s*.09,.012,.50),(s*.09,.016,.12),'Thigh.'+side),('Foot.'+side,(s*.09,.016,.12),(s*.09,-.12,.06),'Shin.'+side),('UpperArm.'+side,(s*.184,0,1.405),elbow,'Spine'),('Forearm.'+side,elbow,wrist,'UpperArm.'+side),('Hand.'+side,wrist,tuple(Vector(wrist)+Vector((0,-.10,-.01))),'Forearm.'+side)]
    if not zombie: specs.append(('WeaponSocket',(0,-.405,1.245),(0,-.605,1.245),'Hand.R'))
    for name,head,tail,parent in specs:
        b=armdata.edit_bones.new(name); b.head=head; b.tail=tail
        if parent:b.parent=armdata.edit_bones[parent]
    bpy.ops.object.mode_set(mode='OBJECT')
    for obj in meshes:
        mod=obj.modifiers.new('Skin','ARMATURE'); mod.object=rig; obj.parent=rig
    rig.animation_data_create()
    clips=['Idle','Walk','Attack','Hit','Death'] if zombie else ['Idle','Run','Aim','Shoot','Hit','Death']
    for clip in clips:
        frames={'Idle':90,'Aim':60,'Run':24,'Walk':48,'Shoot':9,'Hit':12,'Attack':24,'Death':36}[clip]
        action=bpy.data.actions.new(('Walker_' if zombie else 'Survivor_')+clip); rig.animation_data.action=action
        for frame in range(1,frames+1):
            t=(frame-1)/(frames-1); phase=t*2*math.pi
            for b in rig.pose.bones:b.rotation_mode='XYZ'; b.rotation_euler=(0,0,0); b.location=(0,0,0)
            def rot(name,x=0,y=0,z=0):rig.pose.bones[name].rotation_euler=(x,y,z)
            rot('Spine',.13 if zombie else .035,0,.025 if zombie else 0)
            rot('Head',-.06 if zombie else -.02,0,-.045 if zombie else 0)
            if clip in ['Idle','Aim']:
                rot('Spine',(.13 if zombie else .035)+math.sin(phase)*.007,0,.025 if zombie else 0)
                if zombie:rot('UpperArm.L',.05,0,.08);rot('UpperArm.R',-.04,0,-.035)
            if clip in ['Run','Walk']:
                strength=.63 if clip=='Run' else .28
                for s,side in [(-1,'L'),(1,'R')]:
                    a=phase+(math.pi if s==1 else 0)
                    rot('Thigh.'+side,math.sin(a)*strength)
                    rot('Shin.'+side,-max(0,math.cos(a))*(.95 if clip=='Run' else .38))
                    rot('Foot.'+side,max(0,math.cos(a))*.22)
                    if zombie:rot('UpperArm.'+side,math.sin(a)*(.14 if s<0 else .08),0,s*.08)
                rig.pose.bones['Root'].location.z=(.025 if zombie else .045)*(1-math.cos(phase*2))
                rot('Spine',.16 if zombie else .10,math.sin(phase)*.025,math.sin(phase)*.025)
            if clip=='Shoot':
                kick=math.sin(math.pi*t)*math.exp(-t*3)
                rot('Spine',-.045*kick);rot('UpperArm.L',-.045*kick);rot('UpperArm.R',-.045*kick)
            if clip=='Hit':rot('Spine',-.14*math.sin(t*math.pi),0,.08*math.sin(t*math.pi))
            if clip=='Attack':
                swing=math.sin(math.pi*t)
                rot('Spine',.13+swing*.25);rot('UpperArm.L',swing*1.05,0,.15);rot('UpperArm.R',swing*.72,0,-.18);rot('Forearm.L',swing*.18)
            if clip=='Death':
                f=t*t*(3-2*t)
                rot('Root',-1.47*f,0,.13*f);rig.pose.bones['Root'].location.z=.07*f
                rot('Thigh.L',.23*f);rot('Shin.L',-.30*f);rot('UpperArm.L',0,0,-.35*f);rot('UpperArm.R',0,0,.40*f)
            for b in rig.pose.bones:
                b.keyframe_insert('rotation_euler',frame=frame,group=b.name);b.keyframe_insert('location',frame=frame,group=b.name)
        track=rig.animation_data.nla_tracks.new();track.name=clip;track.strips.new(clip,1,action)
        track.mute=True
    rig.animation_data.action=None
    for b in rig.pose.bones:b.rotation_euler=(0,0,0);b.location=(0,0,0)
    # Select only this character for export; the user's torii scene remains intact.
    bpy.ops.object.select_all(action='DESELECT')
    for obj in meshes+[rig]:obj.select_set(True)
    bpy.context.view_layer.objects.active=rig
    output=ROOT+('/public/assets/zombies/walker.glb' if zombie else '/public/assets/characters/survivor.glb')
    os.makedirs(os.path.dirname(output),exist_ok=True)
    for obj in meshes:
        obj.data.validate(); obj.data.update()
    bpy.ops.export_scene.gltf(filepath=output,use_selection=True,use_active_scene=True,export_animation_mode='NLA_TRACKS',export_animations=True,export_force_sampling=True)
    triangles=0
    for obj in meshes:obj.data.calc_loop_triangles();triangles+=len(obj.data.loop_triangles)
    report={'character':'walker' if zombie else 'survivor','triangles':triangles,'meshes':len(meshes),'clips':clips,'bytes':os.path.getsize(output),'glb':output,'texture_resolution':512}
    print('CHARACTER_REPORT',json.dumps(report))
    return report


reports=[]
for scene_name in ['Survivor_Rebuild','Walker_Rebuild']:
    old=bpy.data.scenes.get(scene_name)
    if old:
        bpy.context.window.scene=bpy.data.scenes['Scene']
        for obj in list(old.objects):bpy.data.objects.remove(obj,do_unlink=True)
        bpy.data.scenes.remove(old)
for zombie in [False,True]:
    scene=bpy.data.scenes.new('Walker_Rebuild' if zombie else 'Survivor_Rebuild')
    bpy.context.window.scene=scene
    with bpy.context.temp_override(scene=scene,view_layer=scene.view_layers[0],collection=scene.collection):
        reports.append(make_character(zombie))
bpy.ops.wm.save_as_mainfile(filepath=ART+'/survivor-walker.blend',copy=True)
print('REBUILD_REPORT',json.dumps(reports))
