import bpy, math, os
from mathutils import Vector
ROOT='/Users/nabendubiswas/Desktop/Projects/nabendu-blog-site/standalone/dead-shift'
scene=bpy.data.scenes.new('Survivor_Rifle')
bpy.context.window.scene=scene
material=bpy.data.materials.new('Worn phosphate steel')
p=next(n for n in material.node_tree.nodes if n.type=='BSDF_PRINCIPLED')
p.inputs['Base Color'].default_value=(.055,.067,.063,1);p.inputs['Metallic'].default_value=.7;p.inputs['Roughness'].default_value=.52
grip=bpy.data.materials.new('Charcoal rifle polymer')
p=next(n for n in grip.node_tree.nodes if n.type=='BSDF_PRINCIPLED')
p.inputs['Base Color'].default_value=(.035,.042,.036,1);p.inputs['Roughness'].default_value=.83
def outline(name,pts,width,mat):
    # Extruded custom side profiles define receiver, stock and grip silhouettes.
    vs=[(s*width/2,y,z) for s in [-1,1] for y,z in pts];n=len(pts)
    fs=[tuple(reversed(range(n))),tuple(n+i for i in range(n))]
    fs += [(i,(i+1)%n,(i+1)%n+n,i+n) for i in range(n)]
    me=bpy.data.meshes.new(name);me.from_pydata(vs,[],fs);me.update()
    obj=bpy.data.objects.new(name,me);scene.collection.objects.link(obj);me.materials.append(mat)
    bpy.context.view_layer.objects.active=obj;obj.select_set(True)
    mod=obj.modifiers.new('Machined edges','BEVEL');mod.width=.003;mod.segments=2
    bpy.ops.object.modifier_apply(modifier=mod.name);obj.select_set(False)
    return obj
def barrel(name,y0,y1,r):
    n=16;vs=[(math.cos(i*2*math.pi/n)*r,y,math.sin(i*2*math.pi/n)*r+.036) for y in [y0,y1] for i in range(n)]
    fs=[(i,(i+1)%n,(i+1)%n+n,i+n) for i in range(n)]+[tuple(reversed(range(n))),tuple(n+i for i in range(n))]
    me=bpy.data.meshes.new(name);me.from_pydata(vs,[],fs);me.update();ob=bpy.data.objects.new(name,me);scene.collection.objects.link(ob);me.materials.append(material)
with bpy.context.temp_override(scene=scene,view_layer=scene.view_layers[0],collection=scene.collection):
    outline('Receiver',[(-.20,.065),(.08,.06),(.10,.018),(.05,-.035),(-.17,-.026),(-.20,.008)],.052,material)
    outline('Handguard',[(-.20,.064),(-.36,.058),(-.39,.02),(-.35,-.009),(-.20,-.012)],.059,grip)
    outline('Grip',[(.047,-.02),(.001,-.028),(.014,-.123),(.055,-.129),(.072,-.107)],.036,grip)
    outline('Magazine',[(-.07,-.026),(-.128,-.026),(-.137,-.156),(-.094,-.175),(-.063,-.12)],.029,material)
    outline('Stock',[(.095,.044),(.285,.046),(.32,.018),(.32,-.075),(.297,-.084),(.245,-.022),(.1,-.015)],.038,grip)
    barrel('Barrel',-.36,-.54,.012);barrel('Flash_hider',-.53,-.575,.018)
    outline('Top_rail',[(-.29,.068),(.07,.068),(.07,.078),(-.29,.078)],.028,material)
    for i in range(13):
        y=-.275+i*.022
        outline('Rail_tooth',[(y,.078),(y+.01,.078),(y+.01,.084),(y,.084)],.031,material)
    outline('Front_sight',[(-.343,.059),(-.33,.059),(-.33,.11),(-.343,.11)],.012,material)
    outline('Rear_sight',[(.035,.079),(.055,.079),(.055,.111),(.035,.111)],.017,material)
    bpy.ops.object.select_all(action='SELECT')
    bpy.context.view_layer.objects.active=next(o for o in scene.objects if o.type=='MESH')
    bpy.ops.object.join();ob=bpy.context.object;ob.name='Survivor_Field_Rifle'
    bpy.ops.export_scene.gltf(filepath=ROOT+'/public/assets/weapons/survivor-field-rifle.glb',use_active_scene=True,use_selection=True)
bpy.ops.wm.save_as_mainfile(filepath=ROOT+'/art/character-rebuild/survivor-walker.blend',copy=True)
print('FIELD_RIFLE_EXPORTED')
