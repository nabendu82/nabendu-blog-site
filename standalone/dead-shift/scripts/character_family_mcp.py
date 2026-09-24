"""Run through Blender MCP in the live Blender process. No local Blender fallback."""
import bpy
import math
import os
import json
from mathutils import Vector

ROOT = '/Users/nabendubiswas/Desktop/Projects/nabendu-blog-site/standalone/dead-shift'
NLA = {'runner':['Idle','Run','Attack','Hit','Death'], 'tank':['Idle','Heavy Walk','Heavy Attack','Hit','Death'], 'hazmat':['Idle','Walk','Attack','Hit','Death']}


def fabric(name, rgb, rough=.86):
    mat=bpy.data.materials.new(name)
    mat.diffuse_color=(*rgb,1)
    bsdf=next(n for n in mat.node_tree.nodes if n.type=='BSDF_PRINCIPLED')
    bsdf.inputs['Base Color'].default_value=(*rgb,1)
    bsdf.inputs['Roughness'].default_value=rough
    image=bpy.data.images.new(name+'_grain',width=256,height=256)
    from array import array
    pix=array('f')
    for y in range(256):
        for x in range(256):
            n=(math.sin(x*2.31+y*4.59)*math.sin(y*1.97+x*5.31))*.045 + math.sin(x*.06)*math.cos(y*.043)*.035
            pix.extend((max(0,min(1,rgb[0]*(1+n))),max(0,min(1,rgb[1]*(1+n))),max(0,min(1,rgb[2]*(1+n))),1))
    image.pixels.foreach_set(pix);image.pack()
    tex=mat.node_tree.nodes.new('ShaderNodeTexImage');tex.image=image
    mat.node_tree.links.new(tex.outputs['Color'],bsdf.inputs['Base Color'])
    return mat


