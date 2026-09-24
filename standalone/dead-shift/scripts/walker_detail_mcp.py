"""Add visible infection marks and a hunched walk to the existing Blender Walker."""
import bpy, math, os, json
ROOT='/Users/nabendubiswas/Desktop/Projects/nabendu-blog-site/standalone/dead-shift'
scene=bpy.data.scenes['Walker_Rebuild'];bpy.context.window.scene=scene
rig=next(o for o in scene.objects if o.type=='ARMATURE')
skin=next(m for m in bpy.data.materials if m.name.startswith('Zombie_skin'))
wound=next(m for m in bpy.data.materials if m.name.startswith('Wound'))
shirt=next(m for m in bpy.data.materials if m.name.startswith('Faded_shirt'))
for name in ('Walker_Exposed_Shoulder','Walker_RibTears','Walker_Tattered_Hem'):
    old=bpy.data.objects.get(name)
    if old and old.name in scene.objects:bpy.data.objects.remove(old,do_unlink=True)

def patch(name,points,radius,mat,bone):
    n=10;verts=[];faces=[]
    for p,r in zip(points,radius):
        for i in range(n):
            a=i*2*math.pi/n
            verts.append((p[0]+math.cos(a)*r,p[1]+math.sin(a)*r,p[2]))
    for j in range(len(points)-1):
        for i in range(n):faces.append((j*n+i,j*n+(i+1)%n,(j+1)*n+(i+1)%n,(j+1)*n+i))
    faces.extend([tuple(reversed(range(n))),tuple((len(points)-1)*n+i for i in range(n))])
    me=bpy.data.meshes.new(name);me.from_pydata(verts,[],faces);me.update();me.materials.append(mat)
    uv=me.uv_layers.new(name='UVMap')
    for poly in me.polygons:
        poly.use_smooth=True
        for li in poly.loop_indices:
            idx=me.loops[li].vertex_index;uv.data[li].uv=((idx%n)/n,(idx//n)/(len(points)-1))
    obj=bpy.data.objects.new(name,me);scene.collection.objects.link(obj);obj.parent=rig
    obj.vertex_groups.new(name=bone).add(list(range(len(verts))),1,'REPLACE')
    mod=obj.modifiers.new('Walker skin','ARMATURE');mod.object=rig
    return obj

patch('Walker_Exposed_Shoulder',[(-.165,-.05,1.35),(-.19,-.075,1.43),(-.18,-.04,1.49)],[.035,.055,.025],skin,'UpperArm.L')
for i in range(4):
    z=1.18+i*.034
    patch('Walker_RibTears',[(-.11,-.111,z),(-.065,-.12,z+.008),(-.012,-.115,z)],[.008,.012,.003],wound,'Spine')
for i in range(6):
    x=-.14+i*.052
    patch('Walker_Tattered_Hem',[(x,-.08,.98),(x+.014,-.09,.89+(i%3)*.02)],[.015,.002],shirt,'Spine')

# Existing motion is retained, with stronger infected upper-body poses in each clip.
for track in rig.animation_data.nla_tracks:
    action=track.strips[0].action
    rig.animation_data.action=action
    begin=int(action.frame_range[0]);end=int(action.frame_range[1])
    for frame in range(begin,end+1):
        bpy.context.scene.frame_set(frame)
        t=(frame-begin)/max(1,end-begin)
        spine=rig.pose.bones['Spine'];spine.rotation_mode='XYZ'
        spine.rotation_euler.x=.27+(math.sin(2*math.pi*t)*.015 if track.name in ('Walk','Idle') else .04)
        spine.keyframe_insert('rotation_euler',frame=frame,group=spine.name)
        head=rig.pose.bones['Head'];head.rotation_mode='XYZ';head.rotation_euler.x=-.11
        head.keyframe_insert('rotation_euler',frame=frame,group=head.name)
    track.mute=False
rig.animation_data.action=None
for bone in rig.pose.bones:bone.rotation_euler=(0,0,0);bone.location=(0,0,0)
with bpy.context.temp_override(scene=scene,view_layer=scene.view_layers[0],collection=scene.collection):
    bpy.ops.object.select_all(action='SELECT')
    path=ROOT+'/public/assets/zombies/walker.glb'
    bpy.ops.export_scene.gltf(filepath=path,use_active_scene=True,use_selection=True,export_animation_mode='NLA_TRACKS',export_animations=True,export_force_sampling=True,export_image_format='JPEG',export_image_quality=85)
tris=0
for obj in scene.objects:
    if obj.type=='MESH':obj.data.calc_loop_triangles();tris+=len(obj.data.loop_triangles)
print('WALKER_DETAIL_REPORT',json.dumps({'triangles':tris,'bytes':os.path.getsize(path),'clips':[t.name for t in rig.animation_data.nla_tracks]}))
