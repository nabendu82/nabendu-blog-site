"""Small final face and fabric changes on the live Blender survivor scene."""
import bpy, math, os, json
from array import array
ROOT='/Users/nabendubiswas/Desktop/Projects/nabendu-blog-site/standalone/dead-shift'
scene=bpy.data.scenes['Survivor_Rebuild'];bpy.context.window.scene=scene
rig=next(o for o in scene.objects if o.type=='ARMATURE')
skin=next(m for m in bpy.data.materials if m.name.startswith('Skin'))
hair=next(m for m in bpy.data.materials if m.name.startswith('Hair'))
olive=next(m for m in bpy.data.materials if m.name.startswith('Olive_canvas'))
for obj in list(scene.objects):
    if obj.name.startswith('Survivor_Final_'):bpy.data.objects.remove(obj,do_unlink=True)

def disk(name,cx,cy,cz,rx,rz,mat):
    n=16
    verts=[(cx,cy,cz)]+[(cx+math.cos(i*2*math.pi/n)*rx,cy-.0003,cz+math.sin(i*2*math.pi/n)*rz) for i in range(n)]
    faces=[(0,i+1,(i+1)%n+1) for i in range(n)]
    data=bpy.data.meshes.new(name);data.from_pydata(verts,[],faces);data.update();data.materials.append(mat)
    uv=data.uv_layers.new(name='UVMap')
    for face in data.polygons:
        for loop in face.loop_indices:
            v=data.vertices[data.loops[loop].vertex_index].co
            uv.data[loop].uv=((v.x-cx)/(2*rx)+.5,(v.z-cz)/(2*rz)+.5)
    obj=bpy.data.objects.new(name,data);scene.collection.objects.link(obj);obj.parent=rig
    obj.vertex_groups.new(name='Head').add(list(range(len(verts))),1,'REPLACE')
    modifier=obj.modifiers.new('Skin','ARMATURE');modifier.object=rig

# Narrow, imperfect eye planes and short scars replace the closed mannequin eyes.
for side,cx in [('L',-.034),('R',.034)]:
    disk('Survivor_Final_Eye_'+side,cx,-.091,1.644,.012,.0045,skin)
    disk('Survivor_Final_Iris_'+side,cx+(.001 if side=='L' else -.001),-.092,1.644,.0034,.0034,hair)
    disk('Survivor_Final_LowerLid_'+side,cx,-.092,1.638,.013,.0018,skin)
disk('Survivor_Final_Scar',.057,-.069,1.614,.0025,.013,hair)

# The jacket keeps its worn texture but gains just enough value to separate it
# from the night-time asphalt under the actual gameplay camera.
nodes=olive.node_tree.nodes
source=next((n.image for n in nodes if n.type=='TEX_IMAGE' and n.image and 'Albedo' in n.image.name),None)
if source and not source.get('survivor_final_brightened'):
    values=array('f',[0])*(source.size[0]*source.size[1]*4)
    source.pixels.foreach_get(values)
    for i in range(0,len(values),4):
        values[i]=min(1,values[i]*1.10)
        values[i+1]=min(1,values[i+1]*1.10)
        values[i+2]=min(1,values[i+2]*1.10)
    source.pixels.foreach_set(values);source.pack();source['survivor_final_brightened']=True

for track in rig.animation_data.nla_tracks:track.mute=False
with bpy.context.temp_override(scene=scene,view_layer=scene.view_layers[0],collection=scene.collection):
    bpy.ops.object.select_all(action='SELECT')
    path=ROOT+'/public/assets/characters/survivor.glb'
    bpy.ops.export_scene.gltf(filepath=path,use_active_scene=True,use_selection=True,export_animation_mode='NLA_TRACKS',export_animations=True,export_force_sampling=True,export_image_format='JPEG',export_image_quality=85)
tris=0
for obj in scene.objects:
    if obj.type=='MESH':obj.data.calc_loop_triangles();tris+=len(obj.data.loop_triangles)
bpy.data.libraries.write(ROOT+'/art/character-rebuild/character-family-final.blend',{bpy.data.scenes[n] for n in ['Survivor_Rebuild','Walker_Rebuild','Runner_Infected','Tank_Infected','Hazmat_Infected']})
print('SURVIVOR_FINAL_REPORT',json.dumps({'triangles':tris,'bytes':os.path.getsize(path)}))