def part(scene, rig, name, rings, mat, bone, n=12):
    verts=[];faces=[]
    for cx,cy,z,rx,ry in rings:
        for i in range(n):
            a=2*math.pi*i/n;verts.append((cx+rx*math.cos(a),cy+ry*math.sin(a),z))
    for j in range(len(rings)-1):
        for i in range(n):
            a=j*n+i;b=j*n+(i+1)%n;faces.append((a,b,b+n,a+n))
    faces.extend([tuple(reversed(range(n))),tuple((len(rings)-1)*n+i for i in range(n))])
    me=bpy.data.meshes.new(name);me.from_pydata(verts,[],faces);me.update();me.materials.append(mat)
    o=bpy.data.objects.new(name,me);scene.collection.objects.link(o)
    uv=me.uv_layers.new(name='UVMap')
    for poly in me.polygons:
        poly.use_smooth=True
        for idx in poly.loop_indices:
            vi=me.loops[idx].vertex_index;uv.data[idx].uv=((vi%n)/n,(vi//n)/max(1,len(rings)-1))
    o.vertex_groups.new(name=bone).add(list(range(len(verts))),1,'REPLACE')
    o.parent=rig;mod=o.modifiers.new('Deform','ARMATURE');mod.object=rig
    return o


def tube(scene,rig,name,points,radii,mat,bone,n=10):
    rings=[]
    for p,r in zip(points,radii):rings.append((p[0],p[1],p[2],r,r))
    return part(scene,rig,name,rings,mat,bone,n)


def prepare(kind):
    old=bpy.data.scenes.get(kind.capitalize()+'_Infected')
    if old:
        bpy.context.window.scene=bpy.data.scenes['Walker_Rebuild']
        for o in list(old.objects):bpy.data.objects.remove(o,do_unlink=True)
        bpy.data.scenes.remove(old)
    source=bpy.data.scenes['Walker_Rebuild']
    srcmesh=next(o for o in source.objects if o.type=='MESH')
    srcrig=next(o for o in source.objects if o.type=='ARMATURE')
    scene=bpy.data.scenes.new(kind.capitalize()+'_Infected');scene.render.fps=30
    bpy.context.window.scene=scene
    rig=srcrig.copy();rig.data=srcrig.data.copy();rig.name=kind.capitalize()+'Rig';scene.collection.objects.link(rig)
    rig.animation_data_clear();rig.animation_data_create()
    obj=srcmesh.copy();obj.data=srcmesh.data.copy();obj.name=kind.capitalize()+'Mesh';scene.collection.objects.link(obj)
    obj.parent=rig
    for mod in obj.modifiers:
        if mod.type=='ARMATURE':mod.object=rig
    return scene,rig,obj


def renew_materials(obj,kind):
    palettes={
      'runner':{'shirt':(.135,.16,.145),'skin':(.36,.38,.31),'pant':(.10,.105,.105),'wound':(.25,.065,.055)},
      'tank':{'shirt':(.22,.19,.16),'skin':(.28,.32,.265),'pant':(.14,.135,.115),'wound':(.16,.11,.095)},
      'hazmat':{'shirt':(.38,.39,.165),'skin':(.31,.39,.285),'pant':(.26,.285,.135),'wound':(.17,.34,.22)}}
    colors=palettes[kind]
    lookup={}
    for i,old in enumerate(list(obj.data.materials)):
        low=old.name.lower()
        key=('skin' if 'skin' in low else 'pant' if 'ripstop' in low or 'leather' in low or 'gunmetal' in low else 'wound' if 'bruise' in low or 'wound' in low else 'shirt')
        if key not in lookup:lookup[key]=fabric(kind+'_'+key,colors[key])
        obj.data.materials[i]=lookup[key]
    return lookup


def sculpt(obj,kind):
    weights={g.index:g.name for g in obj.vertex_groups}
    vertices=obj.data.vertices
    for v in vertices:
        x,y,z=v.co
        groups=[weights[g.group] for g in v.groups if g.weight>.4]
        is_arm=any('Arm' in n or 'Forearm' in n or 'Hand' in n for n in groups)
        is_head='Head' in groups
        if kind=='runner':
            w=.82 if not is_head else .93
            if is_arm:w=.86
            v.co.x=x*w
            if is_arm:v.co.y=y-.035
            elif z>1.1:v.co.y=y-.025*(z-1.1)
            if z>.95:v.co.z=z+.02
        elif kind=='tank':
            if is_head:
                v.co.x=x*.91;v.co.z=z-.02
            elif is_arm:
                s=1 if x>=0 else -1
                v.co.x=x*1.38+s*.065
                v.co.y=y*1.24
                if x<0:v.co.x-=s*.045
                v.co.z=z-.02
            else:
                upper=max(0,min(1,(z-.92)/.50))
                v.co.x=x*(1.24+.52*upper)
                v.co.y=y*(1.1+.18*upper)
                if z>.95:v.co.z=z+.035*upper
        elif kind=='hazmat':
            v.co.x=x*(1.04 if is_arm else 1)
            if is_head:v.co.z=z-.025
    obj.data.update()


def extras(scene,rig,kind,m):
    if kind=='runner':
        for s,side in [(-1,'L'),(1,'R')]:
            tube(scene,rig,'Runner_Claw_'+side,[(s*.22,-.12,.90),(s*.235,-.17,.85),(s*.23,-.20,.78)],[.024,.018,.003],m['skin'],'Hand.'+side)
            tube(scene,rig,'Runner_Rib_'+side,[(s*.12,-.09,1.35),(s*.14,-.10,1.26),(s*.11,-.10,1.19)],[.008,.016,.004],m['wound'],'Spine')
        part(scene,rig,'Runner_Spinal_Ridge',[(0,.09,1.17,.035,.016),(0,.11,1.30,.050,.020),(0,.12,1.42,.03,.02)],m['skin'],'Spine')
        tube(scene,rig,'Runner_Neck_Tendons',[(0,.02,1.46),(0,.04,1.54),(0,.02,1.60)],[.047,.045,.031],m['skin'],'Head')
    elif kind=='tank':
        part(scene,rig,'Tank_Humped_Back',[(0,.11,1.08,.15,.08),(0,.115,1.17,.25,.12),(0,.12,1.27,.30,.15),(0,.115,1.38,.32,.16),(0,.10,1.46,.27,.13),(0,.07,1.52,.16,.07)],m['shirt'],'Spine',24)
        part(scene,rig,'Tank_Broad_Chest',[(0,-.075,1.07,.18,.07),(0,-.085,1.17,.28,.10),(0,-.095,1.27,.34,.12),(0,-.10,1.36,.36,.12),(0,-.08,1.46,.26,.08)],m['shirt'],'Spine',24)
        for s,side in [(-1,'L'),(1,'R')]:
            x=s*(.355 if s<0 else .32)
            part(scene,rig,'Tank_Shoulder_'+side,[(x,.008,1.24,.12,.10),(x,.01,1.32,.15 if s<0 else .13,.12),(x,.012,1.41,.17 if s<0 else .14,.12),(x,.015,1.48,.12,.085)],m['skin'],'UpperArm.'+side,18)
            part(scene,rig,'Tank_Forearm_'+side,[(s*.39,-.07,.83,.09,.09),(s*.395,-.065,.94,.13 if s<0 else .11,.12),(s*.39,-.06,1.03,.14 if s<0 else .12,.13),(s*.38,-.05,1.12,.10,.09)],m['skin'],'Forearm.'+side,18)
            for i in range(3):
                tube(scene,rig,'Tank_Spike_'+side+str(i),[(x+s*(i-1)*.05,.01,1.47),(x+s*(i-1)*.055,.0,1.55+i*.015),(x+s*(i-1)*.04,-.015,1.62+i*.012)],[.035,.018,.002],m['wound'],'UpperArm.'+side)
        part(scene,rig,'Tank_Asymmetric_Mass',[(-.23,.1,1.2,.045,.03),(-.25,.12,1.32,.075,.055),(-.25,.11,1.43,.09,.06),(-.24,.10,1.50,.05,.035)],m['wound'],'Spine',14)
    elif kind=='hazmat':
        suit=fabric('Hazmat_torn_ochre',(.46,.47,.21))
        dark=fabric('Hazmat_visor_black',(.045,.068,.063),.4)
        toxic=fabric('Hazmat_contamination',(.15,.38,.22),.65)
        part(scene,rig,'Hazmat_Hood',[(0,.006,1.54,.095,.087),(0,.006,1.62,.115,.108),(0,.015,1.74,.119,.113),(0,.020,1.81,.106,.10),(0,.025,1.85,.063,.064)],suit,'Head',24)
        part(scene,rig,'Hazmat_Visor',[(0,-.105,1.63,.064,.012),(0,-.124,1.68,.092,.014),(0,-.126,1.75,.094,.014),(0,-.115,1.78,.071,.012)],dark,'Head',18)
        tube(scene,rig,'Hazmat_Filter',[(0,-.135,1.64),(0,-.17,1.63),(0,-.19,1.60)],[.04,.045,.026],dark,'Head')
        part(scene,rig,'Hazmat_Full_Suit',[(0,0,.93,.15,.085),(0,0,1.05,.162,.103),(0,0,1.16,.178,.111),(0,.005,1.29,.188,.117),(0,.007,1.40,.180,.105),(0,.01,1.46,.115,.07)],suit,'Spine',24)
        part(scene,rig,'Hazmat_Back_Tank',[(0,.17,1.10,.08,.07),(0,.18,1.24,.09,.08),(0,.18,1.38,.085,.075)],dark,'Spine')
        for s,side in [(-1,'L'),(1,'R')]:
            tube(scene,rig,'Hazmat_Hose_'+side,[(s*.07,.22,1.35),(s*.16,.15,1.44),(s*.20,-.02,1.38),(s*.15,-.12,1.31)],[.016]*4,dark,'Spine')
            tube(scene,rig,'Hazmat_Sleeve_'+side,[(s*.18,.01,1.40),(s*.24,-.01,1.31),(s*.25,-.03,1.18)],[.09,.08,.06],suit,'UpperArm.'+side,16)
            part(scene,rig,'Hazmat_Leg_'+side,[(s*.09,0,.20,.055,.060),(s*.09,0,.45,.069,.072),(s*.09,0,.72,.075,.077)],suit,'Shin.'+side,14)
        tube(scene,rig,'Hazmat_Chest_Warning',[(-.055,-.138,1.31),(0,-.144,1.33),(.055,-.138,1.31)],[.01,.015,.01],toxic,'Spine')


def animate(rig,kind):
    rig.animation_data_create();rig.animation_data.action=None
    actions=NLA[kind]
    for clip in actions:
        frames={'Idle':60,'Walk':32,'Run':18,'Heavy Walk':42,'Attack':22,'Heavy Attack':33,'Hit':12,'Death':34}[clip]
        action=bpy.data.actions.new(kind.capitalize()+'_'+clip.replace(' ',''))
        rig.animation_data.action=action
        for frame in range(1,frames+1):
            t=(frame-1)/(frames-1);phase=2*math.pi*t
            for b in rig.pose.bones:b.rotation_mode='XYZ';b.rotation_euler=(0,0,0);b.location=(0,0,0)
            def rot(n,x=0,y=0,z=0):rig.pose.bones[n].rotation_euler=(x,y,z)
            base={'runner':.27,'tank':.12,'hazmat':.10}[kind]
            rot('Spine',base,0,math.sin(phase)*.006)
            rot('Head',-.1 if kind=='runner' else -.025)
            if clip in ['Walk','Run','Heavy Walk']:
                amp={'runner':.40,'tank':.24,'hazmat':.28}[kind]
                for side,offset in [('L',0),('R',math.pi)]:
                    a=phase+offset
                    rot('Thigh.'+side,math.sin(a)*amp)
                    rot('Shin.'+side,-max(0,math.cos(a))*(.48 if kind=='runner' else .24))
                    rot('Foot.'+side,max(0,math.cos(a))*.11)
                    rot('UpperArm.'+side,math.sin(a+math.pi)*(.38 if kind=='runner' else .12),0,0)
                rig.pose.bones['Root'].location.z=.012*(1-math.cos(phase*2))
                if kind=='tank':rot('Spine',base+.02*math.cos(phase*2),0,math.sin(phase)*.035)
            elif clip in ['Attack','Heavy Attack']:
                reach=math.sin(math.pi*t)
                rot('Spine',base+reach*.24,0,reach*.055)
                rot('UpperArm.L',reach*(1.12 if kind=='runner' else .78),0,.15)
                rot('UpperArm.R',reach*(.9 if kind=='runner' else .63),0,-.12)
            elif clip=='Hit':rot('Spine',base-.18*math.sin(math.pi*t),0,.08*math.sin(math.pi*t))
            elif clip=='Death':
                f=t*t*(3-2*t);rot('Root',-1.45*f,0,.10*f)
                rot('Thigh.L',.24*f);rot('Shin.R',-.28*f)
            for b in rig.pose.bones:b.keyframe_insert('rotation_euler',frame=frame,group=b.name);b.keyframe_insert('location',frame=frame,group=b.name)
        track=rig.animation_data.nla_tracks.new();track.name=clip;track.strips.new(clip,1,action);track.mute=False
    rig.animation_data.action=None
    for b in rig.pose.bones:b.rotation_euler=(0,0,0);b.location=(0,0,0)


def export(kind,scene,rig,obj):
    bpy.context.window.scene=scene
    with bpy.context.temp_override(scene=scene,view_layer=scene.view_layers[0],collection=scene.collection):
        bpy.ops.object.select_all(action='SELECT')
        path=ROOT+'/public/assets/zombies/'+kind+'.glb'
        bpy.ops.export_scene.gltf(filepath=path,use_active_scene=True,use_selection=True,export_animation_mode='NLA_TRACKS',export_animations=True,export_force_sampling=True,export_image_format='JPEG',export_image_quality=84)
        obj.data.calc_loop_triangles()
        triangles=len(obj.data.loop_triangles)
        for o in scene.objects:
            if o.type=='MESH' and o!=obj:o.data.calc_loop_triangles();triangles+=len(o.data.loop_triangles)
        return {'kind':kind,'triangles':triangles,'bytes':os.path.getsize(path),'clips':NLA[kind]}


reports=[]
for kind in ('runner','tank','hazmat'):
    scene,rig,obj=prepare(kind)
    mats=renew_materials(obj,kind)
    sculpt(obj,kind)
    extras(scene,rig,kind,mats)
    animate(rig,kind)
    reports.append(export(kind,scene,rig,obj))
bpy.data.libraries.write(ROOT+'/art/character-rebuild/zombie-family.blend',{bpy.data.scenes[k.capitalize()+'_Infected'] for k in ('runner','tank','hazmat')})
print('ZOMBIE_FAMILY_REPORT',json.dumps(reports))
